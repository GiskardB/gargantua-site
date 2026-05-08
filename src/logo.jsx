// Logo mark — "G" carved from concentric rings forming an event-horizon glyph.
// Geometric, monoline, scales from 18px to 64px without losing crispness.
function LogoMark({ size = 26, color = 'currentColor' }) {
  const s = size;
  return (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
      {/* Outer ring */}
      <circle cx="16" cy="16" r="14" stroke={color} strokeWidth="1.4" opacity="0.35"/>
      {/* Middle ring */}
      <circle cx="16" cy="16" r="10.5" stroke={color} strokeWidth="1.4" opacity="0.65"/>
      {/* Inner solid disc with notch — the "G" gap */}
      <path
        d="M16 8.5 a7.5 7.5 0 1 0 7.5 7.5 H16"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Singularity dot */}
      <circle cx="16" cy="16" r="1.6" fill={color}/>
    </svg>
  );
}

window.LogoMark = LogoMark;
