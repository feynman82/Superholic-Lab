import fitz  # PyMuPDF
import json
import os
import time
from pathlib import Path
from dotenv import load_dotenv
from google import genai
from google.genai import types
from supabase import create_client, Client
from schemas import ExtractionResult
from json_repair import repair_json  # <--- NEW IMPORT

# 1. Initialization & Configuration
root_dir = Path(__file__).resolve().parent.parent
load_dotenv(dotenv_path=root_dir / ".env")

api_key = os.getenv("GEMINI_API_KEY")
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not all([api_key, supabase_url, supabase_key]):
    raise ValueError("Missing essential API keys in .env file.")

client = genai.Client(api_key=api_key)
supabase: Client = create_client(supabase_url, supabase_key)
BASE_DIR = root_dir / "data" / "past_year_papers"

from google.genai.errors import APIError # Add this to your imports at the top

def free_tier_generate(contents, prompt, response_schema):
    """A bulletproof wrapper for the Free Tier rate limits (15 RPM / 1M TPM)."""
    max_retries = 5
    base_sleep = 6 # Guarantees we never exceed 10 requests per minute
    
    for attempt in range(max_retries):
        try:
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=contents + [prompt],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=response_schema,
                    temperature=0.0,
                ),
            )
            time.sleep(base_sleep) # Pacing mechanism
            return response
            
        except APIError as e:
            if e.code == 429: # 429 is the universal code for "Too Many Requests"
                print(f"      [!] Free Tier limit hit. Cooling down for 60 seconds... (Attempt {attempt+1}/{max_retries})")
                time.sleep(60) 
            else:
                raise e # If it's a different API error, raise it
                
    raise Exception("Max retries exceeded on Free Tier backoff.")

# THE SOURCE OF TRUTH: Strict MOE Taxonomy
ALLOWED_TOPICS = {
  "Primary 1": { "Mathematics": ["Whole Numbers", "Addition and Subtraction", "Multiplication and Division", "Money", "Length and Mass", "Shapes and Patterns", "Picture Graphs"], "English Language": ["Grammar", "Vocabulary", "Comprehension", "Cloze"] },
  "Primary 2": { "Mathematics": ["Whole Numbers", "Multiplication Tables", "Fractions", "Money", "Time", "Length, Mass and Volume", "Shapes", "Picture Graphs"], "English Language": ["Grammar", "Vocabulary", "Comprehension", "Cloze"] },
  "Primary 3": { "Science": ["Diversity", "Systems", "Interactions"], "Mathematics": ["Whole Numbers", "Fractions", "Length, Mass and Volume", "Time", "Angles", "Area and Perimeter", "Bar Graphs"], "English Language": ["Grammar", "Vocabulary", "Comprehension", "Cloze", "Editing"] },
  "Primary 4": { "Science": ["Cycles", "Energy", "Heat", "Light", "Magnets", "Matter"], "Mathematics": ["Whole Numbers", "Factors and Multiples", "Fractions", "Decimals", "Angles", "Area and Perimeter", "Symmetry", "Data Analysis"], "English Language": ["Grammar", "Vocabulary", "Comprehension", "Cloze", "Editing"] },
  "Primary 5": { "Science": ["Cycles", "Systems", "Energy", "Interactions"], "Mathematics": ["Whole Numbers", "Fractions", "Decimals", "Percentage", "Ratio", "Rate", "Area of Triangle", "Volume", "Angles and Geometry", "Average"], "English Language": ["Grammar", "Vocabulary", "Comprehension", "Cloze", "Editing", "Synthesis"] },
  "Primary 6": { "Science": ["Interactions", "Energy", "Cells", "Forces"], "Mathematics": ["Fractions", "Percentage", "Ratio", "Speed", "Algebra", "Circles", "Volume", "Geometry", "Pie Charts"], "English Language": ["Grammar", "Vocabulary", "Comprehension", "Cloze", "Editing", "Synthesis"] }
}

def get_pending_batch(batch_size=15):
    """Fetch the next batch of pending files from Supabase."""
    response = supabase.table("processed_files").select("*").eq("status", "PENDING").limit(batch_size).execute()
    return response.data

def update_file_status(file_path, status, extracted_seeds=0, error_message=None):
    """Update the tracking table."""
    payload = {
        "status": status,
        "extracted_seeds": extracted_seeds,
        "last_updated": "now()"
    }
    if error_message:
        payload["error_message"] = str(error_message)
        
    supabase.table("processed_files").update(payload).eq("file_path", file_path).execute()

