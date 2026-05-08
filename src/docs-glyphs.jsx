// Per-topic SVG glyphs — small, monoline, geometric.
// Used in the sidebar (22px) and as a large hero glyph (40px).
// Subtle hover/active animation via CSS transitions on stroke color.

function DocGlyph({ id, size = 22, color = 'currentColor' }) {
  const s = size;
  const sw = Math.max(1.4, s / 14);
  const half = s / 2;
  const props = { width: s, height: s, viewBox: '0 0 32 32', fill: 'none', stroke: color, strokeWidth: sw, strokeLinecap: 'round', strokeLinejoin: 'round' };

  switch (id) {
    case 'route':  // Skills & Routing — branching paths
      return (
        <svg {...props}>
          <circle cx="6" cy="16" r="2" fill={color} stroke="none" />
          <circle cx="26" cy="6" r="2" fill={color} stroke="none" />
          <circle cx="26" cy="16" r="2" fill={color} stroke="none" />
          <circle cx="26" cy="26" r="2" fill={color} stroke="none" />
          <path d="M8 16 L16 16 M16 16 C20 16 20 6 24 6 M16 16 L24 16 M16 16 C20 16 20 26 24 26" opacity="0.85" />
        </svg>
      );
    case 'tool':   // Tools & Annotations — wrench / spanner
      return (
        <svg {...props}>
          <path d="M22 4 a6 6 0 0 0 -7 7 L4 22 a3 3 0 0 0 4 4 L19 15 a6 6 0 0 0 7 -7 L22 12 L20 12 L20 10 Z" />
        </svg>
      );
    case 'dsl':    // Agent DSL — curly braces
      return (
        <svg {...props}>
          <path d="M12 5 C8 5 9 11 6 13 C5 13.5 5 13.5 5 14 C5 14 5 14.5 5 15 C5 15 5 15.5 5 16 C5 16 5 16.5 5 17 C5 17 5 17.5 5 18 C5 18 5 18.5 5 19 C5 19.5 5 19.5 6 20 C9 22 8 27 12 27" />
          <path d="M20 5 C24 5 23 11 26 13 C27 13.5 27 13.5 27 14 C27 14 27 14.5 27 15 C27 15 27 15.5 27 16 C27 16 27 16.5 27 17 C27 17 27 17.5 27 18 C27 18 27 18.5 27 19 C27 19.5 27 19.5 26 20 C23 22 24 27 20 27" />
          <circle cx="16" cy="16" r="1.6" fill={color} stroke="none" />
        </svg>
      );
    case 'memory': // Memory System — three stacked cylinders
      return (
        <svg {...props}>
          <ellipse cx="16" cy="7" rx="8" ry="2.5" />
          <path d="M8 7 L8 12 C8 13.4 11.6 14.5 16 14.5 C20.4 14.5 24 13.4 24 12 L24 7" />
          <path d="M8 14 L8 19 C8 20.4 11.6 21.5 16 21.5 C20.4 21.5 24 20.4 24 19 L24 14" opacity="0.65" />
          <path d="M8 21 L8 25 C8 26.4 11.6 27.5 16 27.5 C20.4 27.5 24 26.4 24 25 L24 21" opacity="0.4" />
        </svg>
      );
    case 'shield': // Guardrails — shield with check
      return (
        <svg {...props}>
          <path d="M16 4 L26 8 L26 15 C26 21 21 26 16 28 C11 26 6 21 6 15 L6 8 Z" />
          <path d="M11 16 L14.5 19.5 L21 12.5" />
        </svg>
      );
    case 'llm':    // LLM Configuration — overlapping rings
      return (
        <svg {...props}>
          <circle cx="12" cy="16" r="7" />
          <circle cx="20" cy="16" r="7" opacity="0.7" />
          <circle cx="16" cy="16" r="1.5" fill={color} stroke="none" />
        </svg>
      );
    case 'api':    // API Reference — chevrons / brackets
      return (
        <svg {...props}>
          <path d="M11 9 L4 16 L11 23" />
          <path d="M21 9 L28 16 L21 23" />
          <path d="M19 7 L13 25" opacity="0.55" />
        </svg>
      );
    case 'extend': // Extending — plus / module
      return (
        <svg {...props}>
          <rect x="5" y="5" width="9" height="9" rx="1.5" />
          <rect x="18" y="5" width="9" height="9" rx="1.5" opacity="0.55" />
          <rect x="5" y="18" width="9" height="9" rx="1.5" opacity="0.55" />
          <path d="M22.5 18 L22.5 27 M18 22.5 L27 22.5" />
        </svg>
      );
    case 'deploy': // Deployment — server / box
      return (
        <svg {...props}>
          <rect x="5" y="5" width="22" height="7" rx="1.5" />
          <rect x="5" y="13.5" width="22" height="7" rx="1.5" opacity="0.7" />
          <rect x="5" y="22" width="22" height="5" rx="1.5" opacity="0.5" />
          <circle cx="9" cy="8.5" r="1" fill={color} stroke="none" />
          <circle cx="9" cy="17" r="1" fill={color} stroke="none" />
          <circle cx="9" cy="24.5" r="1" fill={color} stroke="none" />
        </svg>
      );
    case 'diagram': // Architecture Diagrams — connected nodes
      return (
        <svg {...props}>
          <circle cx="6" cy="6" r="2.5" />
          <circle cx="26" cy="6" r="2.5" />
          <circle cx="16" cy="16" r="2.5" fill={color} stroke="none" />
          <circle cx="6" cy="26" r="2.5" />
          <circle cx="26" cy="26" r="2.5" />
          <path d="M7.5 7.5 L14.5 14.5 M24.5 7.5 L17.5 14.5 M14.5 17.5 L7.5 24.5 M17.5 17.5 L24.5 24.5" opacity="0.7" />
        </svg>
      );
    default:
      return (
        <svg {...props}>
          <circle cx="16" cy="16" r="10" />
        </svg>
      );
  }
}

window.DocGlyph = DocGlyph;
