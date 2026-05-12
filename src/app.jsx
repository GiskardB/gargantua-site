// App entry — composes sections, mounts reveal observer, wires Tweaks panel.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "gold",
  "diskSpeed": 1,
  "showReadout": true,
  "autoCycleArch": true
}/*EDITMODE-END*/;

const ACCENTS = {
  gold:    { gold: 'oklch(0.62 0.14 55)',  goldSoft: 'oklch(0.62 0.14 55 / 0.14)' },
  amber:   { gold: 'oklch(0.65 0.16 60)',  goldSoft: 'oklch(0.65 0.16 60 / 0.14)' },
  cyan:    { gold: 'oklch(0.55 0.13 250)', goldSoft: 'oklch(0.55 0.13 250 / 0.14)' },
  magenta: { gold: 'oklch(0.55 0.18 340)', goldSoft: 'oklch(0.55 0.18 340 / 0.14)' },
};

function ClosingCTA() {
  const [copied, setCopied] = React.useState(false);
  const cmd = 'mvn archetype:generate -DarchetypeGroupId=com.github.giskardb.gargantua -DarchetypeArtifactId=agent-archetype -DarchetypeVersion=v1.2.18 -DarchetypeRepository=https://jitpack.io';
  return (
    <section className="closing" data-screen-label="05 Closing">
      <div className="halo"></div>
      <div className="container reveal" style={{ position: 'relative' }}>
        <div className="eyebrow" style={{ justifyContent: 'center', display: 'inline-flex' }}>Ready when you are</div>
        <h2 style={{ marginTop: 20 }}>
          Cross the<br/><em>event horizon.</em>
        </h2>
        <div className="install-row">
          <span style={{ color: 'var(--gold)' }}>$</span>
          <span style={{ color: 'var(--fg)' }}>mvn archetype:generate</span>
          <span style={{ color: 'var(--fg-mute)' }}>-DarchetypeGroupId=com.github.giskardb.gargantua</span>
          <span style={{ color: 'var(--fg-mute)' }}>-DarchetypeVersion=v1.2.18</span>
          <button className="copy-btn" onClick={() => {
            navigator.clipboard?.writeText(cmd).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1400);
            });
          }}>{copied ? '✓ Copied' : 'Copy'}</button>
        </div>
        <div style={{ marginTop: 32, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a className="btn btn-primary" href="https://github.com/GiskardB/gargantua" target="_blank" rel="noreferrer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2.18c-3.2.7-3.87-1.36-3.87-1.36-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.76 2.69 1.25 3.34.96.1-.74.4-1.25.72-1.54-2.55-.29-5.23-1.27-5.23-5.66 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.45.11-3.03 0 0 .96-.31 3.16 1.17.92-.26 1.9-.39 2.88-.39.98 0 1.96.13 2.88.39 2.2-1.48 3.16-1.17 3.16-1.17.62 1.58.23 2.74.11 3.03.74.8 1.18 1.82 1.18 3.07 0 4.4-2.68 5.37-5.24 5.65.41.36.78 1.06.78 2.14v3.17c0 .31.21.66.79.55C20.21 21.39 23.5 17.07 23.5 12 23.5 5.65 18.35.5 12 .5z"/></svg>
            Star on GitHub
          </a>
          <a className="btn" href="docs.html">Read the docs →</a>
        </div>
      </div>
    </section>
  );
}

function TopNav() {
  return (
    <nav className="top">
      <div className="container row">
        <a className="brand" href="#top">
          <LogoMark size={26} color="var(--fg)" />
          <span className="name">gargantua</span>
          <span className="ver">v1.2.18</span>
        </a>
        <ul>
          <li><a href="#quickstart">Quick start</a></li>
          <li><a href="#architecture">Architecture</a></li>
          <li><a href="#features">Features</a></li>
          <li><a href="docs.html">Docs</a></li>
        </ul>
        <div className="spacer"></div>
        <div className="actions">
          <a className="btn" href="https://github.com/GiskardB/gargantua" target="_blank" rel="noreferrer">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2.18c-3.2.7-3.87-1.36-3.87-1.36-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.76 2.69 1.25 3.34.96.1-.74.4-1.25.72-1.54-2.55-.29-5.23-1.27-5.23-5.66 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.45.11-3.03 0 0 .96-.31 3.16 1.17.92-.26 1.9-.39 2.88-.39.98 0 1.96.13 2.88.39 2.2-1.48 3.16-1.17 3.16-1.17.62 1.58.23 2.74.11 3.03.74.8 1.18 1.82 1.18 3.07 0 4.4-2.68 5.37-5.24 5.65.41.36.78 1.06.78 2.14v3.17c0 .31.21.66.79.55C20.21 21.39 23.5 17.07 23.5 12 23.5 5.65 18.35.5 12 .5z"/></svg>
            <span>GitHub</span>
          </a>
          <a className="btn btn-primary" href="#quickstart">Get started</a>
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer>
      <div className="container row">
        <div>© 2026 Gargantua — MIT</div>
        <a href="https://github.com/GiskardB/gargantua">GitHub</a>
        <a href="https://jitpack.io/#GiskardB/gargantua">JitPack</a>
        <a href="https://github.com/GiskardB/gargantua-examples">Examples</a>
        <a href="https://github.com/GiskardB/gargantua/tags">Releases</a>
        <div className="spacer"></div>
        <div>Built in Java 21 · 1ε beyond the singularity</div>
      </div>
    </footer>
  );
}

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Apply accent dynamically
  React.useEffect(() => {
    const c = ACCENTS[tweaks.accent] || ACCENTS.gold;
    document.documentElement.style.setProperty('--gold', c.gold);
    document.documentElement.style.setProperty('--gold-soft', c.goldSoft);
  }, [tweaks.accent]);

  // Scroll-reveal observer
  React.useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('in'); });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  });

  return (
    <>
      <TopNav />
      <a id="top"></a>
      <HeroSection diskSpeed={tweaks.diskSpeed} />
      <QuickStart />
      <Architecture />
      <div id="features"><Features /></div>
      <ClosingCTA />
      <Footer />

      <TweaksPanel title="Tweaks">
        <TweakSection title="Accent">
          <TweakRadio
            value={tweaks.accent}
            onChange={(v) => setTweak('accent', v)}
            options={[
              { value: 'gold',    label: 'Bronze' },
              { value: 'amber',   label: 'Amber' },
              { value: 'cyan',    label: 'Indigo' },
              { value: 'magenta', label: 'Plum' },
            ]}
          />
        </TweakSection>
        <TweakSection title="Black hole">
          <TweakSlider
            label="Disk speed"
            value={tweaks.diskSpeed}
            min={0.2} max={3} step={0.1}
            onChange={(v) => setTweak('diskSpeed', v)}
            format={(v) => v.toFixed(1) + '×'}
          />
        </TweakSection>
        <TweakSection title="Architecture">
          <TweakToggle
            label="Auto-cycle stages"
            checked={tweaks.autoCycleArch}
            onChange={(v) => setTweak('autoCycleArch', v)}
          />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