def run_actor_extraction(pdf_path, level, subject, valid_topics, relative_path):
    """Phase 1: Gemini parses the visual PDF in chunks to bypass API limits."""
    doc = fitz.open(str(pdf_path))
    total_pages = len(doc)
    all_questions = []
    
    # Process a maximum of 15 pages per API call to avoid the 8k output token ceiling
    CHUNK_SIZE = 15
    
    # Format valid topics into a strict, isolated string array for the prompt
    topic_string = ", ".join([f'"{t}"' for t in valid_topics])
    
    # 1. Extract the last 5 pages to serve as a universal Answer Key context
    answer_key_parts = []
    start_ak = max(0, total_pages - 5)
    for page_num in range(start_ak, total_pages):
        page = doc.load_page(page_num)
        # Reduced DPI to 150 to prevent API payload rejection
        pix = page.get_pixmap(dpi=150) 
        answer_key_parts.append(types.Part.from_bytes(data=pix.tobytes("png"), mime_type='image/png'))

    # 2. Process the document in safe chunks
    for i in range(0, total_pages, CHUNK_SIZE):
        chunk_end = min(i + CHUNK_SIZE, total_pages)
        print(f"      -> Scanning pages {i+1} to {chunk_end} of {total_pages}...")
        
        image_parts = []
        for page_num in range(i, chunk_end):
            page = doc.load_page(page_num)
            pix = page.get_pixmap(dpi=150) 
            image_parts.append(types.Part.from_bytes(data=pix.tobytes("png"), mime_type='image/png'))

        # If the chunk already includes the end of the book, don't duplicate the answer key
        if chunk_end >= start_ak:
            payload_parts = image_parts
        else:
            payload_parts = image_parts + answer_key_parts

        prompt = f"""
        You are an expert data parser. Extract questions from these exam pages.
        Note: The final images provided to you in this prompt are the answer key.
        
        CRITICAL INSTRUCTIONS:
        1. TOPIC RESTRICTION: You MUST categorize the 'topic' of every question EXACTLY as one of these strings: [{topic_string}].
           CRITICAL: Do NOT invent new topics. Do NOT use topics from other levels or subjects. If a question spans multiple concepts, pick the single closest match from THIS list ONLY.
        2. Cross-reference the answer key to populate correct_answer.
        3. PROCEDURAL DIAGRAMS: If a diagram is needed, populate 'visual_payload'. Use 'diagram-library' for math/science charts, and describe the params as a stringified JSON object.
        4. The source_pdf is "{relative_path}".
        """

        try:
            # ---> USE THE FREE TIER WRAPPER <---
            response = free_tier_generate(
                contents=payload_parts, 
                prompt=prompt, 
                response_schema=ExtractionResult
            )
            
            raw_text = response.text
            
            # --- THE BULLETPROOF NONE CHECK ---
            if raw_text is None:
                print(f"      [!] API blocked this chunk (Safety Filter or Overload). Skipping.")
                continue
                
        except Exception as e:
            print(f"      [!] API connection failed on chunk {i+1}-{chunk_end}: {e}")
            continue
            
        # --- CIRCUIT BREAKER: Auto-Heal Broken JSON ---
        try:
            data = json.loads(raw_text)
        except Exception as e:
            print(f"      [!] Chunk JSON malformed. Engaging auto-repair...")
            data = repair_json(raw_text, return_objects=True)
            if not isinstance(data, dict):
                data = {"questions": []}
                
        questions = data.get("questions", [])
        
        # Parse stringified visual_payload params back to dict
        for q in questions:
            if isinstance(q.get("visual_payload"), dict) and q["visual_payload"].get("params"):
                try:
                    q["visual_payload"]["params"] = json.loads(q["visual_payload"]["params"])
                except:
                    q["visual_payload"]["params"] = {}
                    
        all_questions.extend(questions)
        
    return all_questions


