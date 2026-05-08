// Black hole — journey through. Lightning/neuron synapse network.
// Canvas-driven: branching lightning bolts firing inwards, with persistent
// "neural" filaments and bright synaptic flashes at junction nodes.
// The viewer is "inside" looking toward the singularity at the center.
const { useEffect, useRef } = React;

function BlackHole({ speed = 1, intensity = 1 }) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext('2d');
    let raf;
    let W = 0, H = 0, cx = 0, cy = 0;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      const r = wrap.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = W * DPR; canvas.height = H * DPR;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      cx = W / 2; cy = H / 2;
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    // ── Persistent filament network (the "neurons") ─────────────────
    // Nodes scattered radially; edges connect to nearest neighbours.
    // Pulses travel along edges toward the singularity.
    const NODES = [];
    const EDGES = [];
    const NODE_COUNT = 56;

    function buildNetwork() {
      NODES.length = 0; EDGES.length = 0;
      for (let i = 0; i < NODE_COUNT; i++) {
        const t = Math.random();
        // Pull radius distribution outward — sparse near center, dense outside
        const r = Math.pow(t, 0.65) * Math.min(W, H) * 0.55 + 30;
        const a = Math.random() * Math.PI * 2;
        NODES.push({
          x: cx + Math.cos(a) * r,
          y: cy + Math.sin(a) * r,
          r,
          a,
          baseR: r,
          baseA: a,
          phase: Math.random() * Math.PI * 2,
          fire: 0,
        });
      }
      // Connect each node to its 2-3 nearest neighbours
      for (let i = 0; i < NODES.length; i++) {
        const candidates = [];
        for (let j = 0; j < NODES.length; j++) {
          if (i === j) continue;
          const dx = NODES[i].x - NODES[j].x, dy = NODES[i].y - NODES[j].y;
          candidates.push({ j, d: dx * dx + dy * dy });
        }
        candidates.sort((a, b) => a.d - b.d);
        const k = 2 + Math.floor(Math.random() * 2);
        for (let n = 0; n < k && n < candidates.length; n++) {
          const jj = candidates[n].j;
          if (!EDGES.find(e => (e.a === i && e.b === jj) || (e.a === jj && e.b === i))) {
            EDGES.push({ a: i, b: jj, pulse: -1, lastFire: 0 });
          }
        }
      }
    }
    buildNetwork();
    const onResizeRebuild = () => buildNetwork();
    ro.disconnect();
    const ro2 = new ResizeObserver(() => { resize(); onResizeRebuild(); });
    ro2.observe(wrap);

    // ── Lightning bolts toward center ────────────────────────────────
    // Slower, longer-lived, fewer of them — more meditative than strobing.
    const BOLTS = [];

    function spawnBolt() {
      const angle = Math.random() * Math.PI * 2;
      const startR = Math.min(W, H) * 0.55;
      const sx = cx + Math.cos(angle) * startR;
      const sy = cy + Math.sin(angle) * startR;
      const points = generateBoltPath(sx, sy, cx, cy, 14, 18);
      BOLTS.push({
        points,
        life: 0,
        maxLife: 220 + Math.random() * 140, // very long, gentle breathe
        branches: spawnBranches(points),
        hueShift: Math.random() * 30 - 15,
      });
    }

    function generateBoltPath(x1, y1, x2, y2, segs, jitter) {
      const pts = [{ x: x1, y: y1 }];
      for (let i = 1; i < segs; i++) {
        const t = i / segs;
        const ex = x1 + (x2 - x1) * t;
        const ey = y1 + (y2 - y1) * t;
        // Perpendicular jitter, decreasing as we approach center
        const dx = x2 - x1, dy = y2 - y1;
        const len = Math.hypot(dx, dy) || 1;
        const px = -dy / len, py = dx / len;
        const j = jitter * (1 - t * 0.6) * (Math.random() * 2 - 1);
        pts.push({ x: ex + px * j, y: ey + py * j });
      }
      pts.push({ x: x2, y: y2 });
      return pts;
    }

    function spawnBranches(pts) {
      const branches = [];
      for (let i = 2; i < pts.length - 2; i++) {
        if (Math.random() < 0.35) {
          const start = pts[i];
          const dir = Math.atan2(pts[i + 1].y - pts[i - 1].y, pts[i + 1].x - pts[i - 1].x);
          const off = (Math.random() < 0.5 ? -1 : 1) * (Math.PI / 3 + Math.random() * Math.PI / 4);
          const len = 30 + Math.random() * 60;
          const ex = start.x + Math.cos(dir + off) * len;
          const ey = start.y + Math.sin(dir + off) * len;
          branches.push(generateBoltPath(start.x, start.y, ex, ey, 5, 8));
        }
      }
      return branches;
    }

    // ── Inward radial particles (debris being drawn in) ──────────────
    const PARTS = [];
    function spawnParticle() {
      const a = Math.random() * Math.PI * 2;
      const r = Math.min(W, H) * (0.5 + Math.random() * 0.2);
      PARTS.push({
        a,
        r,
        speed: 0.4 + Math.random() * 1.2,
        size: Math.random() < 0.85 ? 0.8 : 1.6,
        life: 1,
      });
    }
    for (let i = 0; i < 80; i++) spawnParticle();

    // ── Mouse parallax ───────────────────────────────────────────────
    let mx = 0, my = 0;
    const onMove = (e) => {
      const r = wrap.getBoundingClientRect();
      mx = ((e.clientX - (r.left + r.width / 2)) / r.width) || 0;
      my = ((e.clientY - (r.top + r.height / 2)) / r.height) || 0;
    };
    window.addEventListener('mousemove', onMove);

    // ── Animation loop ───────────────────────────────────────────────
    let frame = 0;
    let lastBolt = 0;
    const SPD = speed;

    function loop() {
      frame++;

      // Trails: faint clear instead of full clear
      ctx.fillStyle = 'rgba(5, 6, 10, 0.28)';
      ctx.fillRect(0, 0, W, H);

      // Subtle parallax shift of center
      const ox = mx * 8;
      const oy = my * 8;

      // Far gradient: distant glow toward singularity
      const grad = ctx.createRadialGradient(cx + ox, cy + oy, 4, cx + ox, cy + oy, Math.max(W, H) * 0.7);
      grad.addColorStop(0,    'oklch(0.55 0.20 28 / 0.6)');
      grad.addColorStop(0.12, 'oklch(0.45 0.18 30 / 0.35)');
      grad.addColorStop(0.35, 'oklch(0.30 0.14 280 / 0.18)');
      grad.addColorStop(1,    'rgba(5,6,10,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Inward particles (warp-streak feel)
      ctx.lineCap = 'round';
      for (let i = PARTS.length - 1; i >= 0; i--) {
        const p = PARTS[i];
        const px = cx + ox + Math.cos(p.a) * p.r;
        const py = cy + oy + Math.sin(p.a) * p.r;
        p.r -= p.speed * SPD;
        if (p.r < 14) { PARTS.splice(i, 1); spawnParticle(); continue; }
        const px2 = cx + ox + Math.cos(p.a) * (p.r + p.speed * 4);
        const py2 = cy + oy + Math.sin(p.a) * (p.r + p.speed * 4);
        const alpha = Math.min(1, (p.r / 80)) * 0.7;
        ctx.strokeStyle = `oklch(0.92 0.14 75 / ${alpha})`;
        ctx.lineWidth = p.size;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px2, py2); ctx.stroke();
      }

      // ── Neural network filaments ─────────────────────────────────
      // Nodes drift slowly inward and rotate, simulating fall toward horizon
      for (const n of NODES) {
        n.a += 0.0005 * SPD * (1 + (1 / Math.max(60, n.r)) * 30);
        n.x = cx + ox + Math.cos(n.a) * n.r;
        n.y = cy + oy + Math.sin(n.a) * n.r;
        n.fire *= 0.96; // slower decay → calmer afterglow
      }

      // Edges (thin filaments)
      ctx.lineWidth = 0.6;
      for (const e of EDGES) {
        const A = NODES[e.a], B = NODES[e.b];
        const cxm = (A.x + B.x) / 2, cym = (A.y + B.y) / 2;
        const distToCenter = Math.hypot(cxm - (cx + ox), cym - (cy + oy));
        const alpha = Math.min(0.35, 24 / Math.max(40, distToCenter));
        ctx.strokeStyle = `oklch(0.85 0.10 75 / ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(A.x, A.y);
        ctx.lineTo(B.x, B.y);
        ctx.stroke();

        // Random firing pulses — slower travel, lower spawn rate
        if (Math.random() < 0.0005 * SPD) {
          e.pulse = 0;
          e.lastFire = frame;
        }
        if (e.pulse >= 0) {
          e.pulse += 0.008 * SPD;
          if (e.pulse > 1) {
            e.pulse = -1;
            B.fire = 1;
          } else {
            const t = e.pulse;
            const px = A.x + (B.x - A.x) * t;
            const py = A.y + (B.y - A.y) * t;
            ctx.fillStyle = 'oklch(0.85 0.10 75 / 0.55)';
            ctx.beginPath(); ctx.arc(px, py, 1.1, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'oklch(0.85 0.10 75 / 0.08)';
            ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2); ctx.fill();
          }
        }
      }

      // Nodes (synapses) — fire flash, gentler decay
      for (const n of NODES) {
        const base = 0.6 + n.fire * 2.5;
        ctx.fillStyle = `oklch(0.88 0.12 75 / ${0.35 + n.fire * 0.45})`;
        ctx.beginPath(); ctx.arc(n.x, n.y, base, 0, Math.PI * 2); ctx.fill();
        if (n.fire > 0.3) {
          ctx.fillStyle = `oklch(0.90 0.14 75 / ${n.fire * 0.22})`;
          ctx.beginPath(); ctx.arc(n.x, n.y, 5 + n.fire * 6, 0, Math.PI * 2); ctx.fill();
        }
      }

      // ── Lightning bolts (foreground) ────────────────────────────
      // Spawn rate cut ~5x. Cap concurrent bolts so the field never strobes.
      if (BOLTS.length < 1 && frame - lastBolt > 320 / SPD && Math.random() < 0.05) {
        spawnBolt();
        lastBolt = frame;
      }
      for (let i = BOLTS.length - 1; i >= 0; i--) {
        const b = BOLTS[i];
        b.life++;
        // Smooth ease-in/out envelope so bolts fade in and fade out
        // gradually instead of popping on/off.
        const t = b.life / b.maxLife;
        if (t >= 1) { BOLTS.splice(i, 1); continue; }
        // a = sin(πt) → 0 at start & end, 1 at middle
        const a = Math.sin(t * Math.PI);
        // Outer glow — much softer
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.strokeStyle = `oklch(0.85 0.12 78 / ${a * 0.05})`;
        ctx.lineWidth = 6;
        drawPath(ctx, b.points);
        ctx.strokeStyle = `oklch(0.82 0.10 75 / ${a * 0.18})`;
        ctx.lineWidth = 1.4;
        drawPath(ctx, b.points);
        ctx.strokeStyle = `oklch(0.85 0.10 78 / ${a * 0.38})`;
        ctx.lineWidth = 0.7;
        drawPath(ctx, b.points);
        for (const br of b.branches) {
          ctx.strokeStyle = `oklch(0.82 0.10 75 / ${a * 0.12})`;
          ctx.lineWidth = 0.8;
          drawPath(ctx, br);
        }
      }

      // ── Singularity core ────────────────────────────────────────
      const coreR = 28 + Math.sin(frame * 0.04) * 2;
      const coreGrad = ctx.createRadialGradient(cx + ox, cy + oy, 0, cx + ox, cy + oy, coreR * 4);
      coreGrad.addColorStop(0,    'oklch(0.99 0.05 95 / 0.95)');
      coreGrad.addColorStop(0.18, 'oklch(0.92 0.16 78 / 0.7)');
      coreGrad.addColorStop(0.45, 'oklch(0.55 0.20 30 / 0.25)');
      coreGrad.addColorStop(1,    'rgba(0,0,0,0)');
      ctx.fillStyle = coreGrad;
      ctx.beginPath(); ctx.arc(cx + ox, cy + oy, coreR * 4, 0, Math.PI * 2); ctx.fill();

      // Black core (event horizon)
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.arc(cx + ox, cy + oy, coreR, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'oklch(0.95 0.14 78 / 0.7)';
      ctx.lineWidth = 1;
      ctx.stroke();

      raf = requestAnimationFrame(loop);
    }

    function drawPath(ctx, pts) {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
    }

    loop();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      ro2.disconnect();
    };
  }, [speed]);

  return (
    <div ref={wrapRef} style={{
      position: 'absolute', inset: 0,
      borderRadius: '50%', overflow: 'hidden',
      background: 'radial-gradient(circle at 50% 50%, #05060A 0%, #0B0E16 60%, #14161E 100%)',
    }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0 }} />
      {/* HUD */}
      <div style={{
        position: 'absolute', top: 14, left: 16,
        fontFamily: 'Geist Mono, monospace', fontSize: 10,
        color: 'oklch(0.92 0.14 75 / 0.7)', letterSpacing: '0.1em',
        pointerEvents: 'none',
      }}>
        <div><span style={{ color: '#5B606D' }}>SYS / </span>GARGANTUA</div>
        <div><span style={{ color: '#5B606D' }}>DEPTH </span>∞ approaching</div>
      </div>
      <div style={{
        position: 'absolute', bottom: 14, right: 16, textAlign: 'right',
        fontFamily: 'Geist Mono, monospace', fontSize: 10,
        color: 'oklch(0.92 0.14 75 / 0.7)', letterSpacing: '0.1em',
        pointerEvents: 'none',
      }}>
        <div><span style={{ color: '#5B606D' }}>SYNAPSE </span><span style={{ animation: 'blink 1.4s steps(2) infinite' }}>●</span> firing</div>
        <div><span style={{ color: '#5B606D' }}>FRAME </span>locked</div>
      </div>
      <style>{`@keyframes blink { 50% { opacity: 0; } }`}</style>
    </div>
  );
}

window.BlackHole = BlackHole;
