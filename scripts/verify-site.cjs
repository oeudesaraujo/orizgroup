const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const services = {
  'trafego-pago': 'Wallyson',
  'estrategia-de-marketing': 'Wallyson',
  'criacao-de-sites': 'Eudes',
  seo: 'Eudes',
  'criacao-de-marca': 'Eudes',
  branding: 'Eudes',
}
const cities = ['itapipoca', 'fortaleza', 'trairi', 'amontada', 'itapaje', 'sobral']
const expectedPages = [
  'servicos/index.html',
  'cidades/index.html',
  ...Object.keys(services).map((slug) => `servicos/${slug}/index.html`),
  ...cities.map((slug) => `cidades/${slug}/index.html`),
]
const assetVersion = 'v=oriz-20260927-1'
const assetPages = ['index.html', 'insights.html', ...expectedPages]

const failures = []
const titles = new Map()
const descriptions = new Map()
const h1s = new Map()

function check(condition, message) {
  if (!condition) failures.push(message)
}

function capture(html, pattern) {
  return html.match(pattern)?.[1]?.replace(/<[^>]+>/g, '').trim() || ''
}

for (const relative of assetPages) {
  const filename = path.join(root, relative)
  if (!fs.existsSync(filename)) continue
  const html = fs.readFileSync(filename, 'utf8')
  const localAssets = [...html.matchAll(/(?:href|src)="([^"?#]+\.(?:css|js)(?:\?[^"#]*)?)"/gi)].map((match) => match[1])
  check(localAssets.length > 0, `Nenhum asset local encontrado: ${relative}`)
  localAssets.forEach((asset) => check(asset.includes(assetVersion), `Asset sem versão anticache em ${relative}: ${asset}`))
}

for (const relative of expectedPages) {
  const filename = path.join(root, relative)
  check(fs.existsSync(filename), `Página ausente: ${relative}`)
  if (!fs.existsSync(filename)) continue

  const html = fs.readFileSync(filename, 'utf8')
  const title = capture(html, /<title>([\s\S]*?)<\/title>/i)
  const description = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i)?.[1] || ''
  const h1Matches = [...html.matchAll(/<h1(?:\s[^>]*)?>([\s\S]*?)<\/h1>/gi)]
  const h1 = h1Matches[0]?.[1]?.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() || ''

  check(title.length >= 20, `Title incompleto: ${relative}`)
  check(description.length >= 80, `Description incompleta: ${relative}`)
  check(h1Matches.length === 1, `A página precisa de um único h1: ${relative}`)
  check(h1.length >= 3, `h1 vazio: ${relative}`)
  check(!titles.has(title), `Title duplicado: ${title}`)
  check(!descriptions.has(description), `Description duplicada: ${relative}`)
  check(!h1s.has(h1), `h1 duplicado: ${h1}`)
  titles.set(title, relative)
  descriptions.set(description, relative)
  h1s.set(h1, relative)

  check(/<meta\s+name="robots"\s+content="index, follow"/i.test(html), `Robots ausente: ${relative}`)
  check(/aria-label="Breadcrumb"/.test(html), `Breadcrumb ausente: ${relative}`)
  check(/<script type="application\/ld\+json">/.test(html), `JSON-LD ausente: ${relative}`)
  check(/detail-pages\.css/.test(html), `CSS compartilhado ausente: ${relative}`)
  check(/menu\.js/.test(html), `Menu compartilhado ausente: ${relative}`)

  for (const href of html.matchAll(/href="([^"]+)"/g)) {
    const target = href[1]
    if (/^(https?:|mailto:|tel:|#)/.test(target)) continue
    const clean = target.split('#')[0].split('?')[0]
    if (!clean) continue
    const resolved = path.resolve(path.dirname(filename), clean)
    const candidate = clean.endsWith('/') ? path.join(resolved, 'index.html') : resolved
    check(fs.existsSync(candidate), `Link quebrado em ${relative}: ${target}`)
  }
}

for (const [slug, owner] of Object.entries(services)) {
  const relative = `servicos/${slug}/index.html`
  const filename = path.join(root, relative)
  if (!fs.existsSync(filename)) continue
  const html = fs.readFileSync(filename, 'utf8')
  check(html.includes(`data-owner="${owner}"`), `Responsável incorreto em ${relative}: esperado ${owner}`)
  check(html.includes('"@type":"Service"'), `Schema Service ausente: ${relative}`)
}

for (const slug of cities) {
  const relative = `cidades/${slug}/index.html`
  const filename = path.join(root, relative)
  if (!fs.existsSync(filename)) continue
  const html = fs.readFileSync(filename, 'utf8')
  check(html.includes('data-owner="Eudes"') && html.includes('data-owner="Wallyson"'), `Equipe incompleta: ${relative}`)
  check(html.includes('"@type":"ProfessionalService"'), `Schema ProfessionalService ausente: ${relative}`)
}

const accidentalCombinations = []
for (const city of cities) {
  for (const service of Object.keys(services)) {
    if (fs.existsSync(path.join(root, city, service, 'index.html'))) accidentalCombinations.push(`${city}/${service}`)
  }
}
check(accidentalCombinations.length === 0, `Combinações não aprovadas: ${accidentalCombinations.join(', ')}`)

if (failures.length) {
  console.error(`FALHOU — ${failures.length} problema(s)\n${failures.map((item) => `- ${item}`).join('\n')}`)
  process.exit(1)
}

console.log(`OK — ${expectedPages.length} páginas, responsáveis, metadados, schemas e links internos verificados.`)