def run_critic_review(raw_questions, valid_topics):
    """Phase 2: A fast, text-only AI checks the Actor's work for strict compliance."""
    if not raw_questions:
        return []

    # Format valid topics into a strict, isolated string array for the prompt
    topic_string = ", ".join([f'"{t}"' for t in valid_topics])

    prompt = f"""
    You are a strict QA bot. Review this JSON array of exam questions.
    1. Ensure the 'topic' field for EVERY question is strictly one of these: [{topic_string}]. If it is not, re-map it to the closest valid topic from that exact list.
    2. Ensure that 'flag_review' is False unless the question is truly broken.
    3. Return the corrected JSON array in the exact same schema.
    
    JSON to review:
    {json.dumps(raw_questions)}
    """
    
    try:
        # ---> USE THE FREE TIER WRAPPER <---
        response = free_tier_generate(
            contents=[], # No images for the critic
            prompt=prompt, 
            response_schema=ExtractionResult
        )
        
        # --- CIRCUIT BREAKER 2: The Critic Bypass ---
        # ... (keep your existing try/except block for json.loads(response.text) here)
        
        # --- CIRCUIT BREAKER 2: The Critic Bypass ---
        try:
            data = json.loads(response.text)
            return data.get("questions", [])
        except Exception as e:
            print(f"      [!] Critic JSON malformed. Attempting repair... ({e})")
            data = repair_json(response.text, return_objects=True)
            if isinstance(data, dict) and "questions" in data:
                return data["questions"]
            raise ValueError("Repair failed.")
            
    except Exception as fallback_error:
        # If the Critic utterly fails (or repair fails), DO NOT throw away the Actor's data!
        # We simply bypass the critic, flag the questions so you know to check them, and push them through.
        print("      ⚠️ Critic review crashed. Bypassing Critic and salvaging Actor data...")
        for q in raw_questions:
            q["flag_review"] = True 
        return raw_questions

def push_to_supabase(questions):
    """Phase 3: Format and push the cleaned questions to the database."""
    success_count = 0
    for q in questions:
        # --- PRE-INSERT SANITY CHECK ---
        # If auto-repair created a 'ghost question' missing the core text, drop it.
        if not q.get("question_text") or str(q.get("question_text")).strip() == "":
            print("      [!] Dropped a ghost question (missing question_text due to API truncation).")
            continue

        # Stringify nested arrays for the database schema
        for key in ["options", "blanks", "passage_lines"]:
            if q.get(key):
                q[key] = json.dumps(q[key])
                
        try:
            supabase.table("seed_questions").insert(q).execute()
            success_count += 1
        except Exception as e:
            # We keep this try/except to catch any other unforeseen DB schema mismatches
            print(f"      [!] DB Insert Error for a question: {e}")
            
    return success_count

def process_batch():
    batch = get_pending_batch(batch_size=15)
    
    if not batch:
        print("🎉 No PENDING files found in the database. Production complete!")
        return False

    print(f"\n🚀 Starting batch of {len(batch)} papers...")

    for file_record in batch:
        relative_path = file_record["file_path"]
        level = file_record["level"]
        subject = file_record["subject"]
        
        # Clean up path matching (handle absolute vs relative data paths)
        pdf_path = BASE_DIR / relative_path.replace("past_year_papers/", "")
        
        print(f"\n📄 Processing: {pdf_path.name}")
        update_file_status(relative_path, "PROCESSING")

        if not pdf_path.exists():
            print(f"   [!] File not found locally: {pdf_path}")
            update_file_status(relative_path, "ERROR", error_message="File not found locally.")
            continue

        valid_topics = ALLOWED_TOPICS.get(level, {}).get(subject, ["Mixed"])

        try:
            # 1. ACTOR
            print("   -> Running Actor Extraction...")
            raw_questions = run_actor_extraction(pdf_path, level, subject, valid_topics, relative_path)
            
            # 2. CRITIC
            print("   -> Running Critic Review...")
            cleaned_questions = run_critic_review(raw_questions, valid_topics)
            
            # 3. UPLOAD
            print(f"   -> Uploading {len(cleaned_questions)} questions to Supabase...")
            inserted_count = push_to_supabase(cleaned_questions)
            
            # 4. MARK COMPLETE
            update_file_status(relative_path, "COMPLETED", extracted_seeds=inserted_count)
            print(f"   ✅ Done! Inserted {inserted_count} questions.")
            
        except Exception as e:
            print(f"   ❌ Failed: {e}")
            update_file_status(relative_path, "ERROR", error_message=str(e))
            


    return True

if __name__ == "__main__":
    # Wrap in a loop to continuously process batches until empty
    while True:
        has_more = process_batch()
        if not has_more:
            break