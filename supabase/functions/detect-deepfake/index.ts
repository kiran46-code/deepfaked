import { decodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { image } = await req.json()
    if (!image || typeof image !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing image data' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const apiKey = Deno.env.get('HUGGINGFACE_API_KEY')
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'HuggingFace API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Strip data URL prefix if present
    const base64Data = image.replace(/^data:image\/[a-zA-Z+]+;base64,/, '')

    const hfResponse = await fetch(
      'https://router.huggingface.co/hf-inference/models/buildborderless/CommunityForensics-DeepfakeDet-ViT',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: base64Data,
          parameters: {
            image_processor_size: 384,
          },
        }),
      }
    )

    if (!hfResponse.ok) {
      let errorText = ''
      try {
        errorText = await hfResponse.text()
      } catch (_) {
        errorText = 'Could not read error response'
      }
      console.error('HuggingFace API error:', hfResponse.status, errorText)

      if (hfResponse.status === 503) {
        return new Response(JSON.stringify({ error: 'Model is loading, please try again in ~20 seconds' }), {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({ error: `API error: ${hfResponse.status}` }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let classifications
    try {
      classifications = await hfResponse.json()
    } catch (e) {
      console.error('Failed to parse HF response:', e)
      return new Response(JSON.stringify({ error: 'Failed to parse model response' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    console.log('HF response:', JSON.stringify(classifications))

    // The model returns an array of arrays: [[{label, score}, ...]]
    const results = Array.isArray(classifications[0]) ? classifications[0] : classifications
    
    // Find the top label - model uses "AI" for fake and "Real" for real
    const topResult = results.reduce((best: any, item: any) =>
      item.score > best.score ? item : best, results[0])

    const isFake = topResult.label.toLowerCase() === 'ai' || topResult.label.toLowerCase() === 'fake'

    return new Response(JSON.stringify({
      result: isFake ? 'fake' : 'real',
      confidence: topResult.score,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
