/**
 * Industrial Field Mobile Companion Container
 * Renders touch-optimized field views for mobile users while seamlessly falling back to standard view
 */
export function MobileContainer({
  children,
}) {
  return (
    <div className="w-full flex flex-col space-y-4 max-w-full overflow-hidden">
      {children}
    </div>
  );
}

export default MobileContainer;
