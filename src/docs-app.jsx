// Docs app — sidebar nav + markdown renderer + ⌘K search.
// Reads window.DOCS_INDEX and window.DOCS_CONTENT from src/docs-data.js.

const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ── Marked + highlight.js + mermaid configuration ────────────────────────
const MERMAID_THEME = {
  startOnLoad: false,
  theme: 'base',
  themeVariables: {
    fontFamily: 'Geist, ui-sans-serif, system-ui',
    fontSize: '13px',
    primaryColor: '#FBF9F4',
    primaryTextColor: '#14161E',
    primaryBorderColor: '#D4A861',
    lineColor: '#5B606D',
    secondaryColor: '#F2EFE7',
    tertiaryColor: '#FFFFFF',
    background: '#FFFFFF',
    nodeTextColor: '#14161E',
  },
  flowchart: { curve: 'basis', htmlLabels: true },
  sequence: { actorMargin: 50, useMaxWidth: true },
};

if (window.mermaid) {
  window.mermaid.initialize(MERMAID_THEME);
}

if (window.marked) {
  const renderer = new window.marked.Renderer();
  // Custom code renderer: detect mermaid + highlight others.
  const origCode = renderer.code.bind(renderer);
  renderer.code = function (code, lang) {
    // marked v13 passes a token object { text, lang, escaped }
    let text, language;
    if (typeof code === 'object' && code !== null) {
      text = code.text || '';
      language = code.lang || '';
    } else {
      text = code || '';
      language = lang || '';
    }

    if (language === 'mermaid') {
      // Defer rendering to mermaid.run() after DOM insertion.
      return `<div class="mermaid">${escapeHtml(text)}</div>`;
    }

    let highlighted = '';
    let langTag = language || '';
    if (language && window.hljs && window.hljs.getLanguage(language)) {
      try {
        highlighted = window.hljs.highlight(text, { language }).value;
      } catch (_) {
        highlighted = escapeHtml(text);
      }
    } else if (window.hljs) {
      try {
        const auto = window.hljs.highlightAuto(text);
        highlighted = auto.value;
        langTag = langTag || auto.language || 'text';
      } catch (_) {
        highlighted = escapeHtml(text);
      }
    } else {
      highlighted = escapeHtml(text);
    }

    const cls = language ? ` class="language-${language} hljs"` : ' class="hljs"';
    const tagAttr = langTag ? `<span class="lang-tag">${langTag}</span>` : '';
    return `<pre>${tagAttr}<button class="copy-btn" data-copy>Copy</button><code${cls}>${highlighted}</code></pre>`;
  };

  // Slugify headings for anchor links + scroll-spy.
  const origHeading = renderer.heading.bind(renderer);
  renderer.heading = function (token) {
    const text = (typeof token === 'object' ? token.text : arguments[0]) || '';
    const depth = (typeof token === 'object' ? token.depth : arguments[1]) || 2;
    const id = slugify(text);
    return `<h${depth} id="${id}">${parseInline(text)}</h${depth}>`;
  };

  window.marked.setOptions({ renderer, breaks: false, gfm: true });
}

