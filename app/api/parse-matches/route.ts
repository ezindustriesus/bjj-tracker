import { NextRequest, NextResponse } from 'next/server'

const SYSTEM_PROMPT = `You are a BJJ competition data parser. Extract match results and return ONLY a JSON array — no explanation, no markdown, no code fences.

Each match object must have these exact fields:
{
  "date": "YYYY-MM-DD",
  "tournament": "string",
  "organization": "string (AGF, IBJJF, Springfield BJJ, Newbreed, Chewjitsu, etc.)",
  "belt": "White | Blue | Purple | Brown | Black",
  "age_division": "string (Adult (18+), Master 1 (30+), Master 2 (35+), Masters, etc.)",
  "weight_class": "string (Light (175), Challenger I (175), Middle (190), etc.)",
  "gi_nogi": "Gi | No Gi | Suit",
  "division_type": "Regular | Challenger | Challenger I | Round Robin | Intermediate",
  "opponent": "string (full name, or Unknown)",
  "result": "Win | Loss",
  "method": "string (Submission, Points, Heel Hook, Armbar, Triangle, etc.)",
  "score": "string or null (e.g. '5-2', null if not available)",
  "medal": "Gold | Silver | Bronze | 5th | 7th | null"
}

Rules:
- If a field is unknown/missing, use null or a sensible default
- For belt, default to Purple if unclear
- For organization, infer from tournament name if possible (AGF = American Grappling Federation)
- If you see a bracket result (e.g. gold medal division), infer medal from placement
- Always return a valid JSON array, even for a single match
- If input contains no match data, return []
- Do NOT wrap in markdown code blocks`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, imageBase64, imageMediaType } = body

    if (!text && !imageBase64) {
      return NextResponse.json({ error: 'No input provided' }, { status: 400 })
    }

    const messageContent: any[] = []

    if (imageBase64) {
      messageContent.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: imageMediaType || 'image/jpeg',
          data: imageBase64,
        },
      })
    }

    if (text) {
      messageContent.push({ type: 'text', text: `Parse these BJJ match results:\n\n${text}` })
    } else {
      messageContent.push({ type: 'text', text: 'Parse all BJJ match results visible in this image/document.' })
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: messageContent }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      return NextResponse.json({ error: `Claude API error: ${err}` }, { status: 500 })
    }

    const data = await response.json()
    const rawText = data.content?.[0]?.text || '[]'

    // Parse the JSON response
    let parsed
    try {
      // Strip any accidental markdown fences
      const clean = rawText.replace(/^```json?\n?/i, '').replace(/\n?```$/i, '').trim()
      parsed = JSON.parse(clean)
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI response', raw: rawText }, { status: 500 })
    }

    return NextResponse.json({ matches: Array.isArray(parsed) ? parsed : [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
