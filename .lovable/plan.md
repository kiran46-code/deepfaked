

# Test Deepfake Detector with AI-Generated Image

## Approach
1. Use the AI Gateway script to generate a synthetic face image
2. Base64-encode the generated image
3. Send it to the `detect-deepfake` edge function via curl
4. Verify the function returns `result: "fake"` with reasonable confidence

## Steps
1. **Copy AI gateway script** to `/tmp/lovable_ai.py`
2. **Generate an AI face** using `google/gemini-3-pro-image-preview` with a prompt like "A photorealistic portrait of a person, studio lighting"
3. **Base64-encode** the output image
4. **Call the edge function** with `supabase--curl_edge_functions` passing the base64 image
5. **Report results** — whether it was detected as fake, confidence level, and reasoning

No code changes needed — this is a pure testing task.

