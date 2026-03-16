import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const belt = searchParams.get('belt')
  const gi_nogi = searchParams.get('gi_nogi')
  const limit = searchParams.get('limit')
  const year = searchParams.get('year')
  const organization = searchParams.get('organization')

  const supabase = createServiceClient()
  let query = supabase.from('matches').select('*').order('date', { ascending: false })

  if (belt) query = query.eq('belt', belt)
  if (gi_nogi) query = query.eq('gi_nogi', gi_nogi)
  if (organization) query = query.eq('organization', organization)
  if (year) {
    query = query
      .gte('date', `${year}-01-01`)
      .lte('date', `${year}-12-31`)
  }
  if (limit) query = query.limit(parseInt(limit))

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const supabase = createServiceClient()

  // Support single match or array
  const matches = Array.isArray(body) ? body : [body]

  const { data, error } = await supabase.from('matches').insert(matches).select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
