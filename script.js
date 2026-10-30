(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------- Project filter ---------- */
    const buttons = document.querySelectorAll('.filters button');
    const items = document.querySelectorAll('.project');
    buttons.forEach(btn => btn.addEventListener('click', () => {
        const tag = btn.dataset.filter;
        buttons.forEach(b => b.classList.toggle('active', b === btn));
        items.forEach(item => {
            const show = tag === 'all' || item.dataset.tags.split(' ').includes(tag);
            item.classList.toggle('hide', !show);
            item.classList.toggle('featured', show && tag === 'all' && item.dataset.featured === 'true');
        });
    }));
    // keep old inline handler working, just in case
    window.filterItems = tag => {
        const b = document.querySelector(`.filters button[data-filter="${tag}"]`);
        if (b) b.click();
    };

    /* ---------- Reveal on scroll ---------- */
    const io = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach((el, i) => {
        el.style.transitionDelay = `${(i % 3) * 70}ms`;
        io.observe(el);
    });

    /* ---------- Active nav link ---------- */
    const links = document.querySelectorAll('.topbar a[href^="#"]:not(.logo)');
    const secs = [...links].map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
    const navIO = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
        });
    }, { rootMargin: '-45% 0px -50% 0px' });
    secs.forEach(s => navIO.observe(s));

    /* ---------- Card spotlight + tilt ---------- */
    const fine = window.matchMedia('(pointer: fine)').matches;
    document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('pointermove', e => {
            const r = card.getBoundingClientRect();
            card.style.setProperty('--mx', `${e.clientX - r.left}px`);
            card.style.setProperty('--my', `${e.clientY - r.top}px`);
        });
    });
    if (fine && !reduce) {
        items.forEach(card => {
            card.addEventListener('pointermove', e => {
                const r = card.getBoundingClientRect();
                const x = (e.clientX - r.left) / r.width - 0.5;
                const y = (e.clientY - r.top) / r.height - 0.5;
                card.style.transform = `perspective(900px) rotateX(${-y * 6}deg) rotateY(${x * 6}deg) translateY(-4px)`;
            });
            card.addEventListener('pointerleave', () => { card.style.transform = ''; });
        });
        const glow = document.querySelector('.glow');
        if (glow) window.addEventListener('pointermove', e => {
            glow.style.left = e.clientX + 'px';
            glow.style.top = e.clientY + 'px';
        });
    }

    /* ---------- Typed role ---------- */
    const typed = document.querySelector('.typed');
    if (typed) {
        const words = JSON.parse(typed.dataset.words);
        if (reduce) { typed.textContent = words[0]; }
        else {
            let w = 0, c = 0, del = false;
            const tick = () => {
                const word = words[w];
                typed.textContent = word.slice(0, c);
                if (!del && c < word.length) c++;
                else if (!del) { del = true; return setTimeout(tick, 1600); }
                else if (c > 0) c--;
                else { del = false; w = (w + 1) % words.length; }
                setTimeout(tick, del ? 35 : 70);
            };
            tick();
        }
    }

    /* ---------- Footer year ---------- */
    document.querySelectorAll('.year-now').forEach(el => el.textContent = new Date().getFullYear());

    /* ---------- Hero: splat-ish particle field ---------- */
    const canvas = document.getElementById('field');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H, DPR, pts = [];
    const mouse = { x: -9999, y: -9999 };
    const palette = [[124,156,255],[183,139,255],[79,227,214],[255,181,71]];

    function resize() {
        DPR = Math.min(window.devicePixelRatio || 1, 2);
        W = canvas.clientWidth; H = canvas.clientHeight;
        canvas.width = W * DPR; canvas.height = H * DPR;
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
        const n = Math.min(160, Math.floor(W * H / 9000));
        pts = Array.from({ length: n }, () => {
            const z = Math.random();
            return {
                x: Math.random() * W, y: Math.random() * H, z,
                vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25,
                r: 1 + z * 2.4,
                c: palette[Math.random() < .08 ? 3 : Math.floor(Math.random() * 3)],
            };
        });
    }
    window.addEventListener('resize', resize);
    canvas.parentElement.addEventListener('pointermove', e => {
        const r = canvas.getBoundingClientRect();
        mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    canvas.parentElement.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });
    resize();

    let visible = true;
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) requestAnimationFrame(frame); }).observe(canvas);

    function frame(t) {
        if (!visible) return;
        ctx.clearRect(0, 0, W, H);
        const LINK = 130;
        for (const p of pts) {
            if (!reduce) {
                p.x += p.vx * (0.4 + p.z); p.y += p.vy * (0.4 + p.z);
                const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
                if (d2 < 22000) { const f = (1 - d2 / 22000) * 1.6; p.x += dx / Math.sqrt(d2 + 1) * f; p.y += dy / Math.sqrt(d2 + 1) * f; }
                if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
                if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
            }
        }
        // links
        for (let i = 0; i < pts.length; i++) {
            const a = pts[i];
            for (let j = i + 1; j < pts.length; j++) {
                const b = pts[j];
                const dx = a.x - b.x, dy = a.y - b.y, d = Math.hypot(dx, dy);
                if (d < LINK) {
                    ctx.strokeStyle = `rgba(${a.c[0]},${a.c[1]},${a.c[2]},${(1 - d / LINK) * 0.16 * (a.z + b.z)})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
                }
            }
        }
        // gaussian-ish splats
        for (const p of pts) {
            const pulse = 1 + Math.sin(t / 900 + p.x * 0.01) * 0.15;
            const R = p.r * 6 * pulse;
            const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, R);
            g.addColorStop(0, `rgba(${p.c[0]},${p.c[1]},${p.c[2]},${0.55 * (0.4 + p.z)})`);
            g.addColorStop(0.25, `rgba(${p.c[0]},${p.c[1]},${p.c[2]},${0.12 * (0.4 + p.z)})`);
            g.addColorStop(1, `rgba(${p.c[0]},${p.c[1]},${p.c[2]},0)`);
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.arc(p.x, p.y, R, 0, Math.PI * 2); ctx.fill();
        }
        if (!reduce) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
})();