function parseInline(text) {
  // Run marked's inline parser for content inside headings.
  if (window.marked && window.marked.parseInline) {
    try { return window.marked.parseInline(text); } catch (_) {}
  }
  return escapeHtml(text);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function slugify(s) {
  return String(s).toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// ── Sidebar groups ───────────────────────────────────────────────────────
const SIDEBAR_GROUPS = [
  { title: 'Getting started', slugs: ['skills-and-routing', 'tools-and-annotations', 'agent-dsl'] },
  { title: 'Runtime',         slugs: ['memory-system', 'guardrails', 'llm-configuration'] },
  { title: 'Reference',       slugs: ['api-reference', 'extending', 'deployment', 'architecture-diagrams'] },
];

// ── Hash routing ─────────────────────────────────────────────────────────
function readHash() {
  const h = window.location.hash.slice(1);
  if (!h) return { slug: window.DOCS_INDEX[0].slug, anchor: null };
  const [slug, anchor] = h.split('#');
  const found = window.DOCS_INDEX.find(d => d.slug === slug);
  return { slug: found ? slug : window.DOCS_INDEX[0].slug, anchor: anchor || null };
}

// ── App ──────────────────────────────────────────────────────────────────
function DocsApp() {
  const [route, setRoute] = useState(readHash);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onHash = () => setRoute(readHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true); }
      if (e.key === '/' && !e.target.matches('input, textarea')) { e.preventDefault(); setSearchOpen(true); }
      if (e.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const goto = (slug, anchor = null) => {
    const h = anchor ? `#${slug}#${anchor}` : `#${slug}`;
    if (window.location.hash !== h) window.location.hash = h;
    else setRoute({ slug, anchor });
    if (anchor) {
      requestAnimationFrame(() => {
        const el = document.getElementById(anchor);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const current = window.DOCS_INDEX.find(d => d.slug === route.slug) || window.DOCS_INDEX[0];
  const idx = window.DOCS_INDEX.findIndex(d => d.slug === current.slug);
  const prev = idx > 0 ? window.DOCS_INDEX[idx - 1] : null;
  const next = idx < window.DOCS_INDEX.length - 1 ? window.DOCS_INDEX[idx + 1] : null;

  return (
    <>
      <div className="docs-shell">
        <TopBar onOpenSearch={() => setSearchOpen(true)} current={current} />
        <Sidebar currentSlug={current.slug} onNavigate={goto} />
        <main className="main">
          <DocContent doc={current} anchor={route.anchor} />
          <DocFooter prev={prev} next={next} onNavigate={goto} />
        </main>
      </div>
      {searchOpen && <SearchPalette onClose={() => setSearchOpen(false)} onNavigate={goto} />}
    </>
  );
}

function TopBar({ onOpenSearch, current }) {
  return (
    <header className="topbar">
      <a className="brand" href="index.html" title="Back to home">
        <LogoMark size={22} color="var(--fg)" />
        <span>gargantua</span>
        <span className="ver">docs · v1.2.2</span>
      </a>
      <div className="crumbs">
        Docs <span className="sep">/</span> <em>{current.title}</em>
      </div>
      <div className="spacer"></div>
      <div className="actions">
        <button className="icon-btn" onClick={onOpenSearch}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
          <span>Search</span>
          <kbd>⌘K</kbd>
        </button>
        <a className="icon-btn" href="https://github.com/GiskardB/gargantua" target="_blank" rel="noreferrer">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2.18c-3.2.7-3.87-1.36-3.87-1.36-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.76 2.69 1.25 3.34.96.1-.74.4-1.25.72-1.54-2.55-.29-5.23-1.27-5.23-5.66 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.45.11-3.03 0 0 .96-.31 3.16 1.17.92-.26 1.9-.39 2.88-.39.98 0 1.96.13 2.88.39 2.2-1.48 3.16-1.17 3.16-1.17.62 1.58.23 2.74.11 3.03.74.8 1.18 1.82 1.18 3.07 0 4.4-2.68 5.37-5.24 5.65.41.36.78 1.06.78 2.14v3.17c0 .31.21.66.79.55C20.21 21.39 23.5 17.07 23.5 12 23.5 5.65 18.35.5 12 .5z"/></svg>
          <span>GitHub</span>
        </a>
      </div>
    </header>
  );
}

function Sidebar({ currentSlug, onNavigate }) {
  return (
    <aside className="sidebar">
      <a className="home-link" href="index.html">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        <span>Back to home</span>
      </a>
      {SIDEBAR_GROUPS.map((group) => (
        <div key={group.title}>
          <div className="group">{group.title}</div>
          {group.slugs.map((slug) => {
            const doc = window.DOCS_INDEX.find(d => d.slug === slug);
            if (!doc) return null;
            const active = slug === currentSlug;
            return (
              <a
                key={slug}
                className={`nav-item${active ? ' active' : ''}`}
                href={`#${slug}`}
                onClick={(e) => { e.preventDefault(); onNavigate(slug); }}
              >
                <span className="glyph"><DocGlyph id={doc.glyph} size={18} /></span>
                <span className="label">{doc.title}</span>
                <span className="arr">→</span>
              </a>
            );
          })}
        </div>
      ))}
    </aside>
  );
}

function DocContent({ doc, anchor }) {
  const containerRef = useRef(null);
  const [headings, setHeadings] = useState([]);
  const [activeHeading, setActiveHeading] = useState(null);

  const html = useMemo(() => {
    const md = window.DOCS_CONTENT[doc.slug] || '';
    if (!window.marked) return escapeHtml(md);
    try { return window.marked.parse(md); } catch (e) { return `<pre>${escapeHtml(String(e))}</pre>`; }
  }, [doc.slug]);

  // After render: render mermaid, attach copy buttons, harvest headings, jump to anchor.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Mermaid render
    if (window.mermaid) {
      try { window.mermaid.run({ querySelector: '.mermaid', nodes: el.querySelectorAll('.mermaid') }); }
      catch (_) {}
    }

    // Copy buttons
    el.querySelectorAll('pre [data-copy]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const code = btn.parentElement.querySelector('code');
        if (!code) return;
        navigator.clipboard?.writeText(code.innerText).then(() => {
          btn.textContent = '✓ Copied';
          btn.classList.add('copied');
          setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 1400);
        });
      });
    });

    // Headings for TOC
    const hs = [...el.querySelectorAll('h2, h3')].map(h => ({
      id: h.id, text: h.textContent, level: parseInt(h.tagName.substring(1), 10),
    }));
    setHeadings(hs);

    // Jump to anchor if specified
    if (anchor) {
      const target = document.getElementById(anchor);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [html, doc.slug, anchor]);

  // Scroll-spy for TOC
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const headingEls = [...el.querySelectorAll('h2, h3')];
    if (!headingEls.length) return;
    const onScroll = () => {
      let active = null;
      for (const h of headingEls) {
        const r = h.getBoundingClientRect();
        if (r.top < 120) active = h.id;
      }
      setActiveHeading(active);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [headings]);

  return (
    <div className="doc-content" key={doc.slug}>
      <div className="doc-hero">
        <div className="glyph-lg">
          <DocGlyph id={doc.glyph} size={36} />
        </div>
        <div className="meta">
          <div className="eyebrow">Documentation</div>
          <h1>{doc.title}</h1>
          <p className="blurb">{doc.blurb}</p>
        </div>
      </div>
      <div className="markdown" ref={containerRef} dangerouslySetInnerHTML={{ __html: html }} />
      {headings.length > 0 && (
        <nav className="toc">
          <div className="toc-title">On this page</div>
          {headings.map(h => (
            <a
              key={h.id}
              href={`#${doc.slug}#${h.id}`}
              className={`${h.level === 3 ? 'h3' : ''}${activeHeading === h.id ? ' active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                window.location.hash = `${doc.slug}#${h.id}`;
                document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >{h.text}</a>
          ))}
        </nav>
      )}
    </div>
  );
}

function DocFooter({ prev, next, onNavigate }) {
  return (
    <div className="doc-footer">
      <div className={`nav-card prev${prev ? '' : ' disabled'}`} onClick={() => prev && onNavigate(prev.slug)}>
        <div className="dir">← Previous</div>
        <div className="title">{prev ? prev.title : '—'}</div>
      </div>
      <div className={`nav-card next${next ? '' : ' disabled'}`} onClick={() => next && onNavigate(next.slug)}>
        <div className="dir">Next →</div>
        <div className="title">{next ? next.title : '—'}</div>
      </div>
    </div>
  );
}

// ── Search palette ──────────────────────────────────────────────────────
function SearchPalette({ onClose, onNavigate }) {
  const [q, setQ] = useState('');
  const [focusIdx, setFocusIdx] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const results = useMemo(() => {
    if (!q || q.trim().length < 2) return [];
    const needle = q.trim().toLowerCase();
    const out = [];
    for (const doc of window.DOCS_INDEX) {
      const md = window.DOCS_CONTENT[doc.slug] || '';
      // Find heading-anchored snippets where the heading or following text matches.
      const lines = md.split('\n');
      let currentHeading = null, currentHeadingId = null;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const hMatch = line.match(/^(#{2,4})\s+(.+)$/);
        if (hMatch) {
          currentHeading = hMatch[2].replace(/[*`]/g, '').trim();
          currentHeadingId = slugify(currentHeading);
          continue;
        }
        if (line.toLowerCase().includes(needle)) {
          out.push({
            doc, heading: currentHeading || doc.title, headingId: currentHeadingId,
            snippet: line.trim().slice(0, 240),
          });
          if (out.length >= 40) break;
        }
      }
      if (out.length >= 40) break;
    }
    return out.slice(0, 30);
  }, [q]);

  useEffect(() => { setFocusIdx(0); }, [q]);

  const go = (r) => { onNavigate(r.doc.slug, r.headingId); onClose(); };

  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setFocusIdx(i => Math.min(results.length - 1, i + 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setFocusIdx(i => Math.max(0, i - 1)); }
    if (e.key === 'Enter' && results[focusIdx]) { e.preventDefault(); go(results[focusIdx]); }
    if (e.key === 'Escape') onClose();
  };

  const highlight = (text, q) => {
    if (!q) return text;
    const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig');
    const parts = text.split(re);
    return parts.map((p, i) => re.test(p) ? <mark key={i}>{p}</mark> : <span key={i}>{p}</span>);
  };

  return (
    <div className="search-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="search-box" onKeyDown={onKey}>
        <div className="search-input-row">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search the documentation…"
          />
          <span className="esc">esc</span>
        </div>
        <div className="search-results">
          {q.trim().length < 2 && (
            <div className="empty">Type at least 2 characters to search across all docs.</div>
          )}
          {q.trim().length >= 2 && results.length === 0 && (
            <div className="empty">No results for "{q}".</div>
          )}
          {results.map((r, i) => (
            <a
              key={i}
              className={`search-result${i === focusIdx ? ' focused' : ''}`}
              onMouseEnter={() => setFocusIdx(i)}
              onClick={(e) => { e.preventDefault(); go(r); }}
              href={`#${r.doc.slug}${r.headingId ? '#' + r.headingId : ''}`}
            >
              <div className="topic">{r.doc.title}</div>
              <div className="heading">{r.heading}</div>
              <div className="snippet">{highlight(r.snippet, q)}</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<DocsApp />);
