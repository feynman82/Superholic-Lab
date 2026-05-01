import fitz  # PyMuPDF
import json
import os
from pathlib import Path
from dotenv import load_dotenv
from google import genai
from google.genai import types
from schemas import ExtractionResult

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("GEMINI_API_KEY not found. Check your .env file.")

client = genai.Client(api_key=api_key)
BASE_DIR = Path(r"D:\Git\Superholic-Lab\data\past_year_papers")

def process_test_paper():
    # Target the specific Science paper
    test_pdf_path = BASE_DIR / "P4_Primary4" / "Science" / "P4 Science 2025 WA1 - ACS Primary.pdf"
    
    if not test_pdf_path.exists():
        print(f"Error: Could not find {test_pdf_path}")
        return

    print(f"\n--- EXTRACTING: {test_pdf_path.name} ---")
    doc = fitz.open(str(test_pdf_path))
    relative_source_pdf = test_pdf_path.relative_to(BASE_DIR.parent).as_posix()

    # Collect ALL pages into a single payload array
    image_parts = []
    print(f"Converting {len(doc)} pages to images...")
    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        pix = page.get_pixmap(dpi=300)
        img_bytes = pix.tobytes("png")
        image_parts.append(types.Part.from_bytes(data=img_bytes, mime_type='image/png'))

    prompt = f"""
        You are an expert data parser for a Singapore MOE syllabus app. 
        Read this ENTIRE exam paper, including the answer key at the very end.
        
        CRITICAL INSTRUCTIONS:
        1. Extract every question accurately. Cross-reference the answer key to populate 'correct_answer' and 'model_answer'. Do not guess.
        2. PROCEDURAL DIAGRAMS: If a question requires a diagram to be solved, DO NOT flag it for review. Instead, populate the 'visual_payload'.
           - If it's a chart, use function_name 'barChart', 'horizontalBarChart', or 'lineGraph' and extract the exact data points into 'params'.
           - If it's a science setup, invent a logical function_name (e.g., 'plantLifeCycle', 'beakerSetup', 'magnetExperiment') and describe the visual state in the 'params' (e.g., {{ "stage": "seedling", "hasRoots": true }}).
        3. Only set 'flag_review' to true if the text is completely illegible or the diagram is too artistic/photographic to be parameterized.
        4. The source_pdf is "{relative_source_pdf}".
        """

    print("Sending full document to Gemini 2.5 Flash. This may take 30-60 seconds...")
    contents_payload = image_parts + [prompt]

    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=contents_payload,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=ExtractionResult,
                temperature=0.0,
            ),
        )
        
        page_data = json.loads(response.text)
        extracted_questions = page_data.get("questions", [])
        
        # --- THE FIX: Parse the stringified params back into a dictionary ---
        for q in extracted_questions:
            if q.get("visual_payload") and q["visual_payload"].get("params"):
                try:
                    # Convert the JSON string back into a real Python dictionary
                    q["visual_payload"]["params"] = json.loads(q["visual_payload"]["params"])
                except Exception as e:
                    print(f"  [!] Failed to parse params JSON for a question: {e}")
                    q["visual_payload"]["params"] = {}
        # --------------------------------------------------------------------

        with open("review_queue.json", "w", encoding="utf-8") as f:
            json.dump(extracted_questions, f, indent=2, ensure_ascii=False)
            
        print(f"Extraction complete! {len(extracted_questions)} questions saved to review_queue.json.")
        
    except Exception as e:
        print(f"Extraction failed: {e}")

if __name__ == "__main__":
    process_test_paper()