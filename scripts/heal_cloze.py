import os
import re
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()
supabase: Client = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY"))

def heal_cloze_questions():
    print("Fetching ALL cloze questions for deep inspection...")
    
    # Fetch all cloze questions to bypass strict SQL JSON null-checks
    response = supabase.table('question_bank').select('id, passage, question_text, correct_answer, model_answer, blanks').eq('type', 'cloze').execute()
    all_cloze = response.data
    
    if not all_cloze:
        print("No cloze questions exist in the database at all.")
        return

    # 1. Filter broken questions manually in Python
    broken_questions = []
    for q in all_cloze:
        b = q.get('blanks')
        # Catch SQL NULL, JSON "null", empty arrays, or empty strings
        if not b or b == 'null' or b == '[]' or b == []:
            broken_questions.append(q)

    if not broken_questions:
        print("All cloze questions have valid blanks! You are good to go.")
        return

    print(f"Found {len(broken_questions)} broken cloze questions. Attempting to heal...\n")

    # Regex pattern to find things like: (1) _______________ (wake/ wakes/ woke)
    pattern = r'\(([0-9]+)\)\s*_{2,}\s*\(([^)]+)\)'

    fixed_count = 0

    for q in broken_questions:
        # The AI sometimes dumps the text in question_text instead of passage
        passage = q.get('passage') or q.get('question_text') or ''
        
        # The AI sometimes dumps the answers in model_answer instead of correct_answer
        ans_str = q.get('model_answer') or q.get('correct_answer') or ''
        
        matches = re.findall(pattern, passage)
        
        if not matches:
            print(f"  [Skipped] Could not find the '(1) ____ (a/b/c)' pattern in ID: {q['id']}")
            continue

        # Parse the answers into a map: { "1": "wakes", "2": "eats" }
        correct_map = {}
        if ans_str:
            ans_parts = ans_str.split(',')
            for part in ans_parts:
                if '.' in part:
                    num, word = part.split('.', 1)
                    correct_map[num.strip()] = word.strip()

        blanks_array = []
        new_passage = passage

        # Build the structured JSON for each blank
        for match in matches:
            blank_num = match[0]   # e.g., "1"
            options_raw = match[1] # e.g., "wake/ wakes/ woke"
            
            # Clean up the options into a proper list
            options_list = [opt.strip() for opt in options_raw.split('/')]
            
            # Get the exact correct answer from our map, or default to the first option if the AI forgot to provide an answer key
            correct_word = correct_map.get(blank_num, options_list[0])

            blanks_array.append({
                "number": int(blank_num),
                "correct_answer": correct_word,
                "options": options_list,
                "explanation": "Contextual grammar or vocabulary rule applies."
            })

            # Format the passage for the frontend UI: replace the whole raw string with just "[1]"
            chunk_pattern = rf'\({blank_num}\)\s*_{{2,}}\s*\({re.escape(options_raw)}\)'
            new_passage = re.sub(chunk_pattern, f"[{blank_num}]", new_passage)

        # 2. Update the Database
        try:
            supabase.table('question_bank').update({
                'passage': new_passage,
                'blanks': blanks_array,
                'question_text': "Fill in each blank with the correct word from the options." # Standardize the preamble
            }).eq('id', q['id']).execute()
            
            fixed_count += 1
            print(f"  [Fixed] Healed question ID: {q['id']}")
        except Exception as e:
            print(f"  [Error] Failed to update {q['id']}: {e}")

    print(f"\nHealing complete. Successfully salvaged {fixed_count} out of {len(broken_questions)} broken questions.")

if __name__ == "__main__":
    heal_cloze_questions()