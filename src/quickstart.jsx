// Quick start — two-step (manifest.yaml + SKILL.md) and install
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
            Download the runtime, describe an agent as a manifest and a skill,
            run it. No Java, no build step, no clone.
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
              <h3>Describe the agent — <span style={{ fontFamily: 'var(--mono)', color: 'var(--fg-dim)' }}>manifest.yaml</span></h3>
            </header>
            <p>What it's called, what it can do, which skill answers by default. No code.</p>
            <div className="code-card">
              <div className="code-head">
                <div className="dots"><div className="dot"></div><div className="dot"></div><div className="dot"></div></div>
                <span>my-agent/manifest.yaml</span>
              </div>
              <div className="code-body">
<pre>{``}<span className="tok-y">apiVersion</span>{`: gargantua.ai/v1
`}<span className="tok-y">kind</span>{`: Agent
`}<span className="tok-y">metadata</span>{`:
  name: order-agent
  version: 1.0.0
`}<span className="tok-y">spec</span>{`:
  capabilities:
    - name: manage-orders
      description: Handles order status and cancellations
      implementedBy: order-skill
  defaultSkill: order-skill`}</pre>
              </div>
            </div>
          </div>

          <div className="qs-step reveal">
            <header>
              <span className="num">02</span>
              <h3>Declare a skill — <span style={{ fontFamily: 'var(--mono)', color: 'var(--fg-dim)' }}>SKILL.md</span></h3>
            </header>
            <p>Frontmatter declares routing description, tool bindings and policy. The body is the system prompt.</p>
            <div className="code-card">
              <div className="code-head">
                <div className="dots"><div className="dot"></div><div className="dot"></div><div className="dot"></div></div>
                <span>my-agent/skills/order-skill/SKILL.md</span>
              </div>
              <div className="code-body">
<pre>{`---
`}<span className="tok-y">name</span>{`: order-skill
`}<span className="tok-y">description</span>{`: >
  Manages customer orders. Use when the user asks about
  order status, tracking, or cancellations.
`}<span className="tok-y">version</span>{`: 1.0.0
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
        </div>

        <div className="reveal" style={{ marginTop: 28 }}>
          <p className="lead" style={{ maxWidth: '60ch' }}>
            Real tools come from <b>MCP servers</b> named in the manifest, not Java. Need tools
            that call your own code instead? Implement <span style={{ fontFamily: 'var(--mono)', color: 'var(--gold)' }}>@AgentTool</span> methods
            and run the same engine as a Java library — see <a href="docs.html#delivery-modes">Delivery Modes</a>.
          </p>
        </div>
      </div>
    </section>
  );
};

const InstallBar = () => {
  const [tab, setTab] = React.useState('runtime');
  const [copied, setCopied] = React.useState(false);

  const snippets = {
    runtime: `curl -LO https://github.com/GiskardB/gargantua/releases/latest/download/gargantua-runtime.jar
java -jar gargantua-runtime.jar run my-agent --spring.profiles.active=embedded`,
    docker: `docker run -p 8080:8080 -v ./my-agent:/bundle:ro \\
  -e LLM_PRIMARY_API_KEY=sk-your-key \\
  ghcr.io/giskardb/gargantua-runtime:latest`,
    archetype: `mvn archetype:generate \\
  -DarchetypeGroupId=io.github.giskardb \\
  -DarchetypeArtifactId=agent-archetype \\
  -DarchetypeVersion=1.4.0 \\
  -DgroupId=com.mycompany -DartifactId=my-agent \\
  -DagentName=MyAgent -DinteractiveMode=false`,
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
            ['runtime', 'Runtime (jar)'],
            ['docker', 'Runtime (Docker)'],
            ['archetype', 'Java library'],
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
