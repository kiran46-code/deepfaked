import { corsHeaders } from '@supabase/supabase-js/cors'

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
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '')
    const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0))

    const hfResponse = await fetch(
      'https://api-inference.huggingface.co/models/buildborderless/CommunityForensics-DeepfakeDet-ViT',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/octet-stream',
        },
        body: binaryData,
      }
    )

    if (!hfResponse.ok) {
      const errorText = await hfResponse.text()
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

    const classifications = await hfResponse.json()
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
