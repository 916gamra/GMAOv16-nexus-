
/**
 * AllOutIcon / RoboticHand Icon - Google Material Icons "all_out"
 * Represents Machine Families (Familles de Machines)
 */
export function RoboticHand({
  className = 'w-4 h-4',
  size,
  color = 'currentColor',
  ...props
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size || 24}
      height={size || 24}
      fill={color}
      className={className}
      {...props}
    >
      <path d="M16.21 4.16l4 4v-4zm4 12l-4 4h4zm-12 4l-4-4v4zm-4-12l4-4h-4zm12.95-.95c-2.73-2.73-7.17-2.73-9.9 0s-2.73 7.17 0 9.9 7.17 2.73 9.9 0 2.73-7.16 0-9.9zm-1.41 8.49c-1.95 1.95-5.12 1.95-7.07 0s-1.95-5.12 0-7.07 5.12-1.95 7.07 0 1.95 5.12 0 7.07z" />
    </svg>
  );
}

export const AllOutIcon = RoboticHand;
export const AllOut = RoboticHand;
export default RoboticHand;

