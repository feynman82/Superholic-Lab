import os
import json
import time
from pathlib import Path
from dotenv import load_dotenv
from google import genai
from google.genai import types
from supabase import create_client, Client
from pydantic import BaseModel

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

# 2. Define the Strict Target Schema for Gemini
class BlankSchema(BaseModel):
    number: int
    options: list[str]
    correct_answer: str
    explanation: str

class ClozeRepairSchema(BaseModel):
    passage: str
    blanks: list[BlankSchema]
    worked_solution: str

def fetch_broken_cloze_rows():
    """Fetch ALL cloze rows and filter in Python to avoid SQL null-type mismatches."""
    print("🔍 Fetching all Cloze rows to inspect locally...")
    
    # Fetch all cloze questions without the strict null filter
    response = supabase.table("question_bank") \
        .select("id, question_text, passage, model_answer, blanks") \
        .eq("type", "cloze") \
        .execute()
        
    all_cloze = response.data
    broken_rows = []
    
    for row in all_cloze:
        blanks = row.get("blanks")
        # Catch SQL Null, empty lists [], empty strings "", or stringified "null"
        if not blanks or blanks == "null" or blanks == [] or blanks == "":
            broken_rows.append(row)
            
    return broken_rows

def repair_row_with_gemini(row):
    """Feed the broken data to Gemini with Free Tier Rate Limit protection."""
    
    messy_text = row.get("question_text", "") or row.get("passage", "")
    legacy_answers = row.get("model_answer", "")
    
    prompt = f"""
    You are an expert data repair AI for a Singapore MOE EdTech platform.
    I am giving you a broken "Cloze" question. 

    BROKEN DATA:
    Text: {messy_text}
    Legacy Answers: {legacy_answers}

    YOUR MISSION:
    1. EXTRACT PASSAGE: Remove all inline options like "(wake/ wakes/ woke)" from the text. Replace every blank with a clean bracketed number: [1], [2], [3], etc.
    2. BUILD BLANKS ARRAY: Extract the options into the 'blanks' array.
    3. MISSING OPTIONS RULE: If a blank just looks like "_______" and has NO inline options, you MUST autonomously generate exactly 4 plausible, MOE-appropriate options based on the correct answer. 
    4. EXPLANATIONS: Generate a concise grammar/vocabulary explanation for why the correct answer is right.
    5. WORKED SOLUTION: Generate a brief summary of all correct answers.
    """

    max_retries = 6
    base_sleep = 10

    for attempt in range(max_retries):
        try:
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=ClozeRepairSchema,
                    temperature=0.1, 
                ),
            )
            return json.loads(response.text)
            
        except Exception as e:
            error_msg = str(e)
            if "429" in error_msg or "503" in error_msg or "Quota" in error_msg:
                wait_time = base_sleep * (2 ** attempt)
                print(f"      [!] Rate Limit Hit. Cooling down for {wait_time}s... (Attempt {attempt+1}/{max_retries})")
                time.sleep(wait_time)
            else:
                print(f"      [!] Fatal Gemini API error for row {row['id']}: {error_msg}")
                return None
                
    print(f"      [!] Max retries exceeded for row {row['id']}.")
    return None

def update_supabase(row_id, repaired_data):
    """Format and push the healed data back to the database."""
    payload = {
        "question_text": "Fill in each blank with the most suitable word.",
        "passage": repaired_data["passage"],
        "blanks": json.dumps(repaired_data["blanks"]),
        "worked_solution": repaired_data["worked_solution"],
        "model_answer": None 
    }

    try:
        supabase.table("question_bank").update(payload).eq("id", row_id).execute()
        return True
    except Exception as e:
        print(f"      [!] Supabase Update failed for row {row_id}: {e}")
        return False

def run_salvage_operation():
    print("🟢 Starting Cloze Salvage Operation...")
    broken_rows = fetch_broken_cloze_rows()
    
    if not broken_rows:
        print("🎉 No broken cloze rows found! The database is clean.")
        return

    print(f"🚨 Found {len(broken_rows)} broken Cloze questions. Beginning repairs...")
    
    success_count = 0
    for idx, row in enumerate(broken_rows):
        print(f"   -> Repairing {idx + 1}/{len(broken_rows)} (ID: {row['id'][:8]}...)")
        
        repaired_data = repair_row_with_gemini(row)
        if repaired_data:
            success = update_supabase(row['id'], repaired_data)
            if success:
                success_count += 1
        
        # Standard safety delay between successful calls to avoid triggering the 15 RPM free tier limit
        time.sleep(5) 

    print(f"\n✅ Operation Complete! Successfully healed {success_count}/{len(broken_rows)} rows.")

if __name__ == "__main__":
    run_salvage_operation()