

## Integrate Real Deepfake Detection via HuggingFace Inference API

### Context
The model `buildborderless/CommunityForensics-DeepfakeDet-ViT` is MIT-licensed and free. It's a PyTorch ViT model — too heavy for browser execution. The best approach for a Lovable project is to call the **HuggingFace Inference API**, which hosts many models for free (rate-limited).

### Approach
Use a Supabase Edge Function as a proxy to call the HuggingFace Inference API with the uploaded image, then return the real/fake classification to the frontend.

### Steps

1. **Store HuggingFace API token as a secret**
   - User provides a free HuggingFace API token (from huggingface.co/settings/tokens)
   - Store it via secrets tool as `HUGGINGFACE_API_KEY`

2. **Create edge function `detect-deepfake`**
   - Receives base64 image from frontend
   - Calls `https://api-inference.huggingface.co/models/buildborderless/CommunityForensics-DeepfakeDet-ViT` with the image binary
   - Parses the classification response (returns labels + scores)
   - Returns `{ result: "real" | "fake", confidence: number }`

3. **Update `DetectorPanel.tsx`**
   - Replace the simulated `setTimeout` logic with a real `supabase.functions.invoke("detect-deepfake", { body: { image } })` call
   - Convert the uploaded file to base64 and send it
   - Map the HuggingFace response to the existing `DetectionResult` type

4. **Error handling & loading states**
   - Handle model cold-start (HF free tier can take ~20s on first call)
   - Show appropriate messages for API errors or rate limits
   - Keep the scanning animation during the real API call

### Technical Details
- HuggingFace free Inference API: rate-limited but no cost
- The model returns classification labels like `"AI"` / `"Real"` with confidence scores
- Edge function handles CORS and JWT validation
- No changes needed to `ResultDisplay` or `ScanningOverlay` — they already support the result format

### What's Needed from You
- A free HuggingFace account and API token (I'll guide you through getting one)

