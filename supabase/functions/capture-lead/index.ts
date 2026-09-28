import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.95.0'

import { createCaptureHandler } from './handler.mjs'

function parseKeyMap(variable: string, legacyVariable: string): string[] {
  const encoded = Deno.env.get(variable)
  if (encoded) {
    const values = Object.values(JSON.parse(encoded)).filter((value): value is string => typeof value === 'string')
    if (values.length) return values
  }

  const legacy = Deno.env.get(legacyVariable)
  return legacy ? [legacy] : []
}

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const projectPublishableKey = 'sb_publishable_cu2QrGqC4au6ezzotBPSbw_daFPBN7e'
const publishableKeys = [
  projectPublishableKey,
  ...parseKeyMap('SUPABASE_PUBLISHABLE_KEYS', 'SUPABASE_ANON_KEY'),
]
const secretKeys = parseKeyMap('SUPABASE_SECRET_KEYS', 'SUPABASE_SERVICE_ROLE_KEY')
const configuredOrigins = (Deno.env.get('ORIZ_ALLOWED_ORIGINS') || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

if (!supabaseUrl || publishableKeys.length === 0 || secretKeys.length === 0) {
  throw new Error('Supabase function environment is incomplete.')
}

const supabaseAdmin = createClient(supabaseUrl, secretKeys[0], {
  auth: { persistSession: false, autoRefreshToken: false },
})

const handler = createCaptureHandler({
  allowedOrigins: [
    ...configuredOrigins,
    'http://127.0.0.1:4175',
    'http://localhost:4175',
  ],
  publishableKeys,
  insertLead: async (lead) => {
    const { data, error } = await supabaseAdmin
      .from('leads')
      .insert(lead)
      .select('id')
      .single()

    if (error) throw error
    return data
  },
})

Deno.serve(handler)
