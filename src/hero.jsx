// Hero
const HeroSection = ({ diskSpeed = 1 }) => {
  return (
    <section className="hero" data-screen-label="01 Hero">
      <div className="container">
        <div className="grid">
          <div>
            <div className="eyebrow reveal">Java 21 · MIT · v1.2.2</div>
            <h1 className="reveal" style={{ marginTop: 20 }}>
              Build autonomous<br/>
              AI agents <em>in Java.</em>
            </h1>
            <p className="sub reveal">
              Gargantua is a distributable framework built on Spring Boot 4.0.4 and LangChain4j 1.12.
              You write a <code style={{ fontFamily: 'var(--mono)', color: 'var(--gold)' }}>SKILL.md</code> and
              an <code style={{ fontFamily: 'var(--mono)', color: 'var(--gold)' }}>@AgentTool</code>.
              Routing, 3-layer memory, guardrails, HITL, streaming, A2A, MCP, cost tracking — all included.
            </p>
            <div className="cta reveal">
              <a className="btn btn-primary" href="#quickstart">
                <span>Get started</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
              </a>
              <a className="btn" href="https://github.com/GiskardB/gargantua" target="_blank" rel="noreferrer">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2.18c-3.2.7-3.87-1.36-3.87-1.36-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.76 2.69 1.25 3.34.96.1-.74.4-1.25.72-1.54-2.55-.29-5.23-1.27-5.23-5.66 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.45.11-3.03 0 0 .96-.31 3.16 1.17.92-.26 1.9-.39 2.88-.39.98 0 1.96.13 2.88.39 2.2-1.48 3.16-1.17 3.16-1.17.62 1.58.23 2.74.11 3.03.74.8 1.18 1.82 1.18 3.07 0 4.4-2.68 5.37-5.24 5.65.41.36.78 1.06.78 2.14v3.17c0 .31.21.66.79.55C20.21 21.39 23.5 17.07 23.5 12 23.5 5.65 18.35.5 12 .5z"/></svg>
                <span>View on GitHub</span>
              </a>
              <a className="btn btn-ghost" href="#architecture">
                <span>How it works</span>
              </a>
            </div>
            <div className="meta reveal">
              <div><b>2 things to write.</b> Skill + Tool.</div>
              <div><b>Zero infra mode.</b> Embedded by default.</div>
              <div><b>&lt; 100ms cold start.</b> GraalVM native.</div>
            </div>
          </div>
          <div className="reveal">
            <div className="bh-stage">
              <BlackHole speed={diskSpeed} intensity={1} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

window.HeroSection = HeroSection;
