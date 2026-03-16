import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const { email, role } = await request.json()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  const supabase = createServiceClient()

  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { role: role || 'viewer' }
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('profiles').upsert({
    id: data.user.id,
    email,
    role: role || 'viewer',
  })

  return NextResponse.json({ success: true })
}
