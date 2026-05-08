// Architecture — isometric 3D stack. Layers extrude bottom-up as the user
// scrubs through the request lifecycle. Each layer is a beveled slab in
// isometric projection; the active one lifts, glows, and shows its details
// in a side panel.
const { useState, useEffect, useRef } = React;

const LAYERS = [
  { id: 'req',  label: 'Request',     sub: 'POST /api/agent/chat',     detail: 'X-User-Id · X-Session-Id · message body',          tint: 0 },
  { id: 'grd',  label: 'Guardrails',  sub: 'PII · Injection · Rate',   detail: 'Ordered pipeline · masking · drop',                tint: 1 },
  { id: 'rt',   label: 'Routing',     sub: 'Hybrid · semantic + LLM',  detail: 'all-MiniLM-L6 in-process · threshold 0.82',        tint: 2 },
  { id: 'mem',  label: 'Memory',      sub: '3-layer · Redis + Mongo',  detail: 'Working · episodic · knowledge',                   tint: 3 },
  { id: 'llm',  label: 'LLM',         sub: 'Multi-provider · failover', detail: 'OpenAI · Anthropic · Azure · Resilience4j',       tint: 4 },
  { id: 'tool', label: 'Tools',       sub: '@AgentTool · retry · HITL', detail: 'Cache · approval · dry-run · structured output',  tint: 5 },
  { id: 'res',  label: 'Response',    sub: 'SSE stream · sync',        detail: 'Tokens · cost · trace · OpenTelemetry',            tint: 6 },
];

