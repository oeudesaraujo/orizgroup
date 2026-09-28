(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  document.querySelectorAll('.detail-section > *, .directory-grid > a').forEach((element) => element.classList.add('is-reveal'))

  if (reduced.matches) {
    document.querySelectorAll('.is-reveal').forEach((element) => element.classList.add('is-visible'))
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('is-visible')
        observer.unobserve(entry.target)
      })
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' })
    document.querySelectorAll('.is-reveal').forEach((element) => observer.observe(element))
  }

  const visuals = [...document.querySelectorAll('.detail-visual')]
  let frame = 0
  function moveVisual() {
    frame = 0
    if (reduced.matches) return
    visuals.forEach((visual) => {
      const rect = visual.getBoundingClientRect()
      const progress = Math.max(-1, Math.min(1, (innerHeight / 2 - rect.top - rect.height / 2) / innerHeight))
      visual.style.setProperty('--sy', progress.toFixed(3))
    })
  }
  addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(moveVisual) }, { passive: true })
  visuals.forEach((visual) => {
    visual.addEventListener('pointermove', (event) => {
      if (reduced.matches || event.pointerType === 'touch') return
      const rect = visual.getBoundingClientRect()
      visual.style.setProperty('--mx', (((event.clientX - rect.left) / rect.width) * 2 - 1).toFixed(3))
      visual.style.setProperty('--my', (((event.clientY - rect.top) / rect.height) * 2 - 1).toFixed(3))
    }, { passive: true })
    visual.addEventListener('pointerleave', () => {
      visual.style.setProperty('--mx', '0')
      visual.style.setProperty('--my', '0')
    })
  })
  moveVisual()

  document.querySelectorAll('.faq-list details').forEach((detail) => {
    detail.addEventListener('toggle', () => {
      if (!detail.open) return
      document.querySelectorAll('.faq-list details[open]').forEach((other) => {
        if (other !== detail) other.removeAttribute('open')
      })
    })
  })

  if (reduced.matches) visuals.forEach((visual) => {
    visual.style.setProperty('--mx', '0')
    visual.style.setProperty('--my', '0')
    visual.style.setProperty('--sy', '0')
  })

  const year = document.querySelector('#year')
  if (year) year.textContent = String(new Date().getFullYear())
})()
