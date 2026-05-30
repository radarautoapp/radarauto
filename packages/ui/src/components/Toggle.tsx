/**
 * Toggle
 *
 * Switch on/off (matching .tg do protótipo).
 */
export interface ToggleProps {
  on: boolean;
  onClick: () => void;
  ariaLabel?: string;
}

export function Toggle({ on, onClick, ariaLabel }: ToggleProps): JSX.Element {
  return (
    <button
      type="button"
      className={`tg${on ? " on" : ""}`}
      onClick={onClick}
      role="switch"
      aria-checked={on}
      aria-label={ariaLabel}
    >
      <span />
    </button>
  );
}
