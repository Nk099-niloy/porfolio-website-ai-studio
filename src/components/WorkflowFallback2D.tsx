interface WorkflowFallback2DProps {
  accentColor: string;
}

export function WorkflowFallback2D({ accentColor }: WorkflowFallback2DProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#0b0b0e] opacity-40"
    >
      <svg
        className="h-full w-full"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <g stroke="rgba(245,243,238,0.14)" strokeWidth="1">
          <line x1="680" y1="140" x2="860" y2="230" />
          <line x1="860" y1="230" x2="1040" y2="180" />
          <line x1="860" y1="230" x2="790" y2="410" />
          <line x1="790" y1="410" x2="980" y2="490" />
          <line x1="980" y1="490" x2="1080" y2="330" />
          <line x1="1040" y1="180" x2="1080" y2="330" />
          <line x1="790" y1="410" x2="620" y2="560" />
          <line x1="620" y1="560" x2="860" y2="660" />
          <line x1="860" y1="660" x2="980" y2="490" />
        </g>

        <g>
          <circle cx="680" cy="140" r="6" fill="#f5f3ee" fillOpacity="0.45" />
          <circle cx="860" cy="230" r="10" fill={accentColor} />
          <circle cx="860" cy="230" r="22" stroke={accentColor} strokeWidth="1" />
          <circle cx="1040" cy="180" r="6" fill="#f5f3ee" fillOpacity="0.45" />
          <circle cx="790" cy="410" r="8" fill="#f5f3ee" fillOpacity="0.6" />
          <circle cx="790" cy="410" r="16" stroke="rgba(245,243,238,0.28)" strokeWidth="1" />
          <circle cx="980" cy="490" r="7" fill={accentColor} />
          <circle cx="1080" cy="330" r="5" fill="#f5f3ee" fillOpacity="0.45" />
          <circle cx="620" cy="560" r="6" fill="#f5f3ee" fillOpacity="0.45" />
          <circle cx="860" cy="660" r="8" fill="#f5f3ee" fillOpacity="0.6" />
        </g>
      </svg>
    </div>
  );
}
