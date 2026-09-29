const fs = require('node:fs')
const path = require('node:path')
const { owners: contentOwners } = require('../content/site-content.cjs')

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
const productionOrigin = 'https://orizgroup.com.br'
const visualLabels = {
  'trafego-pago': 'Tráfego pago',
  'estrategia-de-marketing': 'Estratégia de marketing',
  'criacao-de-sites': 'Criação de sites',
  seo: 'SEO',
  'criacao-de-marca': 'Criação de marca',
  branding: 'Branding',
  itapipoca: 'Itapipoca',
  fortaleza: 'Fortaleza',
  trairi: 'Trairi',
  amontada: 'Amontada',
  itapaje: 'Itapajé',
  sobral: 'Sobral',
}
const expectedPages = [
  'servicos/index.html',
  'cidades/index.html',
  ...Object.keys(services).map((slug) => `servicos/${slug}/index.html`),
  ...cities.map((slug) => `cidades/${slug}/index.html`),
]
const canonicalPages = new Map([
  ['index.html', `${productionOrigin}/`],
  ['insights.html', `${productionOrigin}/insights.html`],
  ['contato/index.html', `${productionOrigin}/contato/`],
  ['servicos/index.html', `${productionOrigin}/servicos/`],
  ['cidades/index.html', `${productionOrigin}/cidades/`],
  ...Object.keys(services).map((slug) => [`servicos/${slug}/index.html`, `${productionOrigin}/servicos/${slug}/`]),
  ...cities.map((slug) => [`cidades/${slug}/index.html`, `${productionOrigin}/cidades/${slug}/`]),
])
const organizationId = `${productionOrigin}/#organization`
const websiteId = `${productionOrigin}/#website`
const personIds = {
  Eudes: `${productionOrigin}/#eudes-araujo`,
  Wallyson: `${productionOrigin}/#wallyson-dias`,
}
const assetVersion = 'v=oriz-20260928-5'
const assetPages = ['index.html', 'insights.html', 'contato/index.html', ...expectedPages]
const team = {
  Eudes: {
    name: 'Eudes Araújo',
    photo: 'assets/equipe/eudes-araujo.png',
  },
  Wallyson: {
    name: 'Wallyson Dias',
    photo: 'assets/equipe/wallyson-dias.png',
  },
}

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

function parseJsonLd(html, relative) {
  const scripts = [...html.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi)]
  check(scripts.length === 1, `JSON-LD único ausente: ${relative}`)
  if (scripts.length !== 1) return null
  try {
    return JSON.parse(scripts[0][1])
  } catch (error) {
    check(false, `JSON-LD inválido em ${relative}: ${error.message}`)
    return null
  }
}

function graphNode(schema, type) {
  return schema?.['@graph']?.find((node) => {
    const nodeTypes = Array.isArray(node['@type']) ? node['@type'] : [node['@type']]
    return nodeTypes.includes(type)
  })
}

for (const relative of assetPages) {
  const filename = path.join(root, relative)
  if (!fs.existsSync(filename)) continue
  const html = fs.readFileSync(filename, 'utf8')
  const localAssets = [...html.matchAll(/(?:href|src)="([^"?#]+\.(?:css|js)(?:\?[^"#]*)?)"/gi)].map((match) => match[1])
  check(localAssets.length > 0, `Nenhum asset local encontrado: ${relative}`)
  localAssets.forEach((asset) => check(asset.includes(assetVersion), `Asset sem versão anticache em ${relative}: ${asset}`))
  check(!/[↗→↑↓↺](?!\uFE0E)/u.test(html), `Símbolo pode virar emoji no iOS: ${relative}`)
}

const detailPagesScript = fs.readFileSync(path.join(root, 'detail-pages.js'), 'utf8')
check(detailPagesScript.includes("'IntersectionObserver' in window"), 'Animações de entrada precisam de fallback sem IntersectionObserver')
check(detailPagesScript.includes("element.classList.add('is-visible')"), 'Animações de entrada precisam liberar o conteúdo mesmo sem evento de scroll')
const sharedStyles = fs.readFileSync(path.join(root, 'styles.css'), 'utf8')
const menuStyles = fs.readFileSync(path.join(root, 'menu.css'), 'utf8')
const detailStyles = fs.readFileSync(path.join(root, 'detail-pages.css'), 'utf8')
check(sharedStyles.includes('-webkit-text-size-adjust:100%'), 'Proteção contra ampliação automática de texto no iOS ausente')
check(menuStyles.includes('height:100vh;height:100dvh'), 'Menu precisa de fallback de altura para versões antigas do iOS')
check(detailStyles.includes('-webkit-mask-image:'), 'Ilustrações precisam do prefixo de máscara do Safari')

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
  check(html.includes(`data-owner="${team[owner].name}"`), `Responsável incorreto em ${relative}: esperado ${team[owner].name}`)
  check(html.includes(`src="../../${team[owner].photo}"`), `Foto do responsável ausente em ${relative}`)
  check(html.includes(`data-visual="${slug}"`), `Identidade visual ausente em ${relative}`)
  check(html.includes('glass-layer--front') && html.includes('visual-scan'), `Sistema glassmorphism incompleto em ${relative}`)
  check(!html.includes(`<span>${visualLabels[slug]}</span>`), `Nome duplicado dentro da ilustração em ${relative}`)
  check(html.includes('"@type":"Service"'), `Schema Service ausente: ${relative}`)
}

for (const slug of cities) {
  const relative = `cidades/${slug}/index.html`
  const filename = path.join(root, relative)
  if (!fs.existsSync(filename)) continue
  const html = fs.readFileSync(filename, 'utf8')
  check(html.includes('data-owner="Eudes Araújo"') && html.includes('data-owner="Wallyson Dias"'), `Equipe incompleta: ${relative}`)
  check(html.includes(`src="../../${team.Eudes.photo}"`) && html.includes(`src="../../${team.Wallyson.photo}"`), `Fotos da equipe ausentes: ${relative}`)
  check(html.includes('data-visual="city"'), `Identidade visual de cidade ausente em ${relative}`)
  check(html.includes('glass-layer--front') && html.includes('visual-scan'), `Sistema glassmorphism incompleto em ${relative}`)
  check(!html.includes(`<span>${visualLabels[slug]}</span>`), `Nome duplicado dentro da ilustração em ${relative}`)
  check(html.includes('"@type":"Service"'), `Schema de serviço regional ausente: ${relative}`)
}

const accidentalCombinations = []
for (const city of cities) {
  for (const service of Object.keys(services)) {
    if (fs.existsSync(path.join(root, city, service, 'index.html'))) accidentalCombinations.push(`${city}/${service}`)
  }
}
check(accidentalCombinations.length === 0, `Combinações não aprovadas: ${accidentalCombinations.join(', ')}`)

for (const person of Object.values(team)) {
  check(fs.existsSync(path.join(root, person.photo)), `Foto ausente: ${person.photo}`)
}

const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
check(home.includes('Eudes Araújo') && home.includes('Wallyson Dias'), 'Nomes completos ausentes na Home')
check(home.includes(`src="${team.Eudes.photo}"`) && home.includes(`src="${team.Wallyson.photo}"`), 'Fotos da equipe ausentes na Home')
check(home.includes('Graduando em Direito'), 'Formação em Direito de Wallyson ausente na Home')
check(home.includes('mercado jurídico') && home.includes('contexto empresarial'), 'Foco jurídico e empresarial de Wallyson ausente na Home')

const contactRelative = 'contato/index.html'
const contactFilename = path.join(root, contactRelative)
check(fs.existsSync(contactFilename), 'Página de contato ausente')

for (const relative of ['index.html', 'insights.html', ...expectedPages]) {
  const filename = path.join(root, relative)
  if (!fs.existsSync(filename)) continue
  const html = fs.readFileSync(filename, 'utf8')
  check(!/href="(?:\.\.\/)*index\.html#contato"|href="#contato"/.test(html), `CTA antigo de contato em ${relative}`)
}

for (const [relative, canonical] of canonicalPages) {
  const html = fs.readFileSync(path.join(root, relative), 'utf8')
  const matches = [...html.matchAll(/<link\s+rel="canonical"\s+href="([^"]+)"/gi)]
  check(matches.length === 1, `Canonical único ausente: ${relative}`)
  check(matches[0]?.[1] === canonical, `Canonical incorreto em ${relative}: esperado ${canonical}`)
  check(!/href="(?:\.\.\/)*index\.html(?:[?#][^"]*)?"/i.test(html), `Link interno aponta para index.html em ${relative}`)

  const schema = parseJsonLd(html, relative)
  check(schema?.['@context'] === 'https://schema.org', `Contexto Schema.org ausente: ${relative}`)
  check(Array.isArray(schema?.['@graph']), `JSON-LD precisa usar @graph: ${relative}`)
  const page = graphNode(schema, relative === 'contato/index.html' ? 'ContactPage' : relative.endsWith('/index.html') && !relative.startsWith('servicos/') && !relative.startsWith('cidades/') ? 'WebPage' : relative === 'servicos/index.html' || relative === 'cidades/index.html' || relative === 'insights.html' ? 'CollectionPage' : 'WebPage')
  check(Boolean(page), `Entidade principal da página ausente: ${relative}`)
  check(page?.url === canonical, `URL da entidade principal incorreta: ${relative}`)
  check(page?.isPartOf?.['@id'] === websiteId, `Relação com WebSite ausente: ${relative}`)
  check(page?.publisher?.['@id'] === organizationId, `Relação com a Oriz ausente: ${relative}`)
  const organization = graphNode(schema, 'Organization')
  check(Boolean(organization?.description), `Descrição central da Oriz ausente: ${relative}`)
  check(organization?.employee?.length === 2, `Equipe central da Oriz incompleta: ${relative}`)
}

