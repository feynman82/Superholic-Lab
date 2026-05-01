import os
import json
import time
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

# 1. Dynamically find the root directory and explicitly point to the .env file
root_dir = Path(__file__).resolve().parent.parent
env_path = root_dir / ".env"

# 2. Load it forcefully
load_dotenv(dotenv_path=env_path)

# 3. Fetch credentials
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# 4. Fail-safe check so you know exactly what went wrong if it fails again
if not url or not key:
    raise ValueError(f"Missing Supabase credentials! Looked for .env at: {env_path}\nMake sure your keys are exactly 'SUPABASE_URL' and 'SUPABASE_SERVICE_KEY'.")

supabase: Client = create_client(url, key)

def upload_diagram_and_get_url(local_image_path: str, destination_filename: str) -> str:
    """Uploads an image to the question_assets bucket and returns the public URL."""
    bucket_name = "question_assets"
    
    # Upload the file
    with open(local_image_path, "rb") as f:
        supabase.storage.from_(bucket_name).upload(
            file=f"diagrams/{destination_filename}",
            path_or_file=f,
            file_options={"content-type": "image/png"}
        )
    
    # Generate the public URL
    public_url = supabase.storage.from_(bucket_name).get_public_url(f"diagrams/{destination_filename}")
    return public_url

def process_and_seed():
    with open("review_queue.json", "r", encoding="utf-8") as f:
        questions = json.load(f)

    for q in questions:
        # 1. Handle Images First
        if q.get("requires_diagram"):
            print(f"⚠️ Diagram required for: {q.get('question_text')[:30]}...")
            # In your mass-production pipeline, this is where your script would 
            # reference the local cropped image you made for this question.
            local_crop_path = f"local_crops/{q['id']}.png" # Example path
            
            if os.path.exists(local_crop_path):
                # Upload and attach the URL to the question payload
                unique_filename = f"{int(time.time())}-{q['topic']}.png"
                img_url = upload_diagram_and_get_url(local_crop_path, unique_filename)
                q["image_url"] = img_url
            else:
                print("Skipping upload - no local crop found.")

        # 2. Stringify nested arrays for Supabase schema
        for key in ["options", "blanks", "passage_lines"]:
            if q.get(key):
                q[key] = json.dumps(q[key])

        # 3. Insert the final unified row
        try:
            supabase.table("seed_questions").insert(q).execute()
            print(f"✅ Synced: {q.get('topic')}")
        except Exception as e:
            print(f"❌ Database error: {e}")

if __name__ == "__main__":
    process_and_seed()