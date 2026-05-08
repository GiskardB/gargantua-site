// Animated request-journey visualization for the Architecture Diagrams page.
// Bytebytego-style: clear node boxes, labeled connections, animated packet
// traveling through the pipeline, numbered steps in a side panel.

const { useState, useEffect, useRef } = React;

// ── Pipeline definition ─────────────────────────────────────────────────
// Each node has: id, label, sublabel, x, y, group ('client' | 'pipeline' | 'sidecar' | 'output')
const NODES = [
  { id: 'client',    label: 'Client',          sub: 'REST · UI · MCP · A2A',     x: 60,   y: 280, group: 'client'  },
  { id: 'guard-in',  label: 'Input Guardrails',sub: 'PII · Injection · RateLimit',x: 250, y: 120, group: 'pipeline'},
  { id: 'router',    label: 'Skill Router',    sub: 'Semantic + LLM',            x: 460,  y: 120, group: 'pipeline'},
  { id: 'rbac',      label: 'RBAC Re-check',   sub: 'Roles · Tenants',           x: 670,  y: 120, group: 'pipeline'},
  { id: 'memory',    label: 'Memory Compose',  sub: 'Working · Episodic · Knowledge', x: 880, y: 120, group: 'pipeline' },
  { id: 'prompt',    label: 'Prompt Builder',  sub: 'Token Budget',              x: 880,  y: 280, group: 'pipeline'},
  { id: 'llm',       label: 'LLM Provider',    sub: 'Failover · Tools · HITL',   x: 670,  y: 280, group: 'pipeline'},
  { id: 'guard-out', label: 'Output Guardrails',sub: 'PII · Schema · Disclaimer',x: 460,  y: 280, group: 'pipeline'},
  { id: 'stream',    label: 'SSE Stream',      sub: 'Token-by-token',            x: 250,  y: 280, group: 'output'  },
  { id: 'audit',     label: 'Audit Trail',     sub: 'Immutable log',             x: 460,  y: 440, group: 'sidecar' },
  { id: 'cost',      label: 'Cost Tracking',   sub: 'Per skill / user',          x: 670,  y: 440, group: 'sidecar' },
];

// Edges: source → target with optional curve hint and label
const EDGES = [
  { from: 'client',    to: 'guard-in',  label: '1' },
  { from: 'guard-in',  to: 'router',    label: '2' },
  { from: 'router',    to: 'rbac',      label: '3' },
  { from: 'rbac',      to: 'memory',    label: '4' },
  { from: 'memory',    to: 'prompt',    label: '5' },
  { from: 'prompt',    to: 'llm',       label: '6' },
  { from: 'llm',       to: 'guard-out', label: '7' },
  { from: 'guard-out', to: 'stream',    label: '8' },
  { from: 'stream',    to: 'client',    label: '9' },
];

const SIDECAR_EDGES = [
  { from: 'llm',       to: 'audit', dashed: true },
  { from: 'llm',       to: 'cost',  dashed: true },
];

const STEPS = [
  { n: 1, title: 'Input Guardrails',   desc: 'PII masking, prompt-injection detection, rate limit, pre-routing RBAC.' },
  { n: 2, title: 'Skill Routing',      desc: 'Semantic similarity (~2 ms, all-MiniLM-L6-v2) + LLM fallback if confidence is low.' },
  { n: 3, title: 'Post-routing RBAC',  desc: 'Re-runs guardrails with the resolved skill for role-based access decisions.' },
  { n: 4, title: 'Memory Compose',     desc: 'Loads working (Redis), episodic & knowledge (MongoDB) memory in parallel.' },
  { n: 5, title: 'Prompt Builder',     desc: 'Runs context enrichers, injects memory, applies token budget for the model context window.' },
  { n: 6, title: 'LLM Call',           desc: 'Streams tokens from the Primary provider; auto-failovers to fallback; calls @AgentTools and pauses on @RequiresApproval.' },
  { n: 7, title: 'Output Guardrails',  desc: 'PII redaction, schema validation, disclaimer injection.' },
  { n: 8, title: 'SSE Stream',         desc: 'Server-Sent Events deliver tokens to the client in real time, plus tool_call / tool_result events.' },
  { n: 9, title: 'Persist',            desc: 'Append to memory, chat history, cost tracker, and immutable audit trail (parallel writes).' },
];

