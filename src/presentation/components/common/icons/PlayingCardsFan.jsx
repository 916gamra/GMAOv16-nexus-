
/**
 * PlayingCardsFan Icon - Compatible with Lucide React icon standard
 * Represents a fanned deck of cards / item designations
 */
export function PlayingCardsFan({
  className = 'w-4 h-4',
  size,
  color = 'currentColor',
  strokeWidth = 2,
  ...props
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size || 24}
      height={size || 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Center upright card */}
      <rect x="7" y="3" width="10" height="15" rx="1.5" />
      {/* Left tilted card behind */}
      <path d="M4.5 7.5 3 17a1.5 1.5 0 0 0 1.2 1.7l6.8 1.1" />
      {/* Right tilted card behind */}
      <path d="M19.5 7.5 21 17a1.5 1.5 0 0 1-1.2 1.7l-6.8 1.1" />
      {/* Center card pip symbol (diamond / spade accent) */}
      <path d="m12 8.5 1.5 2-1.5 2-1.5-2Z" />
    </svg>
  );
}

export default PlayingCardsFan;
