-- 1. Ensure your students table has a column for the photo URL
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- 2. Create a public storage bucket named 'avatars'
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Set up Security Policies so users can view and upload photos
CREATE POLICY "Avatar images are publicly accessible." 
  ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars." 
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update their avatars." 
  ON storage.objects FOR UPDATE WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');