import { NextRequest, NextResponse } from 'next/server'

const SYSTEM_PROMPT = `You are a BJJ competition data parser for Zack Kram's match tracker.

Extract match data from any input: text descriptions, tournament result screenshots, bracket photos, spreadsheet data, handwritten notes, or any other format.

Context about Zack:
- Competes at Purple belt (previously White and Blue)
- Age divisions: Master 1 (30+), Master 2 (35+), Adult (18+), Masters
- Typical weight: Light (175), Challenger I (175)
- Common orgs: AGF, IBJJF, Springfield BJJ, Newbreed, Chewjitsu

Return ONLY a valid JSON array of match objects. No explanation, no markdown, no preamble.

Each match object must have these exact fields:
{
  "date": "YYYY-MM-DD",
  "tournament": "full tournament name",
  "organization": "org abbreviation",
  "belt": "White|Blue|Purple|Brown|Black",
  "age_division": "e.g. Master 1 (30+)",
  "weight_class": "e.g. Light (175)",
  "gi_nogi": "Gi|No Gi|Suit",
  "division_type": "Regular|Challenger|Challenger I|Round Robin",
  "opponent": "Opponent Full Name",
  "result": "Win|Loss",
  "method": "e.g. Submission|Points|Heel Hook|Armbar|Triangle|Kimura|Guillotine|Rear Naked Choke|Overtime|Ref Decision|Tie Breaker|Disqualification|Walkover",
  "score": "e.g. 5-2 or null if unknown",
  "medal": "Gold|Silver|Bronze|5th|7th or null"
}

Rules:
- If a field is unknown, use null (not empty string)
- result must be exactly "Win" or "Loss"  
- gi_nogi must be exactly "Gi", "No Gi", or "Suit"
- date must be YYYY-MM-DD format
- If multiple matches are described, return all of them as an array
- If only one match, still return a single-element array
- If you cannot parse any matches, return []
- Infer reasonable defaults based on context (e.g. if no belt mentioned and it's recent, assume Purple)
`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, imageBase64, imageType } = body

    if (!text && !imageBase64) {
      return NextResponse.json({ error: 'No input provided' }, { status: 400 })
    }

    // Build message content
    const content: any[] = []

    if (imageBase64) {
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: imageType || 'image/jpeg',
          data: imageBase64,
        },
      })
    }

    content.push({
      type: 'text',
      text: text
        ? `Parse the following into match data:\n\n${text}`
        : 'Parse the matches shown in this image/document.',
    })

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      return NextResponse.json({ error: `AI error: ${err}` }, { status: 500 })
    }

    const aiData = await response.json()
    const rawText = aiData.content?.[0]?.text || '[]'

    // Parse JSON from response
    let matches = []
    try {
      // Strip any accidental markdown fences
      const clean = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      matches = JSON.parse(clean)
      if (!Array.isArray(matches)) matches = [matches]
    } catch {
      return NextResponse.json({ error: 'Could not parse AI response', raw: rawText }, { status: 500 })
    }

    return NextResponse.json({ matches })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
