const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MetadataSummary {
  cameraMake?: string;
  cameraModel?: string;
  dateTaken?: string;
  software?: string;
  gps?: boolean;
  hasExif: boolean;
}

interface MetadataReport {
  cameraMake?: string;
  cameraModel?: string;
  dateTaken?: string;
  software?: string;
  hasGps: boolean;
  hasExif: boolean;
  metadataPresent: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { image, metadata } = await req.json()
    if (!image || typeof image !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing image data' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const apiKey = Deno.env.get('LOVABLE_API_KEY')
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'AI API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Build metadata report
    const meta = (metadata || {}) as MetadataSummary
    const metadataReport: MetadataReport = {
      cameraMake: meta.cameraMake,
      cameraModel: meta.cameraModel,
      dateTaken: meta.dateTaken,
      software: meta.software,
      hasGps: !!meta.gps,
      hasExif: !!meta.hasExif,
      metadataPresent: !!(meta.cameraMake || meta.cameraModel || meta.dateTaken || meta.gps),
    }

    // Strip data URL prefix to get just base64
    const base64Data = image.replace(/^data:image\/[a-zA-Z+]+;base64,/, '')
    const mimeMatch = image.match(/^data:(image\/[a-zA-Z+]+);base64,/)
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg'

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an expert forensic image analyst specializing in detecting AI-generated and manipulated images (deepfakes). Analyze the provided image for signs of AI generation or manipulation.

Look for these indicators:
- Unnatural skin texture, overly smooth or plastic-looking skin
- Inconsistent lighting or shadows
- Artifacts around hair, ears, teeth, glasses, or jewelry
- Asymmetric facial features that look unnatural
- Blurred or warped backgrounds
- Inconsistent reflections in eyes or glasses
- Unusual patterns in textures (fabric, skin pores, hair strands)
- Signs of inpainting or blending artifacts
- Too-perfect symmetry that looks artificial

You MUST respond with ONLY a valid JSON object in this exact format, no other text:
{"result": "real" or "fake", "confidence": number between 0 and 1, "reasoning": "brief explanation"}`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this image. Is it a real photograph or AI-generated/manipulated (deepfake)? Respond with ONLY the JSON object.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Data}`,
                },
              },
            ],
          },
        ],
      }),
    })

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text()
      console.error('AI API error:', aiResponse.status, errorText)

      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded, please try again later' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({ error: `AI analysis failed: ${aiResponse.status}` }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const aiData = await aiResponse.json()
    const content = aiData.choices?.[0]?.message?.content || ''
    console.log('AI response content:', content)

    let parsed
    try {
      const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      parsed = JSON.parse(jsonStr)
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', content)
      return new Response(JSON.stringify({ error: 'Failed to parse analysis result' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let result = parsed.result === 'fake' ? 'fake' : 'real'
    let confidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0.5
    let reasoning = parsed.reasoning || ''

    // Apply metadata logic: if no meaningful metadata and AI says "real", cap confidence at 0.59
    if (!metadataReport.metadataPresent) {
      if (result === 'real' && confidence > 0.59) {
        confidence = 0.59
        reasoning += ' [Confidence capped: no EXIF metadata found — common in AI-generated images]'
      }
      // If already fake, just note it
      if (result === 'fake') {
        reasoning += ' [No EXIF metadata found, reinforcing suspicion]'
      }
    }

    return new Response(JSON.stringify({
      result,
      confidence,
      reasoning,
      metadataReport,
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
