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

  const visual = document.querySelector('.detail-visual')
  let frame = 0
  function moveVisual() {
    frame = 0
    if (!visual || reduced.matches) return
    const rect = visual.getBoundingClientRect()
    const progress = Math.max(-1, Math.min(1, (innerHeight / 2 - rect.top - rect.height / 2) / innerHeight))
    visual.style.transform = `perspective(900px) rotateX(${progress * 5}deg) rotateY(${progress * -7}deg) translateY(${progress * 14}px)`
  }
  addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(moveVisual) }, { passive: true })
  moveVisual()

  document.querySelectorAll('.faq-list details').forEach((detail) => {
    detail.addEventListener('toggle', () => {
      if (!detail.open) return
      document.querySelectorAll('.faq-list details[open]').forEach((other) => {
        if (other !== detail) other.removeAttribute('open')
      })
    })
  })

  const year = document.querySelector('#year')
  if (year) year.textContent = String(new Date().getFullYear())
})()
