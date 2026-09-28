const { owners, services, cities } = require('./site-content.cjs')

const origin = 'https://orizgroup.com.br'
const ids = {
  organization: `${origin}/#organization`,
  website: `${origin}/#website`,
  Eudes: `${origin}/#eudes-araujo`,
  Wallyson: `${origin}/#wallyson-dias`,
}

const ref = (id) => ({ '@id': id })

function personSchema(key) {
  const owner = owners[key]
  const specialties = services.filter((service) => service.owner === key).map((service) => service.name)
  if (key === 'Wallyson') specialties.push('Mercado jurídico', 'Contexto empresarial')
  return {
    '@type': 'Person',
    '@id': ids[key],
    name: owner.name,
    jobTitle: owner.role,
    description: owner.bio,
    image: `${origin}/${owner.photo}`,
    worksFor: ref(ids.organization),
    knowsAbout: specialties,
  }
}

function organizationSchema() {
  return {
    '@type': 'Organization',
    '@id': ids.organization,
    name: 'Oriz Marketing',
    alternateName: 'Oriz',
    url: `${origin}/`,
    logo: `${origin}/icone-oriz.svg`,
    description: 'Estratégia, criatividade e performance conectadas para construir a próxima fase de marcas e negócios.',
    employee: [ref(ids.Eudes), ref(ids.Wallyson)],
    knowsAbout: services.map((service) => service.name),
    areaServed: cities.map((city) => ({ '@type': 'City', name: city.name })),
  }
}

function websiteSchema() {
  return {
    '@type': 'WebSite',
    '@id': ids.website,
    url: `${origin}/`,
    name: 'Oriz Marketing',
    inLanguage: 'pt-BR',
    publisher: ref(ids.organization),
  }
}

function webpageSchema({ type = 'WebPage', url, name, description, about = ref(ids.organization), breadcrumbId, mainEntityId }) {
  const page = {
    '@type': type,
    '@id': `${url}#webpage`,
    url,
    name,
    description,
    inLanguage: 'pt-BR',
    isPartOf: ref(ids.website),
    publisher: ref(ids.organization),
    about,
  }
  if (breadcrumbId) page.breadcrumb = ref(breadcrumbId)
  if (mainEntityId) page.mainEntity = ref(mainEntityId)
  return page
}

function breadcrumbSchema(url, items) {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${url}#breadcrumb`,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

function faqSchema(url, faqs) {
  return {
    '@type': 'FAQPage',
    '@id': `${url}#faq`,
    mainEntity: faqs.map(([question, answer]) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  }
}

function itemListSchema(url, name, items) {
  return {
    '@type': 'ItemList',
    '@id': `${url}#items`,
    name,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      url: item.url,
    })),
  }
}

function graph(...nodes) {
  return { '@context': 'https://schema.org', '@graph': nodes.flat().filter(Boolean) }
}

module.exports = {
  origin,
  ids,
  ref,
  graph,
  personSchema,
  organizationSchema,
  websiteSchema,
  webpageSchema,
  breadcrumbSchema,
  faqSchema,
  itemListSchema,
}
