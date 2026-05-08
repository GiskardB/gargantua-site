// Features grid + tech stack ribbon
const FEATURES = [
  { k: '01', title: 'Declarative skills',  desc: 'SKILL.md frontmatter declares routing description, allowed tools, and policy. Body becomes the system prompt.' },
  { k: '02', title: '3-layer memory',      desc: 'Working (Redis) for the live conversation, episodic (Mongo) for past sessions, knowledge (Mongo) for user facts.' },
  { k: '03', title: 'Hybrid routing',      desc: 'Semantic similarity via in-process embeddings, with LLM fallback when nothing crosses the threshold.' },
  { k: '04', title: 'Guardrail pipeline',  desc: 'PII masking, prompt-injection detection, rate limiting. Drop in your own with @Order — no forking.' },
  { k: '05', title: 'Human-in-the-loop',   desc: '@RequiresApproval pauses execution and waits for user confirmation. TTL-bounded, resumable.' },
  { k: '06', title: 'Multi-provider LLM',  desc: 'OpenAI, Anthropic, Azure. Rule-based routing per phase, with Resilience4j-driven failover to a fallback model.' },
  { k: '07', title: 'Streaming + sync',    desc: 'SSE for tokens, sync for batch. Same handler, same memory, same trace.' },
  { k: '08', title: 'Eval as code',        desc: 'Golden datasets per skill. LLM-as-Judge. Reports stored, diffable, run from /api/admin/evals/run.' },
  { k: '09', title: 'Cost tracking',       desc: 'Per skill, per user, per provider, per phase. Aggregated summary endpoint, exportable.' },
  { k: '10', title: 'MCP gateway',         desc: 'Optional. Expose your agent over MCP for Claude Desktop, Cursor, anything that speaks the protocol.' },
  { k: '11', title: 'GraalVM native',      desc: 'Compile to a native image. Cold start < 100ms. Same code, no special branch.' },
  { k: '12', title: 'Embedded mode',       desc: 'No Docker, no Mongo, no Redis. ConcurrentHashMaps everywhere. Perfect for prototypes and CI.' },
];

const STACK = [
  { name: 'Java',         ver: '21 · Loom' },
  { name: 'Spring Boot',  ver: '4.0.4' },
  { name: 'LangChain4j',  ver: '1.12.1' },
  { name: 'MongoDB',      ver: '8.0' },
  { name: 'Redis',        ver: '7.4' },
  { name: 'GraalVM',      ver: '21' },
];

function Features() {
  return (
    <section data-screen-label="04 Features">
      <div className="container">
        <div className="reveal" style={{ display: 'flex', alignItems: 'baseline', gap: 24, flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div>
            <div className="eyebrow">Capabilities</div>
            <h2 style={{ marginTop: 20, maxWidth: '20ch' }}>Everything an agent needs, nothing it doesn't.</h2>
          </div>
          <p className="lead" style={{ maxWidth: '36ch', margin: 0 }}>
            Twelve subsystems, one Spring context. Add what you need with a starter, ignore the rest.
          </p>
        </div>

        <div className="features-grid reveal">
          {FEATURES.map((f) => (
            <div className="feat" key={f.k}>
              <div className="icon">{f.k}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="stack-rail reveal">
          {STACK.map((s) => (
            <div className="item" key={s.name}>
              <b>{s.name}</b>
              <span>{s.ver}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

window.Features = Features;
