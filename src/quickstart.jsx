// Quick start — two-step (SKILL.md + @AgentTool) and install
const QuickStart = () => {
  return (
    <section className="quickstart" id="quickstart" data-screen-label="02 Quickstart">
      <div className="container">
        <div className="reveal">
          <div className="eyebrow">Quick start</div>
          <h2 style={{ marginTop: 20, maxWidth: 18 + 'ch' }}>
            Two files. One agent.
          </h2>
          <p className="lead" style={{ marginTop: 20 }}>
            Generate a project from the Maven archetype, declare a skill,
            implement a tool. The framework wires the rest.
          </p>
        </div>

        {/* Install bar */}
        <div className="reveal" style={{ marginTop: 40 }}>
          <InstallBar />
        </div>

        <div className="grid">
          <div className="qs-step reveal">
            <header>
              <span className="num">01</span>
              <h3>Declare a skill — <span style={{ fontFamily: 'var(--mono)', color: 'var(--fg-dim)' }}>SKILL.md</span></h3>
            </header>
            <p>Frontmatter declares routing description, tool bindings and policy. The body is the system prompt.</p>
            <div className="code-card">
              <div className="code-head">
                <div className="dots"><div className="dot"></div><div className="dot"></div><div className="dot"></div></div>
                <span>skills/order-skill/SKILL.md</span>
              </div>
              <div className="code-body">
<pre>{`---
`}<span className="tok-y">name</span>{`: order-skill
`}<span className="tok-y">description</span>{`: >
  Manages customer orders. Use when the user asks about
  order status, tracking, or cancellations.
`}<span className="tok-y">version</span>{`: 1.0.0
`}<span className="tok-y">allowed-tools</span>{`:
  - getOrderStatus
  - cancelOrder
`}<span className="tok-y">metadata</span>{`:
  active: true
  domain: ecommerce
---

`}<span className="tok-c">## Role</span>{`
You are an order management assistant.

`}<span className="tok-c">## Behavior</span>{`
- Always verify the order ID via tools
- Never cancel without explicit confirmation
- Provide tracking links when available`}</pre>
              </div>
            </div>
          </div>

          <div className="qs-step reveal">
            <header>
              <span className="num">02</span>
              <h3>Implement a tool — <span style={{ fontFamily: 'var(--mono)', color: 'var(--fg-dim)' }}>@AgentTool</span></h3>
            </header>
            <p>Plain Spring components. Annotations add retry, caching, human-in-the-loop approval.</p>
            <div className="code-card">
              <div className="code-head">
                <div className="dots"><div className="dot"></div><div className="dot"></div><div className="dot"></div></div>
                <span>tools/OrderTool.java</span>
              </div>
              <div className="code-body">
<pre>{``}<span className="tok-a">@Component</span>{`
`}<span className="tok-k">public class</span>{` `}<span className="tok-t">OrderTool</span>{` {{`}{`

  `}<span className="tok-a">@AgentTool</span>{`(description = `}<span className="tok-s">"Get order status by ID"</span>{`)
  `}<span className="tok-a">@ToolRetry</span>{`(maxAttempts = 3, waitDurationMs = 500)
  `}<span className="tok-a">@CacheableToolResult</span>{`(ttlSeconds = 60, scope = USER)
  `}<span className="tok-k">public</span>{` `}<span className="tok-t">OrderStatus</span>{` getOrderStatus(`}<span className="tok-t">String</span>{` orderId) {{`}{`
    `}<span className="tok-k">return</span>{` orderService.getStatus(orderId);
  }}

  `}<span className="tok-a">@AgentTool</span>{`(description = `}<span className="tok-s">"Cancel order — irreversible"</span>{`)
  `}<span className="tok-a">@RequiresApproval</span>{`(message = `}<span className="tok-s">"Cancel order?"</span>{`,
                    showParameters = {{`}<span className="tok-s">"orderId"</span>{`}}, dangerous = `}<span className="tok-k">true</span>{`)
  `}<span className="tok-k">public</span>{` `}<span className="tok-t">CancelResult</span>{` cancelOrder(`}<span className="tok-t">String</span>{` orderId) {{`}{`
    `}<span className="tok-k">return</span>{` orderService.cancel(orderId);
  }}
}}`}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const InstallBar = () => {
  const [tab, setTab] = React.useState('archetype');
  const [copied, setCopied] = React.useState(false);

  const snippets = {
    archetype: `mvn archetype:generate \\
  -DarchetypeGroupId=com.github.giskardb.gargantua \\
  -DarchetypeArtifactId=agent-archetype \\
  -DarchetypeVersion=v1.2.18 \\
  -DarchetypeRepository=https://jitpack.io \\
  -DgroupId=com.mycompany -DartifactId=my-agent \\
  -DagentName=MyAgent -DinteractiveMode=false`,
    embedded: `export LLM_PRIMARY_PROVIDER=openai
export LLM_PRIMARY_MODEL=gpt-4o
export LLM_PRIMARY_API_KEY=sk-your-key
export LLM_PRIMARY_ENDPOINT=https://api.openai.com/v1
SPRING_PROFILES_ACTIVE=embedded mvn spring-boot:run`,
    docker: `docker compose up -d mongo redis ollama
docker compose exec ollama ollama pull phi4-mini
mvn spring-boot:run`,
  };

  const copy = () => {
    navigator.clipboard?.writeText(snippets[tab]).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    });
  };

  return (
    <div className="code-card" style={{ overflow: 'hidden' }}>
      <div className="code-head" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {[
            ['archetype', 'Archetype'],
            ['embedded', 'Embedded mode'],
            ['docker', 'Docker stack'],
          ].map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              style={{
                padding: '6px 12px',
                fontFamily: 'var(--mono)', fontSize: 11,
                background: tab === k ? 'var(--gold-soft)' : 'transparent',
                color: tab === k ? 'var(--gold)' : 'var(--fg-dim)',
                border: `1px solid ${tab === k ? 'var(--gold-soft)' : 'transparent'}`,
                borderRadius: 6, cursor: 'pointer',
              }}
            >{label}</button>
          ))}
        </div>
        <button
          onClick={copy}
          style={{
            background: 'transparent', border: '1px solid var(--line-2)',
            color: copied ? 'var(--gold)' : 'var(--fg-dim)',
            fontFamily: 'var(--mono)', fontSize: 11,
            padding: '5px 12px', borderRadius: 6, cursor: 'pointer',
            transition: 'all 0.18s ease',
          }}
        >{copied ? '✓ Copied' : 'Copy'}</button>
      </div>
      <div className="code-body" style={{ background: '#07090F' }}>
        <pre style={{ whiteSpace: 'pre-wrap' }}>
          <span style={{ color: 'var(--gold)' }}>$ </span>
          {snippets[tab]}
        </pre>
      </div>
    </div>
  );
};

window.QuickStart = QuickStart;
