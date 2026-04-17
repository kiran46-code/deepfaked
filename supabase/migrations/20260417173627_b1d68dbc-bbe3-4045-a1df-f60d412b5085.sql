-- Create a private storage bucket for analysis thumbnails
INSERT INTO storage.buckets (id, name, public)
VALUES ('analysis-thumbnails', 'analysis-thumbnails', false)
ON CONFLICT (id) DO NOTHING;

-- Users can read their own thumbnails (folder named after their user_id)
CREATE POLICY "Users can view their own thumbnails"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'analysis-thumbnails'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can upload thumbnails into their own folder
CREATE POLICY "Users can upload their own thumbnails"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'analysis-thumbnails'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own thumbnails
CREATE POLICY "Users can delete their own thumbnails"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'analysis-thumbnails'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );