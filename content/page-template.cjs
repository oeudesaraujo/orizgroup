const { owners, services, cities } = require('./site-content.cjs')

const esc = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])
const serviceBySlug = Object.fromEntries(services.map((item) => [item.slug, item]))
const assetVersion = '?v=oriz-20260928-1'

function shell({ title, description, base, bodyClass, breadcrumb, content, schema }) {
  const nav = [
    ['ORIZ', `${base}index.html#oriz`],
    ['SERVIÇOS', `${base}servicos/`],
    ['COMO TRABALHAMOS', `${base}index.html#metodo`],
    ['INSIGHTS', `${base}insights.html`],
    ['VAMOS CONVERSAR', `${base}index.html#contato`],
  ]
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${esc(description)}">
  <meta name="robots" content="index, follow">
  <meta name="theme-color" content="#ff5a1f">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="pt_BR">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <title>${esc(title)}</title>
  <link rel="icon" href="${base}icone-oriz.svg" type="image/svg+xml">
  <link rel="stylesheet" href="${base}styles.css${assetVersion}">
  <link rel="stylesheet" href="${base}menu.css${assetVersion}">
  <link rel="stylesheet" href="${base}footer-motion.css${assetVersion}">
  <link rel="stylesheet" href="${base}detail-pages.css${assetVersion}">
  <script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>
  <script defer src="${base}menu.js${assetVersion}"></script>
  <script defer src="${base}footer-motion.js${assetVersion}"></script>
  <script defer src="${base}detail-pages.js${assetVersion}"></script>
</head>
<body class="detail-page ${bodyClass}">
  <a class="skip" href="#main">Pular para o conteúdo</a>
  <header class="header detail-header">
    <a class="logo" href="${base}index.html" aria-label="Oriz, início">oriz<span>®</span><small>MARKETING</small></a>
    <button class="menu-toggle" aria-expanded="false" aria-controls="navigation">Menu <span class="menu-lines" aria-hidden="true"></span></button>
  </header>
  <dialog id="navigation" class="fullscreen-menu" aria-label="Menu principal">
    <div class="menu-shell">
      <div class="menu-links-panel">
        <div class="menu-topline"><a class="logo" href="${base}index.html" aria-label="Oriz, início">oriz<span>®</span><small>MARKETING</small></a><span class="menu-caption">CONEXÕES QUE CONSTROEM.</span></div>
        <nav aria-label="Navegação principal">${nav.map(([label, href], index) => `<a href="${href}">${label}${index === nav.length - 1 ? '<span aria-hidden="true">↗</span>' : ''}</a>`).join('')}</nav>
        <div class="menu-bottomline">Estratégia, criatividade e performance.<br>Na mesma direção.</div>
      </div>
      <div class="menu-brand-panel"><canvas class="pixel-trail" aria-hidden="true"></canvas><div class="pixel-word" role="img" aria-label="ORIZ"></div><span class="menu-brand-note">IDEIAS EM MOVIMENTO.</span></div>
      <button class="menu-close" aria-label="Fechar menu">Fechar <span aria-hidden="true">×</span></button>
    </div>
  </dialog>
  <main id="main">
    <nav class="breadcrumb" aria-label="Breadcrumb">${breadcrumb}</nav>
    ${content}
  </main>
  <footer class="section footer detail-footer">
    <div class="footer-top"><p>Estratégia, criatividade e performance.<br>Na mesma direção.</p><a href="#main" class="back-top">VOLTAR AO TOPO ↑</a></div>
    <a class="footer-logo" href="${base}index.html" aria-label="Oriz, início">oriz<span>®</span></a>
    <div class="footer-bottom"><span>© <span id="year">2026</span> Oriz Marketing</span><div><a href="${base}servicos/">Serviços</a><a href="${base}cidades/">Cidades</a><a href="${base}insights.html">Insights</a><a href="${base}index.html#contato">Contato</a></div><span>FEITO DE CONEXÕES.</span></div>
  </footer>
</body>
</html>`
}

function ownerCard(name, base, compact = false) {
  const owner = owners[name]
  return `<article class="owner-card${compact ? ' owner-card--compact' : ''}" data-owner="${owner.name}">
    <div class="owner-portrait"><img src="${base}${owner.photo}" alt="${esc(owner.photoAlt)}" width="947" height="${name === 'Wallyson' ? '805' : '837'}" loading="lazy" decoding="async"><span class="mono owner-photo-label">ORIZ · PESSOAS</span><span class="mono owner-photo-note">DIFERENTES OLHARES · UMA DIREÇÃO</span></div>
    <div><span class="detail-kicker">QUEM CONDUZ</span><h3>${owner.name}</h3><p class="owner-role">${owner.role}</p><p>${owner.bio}</p></div>
  </article>`
}

function visual(kind, label) {
  return `<div class="detail-visual detail-visual--${kind}" aria-hidden="true"><div class="visual-grid"></div><div class="visual-orbit"></div><span>${esc(label)}</span><i></i><i></i><i></i></div>`
}

function renderService(service) {
  const base = '../../'
  const owner = owners[service.owner]
  const breadcrumb = `<a href="${base}index.html">Início</a><span>→</span><a href="${base}servicos/">Serviços</a><span>→</span><strong>${esc(service.name)}</strong>`
  const content = `<section class="detail-hero detail-section">
      <div class="detail-hero-copy"><span class="detail-kicker">${service.eyebrow}</span><h1>${esc(service.name)}<br><em>com direção.</em></h1><p>${esc(service.promise)}</p><a class="button dark" href="${base}index.html#contato">Começar uma conversa <span>↗</span></a></div>
      <div class="detail-hero-side">${visual(service.slug, service.name)}<p>LIDERADO POR <strong>${owner.name}</strong><br>${owner.role}</p></div>
    </section>
    <section class="detail-section statement-section"><span class="detail-kicker">QUANDO FAZ SENTIDO</span><h2>${esc(service.context)}</h2></section>
    <section class="detail-section modules-section"><div class="section-heading"><span class="detail-kicker">O QUE CONSTRUÍMOS</span><h2>Entregas conectadas,<br><em>não peças soltas.</em></h2></div><div class="deliverable-grid">${service.deliverables.map((item, index) => `<article><span>${String(index + 1).padStart(2, '0')}</span><h3>${esc(item)}</h3></article>`).join('')}</div></section>
    <section class="detail-section process-section"><div class="section-heading"><span class="detail-kicker">COMO ACONTECE</span><h2>Um processo que<br><em>deixa rastros claros.</em></h2></div><div class="process-list">${service.process.map(([name, copy]) => `<article><h3>${esc(name)}</h3><p>${esc(copy)}</p><span>↗</span></article>`).join('')}</div></section>
    <section class="detail-section owner-section">${ownerCard(service.owner, base)}</section>
    <section class="detail-section link-section"><div class="section-heading"><span class="detail-kicker">ONDE ATENDEMOS</span><h2>Estratégia próxima<br><em>do contexto.</em></h2></div><div class="text-link-grid">${cities.map((city) => `<a href="${base}cidades/${city.slug}/">${city.name}<span>↗</span></a>`).join('')}</div></section>
    <section class="detail-section faq-section"><div class="section-heading"><span class="detail-kicker">PERGUNTAS FREQUENTES</span><h2>Antes do próximo<br><em>movimento.</em></h2></div><div class="faq-list">${service.faqs.map(([question, answer]) => `<details><summary>${esc(question)}<span>+</span></summary><p>${esc(answer)}</p></details>`).join('')}</div></section>
    <section class="detail-section related-section"><span class="detail-kicker">SERVIÇOS RELACIONADOS</span><div class="related-grid">${service.related.map((slug) => { const item = serviceBySlug[slug]; return `<a href="${base}servicos/${item.slug}/"><span>${item.eyebrow}</span><h3>${item.name}</h3><b>↗</b></a>` }).join('')}</div></section>
    ${cta(base, `Vamos colocar ${service.name.toLowerCase()} em movimento?`)}
`
  return shell({
    title: `${service.name} com estratégia | Oriz Marketing`,
    description: `${service.promise} Conheça a abordagem da Oriz para ${service.name.toLowerCase()}, as entregas, o processo e quem conduz o trabalho.`,
    base, bodyClass: `service-page service-${service.slug}`, breadcrumb, content,
    schema: { '@context': 'https://schema.org', '@type': 'Service', name: service.name, provider: { '@type': 'ProfessionalService', name: 'Oriz Marketing' }, description: service.promise, areaServed: cities.map((city) => city.name) },
  })
}

function renderCity(city) {
  const base = '../../'
  const breadcrumb = `<a href="${base}index.html">Início</a><span>→</span><a href="${base}cidades/">Cidades</a><span>→</span><strong>${esc(city.name)}</strong>`
  const content = `<section class="detail-hero city-hero detail-section">
      <div class="detail-hero-copy"><span class="detail-kicker">${city.eyebrow}</span><h1>Marketing digital<br>em <em>${esc(city.name)}.</em></h1><p>${esc(city.promise)}</p><a class="button dark" href="${base}index.html#contato">Conversar sobre o negócio <span>↗</span></a></div>
      <div class="detail-hero-side">${visual('city', city.name)}<p>CEARÁ · BRASIL<br><strong>${esc(city.focus)}</strong></p></div>
    </section>
    <section class="detail-section statement-section"><span class="detail-kicker">ENTENDER ANTES DE AGIR</span><h2>${esc(city.context)}</h2></section>
    <section class="detail-section city-services"><div class="section-heading"><span class="detail-kicker">CAPACIDADES CONECTADAS</span><h2>Seis frentes.<br><em>Uma mesma direção.</em></h2></div><div class="service-card-grid">${services.map((service) => `<a href="${base}servicos/${service.slug}/"><span>${service.eyebrow}</span><h3>${service.name}</h3><p>${service.promise}</p><b>${owners[service.owner].name} ↗</b></a>`).join('')}</div></section>
    <section class="detail-section regional-section"><div><span class="detail-kicker">COMO TRABALHAMOS</span><h2>Proximidade não depende<br><em>de estar na mesma sala.</em></h2></div><div><p>O processo combina conversas objetivas, apresentação de decisões e ciclos claros de validação. Quando um encontro presencial agrega ao projeto, ele pode ser alinhado conforme contexto e disponibilidade.</p><ul><li>Diagnóstico com contexto local</li><li>Rotina remota organizada</li><li>Decisões registradas</li><li>Entregas conectadas ao objetivo</li></ul></div></section>
    <section class="detail-section team-section"><div class="section-heading"><span class="detail-kicker">QUEM FAZ ACONTECER</span><h2>Duas especialidades.<br><em>Uma direção.</em></h2></div><div class="team-grid">${ownerCard('Wallyson', base, true)}${ownerCard('Eudes', base, true)}</div></section>
    <section class="detail-section faq-section"><div class="section-heading"><span class="detail-kicker">PERGUNTAS FREQUENTES</span><h2>Atendimento em<br><em>${esc(city.name)}.</em></h2></div><div class="faq-list">${city.faqs.map(([question, answer]) => `<details><summary>${esc(question)}<span>+</span></summary><p>${esc(answer)}</p></details>`).join('')}</div></section>
    <section class="detail-section link-section"><div class="section-heading"><span class="detail-kicker">OUTROS CONTEXTOS</span><h2>Conexões pela<br><em>região.</em></h2></div><div class="text-link-grid">${cities.filter((item) => item.slug !== city.slug).map((item) => `<a href="${base}cidades/${item.slug}/">${item.name}<span>↗</span></a>`).join('')}</div></section>
    ${cta(base, `Vamos construir a próxima fase da sua marca em ${city.name}?`)}
`
  return shell({
    title: `Marketing digital em ${city.name} | Oriz Marketing`,
    description: `${city.promise} Conheça os serviços de estratégia, tráfego, sites, SEO e marca da Oriz para empresas em ${city.name}.`,
    base, bodyClass: `city-page city-${city.slug}`, breadcrumb, content,
    schema: { '@context': 'https://schema.org', '@type': 'ProfessionalService', name: `Oriz Marketing — ${city.name}`, description: city.promise, areaServed: { '@type': 'City', name: city.name }, knowsAbout: services.map((service) => service.name) },
  })
}

function cta(base, title) {
  return `<section class="detail-section detail-cta"><span class="detail-kicker">O PRÓXIMO MOVIMENTO</span><h2>${esc(title)}</h2><a class="button dark" href="${base}index.html#contato">Conversar com a Oriz <span>↗</span></a></section>`
}

function renderIndex(type) {
  const isServices = type === 'services'
  const base = '../'
  const items = isServices ? services : cities
  const title = isServices ? 'Serviços de marketing conectados | Oriz' : 'Cidades atendidas pela Oriz Marketing'
  const description = isServices
    ? 'Conheça as frentes de estratégia, tráfego pago, sites, SEO, criação de marca e branding da Oriz e veja quem conduz cada entrega.'
    : 'Conheça a atuação regional da Oriz em Itapipoca, Fortaleza, Trairi, Amontada, Itapajé e Sobral, com estratégia próxima de cada contexto.'
  const h1 = isServices ? 'Serviços que<br><em>trabalham juntos.</em>' : 'Estratégia próxima<br><em>de cada contexto.</em>'
  const intro = isServices ? 'Especialidades diferentes ganham força quando compartilham uma direção.' : 'Atuação regional sem fórmulas copiadas de uma cidade para outra.'
  const cards = items.map((item) => isServices
    ? `<a href="${item.slug}/"><span>${item.eyebrow}</span><h2>${item.name}</h2><p>${item.promise}</p><b>${owners[item.owner].name} ↗</b></a>`
    : `<a href="${item.slug}/"><span>${item.eyebrow}</span><h2>${item.name}</h2><p>${item.focus}</p><b>CONHECER ↗</b></a>`).join('')
  const category = isServices ? 'Serviços' : 'Cidades'
  const breadcrumb = `<a href="${base}index.html">Início</a><span>→</span><strong>${category}</strong>`
  const content = `<section class="index-hero detail-section"><span class="detail-kicker">${isServices ? 'CAPACIDADES ORIZ' : 'PRESENÇA REGIONAL'}</span><h1>${h1}</h1><p>${intro}</p></section><section class="detail-section directory-grid">${cards}</section>${cta(base, isServices ? 'Qual frente precisa ganhar direção agora?' : 'Onde está o próximo movimento da sua marca?')}`
  return shell({
    title, description, base, bodyClass: `${isServices ? 'services' : 'cities'}-index`, breadcrumb, content,
    schema: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: category, description },
  })
}

module.exports = { renderService, renderCity, renderIndex }