function Architecture() {
  const [active, setActive] = useState(LAYERS.length - 1); // start fully built
  const [auto, setAuto] = useState(true);
  const stageRef = useRef(null);

  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => {
      setActive((a) => (a + 1) % LAYERS.length);
    }, 1800);
    return () => clearInterval(id);
  }, [auto]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => setAuto(e.isIntersecting));
    }, { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section className="arch" id="architecture" data-screen-label="03 Architecture">
      <style>{`
        .iso-wrap {
          margin-top: 56px;
          display: grid;
          grid-template-columns: 1.2fr 0.9fr;
          gap: 32px;
          align-items: stretch;
        }
        @media (max-width: 980px) { .iso-wrap { grid-template-columns: 1fr; } }

        .iso-stage {
          position: relative;
          border: 1px solid var(--line-2);
          border-radius: 16px;
          background:
            radial-gradient(ellipse 70% 50% at 50% 60%, oklch(0.62 0.14 55 / 0.06), transparent 70%),
            var(--panel);
          aspect-ratio: 1 / 1;
          overflow: hidden;
          box-shadow: 0 24px 60px -30px rgba(20,22,30,0.18);
        }
        .iso-stage::before {
          content: ""; position: absolute; inset: 0;
          background-image:
            linear-gradient(to right, var(--line) 1px, transparent 1px),
            linear-gradient(to bottom, var(--line) 1px, transparent 1px);
          background-size: 28px 28px;
          mask-image: radial-gradient(ellipse 80% 70% at 50% 60%, black 20%, transparent 80%);
          opacity: 0.5; pointer-events: none;
        }

        /* The 3D scene */
        .iso-scene {
          position: absolute;
          inset: 0;
          perspective: 1600px;
          perspective-origin: 50% 35%;
          display: grid;
          place-items: center;
        }
        .iso-rotor {
          position: relative;
          width: 280px;
          height: 280px;
          transform-style: preserve-3d;
          transform: rotateX(58deg) rotateZ(-32deg);
          animation: isoFloat 8s ease-in-out infinite;
          filter: drop-shadow(0 30px 30px rgba(20,22,30,0.18));
        }
        @keyframes isoFloat {
          0%, 100% { transform: rotateX(58deg) rotateZ(-32deg) translateZ(0); }
          50%      { transform: rotateX(58deg) rotateZ(-32deg) translateZ(8px); }
        }

        .iso-layer {
          position: absolute;
          left: 50%; top: 50%;
          width: 280px;
          height: 280px;
          transform-style: preserve-3d;
          transform: translate(-50%, -50%) translateZ(var(--z, 0px));
          transition: transform 0.7s cubic-bezier(.2,.7,.2,1), opacity 0.5s ease;
        }
        .iso-layer.below { opacity: 0.96; }
        .iso-layer.future { opacity: 0; transform: translate(-50%, -50%) translateZ(var(--z, 0px)) scale(0.9); }
        .iso-layer.lifted { transform: translate(-50%, -50%) translateZ(calc(var(--z, 0px) + 38px)); }

        /* The slab itself: top face + 4 side faces */
        .slab {
          position: absolute; inset: 0;
          transform-style: preserve-3d;
        }
        .face {
          position: absolute;
          backface-visibility: hidden;
        }
        .face-top {
          width: 280px; height: 280px;
          background: var(--face-top, #FBF9F4);
          border: 1px solid var(--face-line, rgba(20,22,30,0.18));
          background-image:
            linear-gradient(135deg, rgba(255,255,255,0.6) 0%, transparent 40%),
            radial-gradient(ellipse 60% 80% at 0% 0%, rgba(255,255,255,0.5), transparent 60%);
          box-shadow:
            inset 0 0 0 1px rgba(255,255,255,0.7),
            inset 0 -30px 60px rgba(20,22,30,0.06),
            inset 0 0 80px rgba(20,22,30,0.04);
          transform: translateZ(18px);
          display: grid;
          place-items: center;
          padding: 20px;
        }
        .iso-layer.lifted .face-top {
          background: var(--face-top-active, #FFFFFF);
          background-image:
            linear-gradient(135deg, rgba(255,255,255,0.9) 0%, transparent 50%),
            radial-gradient(ellipse 70% 100% at 0% 0%, rgba(255,255,255,0.7), transparent 60%);
          border-color: var(--face-line-active, oklch(0.62 0.14 55 / 0.6));
          box-shadow:
            inset 0 0 0 1px oklch(0.62 0.14 55 / 0.25),
            inset 0 -20px 40px oklch(0.62 0.14 55 / 0.1),
            0 0 60px oklch(0.62 0.14 55 / 0.3);
        }
        .face-side {
          width: 280px; height: 36px;
          background:
            linear-gradient(180deg, var(--face-side, #E8E4DC), color-mix(in oklab, var(--face-side, #E8E4DC) 60%, #000 4%));
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(0,0,0,0.08);
        }
        .face-side.front { transform: rotateX(-90deg) translateZ(-18px) translateY(-18px); transform-origin: top; }
        .face-side.back  { transform: rotateX(-90deg) translateZ(262px) translateY(-18px); transform-origin: top; }
        .face-side.left  { width: 36px; height: 280px; transform: rotateY(90deg) translateZ(-18px) translateX(-18px); transform-origin: left;
          background: linear-gradient(90deg, color-mix(in oklab, var(--face-side, #E8E4DC) 60%, #000 6%), var(--face-side, #E8E4DC));
        }
        .face-side.right { width: 36px; height: 280px; transform: rotateY(90deg) translateZ(262px) translateX(-18px); transform-origin: left;
          background: linear-gradient(90deg, var(--face-side, #E8E4DC), color-mix(in oklab, var(--face-side, #E8E4DC) 50%, #000 8%));
        }
        .iso-layer.lifted .face-side {
          background: linear-gradient(180deg, color-mix(in oklab, var(--face-side, #E8E4DC) 70%, oklch(0.62 0.14 55) 30%), color-mix(in oklab, var(--face-side, #E8E4DC) 50%, oklch(0.4 0.14 55) 30%));
        }

        /* Top face label (visible through iso projection) */
        .face-top .lbl {
          font-family: "Geist Mono", monospace;
          font-size: 12px;
          color: var(--fg-dim);
          letter-spacing: 0.16em;
          text-transform: uppercase;
          text-align: center;
        }
        .face-top .num {
          display: block;
          font-size: 9.5px;
          color: var(--fg-mute);
          margin-bottom: 6px;
        }
        .iso-layer.lifted .face-top .lbl { color: var(--gold); }
        .iso-layer.lifted .face-top .num { color: var(--gold); opacity: 0.7; }

        /* Glyph in middle of top face — varies per layer */
        .glyph {
          width: 60px; height: 60px;
          margin: 0 auto 10px;
          opacity: 0.72;
        }

        /* Inbound packet animation: a small cube travels down to active layer */
        .packet {
          position: absolute;
          left: 50%; top: 50%;
          width: 14px; height: 14px;
          background: var(--gold);
          border-radius: 2px;
          transform: translate(-50%, -50%) translateZ(var(--packet-z, 200px));
          box-shadow: 0 0 16px var(--gold);
          transition: transform 0.7s cubic-bezier(.2,.7,.2,1);
        }

        /* Side panel */
        .iso-panel {
          border: 1px solid var(--line-2);
          border-radius: 16px;
          background: var(--panel);
          padding: 28px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          box-shadow: 0 24px 60px -30px rgba(20,22,30,0.12);
        }
        .iso-panel header {
          display: flex; align-items: baseline; gap: 12px;
          padding-bottom: 16px; border-bottom: 1px solid var(--line);
        }
        .iso-panel header .ix {
          font-family: "Geist Mono", monospace;
          font-size: 11px; color: var(--gold);
          padding: 3px 8px; border-radius: 999px;
          background: var(--gold-soft);
        }
        .iso-panel header h3 {
          font-size: 22px; font-weight: 500; letter-spacing: -0.02em;
        }
        .iso-panel .sub {
          font-family: "Geist Mono", monospace;
          font-size: 12px; color: var(--fg-dim);
        }
        .iso-panel .detail {
          font-size: 14px; line-height: 1.55; color: var(--fg-dim);
        }

        .iso-list {
          list-style: none; padding: 0; margin: 0;
          display: flex; flex-direction: column; gap: 4px;
          font-family: "Geist Mono", monospace; font-size: 12px;
        }
        .iso-list li {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 14px; border-radius: 8px;
          color: var(--fg-mute);
          cursor: pointer;
          transition: all 0.18s ease;
          border: 1px solid transparent;
        }
        .iso-list li:hover { background: var(--panel-2); color: var(--fg); }
        .iso-list li.done { color: var(--fg); }
        .iso-list li.active {
          color: var(--gold);
          background: var(--gold-soft);
          border-color: oklch(0.62 0.14 55 / 0.3);
        }
        .iso-list li .ix {
          font-size: 10.5px;
          color: var(--fg-mute);
          width: 22px;
        }
        .iso-list li.done .ix, .iso-list li.active .ix { color: var(--gold); }
        .iso-list li .pip {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--line-2);
          flex-shrink: 0;
        }
        .iso-list li.done .pip { background: var(--gold); }
        .iso-list li.active .pip {
          background: var(--gold);
          box-shadow: 0 0 0 4px var(--gold-soft);
          animation: pipPulse 1.4s ease-in-out infinite;
        }
        @keyframes pipPulse { 50% { box-shadow: 0 0 0 7px transparent; } }

        .iso-controls {
          display: flex; align-items: center; gap: 10px;
          padding-top: 8px;
          font-family: "Geist Mono", monospace;
          font-size: 11px; color: var(--fg-mute);
        }
        .iso-controls button {
          background: transparent; border: 1px solid var(--line-2);
          color: var(--fg-dim); font-family: inherit; font-size: 11px;
          padding: 6px 12px; border-radius: 6px; cursor: pointer;
          transition: all 0.18s ease;
        }
        .iso-controls button:hover { border-color: var(--fg-dim); color: var(--fg); }

        /* Stage badge top-left */
        .iso-badge {
          position: absolute; top: 16px; left: 16px;
          font-family: "Geist Mono", monospace;
          font-size: 10.5px; color: var(--fg-mute);
          letter-spacing: 0.16em; text-transform: uppercase;
          z-index: 2;
        }
        .iso-badge .dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: var(--gold); margin-right: 8px; vertical-align: middle; box-shadow: 0 0 8px var(--gold); }
      `}</style>

      <div className="container">
        <div className="reveal">
          <div className="eyebrow">Architecture</div>
          <h2 style={{ marginTop: 20, maxWidth: '20ch' }}>
            Built layer by layer.
          </h2>
          <p className="lead" style={{ marginTop: 20 }}>
            Each request descends through a deterministic stack — guardrails first, routing,
            memory, LLM, tools — and surfaces back as a streamed response. Watch the stack
            assemble.
          </p>
        </div>

        <div className="iso-wrap reveal" ref={stageRef}>
          <div className="iso-stage">
            <div className="iso-badge"><span className="dot"></span> AGENT.STACK / RUNTIME</div>
            <IsoScene active={active} />
          </div>

          <div className="iso-panel">
            <header>
              <span className="ix">{String(active + 1).padStart(2, '0')} / {String(LAYERS.length).padStart(2, '0')}</span>
              <h3>{LAYERS[active].label}</h3>
            </header>
            <div className="sub">{LAYERS[active].sub}</div>
            <div className="detail">{LAYERS[active].detail}</div>

            <ul className="iso-list">
              {LAYERS.map((l, i) => (
                <li
                  key={l.id}
                  className={i === active ? 'active' : i < active ? 'done' : ''}
                  onClick={() => { setActive(i); setAuto(false); }}
                >
                  <span className="ix">{String(i + 1).padStart(2, '0')}</span>
                  <span className="pip"></span>
                  <span>{l.label}</span>
                  <span style={{ marginLeft: 'auto', color: 'var(--fg-mute)', fontSize: 10.5 }}>{l.sub}</span>
                </li>
              ))}
            </ul>

            <div className="iso-controls">
              <button onClick={() => setAuto(a => !a)}>{auto ? '◼ Pause' : '▶ Play'}</button>
              <button onClick={() => { setActive(0); setAuto(false); }}>↺ Reset</button>
              <span style={{ marginLeft: 'auto' }}>autocycle {auto ? 'on' : 'off'}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── 3D scene ──────────────────────────────────────────────────────────────

function IsoScene({ active }) {
  // z-spacing per layer (translateZ in CSS-pixels along scene Z)
  const Z_STEP = 56;
  const total = LAYERS.length;

  return (
    <div className="iso-scene">
      <div className="iso-rotor">
        {LAYERS.map((l, i) => {
          // bottom layer at i=0, top at i=total-1
          const z = (i - (total - 1) / 2) * Z_STEP;
          let cls = 'iso-layer';
          if (i < active) cls += ' below';
          else if (i === active) cls += ' lifted';
          else cls += ' future';

          // Tint each layer subtly, with active glowing.
          const baseFill = ['#FFFFFF', '#FBF9F4', '#F7F4ED', '#F2EEE5', '#EEE9DD', '#EAE4D5', '#E6DFCE'][l.tint];
          const sideFill = ['#EFEAE0', '#EAE4D5', '#E4DDC9', '#DED6BC', '#D8CFAF', '#D3C9A2', '#CDC295'][l.tint];

          return (
            <div
              key={l.id}
              className={cls}
              style={{
                '--z': `${z}px`,
                '--face-top': baseFill,
                '--face-top-active': '#FFFFFF',
                '--face-side': sideFill,
                '--face-line': 'rgba(20,22,30,0.16)',
                '--face-line-active': 'oklch(0.62 0.14 55 / 0.6)',
              }}
            >
              <div className="slab">
                <div className="face face-side back"></div>
                <div className="face face-side left"></div>
                <div className="face face-side right"></div>
                <div className="face face-side front"></div>
                <div className="face face-top">
                  <div style={{ textAlign: 'center' }}>
                    <LayerGlyph id={l.id} active={i === active} />
                    <div className="lbl">
                      <span className="num">{String(i + 1).padStart(2, '0')}</span>
                      {l.label}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Traveling packet: sits on top of active layer */}
        <Packet active={active} total={total} zStep={Z_STEP} />
      </div>
    </div>
  );
}

function Packet({ active, total, zStep }) {
  // Drop the packet onto the active layer from above.
  const targetZ = (active - (total - 1) / 2) * zStep + 16;
  return (
    <div
      className="packet"
      style={{
        '--packet-z': `${targetZ}px`,
      }}
    />
  );
}

// Tiny per-layer iconographic glyphs (geometric, monoline)
function LayerGlyph({ id, active }) {
  const c = active ? 'var(--gold)' : 'var(--fg-mute)';
  const op = active ? 1 : 0.55;
  switch (id) {
    case 'req':
      return (
        <svg className="glyph" viewBox="0 0 60 60" fill="none" style={{ opacity: op }}>
          <path d="M10 30 L46 30 M36 20 L46 30 L36 40" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="10" cy="30" r="3" fill={c}/>
        </svg>
      );
    case 'grd':
      return (
        <svg className="glyph" viewBox="0 0 60 60" fill="none" style={{ opacity: op }}>
          <path d="M30 8 L48 16 L48 30 C48 42 30 52 30 52 C30 52 12 42 12 30 L12 16 Z" stroke={c} strokeWidth="2" strokeLinejoin="round"/>
          <path d="M22 30 L28 36 L40 22" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    case 'rt':
      return (
        <svg className="glyph" viewBox="0 0 60 60" fill="none" style={{ opacity: op }}>
          <circle cx="30" cy="30" r="6" stroke={c} strokeWidth="2"/>
          <path d="M30 8 L30 18 M30 42 L30 52 M8 30 L18 30 M42 30 L52 30" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          <path d="M14 14 L22 22 M38 38 L46 46 M46 14 L38 22 M22 38 L14 46" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
        </svg>
      );
    case 'mem':
      return (
        <svg className="glyph" viewBox="0 0 60 60" fill="none" style={{ opacity: op }}>
          <ellipse cx="30" cy="14" rx="16" ry="5" stroke={c} strokeWidth="2"/>
          <path d="M14 14 L14 30 C14 33 21 36 30 36 C39 36 46 33 46 30 L46 14" stroke={c} strokeWidth="2"/>
          <path d="M14 30 L14 46 C14 49 21 52 30 52 C39 52 46 49 46 46 L46 30" stroke={c} strokeWidth="2"/>
        </svg>
      );
    case 'llm':
      return (
        <svg className="glyph" viewBox="0 0 60 60" fill="none" style={{ opacity: op }}>
          <circle cx="30" cy="30" r="14" stroke={c} strokeWidth="2"/>
          <circle cx="30" cy="30" r="8" stroke={c} strokeWidth="2" opacity="0.6"/>
          <circle cx="30" cy="30" r="2.5" fill={c}/>
          <path d="M30 8 L30 14 M30 46 L30 52 M8 30 L14 30 M46 30 L52 30" stroke={c} strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
        </svg>
      );
    case 'tool':
      return (
        <svg className="glyph" viewBox="0 0 60 60" fill="none" style={{ opacity: op }}>
          <path d="M40 16 L48 24 L30 42 L18 42 L18 30 L36 12 Z" stroke={c} strokeWidth="2" strokeLinejoin="round"/>
          <path d="M14 46 L24 36" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          <circle cx="42" cy="22" r="2" fill={c}/>
        </svg>
      );
    case 'res':
      return (
        <svg className="glyph" viewBox="0 0 60 60" fill="none" style={{ opacity: op }}>
          <path d="M14 18 L46 18 M14 30 L38 30 M14 42 L42 42" stroke={c} strokeWidth="2" strokeLinecap="round"/>
          <circle cx="50" cy="18" r="1.6" fill={c}/>
          <circle cx="42" cy="30" r="1.6" fill={c}/>
          <circle cx="46" cy="42" r="1.6" fill={c}/>
        </svg>
      );
    default:
      return null;
  }
}

window.Architecture = Architecture;
