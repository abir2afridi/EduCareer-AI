import type { FC } from "react";
import styles from "./HamburgerToggle.module.css";

type HamburgerToggleProps = {
  open: boolean;
  onToggle: () => void;
  className?: string;
  variantClassName?: string;
  ariaLabel?: string;
};

export const HamburgerToggle: FC<HamburgerToggleProps> = ({
  open,
  onToggle,
  className,
  variantClassName,
  ariaLabel = "Toggle navigation menu",
}) => {
  return (
    <div className={[styles.wrapper, className].filter(Boolean).join(" ")}>
      <label className={[styles.hamburger, variantClassName].filter(Boolean).join(" ")}>
        <input
          type="checkbox"
          checked={open}
          onChange={onToggle}
          aria-label={ariaLabel}
        />
        <svg viewBox="0 0 32 32" role="presentation" aria-hidden="true">
          <path
            className={`${styles.line} ${styles.lineTopBottom}`}
            d="M27 10 13 10C10.8 10 9 8.2 9 6 9 3.5 10.8 2 13 2 15.2 2 17 3.8 17 6L17 26C17 28.2 18.8 30 21 30 23.2 30 25 28.2 25 26 25 23.8 23.2 22 21 22L7 22"
          />
          <path className={styles.line} d="M7 16 27 16" />
        </svg>
      </label>
    </div>
  );
};

export default HamburgerToggle;