// ── Geometry helpers ────────────────────────────────────────────────────
const NODE_W = 168;
const NODE_H = 76;
const BOARD_W = 1140;
const BOARD_H = 560;

function nodeCenter(id) {
  const n = NODES.find(n => n.id === id);
  return { x: n.x + NODE_W / 2, y: n.y + NODE_H / 2 };
}

function edgePath(from, to) {
  const a = nodeCenter(from);
  const b = nodeCenter(to);

  // Move endpoints to node edges (rectangular).
  const dx = b.x - a.x, dy = b.y - a.y;
  const ax = a.x + Math.sign(dx) * (Math.abs(dx) > Math.abs(dy) ? NODE_W / 2 : 0);
  const ay = a.y + Math.sign(dy) * (Math.abs(dx) > Math.abs(dy) ? 0 : NODE_H / 2);
  const bx = b.x - Math.sign(dx) * (Math.abs(dx) > Math.abs(dy) ? NODE_W / 2 : 0);
  const by = b.y - Math.sign(dy) * (Math.abs(dx) > Math.abs(dy) ? 0 : NODE_H / 2);

  // Bezier control points: pull along the dominant axis for graceful curve
  if (Math.abs(dx) >= Math.abs(dy)) {
    const cx1 = ax + dx * 0.4, cx2 = bx - dx * 0.4;
    return `M ${ax} ${ay} C ${cx1} ${ay}, ${cx2} ${by}, ${bx} ${by}`;
  } else {
    const cy1 = ay + dy * 0.4, cy2 = by - dy * 0.4;
    return `M ${ax} ${ay} C ${ax} ${cy1}, ${bx} ${cy2}, ${bx} ${by}`;
  }
}

