import test from 'node:test'
import assert from 'node:assert/strict'

import { normalizeLeadPayload } from '../supabase/functions/capture-lead/lead-domain.mjs'

const validLead = {
  name: 'João da Silva',
  whatsapp: '+55 (11) 97212-1748',
  services: ['criacao-de-sites'],
  source_url: 'https://oriz.example/contato/',
}

test('rejects an empty service selection', () => {
  const result = normalizeLeadPayload({ ...validLead, services: [] })
  assert.deepEqual(result, { ok: false, error: 'Selecione pelo menos um serviço.' })
})

test('rejects unsupported service identifiers', () => {
  const result = normalizeLeadPayload({ ...validLead, services: ['consultoria-generica'] })
  assert.deepEqual(result, { ok: false, error: 'Selecione apenas serviços disponíveis.' })
})

test('rejects names outside the accepted length after trimming', () => {
  assert.equal(normalizeLeadPayload({ ...validLead, name: ' A ' }).ok, false)
  assert.equal(normalizeLeadPayload({ ...validLead, name: 'A'.repeat(101) }).ok, false)
})

test('normalizes formatted Brazilian WhatsApp values to digits', () => {
  const result = normalizeLeadPayload(validLead)
  assert.equal(result.ok, true)
  assert.equal(result.lead.whatsapp, '5511972121748')

  const local = normalizeLeadPayload({ ...validLead, whatsapp: '(85) 3232-1010' })
  assert.equal(local.ok, true)
  assert.equal(local.lead.whatsapp, '8532321010')
})

test('removes duplicate services and keeps canonical order', () => {
  const result = normalizeLeadPayload({
    ...validLead,
    services: ['trafego-pago', 'seo', 'trafego-pago', 'branding'],
  })

  assert.equal(result.ok, true)
  assert.deepEqual(result.lead.services, ['seo', 'branding', 'trafego-pago'])
})

test('routes Eudes-only selections to Eudes', () => {
  const result = normalizeLeadPayload({
    ...validLead,
    services: ['criacao-de-sites', 'seo', 'criacao-de-marca', 'branding'],
  })

  assert.equal(result.ok, true)
  assert.equal(result.lead.responsible, 'Eudes')
  assert.equal(result.targetNumber, '5511972121748')
})

test('routes Wallyson-only selections to Wallyson', () => {
  const result = normalizeLeadPayload({
    ...validLead,
    services: ['trafego-pago', 'estrategia-de-marketing'],
  })

  assert.equal(result.ok, true)
  assert.equal(result.lead.responsible, 'Wallyson')
  assert.equal(result.targetNumber, '558882272079')
})

test('routes mixed selections to Wallyson and stores Ambos', () => {
  const result = normalizeLeadPayload({
    ...validLead,
    services: ['criacao-de-sites', 'trafego-pago'],
  })

  assert.equal(result.ok, true)
  assert.equal(result.lead.responsible, 'Ambos')
  assert.equal(result.targetNumber, '558882272079')
})

test('builds a message with name and service labels but without the telephone', () => {
  const result = normalizeLeadPayload({
    ...validLead,
    services: ['criacao-de-sites', 'trafego-pago'],
  })

  assert.equal(result.ok, true)
  const url = new URL(result.whatsappUrl)
  assert.equal(url.hostname, 'wa.me')
  assert.equal(url.pathname, '/558882272079')
  assert.equal(
    url.searchParams.get('text'),
    'Olá, sou João da Silva. Tenho interesse em Criação de sites e Tráfego pago e cheguei pelo site da Oriz.',
  )
  assert.equal(result.message.includes('5511972121748'), false)
})

test('rejects invalid or overlong source URLs', () => {
  assert.equal(normalizeLeadPayload({ ...validLead, source_url: 'ftp://oriz.example' }).ok, false)
  assert.equal(
    normalizeLeadPayload({ ...validLead, source_url: `https://oriz.example/${'a'.repeat(2030)}` }).ok,
    false,
  )
})
