import type { MouseEvent } from "react";
import { Link } from "react-router-dom";

interface DropdownItemProps {
  tag?: "a" | "button";
  to?: string;
  onClick?: () => void;
  onItemClick?: () => void;
  className?: string;
  children: React.ReactNode;
}

export function DropdownItem({
  tag = "button",
  to,
  onClick,
  onItemClick,
  className = "",
  children,
}: DropdownItemProps) {
  const baseClass =
    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-gray-100";
  const combined = `${baseClass} ${className}`.trim();

  const handleClick = (event: MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    if (tag === "button") {
      event.preventDefault();
    }
    onClick?.();
    onItemClick?.();
  };

  if (tag === "a" && to) {
    return (
      <Link to={to} className={combined} onClick={handleClick}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={handleClick} className={combined}>
      {children}
    </button>
  );
}
