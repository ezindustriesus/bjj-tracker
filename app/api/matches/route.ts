import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

function headers() {
  return {
    'apikey': SERVICE_KEY,
    'Authorization': `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const belt = searchParams.get('belt')
  const gi_nogi = searchParams.get('gi_nogi')
  const limit = searchParams.get('limit')
  const year = searchParams.get('year')
  const organization = searchParams.get('organization')

  let url = `${SUPABASE_URL}/rest/v1/matches?select=*&order=date.desc`
  if (belt) url += `&belt=eq.${encodeURIComponent(belt)}`
  if (gi_nogi) url += `&gi_nogi=eq.${encodeURIComponent(gi_nogi)}`
  if (organization) url += `&organization=eq.${encodeURIComponent(organization)}`
  if (year) url += `&date=gte.${year}-01-01&date=lte.${year}-12-31`
  if (limit) url += `&limit=${limit}`

  try {
    const res = await fetch(url, { headers: headers() })
    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: err }, { status: res.status })
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: e.message, url: SUPABASE_URL }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const matches = Array.isArray(body) ? body : [body]

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/matches`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(matches)
    })
    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: err }, { status: res.status })
    }
    const data = await res.json()
    return NextResponse.json(data, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message, url: SUPABASE_URL }, { status: 500 })
  }
}
