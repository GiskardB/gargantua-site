// Features grid + tech stack ribbon
const FEATURES = [
  { k: '01', title: 'Declarative skills',  desc: 'SKILL.md frontmatter declares routing description, allowed tools, RBAC and RAG. Body becomes the system prompt. Hot-reloadable.' },
  { k: '02', title: 'Java DSL',            desc: '@AgentSkill defines skills in Java with auto-detected tools. @AgentsFlow chains skills into multi-step pipelines — sequential, loop, parallel.' },
  { k: '03', title: '3-layer memory',      desc: 'Working (Redis) for the live conversation, episodic (Mongo) for past sessions compressed locally via Ollama, knowledge (Mongo) for user facts.' },
  { k: '04', title: 'Hybrid routing',      desc: 'Semantic similarity via in-process all-MiniLM-L6-v2 embeddings (~2ms), with LLM fallback when nothing crosses the configured threshold (default 0.6, tune in application.yml).' },
  { k: '05', title: 'Guardrail pipeline',  desc: 'PII masking, prompt-injection detection, rate limiting, schema validation. Drop in your own with @Order — no forking.' },
  { k: '06', title: 'Human-in-the-loop',   desc: '@RequiresApproval pauses execution and waits for user confirmation before dangerous tools. TTL-bounded, resumable.' },
  { k: '07', title: 'Multi-provider LLM',  desc: 'OpenAI, Anthropic, Azure, Ollama, plus any OpenAI-compatible endpoint. Circuit-breaker failover, per-provider rate limits, rule-based routing.' },
  { k: '08', title: 'A2A + MCP',           desc: 'Agent-to-Agent JSON-RPC interop with /.well-known/agent.json discovery. MCP gateway exposes the agent to Claude Desktop, Cursor, VS Code.' },
  { k: '09', title: 'RBAC · multi-tenant', desc: 'Role-based skill access via X-User-Roles. Automatic tenant data isolation via X-Tenant-Id. Immutable audit trail for SOC 2, GDPR, EU AI Act.' },
  { k: '10', title: 'Streaming + sync',    desc: 'SSE for tokens, tool_call/tool_result events, approval requests. Sync endpoint for batch. Same handler, same memory, same trace.' },
  { k: '11', title: 'Cost · observability', desc: 'Per-request token usage and cost by skill, user, provider. OpenTelemetry spans + Micrometer metrics with GenAI semantic conventions.' },
  { k: '12', title: 'GraalVM · embedded',  desc: 'Native image: <100ms cold start, ~50MB. Embedded mode runs zero-infra: no Docker, no Mongo, no Redis. Kustomize + Helm + KEDA for prod.' },
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
            Twelve subsystems, one Spring context. Replace any @Bean to swap an implementation.
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