// ── The animated diagram ────────────────────────────────────────────────
function ArchitectureAnim() {
  const [activeStep, setActiveStep] = useState(0); // 0 = no edge, 1..9 = edge index
  const [playing, setPlaying] = useState(true);
  const timerRef = useRef(null);
  const stepDurations = [1100, 900, 800, 1400, 1300, 2200, 1100, 900, 1100]; // ms per step

  useEffect(() => {
    if (!playing) { clearTimeout(timerRef.current); return; }
    const dur = stepDurations[(activeStep) % EDGES.length];
    timerRef.current = setTimeout(() => {
      setActiveStep(s => (s % EDGES.length) + 1);
    }, dur);
    return () => clearTimeout(timerRef.current);
  }, [activeStep, playing]);

  const activeEdge = activeStep > 0 ? EDGES[activeStep - 1] : null;

  return (
    <div className="arch-anim">
      <div className="arch-board">
        <svg viewBox={`0 0 ${BOARD_W} ${BOARD_H}`} className="arch-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--fg-mute)" />
            </marker>
            <marker id="arrow-active" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--gold)" />
            </marker>
            <filter id="glow"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          </defs>

          {/* Grid background */}
          <g className="arch-grid">
            {Array.from({ length: 14 }, (_, i) => <line key={`v${i}`} x1={i*80} y1="0" x2={i*80} y2={BOARD_H} stroke="rgba(20,22,30,0.04)" />)}
            {Array.from({ length: 8 }, (_, i) => <line key={`h${i}`} x1="0" y1={i*80} x2={BOARD_W} y2={i*80} stroke="rgba(20,22,30,0.04)" />)}
          </g>

          {/* Group labels */}
          <text x="60" y="60" className="arch-group-label">CLIENT</text>
          <text x="250" y="60" className="arch-group-label">REQUEST PIPELINE</text>
          <text x="250" y={BOARD_H - 180} className="arch-group-label">SIDE CHANNELS</text>

          {/* Sidecar (dashed) edges first so they're behind */}
          {SIDECAR_EDGES.map((e, i) => (
            <path key={`s${i}`} d={edgePath(e.from, e.to)} fill="none" stroke="var(--fg-mute)" strokeWidth="1.4" strokeDasharray="4 5" opacity="0.5" markerEnd="url(#arrow)" />
          ))}

          {/* Pipeline edges */}
          {EDGES.map((e, i) => {
            const active = activeEdge && activeEdge.from === e.from && activeEdge.to === e.to;
            const path = edgePath(e.from, e.to);
            return (
              <g key={`e${i}`}>
                <path d={path} fill="none" stroke={active ? 'var(--gold)' : 'var(--line-2)'} strokeWidth={active ? 2 : 1.5} markerEnd={active ? 'url(#arrow-active)' : 'url(#arrow)'} style={{ transition: 'stroke 0.3s ease, stroke-width 0.3s ease' }} />
                {active && (
                  <path d={path} fill="none" stroke="var(--gold)" strokeWidth="3" strokeLinecap="round" filter="url(#glow)"
                    style={{
                      strokeDasharray: 'var(--len), var(--len)',
                      strokeDashoffset: 'var(--len)',
                      animation: 'archDraw var(--dur) cubic-bezier(.4,0,.2,1) forwards',
                      ['--len']: '900',
                      ['--dur']: `${stepDurations[i] - 200}ms`,
                    }} />
                )}
                {/* Step number badge mid-edge */}
                <EdgeBadge from={e.from} to={e.to} label={e.label} active={!!active} />
              </g>
            );
          })}

          {/* Animated packet — small circle traveling along the active edge */}
          {activeEdge && <Packet path={edgePath(activeEdge.from, activeEdge.to)} duration={stepDurations[activeStep - 1] - 200} key={activeStep} />}

          {/* Nodes */}
          {NODES.map(n => {
            const isActive = activeEdge && (activeEdge.to === n.id);
            const wasJustVisited = activeEdge && (activeEdge.from === n.id);
            return (
              <g key={n.id} transform={`translate(${n.x}, ${n.y})`} className={`arch-node arch-node-${n.group}${isActive ? ' active' : ''}${wasJustVisited ? ' visited' : ''}`}>
                <rect width={NODE_W} height={NODE_H} rx="10" />
                <text x={NODE_W / 2} y={32} className="arch-node-label" textAnchor="middle">{n.label}</text>
                <text x={NODE_W / 2} y={52} className="arch-node-sub" textAnchor="middle">{n.sub}</text>
              </g>
            );
          })}
        </svg>

        <div className="arch-controls">
          <button className="arch-btn" onClick={() => { setPlaying(p => !p); }}>
            {playing ? (
              <><svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg> Pause</>
            ) : (
              <><svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg> Play</>
            )}
          </button>
          <button className="arch-btn" onClick={() => { setActiveStep(s => (s % EDGES.length) + 1); }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5l8 7-8 7V5zm10 0h2v14h-2z"/></svg> Step
          </button>
          <button className="arch-btn" onClick={() => { setActiveStep(0); }}>Reset</button>
          <span className="arch-status">
            {activeStep > 0
              ? <>Step <strong>{activeStep}</strong> / {EDGES.length} — <em>{STEPS[activeStep - 1].title}</em></>
              : <>Press <strong>Play</strong> to follow a request through the pipeline</>}
          </span>
        </div>
      </div>

      <ol className="arch-steps">
        {STEPS.map((s, i) => (
          <li key={s.n} className={`arch-step${activeStep === s.n ? ' active' : ''}${activeStep > s.n ? ' done' : ''}`} onClick={() => { setPlaying(false); setActiveStep(s.n); }}>
            <span className="arch-step-n">{s.n}</span>
            <div className="arch-step-body">
              <div className="arch-step-title">{s.title}</div>
              <div className="arch-step-desc">{s.desc}</div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function EdgeBadge({ from, to, label, active }) {
  const a = nodeCenter(from), b = nodeCenter(to);
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  return (
    <g transform={`translate(${mx}, ${my})`}>
      <circle r="11" fill={active ? 'var(--gold)' : 'var(--panel)'} stroke={active ? 'var(--gold)' : 'var(--line-2)'} strokeWidth="1.2" />
      <text textAnchor="middle" dominantBaseline="central" className={`arch-edge-label${active ? ' active' : ''}`}>{label}</text>
    </g>
  );
}

function Packet({ path, duration }) {
  // Use SVG <animateMotion> driven by the M key on each remount.
  const id = `pkt-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <g>
      <circle r="6" fill="var(--gold)" filter="url(#glow)">
        <animateMotion dur={`${duration}ms`} repeatCount="1" fill="freeze" path={path} />
      </circle>
      <circle r="3" fill="#fff">
        <animateMotion dur={`${duration}ms`} repeatCount="1" fill="freeze" path={path} />
      </circle>
    </g>
  );
}

window.ArchitectureAnim = ArchitectureAnim;
