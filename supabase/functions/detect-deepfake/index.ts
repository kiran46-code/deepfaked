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

const SYSTEM_PROMPT = `You are a forensic image analyst. Analyze this image step-by-step. Check these specific areas:

- Skin texture (pores, smoothness, plastic look)
- Hair (individual strands vs blobby masses)
- Eyes (matching reflections, iris detail, alignment)
- Teeth/mouth (count, gum line, lip texture)
- Hands/fingers (count, proportions, nails)
- Background (warped lines, floating objects, inconsistent blur)
- Lighting (shadow direction consistency, specular highlights)
- Edge boundaries (halo effects, blending artifacts where subject meets background)
- Symmetry (too-perfect = suspicious)
- Textures (fabric, surfaces, any text in the image)

Score each area 0-10 (0=definitely real, 10=definitely AI). Areas not visible score -1.

Calculate weighted average of all scored areas.

If average > 5: result is fake. If < 4: real. If 4-5: uncertain.

Respond with ONLY JSON:
{"scores": {"skin_texture": N, "hair": N, "eyes": N, "teeth_mouth": N, "hands_fingers": N, "background": N, "lighting": N, "edge_boundaries": N, "symmetry": N, "textures": N}, "result": "real"/"fake", "confidence": 0-1, "reasoning": "explanation referencing top 3 suspicious areas"}`;

const USER_MESSAGE = 'Forensically analyze this image. Score all 10 areas. If no person in image, mark areas 1-5 as -1 and weight areas 6-10 higher. JSON only.';

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

    const base64Data = image.replace(/^data:image\/[a-zA-Z+]+;base64,/, '')
    const mimeMatch = image.match(/^data:(image\/[a-zA-Z+]+);base64,/)
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg'

    const requestBody = JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: USER_MESSAGE },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Data}` } },
          ],
        },
      ],
    })

    let parsed: any = null

    // Retry logic: up to 2 attempts
    for (let attempt = 0; attempt < 2; attempt++) {
      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: requestBody,
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
      console.log('AI response content (attempt ' + (attempt + 1) + '):', content)

      try {
        const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        parsed = JSON.parse(jsonStr)
        break // success
      } catch (e) {
        console.error('Failed to parse AI response (attempt ' + (attempt + 1) + '):', content)
        if (attempt === 1) {
          return new Response(JSON.stringify({ error: 'Failed to parse analysis result' }), {
            status: 502,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
        // retry
      }
    }

    let result = parsed.result === 'fake' ? 'fake' : 'real'
    let confidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0.5
    let reasoning = parsed.reasoning || ''
    const scores = parsed.scores || null

    // Dynamic EXIF confidence adjustment
    if (!metadataReport.metadataPresent) {
      if (result === 'real') {
        confidence = Math.max(0.3, confidence - 0.1)
        reasoning += ' [Confidence reduced: no EXIF metadata found]'
      } else if (result === 'fake') {
        confidence = Math.min(0.95, confidence + 0.05)
        reasoning += ' [No EXIF metadata found, reinforcing suspicion]'
      }
    } else if ((metadataReport.cameraMake || metadataReport.cameraModel) && result === 'real') {
      confidence = Math.min(0.95, confidence + 0.1)
      reasoning += ' [Confidence boosted: real camera metadata detected]'
    }

    return new Response(JSON.stringify({
      result,
      confidence,
      reasoning,
      scores,
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
