/* ==========================================================================
   TECNOLAMBRO — main.js
   GSAP-driven scroll storytelling. Every non-trivial animation is gated by
   prefers-reduced-motion (see initReducedMotionGate) and degrades to a
   static, fully-visible layout when the user asks for less motion.
   ========================================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
  var hasGSAP = typeof window.gsap !== 'undefined';
  var smoother = null;

  if (reduceMotion) document.body.classList.add('no-motion');

  if (hasGSAP) {
    gsap.registerPlugin(ScrollTrigger);
    if (typeof SplitText !== 'undefined') gsap.registerPlugin(SplitText);
  }

  document.addEventListener('DOMContentLoaded', function () {
    initNav();
    initFooterYear();
    initCookieBanner();
    initMapConsent();
    initContactForm();

    if (!hasGSAP) {
      // CDN failed to load: strip the CSS pre-hidden state so the page
      // stays fully visible and usable without any animation library.
      document.querySelectorAll('[data-split-lines]').forEach(function (el) { el.style.opacity = 1; });
      return;
    }

    if (!reduceMotion && typeof ScrollSmoother !== 'undefined') {
      smoother = ScrollSmoother.create({
        wrapper: '#smooth-wrapper',
        content: '#smooth-content',
        smooth: 1.1,
        smoothTouch: 0.06,
        effects: false
      });
    }

    initHeroTextReveal();

    if (!reduceMotion) {
      initHeroIdleLoop();
      initHeroExplodeSequence();
      initHeroWatermark();
    } else {
      var svgLabels = document.querySelectorAll('.explode-label-svg');
      for (var i = 0; i < svgLabels.length; i++) svgLabels[i].style.display = 'none';
    }

    initManifestoReveal();
    initGalleryPin();
    initTimelineReveal();
    initGenericReveals();

    ScrollTrigger.refresh();
  });

  /* ------------------------------------------------------------------ */
  /* Navigation                                                          */
  /* ------------------------------------------------------------------ */
  function initNav() {
    var toggle = document.getElementById('navToggle');
    var links = document.getElementById('navLinks');
    if (!toggle || !links) return;

    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function (e) {
        links.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        var href = a.getAttribute('href');
        if (href && href.charAt(0) === '#' && href.length > 1) {
          var target = document.querySelector(href);
          if (target) {
            e.preventDefault();
            if (smoother) smoother.scrollTo(target, true, 'top top');
            else target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
          }
        }
      });
    });
  }

  function initFooterYear() {
    var y = document.getElementById('year');
    if (y) y.textContent = new Date().getFullYear();
  }

  /* ------------------------------------------------------------------ */
  /* Hero — headline reveal (runs regardless of reduced motion, it is a
     one-shot fade/slide, not a scroll hijack)                           */
  /* ------------------------------------------------------------------ */
  function initHeroTextReveal() {
    var h1 = document.querySelector('.hero-copy h1[data-split-lines]');
    if (!h1) return;

    if (reduceMotion || typeof SplitText === 'undefined') {
      gsap.set(h1, { opacity: 1 });
      return;
    }

    // Wait for the self-hosted fonts to be ready: SplitText measures line
    // breaks from actual rendered metrics, and running it against a
    // fallback system font bakes in the wrong wrap points once the real
    // font swaps in (GSAP's own "SplitText called before fonts loaded"
    // warning is exactly this failure mode).
    withFontsReady(function () {
      var split = new SplitText(h1, { type: 'lines', mask: 'lines', linesClass: 'line' });
      gsap.set(h1, { opacity: 1 });
      gsap.from(split.lines, {
        yPercent: 110,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        stagger: 0.12,
        delay: 0.15
      });
      gsap.from(['.hero-copy .label-mono', '.hero-copy .sub', '.hero-copy .hero-ctas'], {
        opacity: 0,
        y: 16,
        duration: 0.9,
        ease: 'power2.out',
        stagger: 0.12,
        delay: 0.75
      });
    });
  }

  function withFontsReady(fn) {
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(fn).catch(fn);
    } else {
      fn();
    }
  }

  /* ------------------------------------------------------------------ */
  /* Hero — idle "Moto Perpetuo" loop (Fase 1)                           */
  /* ------------------------------------------------------------------ */
  var idleRotateTween, idleOrbitTween, idleDustTweens = [];

  function initHeroIdleLoop() {
    var joint = document.getElementById('jointIllustration');
    var orbitWrap = document.getElementById('orbitLabels');
    if (!joint) return;

    idleRotateTween = gsap.to(joint, {
      rotation: 360,
      transformOrigin: '50% 50%',
      duration: 22,
      repeat: -1,
      ease: 'none'
    });

    if (orbitWrap) {
      updateOrbitRadius();
      window.addEventListener('resize', debounce(updateOrbitRadius, 200));

      var orbitState = { r: 0 };
      idleOrbitTween = gsap.to(orbitState, {
        r: -360,
        duration: 30,
        repeat: -1,
        ease: 'none',
        onUpdate: function () { orbitWrap.style.setProperty('--runtime', orbitState.r); }
      });

      withFontsReady(function () {
        if (typeof SplitText !== 'undefined') {
          var labels = orbitWrap.querySelectorAll('.orbit-label');
          labels.forEach(function (label, i) {
            var split = new SplitText(label, { type: 'chars', charsClass: 'char' });
            gsap.to(split.chars, {
              opacity: 1,
              duration: 0.35,
              stagger: 0.035,
              delay: 1.1 + i * 0.5,
              ease: 'none'
            });
          });
        } else {
          gsap.to('.orbit-label', { opacity: 1, duration: 0.6, stagger: 0.2, delay: 1.1 });
        }
      });
    }

    var dust = gsap.utils.toArray('.hero-dust circle');
    dust.forEach(function (dot, i) {
      idleDustTweens.push(
        gsap.to(dot, {
          x: gsap.utils.random(-24, 24),
          y: gsap.utils.random(-18, 18),
          duration: gsap.utils.random(6, 11),
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: i * 0.4
        })
      );
    });
  }

  function updateOrbitRadius() {
    var stage = document.querySelector('.hero-mechanism');
    var orbitWrap = document.getElementById('orbitLabels');
    if (!stage || !orbitWrap) return;
    var r = Math.round(stage.offsetWidth * 0.5);
    orbitWrap.style.setProperty('--orbit-radius', r + 'px');
  }

  /* ------------------------------------------------------------------ */
  /* Hero — scroll-scrubbed exploded view (Fase 2 + 3)                   */
  /* ------------------------------------------------------------------ */
  function initHeroExplodeSequence() {
    var sequence = document.querySelector('.hero-sequence');
    var stage = document.querySelector('.hero-stage');
    if (!sequence || !stage) return;

    var mechanism = document.querySelector('.hero-mechanism');
    var joint = document.getElementById('jointIllustration');

    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: sequence,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
        pin: stage,
        onEnter: function () {
          if (idleRotateTween) idleRotateTween.pause();
          if (idleOrbitTween) idleOrbitTween.pause();
        },
        onLeaveBack: function () {
          if (idleRotateTween) idleRotateTween.resume();
          if (idleOrbitTween) idleOrbitTween.resume();
        }
      }
    });

    var mobile = window.innerWidth < 700;
    var spread = mobile ? 0.55 : 1;

    tl.to(joint, { rotation: '+=140', duration: 1, ease: 'power1.in' })
      .to('.orbit-labels', { opacity: 0, duration: 0.6 }, '<')
      .to('.part-flangia-a', { x: -120 * spread, y: -80 * spread, rotateY: 30, duration: 2, ease: 'power2.out' }, '-=0.4')
      .to('.part-flangia-b', { x: 120 * spread, y: 80 * spread, rotateY: -30, duration: 2, ease: 'power2.out' }, '<')
      .to('.part-guarnizione-a', { x: -60 * spread, y: -40 * spread, duration: 2, ease: 'power2.out' }, '<')
      .to('.part-guarnizione-b', { x: 60 * spread, y: 40 * spread, duration: 2, ease: 'power2.out' }, '<')
      .to('.part-bolts-a .bolt', {
        x: function (i) { return (-150 - i * 12) * spread; },
        y: function (i) { return (-100 + i * 16) * spread; },
        stagger: 0.06,
        duration: 2,
        ease: 'power2.out'
      }, '<')
      .to('.part-bolts-b .bolt', {
        x: function (i) { return (150 + i * 12) * spread; },
        y: function (i) { return (100 - i * 16) * spread; },
        stagger: 0.06,
        duration: 2,
        ease: 'power2.out'
      }, '<')
      .to('.explode-label-svg', { opacity: 1, duration: 0.6, stagger: 0.08 }, '-=1.2')
      .to({}, { duration: 0.6 }) // hold so the exploded state is readable
      .to('.explode-label-svg', { opacity: 0, duration: 0.4 })
      .to(
        ['.part-flangia-a', '.part-flangia-b', '.part-guarnizione-a', '.part-guarnizione-b', '.part-bolts-a .bolt', '.part-bolts-b .bolt'],
        { x: 0, y: 0, rotateY: 0, duration: 2.2, ease: 'elastic.out(1, 0.65)' },
        '<'
      )
      .to(mechanism, { opacity: 0, scale: 0.82, duration: 1.1, ease: 'power2.in' }, '-=0.6')
      .to('.hero-copy', { opacity: 0, y: -30, duration: 0.8, ease: 'power2.in' }, '<');
  }

  function initHeroWatermark() {
    var watermark = document.getElementById('heroWatermark');
    var sequence = document.querySelector('.hero-sequence');
    var contact = document.getElementById('contatti');
    if (!watermark || !sequence) return;

    ScrollTrigger.create({
      trigger: sequence,
      start: 'bottom top',
      endTrigger: contact || document.body,
      end: contact ? 'top center' : 'bottom bottom',
      onToggle: function (self) {
        gsap.to(watermark, { opacity: self.isActive ? 0.55 : 0, duration: 0.6 });
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* Manifesto — line-by-line reveal on scroll into view                 */
  /* ------------------------------------------------------------------ */
  function initManifestoReveal() {
    var el = document.querySelector('.manifesto-text[data-split-lines]');
    if (!el) return;

    if (reduceMotion || typeof SplitText === 'undefined') {
      gsap.set(el, { opacity: 1 });
      return;
    }

    withFontsReady(function () {
      var split = new SplitText(el, { type: 'lines', mask: 'lines', linesClass: 'line' });
      gsap.set(el, { opacity: 1 });

      gsap.from(split.lines, {
        opacity: 0,
        yPercent: 60,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.12,
        scrollTrigger: { trigger: el, start: 'top 82%' }
      });
    });

    gsap.from('.manifesto-meta .stat', {
      opacity: 0,
      y: 16,
      duration: 0.7,
      stagger: 0.1,
      scrollTrigger: { trigger: '.manifesto-meta', start: 'top 88%' }
    });
  }

  /* ------------------------------------------------------------------ */
  /* Product gallery — pinned horizontal pan                             */
  /* ------------------------------------------------------------------ */
  function initGalleryPin() {
    var pinSection = document.querySelector('.gallery-pin');
    var viewport = document.querySelector('.gallery-viewport');
    var track = document.getElementById('galleryTrack');
    var bar = document.getElementById('galleryProgressBar');
    if (!pinSection || !track) return;

    if (reduceMotion) {
      gsap.set(track.children, { clipPath: 'inset(0 0 0 0)' });
      return; // CSS fallback already switches this section to a wrapped grid.
    }

    var distance = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };

    gsap.to(track, {
      x: function () { return -distance(); },
      ease: 'none',
      scrollTrigger: {
        trigger: pinSection,
        start: 'top top',
        end: function () { return '+=' + distance(); },
        pin: viewport,
        scrub: 1,
        invalidateOnRefresh: true,
        onUpdate: function (self) {
          if (bar) bar.style.width = (self.progress * 100) + '%';
        }
      }
    });

    gsap.from('.product-card', {
      opacity: 0,
      y: 24,
      duration: 0.6,
      stagger: 0.08,
      scrollTrigger: { trigger: pinSection, start: 'top 70%' }
    });
  }

  /* ------------------------------------------------------------------ */
  /* Process timeline — draw line + step activation                     */
  /* ------------------------------------------------------------------ */
  function initTimelineReveal() {
    var timeline = document.getElementById('timeline');
    var draw = document.getElementById('timelineDraw');
    if (!timeline) return;

    var steps = gsap.utils.toArray('.timeline-step');

    if (!reduceMotion && draw) {
      gsap.to(draw, {
        height: '100%',
        ease: 'none',
        scrollTrigger: { trigger: timeline, start: 'top 65%', end: 'bottom 75%', scrub: 0.6 }
      });
    } else if (draw) {
      draw.style.height = '100%';
    }

    steps.forEach(function (step) {
      ScrollTrigger.create({
        trigger: step,
        start: 'top 65%',
        onEnter: function () { step.classList.add('is-active'); },
        onLeaveBack: function () { step.classList.remove('is-active'); }
      });
      if (!reduceMotion) {
        gsap.from(step, {
          opacity: 0,
          y: 24,
          duration: 0.7,
          ease: 'power2.out',
          scrollTrigger: { trigger: step, start: 'top 85%' }
        });
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* Generic section reveals (quality, sectors, contact)                 */
  /* ------------------------------------------------------------------ */
  function initGenericReveals() {
    if (reduceMotion) return;

    gsap.utils.toArray('.section-head').forEach(function (head) {
      gsap.from(head.children, {
        opacity: 0,
        y: 20,
        duration: 0.7,
        stagger: 0.1,
        scrollTrigger: { trigger: head, start: 'top 85%' }
      });
    });

    gsap.from('.quality-card', {
      opacity: 0,
      y: 24,
      duration: 0.7,
      stagger: 0.1,
      scrollTrigger: { trigger: '.quality-grid', start: 'top 85%' }
    });

    gsap.from('.sector-item', {
      opacity: 0,
      y: 24,
      duration: 0.7,
      stagger: 0.1,
      scrollTrigger: { trigger: '.sectors-list', start: 'top 85%' }
    });

    gsap.from('.contact-form', {
      opacity: 0,
      y: 24,
      duration: 0.7,
      scrollTrigger: { trigger: '.contact-form', start: 'top 85%' }
    });
  }

  /* ------------------------------------------------------------------ */
  /* Cookie consent banner                                               */
  /* ------------------------------------------------------------------ */
  function initCookieBanner() {
    var banner = document.getElementById('cookieBanner');
    var acceptBtn = document.getElementById('cookieAccept');
    var rejectBtn = document.getElementById('cookieReject');
    var customizeBtn = document.getElementById('cookieCustomize');
    var savePrefsBtn = document.getElementById('cookieSavePrefs');
    var settingsPanel = document.getElementById('cookieSettingsPanel');
    var mapsToggle = document.getElementById('consentMaps');
    var openSettingsLink = document.getElementById('openCookieSettings');
    if (!banner) return;

    var STORAGE_KEY = 'tecnolambro_cookie_consent';

    function getConsent() {
      try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch (e) { return null; }
    }
    function setConsent(consent) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(consent)); } catch (e) {}
      document.dispatchEvent(new CustomEvent('tecnolambro:consent', { detail: consent }));
    }
    function showBanner() { banner.classList.add('is-visible'); }
    function hideBanner() { banner.classList.remove('is-visible'); }

    var existing = getConsent();
    if (!existing) {
      showBanner();
    }

    acceptBtn && acceptBtn.addEventListener('click', function () {
      setConsent({ maps: true, ts: Date.now() });
      hideBanner();
    });
    rejectBtn && rejectBtn.addEventListener('click', function () {
      setConsent({ maps: false, ts: Date.now() });
      hideBanner();
    });
    customizeBtn && customizeBtn.addEventListener('click', function () {
      settingsPanel.classList.toggle('is-open');
    });
    savePrefsBtn && savePrefsBtn.addEventListener('click', function () {
      setConsent({ maps: !!(mapsToggle && mapsToggle.checked), ts: Date.now() });
      hideBanner();
    });
    openSettingsLink && openSettingsLink.addEventListener('click', function () {
      showBanner();
      settingsPanel.classList.add('is-open');
    });
  }

  /* ------------------------------------------------------------------ */
  /* Google Maps — click-to-load, consent-gated (GDPR: no third-party    */
  /* cookie/request before explicit user action)                         */
  /* ------------------------------------------------------------------ */
  function initMapConsent() {
    var blocks = document.querySelectorAll('.map-block');
    if (!blocks.length) return;

    var MAP_QUERIES = {
      miradolo: 'Via degli Spinedi, 20, 27010 Miradolo Terme PV'
    };

    function loadMap(block) {
      var city = block.getAttribute('data-map-city');
      var query = encodeURIComponent(MAP_QUERIES[city] || '');
      var iframe = document.createElement('iframe');
      iframe.src = 'https://maps.google.com/maps?q=' + query + '&output=embed';
      iframe.loading = 'lazy';
      iframe.referrerPolicy = 'no-referrer-when-downgrade';
      iframe.title = 'Mappa: ' + (MAP_QUERIES[city] || 'Tecnolambro');
      block.appendChild(iframe);
      block.classList.add('is-loaded');
    }

    blocks.forEach(function (block) {
      var btn = block.querySelector('.btn-load-map');
      btn && btn.addEventListener('click', function () { loadMap(block); });
    });

    document.addEventListener('tecnolambro:consent', function (e) {
      if (e.detail && e.detail.maps) {
        blocks.forEach(function (block) {
          if (!block.classList.contains('is-loaded')) loadMap(block);
        });
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* Contact form — no backend wired up yet (see HTML comment); this     */
  /* just gives the user feedback in the UI.                             */
  /* ------------------------------------------------------------------ */
  function initContactForm() {
    var form = document.getElementById('contact-form');
    var status = document.getElementById('formStatus');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      if (status) {
        status.textContent = 'Richiesta pronta per l\'invio. Collegare il form a un servizio di invio prima della pubblicazione (vedi README).';
      }
    });
  }

  /* ------------------------------------------------------------------ */
  function debounce(fn, wait) {
    var t;
    return function () {
      clearTimeout(t);
      var args = arguments;
      t = setTimeout(function () { fn.apply(null, args); }, wait);
    };
  }
})();