const homeSchema = parseJsonLd(fs.readFileSync(path.join(root, 'index.html'), 'utf8'), 'index.html')
check(graphNode(homeSchema, 'Organization')?.['@id'] === organizationId, 'Entidade central da Oriz ausente na Home')
check(graphNode(homeSchema, 'WebSite')?.['@id'] === websiteId, 'Entidade WebSite ausente na Home')
for (const [key, person] of Object.entries(team)) {
  const node = homeSchema?.['@graph']?.find((item) => item['@id'] === personIds[key])
  check(node?.['@type'] === 'Person' && node.name === person.name, `Pessoa não conectada à Oriz: ${person.name}`)
  check(node?.worksFor?.['@id'] === organizationId, `Vínculo profissional ausente: ${person.name}`)
  check(node?.description === contentOwners[key].bio, `Biografia do schema divergente: ${person.name}`)
}

for (const [slug, owner] of Object.entries(services)) {
  const relative = `servicos/${slug}/index.html`
  const schema = parseJsonLd(fs.readFileSync(path.join(root, relative), 'utf8'), relative)
  const service = graphNode(schema, 'Service')
  const providerIds = Array.isArray(service?.provider) ? service.provider.map((item) => item['@id']) : []
  check(providerIds.includes(organizationId), `Service sem Oriz como provedora: ${relative}`)
  check(providerIds.includes(personIds[owner]), `Service sem responsável correto: ${relative}`)
  check(Boolean(graphNode(schema, 'BreadcrumbList')), `BreadcrumbList ausente: ${relative}`)
  check(Boolean(graphNode(schema, 'FAQPage')), `FAQPage ausente: ${relative}`)
}

for (const slug of cities) {
  const relative = `cidades/${slug}/index.html`
  const schema = parseJsonLd(fs.readFileSync(path.join(root, relative), 'utf8'), relative)
  const page = graphNode(schema, 'WebPage')
  check(page?.about?.['@type'] === 'City' && page.about.name === visualLabels[slug], `Cidade incorreta no schema: ${relative}`)
  check(Boolean(graphNode(schema, 'BreadcrumbList')), `BreadcrumbList ausente: ${relative}`)
  check(Boolean(graphNode(schema, 'FAQPage')), `FAQPage ausente: ${relative}`)
  check(!schema?.['@graph']?.some((node) => node['@type'] === 'LocalBusiness'), `Página regional não deve declarar filial física: ${relative}`)
}

const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8')
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1])
check(sitemapUrls.includes(`${productionOrigin}/contato/`), 'Rota /contato/ ausente do sitemap')
check(sitemapUrls.every((url) => url.startsWith(`${productionOrigin}/`)), 'Sitemap contém URLs fora do domínio oficial')

const robotsFilename = path.join(root, 'robots.txt')
check(fs.existsSync(robotsFilename), 'robots.txt ausente')
if (fs.existsSync(robotsFilename)) {
  const robots = fs.readFileSync(robotsFilename, 'utf8')
  check(/User-agent:\s*\*/i.test(robots) && /Allow:\s*\//i.test(robots), 'Rastreamento geral não está liberado no robots.txt')
  check(/User-agent:\s*OAI-SearchBot[\s\S]*?Allow:\s*\//i.test(robots), 'OAI-SearchBot não está liberado no robots.txt')
  check(robots.includes(`Sitemap: ${productionOrigin}/sitemap.xml`), 'Sitemap oficial ausente do robots.txt')
}

const htaccessFilename = path.join(root, '.htaccess')
check(fs.existsSync(htaccessFilename), '.htaccess de canonicalização ausente')
if (fs.existsSync(htaccessFilename)) {
  const htaccess = fs.readFileSync(htaccessFilename, 'utf8')
  check(/RewriteCond\s+%\{THE_REQUEST\}[^\r\n]*index\\\.html/i.test(htaccess), 'Redirecionamento de index.html ausente')
  check(/RewriteCond\s+%\{HTTP_HOST\}\s+!\^orizgroup\\\.com\\\.br\$/i.test(htaccess), 'Redirecionamento para domínio sem www ausente')
  check(/RewriteRule[^\r\n]*https:\/\/orizgroup\.com\.br/i.test(htaccess), 'Destino canônico não configurado no .htaccess')
}

if (failures.length) {
  console.error(`FALHOU — ${failures.length} problema(s)\n${failures.map((item) => `- ${item}`).join('\n')}`)
  process.exit(1)
}

console.log(`OK — ${expectedPages.length + 1} páginas, responsáveis, metadados, schemas e links internos verificados.`)
