/* Atha Asriandi - Portofolio | main.js */
(() => {
  setTimeout(() => document.body.classList.add('loaded'), 3500);
  addEventListener('error', () => setTimeout(() => document.body.classList.add('loaded'), 800));
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  let off = false;
  try { off = localStorage.getItem('motion') === 'off'; } catch (e) {}
  document.documentElement.classList.toggle('no-motion', off);
  const reduce = off; // animasi aktif secara default; bisa dimatikan lewat tombol di kiri bawah
  const touch = matchMedia('(hover: none)').matches;
  let lenis = null;

  /* 1. Smooth scroll (Lenis) + GSAP ScrollTrigger */
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ lerp: 0.075, smoothWheel: true, wheelMultiplier: 1, touchMultiplier: 1.5 });
    if (window.gsap && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(t => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    const t = $(id);
    if (!t) return;
    e.preventDefault();
    lenis ? lenis.scrollTo(t, { offset: -70, duration: 1.4 }) : t.scrollIntoView({ behavior: 'smooth' });
  }));

  /* 2. Efek scroll: bagian atas perlahan menghilang + parallax */
  if (window.gsap && window.ScrollTrigger && !reduce) {
    $$('[data-fadeout]').forEach(el => {
      gsap.to(el, {
        opacity: 0, y: -90, scale: 0.95, filter: 'blur(8px)', ease: 'none',
        scrollTrigger: (() => {
          if (!el.closest('.hero')) return { trigger: el, start: 'top top', end: 'bottom 10%', scrub: true };
          const top = () => { let y = 0, n = el; while (n) { y += n.offsetTop; n = n.offsetParent; } return y; };
          const st = () => Math.max(0, top() - innerHeight * 0.12);
          return { trigger: el, start: st, end: () => st() + innerHeight * 0.75, scrub: true, invalidateOnRefresh: true };
        })()
      });
    });
    $$('[data-speed]').forEach(el => {
      if (el.classList.contains('about-img') && innerWidth < 992) return;
      gsap.to(el, {
        y: () => -parseFloat(el.dataset.speed) * 120, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 0.6 }
      });
    });
  }

  /* 3. Navbar, progress bar, tombol ke atas */
  const nav = $('#nav'), bar = $('.progress-bar-top'), topBtn = $('.to-top');
  const onScroll = () => {
    const y = window.scrollY, h = document.documentElement.scrollHeight - innerHeight;
    nav && nav.classList.toggle('scrolled', y > 40);
    if (bar) bar.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
    topBtn && topBtn.classList.toggle('show', y > 600);
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  topBtn && topBtn.addEventListener('click', () => lenis ? lenis.scrollTo(0, { duration: 1.6 }) : scrollTo({ top: 0, behavior: 'smooth' }));
  $$('.navbar-nav .nav-link').forEach(l => l.addEventListener('click', () => {
    const c = $('#menu');
    if (c && c.classList.contains('show') && window.bootstrap) bootstrap.Collapse.getInstance(c)?.hide();
  }));

  /* 4. Pecah teks per kata */
  $$('[data-split]').forEach(el => {
    const base = parseFloat(el.dataset.delay || 0);
    el.setAttribute('aria-label', el.textContent.trim());
    el.innerHTML = el.textContent.trim().split(/\s+/)
      .map((w, i) => `<span class="w" aria-hidden="true"><span class="wi" style="transition-delay:${base + i * 0.06}s">${w}</span></span>`)
      .join(' ');
  });

  /* 5. Reveal saat tampil di layar */
  const startReveal = () => {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    $$('[data-reveal],[data-split]').forEach(el => io.observe(el));
  };

  /* 6. Teks mengetik yang berganti-ganti */
  const tw = $('[data-typewriter]');
  const startTyping = () => {
    if (!tw) return;
    const words = JSON.parse(tw.dataset.words);
    if (reduce) { tw.textContent = words[0]; return; }
    let w = 0, c = 0, del = false;
    (function tick() {
      const word = words[w];
      tw.textContent = word.slice(0, c);
      if (!del && c < word.length) { c++; setTimeout(tick, 90); }
      else if (!del) { del = true; setTimeout(tick, 1500); }
      else if (c > 0) { c--; setTimeout(tick, 45); }
      else { del = false; w = (w + 1) % words.length; setTimeout(tick, 350); }
    })();
  };

  /* 7. Angka berhitung */
  $$('[data-count]').forEach(el => {
    const end = +el.dataset.count, suffix = el.dataset.suffix || '';
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now(), dur = 1600;
      (function step(t) {
        const p = Math.min((t - t0) / dur, 1);
        el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + suffix;
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    }, { threshold: 0.6 });
    io.observe(el);
  });

  /* 8. Efek mouse: cursor glow, tilt, tombol magnetik */
  if (!touch && !reduce) {
    const glow = $('.cursor-glow');
    if (glow) {
      let x = innerWidth / 2, y = innerHeight / 2, gx = x, gy = y;
      addEventListener('mousemove', e => { x = e.clientX; y = e.clientY; });
      (function loop() { gx += (x - gx) * 0.08; gy += (y - gy) * 0.08; glow.style.transform = `translate(${gx - 210}px,${gy - 210}px)`; requestAnimationFrame(loop); })();
    }
    $$('[data-tilt]').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(900px) rotateY(${px * 12}deg) rotateX(${-py * 12}deg) translateY(-6px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
    $$('.btn-cloud,.btn-ghost').forEach(b => {
      b.addEventListener('mousemove', e => {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.15}px,${(e.clientY - r.top - r.height / 2) * 0.25 - 3}px)`;
      });
      b.addEventListener('mouseleave', () => { b.style.transform = ''; });
    });
  }

  /* 9. Tabel tumpukan layanan cloud (halaman Materi) */
  const grid = $('#stackGrid');
  if (grid) {
    const cols = ['On-Premise', 'IaaS', 'PaaS', 'SaaS'];
    const rows = [
      ['Aplikasi', [1, 1, 1, 0]], ['Data', [1, 1, 1, 0]], ['Runtime', [1, 1, 0, 0]],
      ['Sistem Operasi', [1, 1, 0, 0]], ['Virtualisasi', [1, 0, 0, 0]], ['Server & Jaringan', [1, 0, 0, 0]]
    ];
    let html = '<div class="h l">Lapisan</div>' + cols.map(c => `<div class="h">${c}</div>`).join('');
    rows.forEach(([n, v]) => {
      html += `<div class="l">${n}</div>` + v.map(x => x ? '<div class="you">Anda</div>' : '<div class="prov">Penyedia</div>').join('');
    });
    grid.innerHTML = html;
  }

  /* 10. Transisi antar halaman */
  $$('a[href$=".html"]').forEach(a => a.addEventListener('click', e => {
    if (a.target === '_blank' || e.ctrlKey || e.metaKey) return;
    e.preventDefault();
    document.body.classList.add('leaving');
    setTimeout(() => (location.href = a.href), 350);
  }));
  addEventListener('pageshow', e => e.persisted && document.body.classList.remove('leaving'));

  /* ===== V2: animasi tambahan ===== */

  /* A. Jaringan partikel di latar (bereaksi ke mouse) */
  const cv = $('#gl');
  if (cv && !reduce && !window.THREE) {
    const ctx = cv.getContext('2d');
    let pts = [], mx = -999, my = -999;
    const size = () => {
      cv.width = innerWidth; cv.height = innerHeight;
      const n = Math.max(28, Math.min(85, Math.floor(innerWidth / 20)));
      pts = Array.from({ length: n }, () => ({ x: Math.random() * cv.width, y: Math.random() * cv.height, vx: (Math.random() - .5) * .45, vy: (Math.random() - .5) * .45, r: 1 + Math.random() * 1.6 }));
    };
    size(); addEventListener('resize', size);
    addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
    (function draw() {
      ctx.clearRect(0, 0, cv.width, cv.height);
      pts.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > cv.width) p.vx *= -1;
        if (p.y < 0 || p.y > cv.height) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fillStyle = 'rgba(161,205,220,.7)'; ctx.fill();
        for (let j = i + 1; j < pts.length; j++) {
          const q = pts[j], d = Math.hypot(p.x - q.x, p.y - q.y);
          if (d < 130) { ctx.strokeStyle = `rgba(113,183,213,${(1 - d / 130) * .28})`; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); }
        }
        const dm = Math.hypot(p.x - mx, p.y - my);
        if (dm < 170) { ctx.strokeStyle = `rgba(161,205,220,${(1 - dm / 170) * .6})`; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mx, my); ctx.stroke(); p.x += (mx - p.x) * .004; p.y += (my - p.y) * .004; }
      });
      requestAnimationFrame(draw);
    })();
  }

  /* B. Spotlight kartu mengikuti mouse */
  document.addEventListener('mousemove', e => {
    const g = e.target.closest && e.target.closest('.glass');
    if (!g) return;
    const r = g.getBoundingClientRect();
    g.style.setProperty('--mx', e.clientX - r.left + 'px');
    g.style.setProperty('--my', e.clientY - r.top + 'px');
  }, { passive: true });

  /* C. Cincin kursor + ledakan ikon saat klik */
  if (!touch && !reduce) {
    const ring = document.createElement('div');
    ring.className = 'cursor-ring'; document.body.appendChild(ring);
    let rx = -100, ry = -100, tx = -100, ty = -100;
    addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; });
    (function f() { rx += (tx - rx) * .18; ry += (ty - ry) * .18; ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`; requestAnimationFrame(f); })();
    document.addEventListener('mouseover', e => ring.classList.toggle('big', !!(e.target.closest && e.target.closest('a,button,.fn,[data-tilt]'))));
  }
  if (!reduce) {
    const icons = ['bi-cloud-fill', 'bi-stars', 'bi-code-slash', 'bi-lightning-charge-fill', 'bi-braces'];
    document.addEventListener('click', e => {
      for (let i = 0; i < 8; i++) {
        const el = document.createElement('i');
        el.className = 'bi ' + icons[i % icons.length] + ' burst';
        el.style.left = e.clientX + 'px'; el.style.top = e.clientY + 'px';
        document.body.appendChild(el);
        const a = (Math.PI * 2 * i) / 8 + Math.random() * .5, d = 50 + Math.random() * 60;
        el.animate([{ transform: 'translate(-50%,-50%) scale(.4)', opacity: 1 }, { transform: `translate(calc(-50% + ${Math.cos(a) * d}px),calc(-50% + ${Math.sin(a) * d}px)) scale(1.2) rotate(${Math.random() * 240 - 120}deg)`, opacity: 0 }], { duration: 800, easing: 'cubic-bezier(.2,.8,.2,1)' }).onfinish = () => el.remove();
      }
    });
  }

  /* D. Marquee ikut kecepatan scroll (arah berbalik saat scroll ke atas) */
  const track = $('.marquee-track');
  if (lenis && track) {
    lenis.on('scroll', ({ velocity }) => {
      const a = track.getAnimations()[0];
      if (!a) return;
      const v = Math.abs(velocity);
      a.playbackRate = v < 0.3 ? 1 : (velocity < 0 ? -1 : 1) * (1 + Math.min(v * 0.5, 10));
    });
  }

  /* E. Garis timeline tergambar mengikuti scroll */
  if (window.gsap && window.ScrollTrigger && !reduce && $('.tl-line')) {
    gsap.fromTo('.tl-line', { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.timeline', start: 'top 80%', end: 'bottom 65%', scrub: true } });
  }

  /* F. Stepper alur cloud (jalan otomatis, bisa dijeda) */
  const flow = $('.flow');
  if (flow) {
    const steps = [
      ['1. Pengguna mengirim permintaan', 'Kamu membuka aplikasi atau website, misalnya Google Drive. Permintaan dikirim dari laptop atau HP.'],
      ['2. Lewat internet', 'Permintaan berjalan melalui internet menuju alamat server milik penyedia cloud.'],
      ['3. Diproses di data center', 'Server virtual di data center menjalankan aplikasi dan mengambil data. Kapasitasnya menyesuaikan jumlah pengguna.'],
      ['4. Hasil kembali ke kamu', 'Hasil dikirim balik dalam hitungan detik. Kamu hanya membayar sebesar yang kamu pakai.']
    ];
    const nodes = $$('.fn', flow), links = $$('.fl', flow), box = $('#flowBox'), btn = $('#flowPlay');
    let cur = 0, timer = null;
    const show = n => {
      cur = n;
      nodes.forEach((x, k) => { x.classList.toggle('on', k === n); x.classList.toggle('done', k < n); });
      links.forEach((x, k) => { x.classList.toggle('on', k === n - 1); x.classList.toggle('done', k < n - 1); });
      $('#flowTitle').textContent = steps[n][0]; $('#flowDesc').textContent = steps[n][1];
      box.classList.remove('swap'); void box.offsetWidth; box.classList.add('swap');
    };
    const label = () => { btn.innerHTML = timer ? '<i class="bi bi-pause-fill me-2"></i>Jeda' : '<i class="bi bi-play-fill me-2"></i>Putar otomatis'; };
    const play = () => { clearInterval(timer); timer = setInterval(() => show((cur + 1) % steps.length), 2800); label(); };
    const stop = () => { clearInterval(timer); timer = null; label(); };
    nodes.forEach((n, k) => {
      const go = () => { stop(); show(k); };
      n.addEventListener('click', go);
      n.addEventListener('keydown', e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), go()));
    });
    btn.addEventListener('click', () => timer ? stop() : play());
    show(0); label();
    if (!reduce) new IntersectionObserver(([e], o) => { if (e.isIntersecting) { play(); o.disconnect(); } }, { threshold: 0.4 }).observe(flow);
  }

  /* ===== V3: 3D + scroll interaktif ===== */

  /* G. Scene 3D Three.js: partikel, bentuk wireframe, awan, kamera ikut scroll & mouse */
  if (window.THREE && $('#gl') && !reduce) try {
    window.__gl = true;
    const canvas = $('#gl'), mobile = innerWidth < 768;
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !mobile, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.setSize(innerWidth, innerHeight);
    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 300);
    cam.position.z = 30;
    scene.add(new THREE.AmbientLight(0xA1CDDC, 0.7));
    const pl = new THREE.PointLight(0x71B7D5, 1.8, 140); pl.position.set(10, 10, 20); scene.add(pl);

    const N = mobile ? 600 : 1500, pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) { pos[i * 3] = (Math.random() - .5) * 140; pos[i * 3 + 1] = 20 - Math.random() * 130; pos[i * 3 + 2] = (Math.random() - .5) * 90 - 10; }
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const points = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0x71B7D5, size: .22, transparent: true, opacity: .75, depthWrite: false }));
    scene.add(points);

    const ax = Math.min(1, (innerWidth / innerHeight) / 1.6);
    const geos = [new THREE.IcosahedronGeometry(3.2, 1), new THREE.TorusKnotGeometry(2.2, .65, 90, 12), new THREE.OctahedronGeometry(2.8), new THREE.TorusGeometry(2.8, .7, 14, 40), new THREE.DodecahedronGeometry(2.6), new THREE.TetrahedronGeometry(3.2)];
    const cols = [0x71B7D5, 0xA1CDDC, 0x096B90];
    const shapes = geos.map((geo, i) => {
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: cols[i % 3], wireframe: true, transparent: true, opacity: .5 }));
      m.position.set((i % 2 ? 1 : -1) * (14 + Math.random() * 8) * ax, -i * 11 - 4 + Math.random() * 4, -8 - Math.random() * 14);
      m.userData = { s: .1 + Math.random() * .2, y0: m.position.y, ph: Math.random() * 6 };
      scene.add(m); return m;
    });

    const cloud = new THREE.Group();
    const cmat = new THREE.MeshStandardMaterial({ color: 0xA1CDDC, emissive: 0x096B90, emissiveIntensity: .5, transparent: true, opacity: .5, roughness: .4 });
    [[0, 0, 0, 3], [3.2, -.6, .3, 2.4], [-3.2, -.5, .2, 2.5], [1.6, 1.6, 0, 2.2], [-1.4, 1.5, .2, 2]].forEach(([x, y, z, r]) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 18), cmat); m.position.set(x, y, z); cloud.add(m);
    });
    cloud.position.set(mobile ? 0 : 24, mobile ? 10 : 7, -24);
    scene.add(cloud);

    let mx = 0, my = 0, sy = 0, prev = 0;
    addEventListener('mousemove', e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; });
    addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); });
    const clock = new THREE.Clock();
    (function loop() {
      const t = clock.getElapsedTime();
      sy += (scrollY - sy) * .08;
      const vel = Math.min(Math.abs(sy - prev), 40); prev = sy;
      cam.position.y = -sy * .012;
      cam.position.x += (mx * 6 - cam.position.x) * .04;
      cam.position.z = 30 - Math.min(sy * .0015, 5);
      cam.lookAt(cam.position.x * .15, cam.position.y - my * 3, 0);
      points.rotation.y = t * .012;
      shapes.forEach(m => {
        const u = m.userData;
        m.rotation.x += u.s * .012 + vel * .002; m.rotation.y += u.s * .015 + vel * .003;
        m.position.y = u.y0 + Math.sin(t * .8 + u.ph) * 1.3;
      });
      cloud.position.y += Math.sin(t) * .01; cloud.rotation.y = Math.sin(t * .3) * .3;
      pl.position.x = mx * 50; pl.position.y = -my * 30 + cam.position.y;
      renderer.render(scene, cam);
      requestAnimationFrame(loop);
    })();
  } catch (err) { console.warn('3D tidak aktif:', err); }

  /* H. Teks menyala kata demi kata mengikuti scroll */
  if (window.gsap && window.ScrollTrigger && !reduce) {
    $$('[data-scrub]').forEach(el => {
      el.innerHTML = el.textContent.trim().split(/\s+/).map(w => `<span class="sw">${w}</span>`).join(' ');
      gsap.to($$('.sw', el), { opacity: 1, color: '#fff', stagger: .12, ease: 'none', scrollTrigger: { trigger: el, start: 'top 85%', end: 'bottom 50%', scrub: true } });
    });
    /* foto About berputar 3D saat scroll */
    const ai = $('.about-img img');
    if (ai && innerWidth >= 992) gsap.fromTo(ai, { rotateY: 38, scale: .88 }, { rotateY: -8, scale: 1, ease: 'none', scrollTrigger: { trigger: '.about-img', start: 'top 95%', end: 'bottom 35%', scrub: true } });
    /* susunan layanan 3D merenggang saat scroll */
    const stage = $('.iso-stage');
    if (stage) gsap.fromTo(stage, { '--gap': '14px' }, { '--gap': '96px', ease: 'none', scrollTrigger: { trigger: '.iso', start: 'top 85%', end: 'center 40%', scrub: true } });
  }

  /* I. Titik navigasi section di sisi kanan */
  const secs = $$('main section[id]');
  if (secs.length >= 3) {
    const names = { beranda: 'Beranda', about: 'Tentang saya', skills: 'Skills', moments: 'Moment', pengertian: 'Pengertian', layanan: 'SaaS PaaS IaaS', alur: 'Alur cloud', tumpukan: 'Tampilan 3D', 'manfaat-risiko': 'Manfaat & risiko' };
    const dots = document.createElement('nav');
    dots.className = 'dots-nav'; dots.setAttribute('aria-label', 'Navigasi section');
    dots.innerHTML = secs.map(x => `<a href="#${x.id}" data-label="${names[x.id] || x.id}" aria-label="${names[x.id] || x.id}"></a>`).join('');
    document.body.appendChild(dots);
    dots.querySelectorAll('a').forEach(a => a.addEventListener('click', e => {
      e.preventDefault();
      const t = $(a.getAttribute('href'));
      lenis ? lenis.scrollTo(t, { offset: -40, duration: 1.6 }) : t.scrollIntoView({ behavior: 'smooth' });
    }));
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) dots.querySelectorAll('a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id));
    }), { rootMargin: '-45% 0px -50% 0px' });
    secs.forEach(x => io.observe(x));
  }

  /* J. Judul melengkung (skew) mengikuti kecepatan scroll */
  if (lenis && window.gsap && !reduce) {
    const qs = $$('.sec-title,.page-hero h1,.stat,.marquee').map(el => gsap.quickTo(el, 'skewY', { duration: .6, ease: 'power3.out' }));
    lenis.on('scroll', ({ velocity }) => { const v = Math.max(-5, Math.min(5, velocity * .1)); qs.forEach(q => q(v)); });
  }

  /* K. Ikon sosial efek dock (membesar saat didekati) */
  if (!touch && !reduce) $$('.social').forEach(d => {
    const items = $$('a', d);
    d.addEventListener('mousemove', e => items.forEach(a => {
      const r = a.getBoundingClientRect(), dist = Math.abs(e.clientX - (r.left + r.width / 2));
      const sc = 1 + Math.max(0, 1 - dist / 110) * .75;
      a.style.transform = `translateY(${-(sc - 1) * 20}px) scale(${sc})`;
    }));
    d.addEventListener('mouseleave', () => items.forEach(a => (a.style.transform = '')));
  });

  /* L. Teks acak lalu terbaca (decrypt) */
  const CH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*';
  const scramble = el => {
    const t = el.dataset.text || (el.dataset.text = el.textContent);
    let f = 0; clearInterval(el._t);
    el._t = setInterval(() => {
      el.textContent = [...t].map((c, i) => c === ' ' ? ' ' : (i < f / 2 ? c : CH[Math.random() * CH.length | 0])).join('');
      if (++f > t.length * 2 + 4) { clearInterval(el._t); el.textContent = t; }
    }, 30);
  };
  if (!reduce) $$('.info-list b').forEach(el => {
    el.dataset.text = el.textContent;
    el.addEventListener('mouseenter', () => scramble(el));
    new IntersectionObserver(([e], o) => { if (e.isIntersecting) { scramble(el); o.disconnect(); } }, { threshold: .8 }).observe(el);
  });

  /* M. Tumpukan layanan 3D ikut gerakan mouse */
  const iso = $('.iso-stage');
  if (iso && !touch && !reduce) {
    const host = $('.iso');
    host.addEventListener('mousemove', e => {
      const r = host.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
      iso.style.setProperty('--rz', (-35 + px * 50) + 'deg');
      iso.style.setProperty('--rx', (62 - py * 25) + 'deg');
    });
    host.addEventListener('mouseleave', () => { iso.style.setProperty('--rz', '-35deg'); iso.style.setProperty('--rx', '62deg'); });
  }

  /* O. Galeri moment: scroll vertikal menggeser galeri ke samping (desktop) */
  if (window.gsap && window.ScrollTrigger && !reduce && $('.moments-track')) {
    gsap.matchMedia().add('(min-width: 992px)', () => {
      const pin = $('.moments-pin'), track = $('.moments-track'), prog = $('.moments-progress i');
      const dist = () => Math.max(0, track.scrollWidth - pin.clientWidth);
      gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: { trigger: '#moments', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: .8, invalidateOnRefresh: true, onUpdate: st => prog && (prog.style.transform = `scaleX(${st.progress})`) }
      });
    });
  }

  /* P. Foto berdiri: potong ruang kosong transparan supaya orangnya pas di tengah */
  const ai0 = $('.about-img img');
  if (ai0) {
    const fix = () => {
      try {
        const w = ai0.naturalWidth, h = ai0.naturalHeight;
        if (!w || ai0.src.startsWith('data:')) return;
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        const x = c.getContext('2d'); x.drawImage(ai0, 0, 0);
        const d = x.getImageData(0, 0, w, h).data;
        let x0 = w, x1 = 0, y0 = h, y1 = 0;
        for (let y = 0; y < h; y += 2) for (let xx = 0; xx < w; xx += 2) {
          if (d[(y * w + xx) * 4 + 3] > 20) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (y < y0) y0 = y; if (y > y1) y1 = y; }
        }
        if (x1 <= x0 || y1 <= y0) return;
        const bw = x1 - x0, bh = y1 - y0, pad = Math.round(bw * .12);
        const o = document.createElement('canvas'); o.width = bw + pad * 2; o.height = bh;
        o.getContext('2d').drawImage(ai0, x0, y0, bw, bh, pad, 0, bw, bh);
        ai0.src = o.toDataURL('image/png');
      } catch (e) { /* dibuka lewat file:// akan dilewati, di hosting berfungsi */ }
    };
    ai0.complete ? fix() : ai0.addEventListener('load', fix, { once: true });
  }

  /* N. Tombol hidup/mati animasi */
  const mt = $('#motionToggle');
  if (mt) {
    mt.setAttribute('aria-pressed', String(!off));
    mt.title = off ? 'Animasi mati. Klik untuk menyalakan' : 'Animasi menyala. Klik untuk mematikan';
    mt.addEventListener('click', () => { try { localStorage.setItem('motion', off ? 'on' : 'off'); } catch (e) {} location.reload(); });
  }

  /* 11. Mulai setelah halaman siap */
  let started = false;
  const ready = () => {
    if (started) return; started = true;
    document.body.classList.add('loaded');
    setTimeout(() => { startReveal(); startTyping(); }, 250);
    setTimeout(() => window.ScrollTrigger && ScrollTrigger.refresh(), 700);
    setTimeout(() => $('#preloader')?.remove(), 1200);
  };
  document.readyState === 'complete' ? ready() : addEventListener('load', ready);
  setTimeout(ready, 4000);
})();
