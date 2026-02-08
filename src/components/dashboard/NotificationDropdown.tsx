import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0, y: -10, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      damping: 30,
      stiffness: 400,
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.98,
    transition: {
      duration: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: -5 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    y: -5,
    transition: {
      duration: 0.15,
    },
  },
};

type NotificationListProps = {
  notifications: NotificationItem[];
  onSelect?: () => void;
};

export function NotificationList({ notifications, onSelect }: NotificationListProps) {
  return (
    <motion.ul className="max-h-80 space-y-2 overflow-y-auto pr-1 text-sm">
      <AnimatePresence>
        {notifications.map((notification, index) => (
          <motion.li 
            key={notification.id}
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ delay: index * 0.05 }}
          >
            <motion.a
              href={notification.href}
              onClick={(event) => {
                event.preventDefault();
                onSelect?.();
              }}
              className="flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-3 text-left text-muted-foreground transition hover:border-border/60 hover:bg-slate-50 hover:text-foreground dark:hover:bg-slate-800"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.span 
                className="relative h-10 w-10 overflow-hidden rounded-full"
                whileHover={{ scale: 1.05 }}
              >
                <img
                  src={notification.avatar}
                  alt={notification.name}
                  className="h-full w-full object-cover"
                />
                <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border border-white bg-emerald-500" />
              </motion.span>
              <span className="flex-1">
                <span className="block text-sm font-medium text-foreground">{notification.name}</span>
                <span className="block text-xs text-muted-foreground">{notification.message}</span>
                <span className="mt-1 block text-[11px] text-muted-foreground">{notification.meta}</span>
              </span>
            </motion.a>
          </motion.li>
        ))}
      </AnimatePresence>
    </motion.ul>
  );
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);

  const toggleDropdown = useCallback(() => {
    setIsOpen((prev) => !prev);
    setHasUnread(false);
  }, []);

  const closeDropdown = useCallback(() => setIsOpen(false), []);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('#notification-dropdown')) {
        closeDropdown();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeDropdown();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, closeDropdown]);

  return (
    <div id="notification-dropdown" className="relative">
      <motion.button
        type="button"
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-border/60 bg-white text-muted-foreground transition hover:bg-slate-100 hover:text-foreground dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
        onClick={toggleDropdown}
        aria-label="View notifications"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {hasUnread && (
          <motion.span 
            className="absolute right-0 top-0 flex h-2.5 w-2.5"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-500 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-orange-500" />
          </motion.span>
        )}
        <motion.svg
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          animate={isOpen ? { rotate: 20 } : { rotate: 0 }}
          transition={{ duration: 0.2 }}
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.292C10.75 1.878 10.414 1.542 10 1.542c-.414 0-.75.336-.75.75v.544C6.083 3.208 3.625 5.9 3.625 9.168v5.292H3.333a.75.75 0 0 0 0 1.5h1.042h11.25h1.041a.75.75 0 0 0 0-1.5h-.291V9.168c0-3.267-2.458-5.96-5.625-6.331V2.292Zm4.125 12.167V9.168c0-2.692-2.183-4.875-4.875-4.875-2.693 0-4.875 2.183-4.875 4.875v5.291h9.75ZM8 17.708c0 .415.336.75.75.75h2.5a.75.75 0 0 0 0-1.5h-2.5a.75.75 0 0 0-.75.75Z"
            fill="currentColor"
          />
        </motion.svg>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={containerVariants}
            className="absolute right-0 z-50 mt-3 w-[340px] max-w-[calc(100vw-2rem)] origin-top-right overflow-hidden rounded-2xl border border-border/60 bg-white p-4 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
          >
            <motion.div 
              className="mb-3 flex items-center justify-between border-b border-border/60 pb-3"
              variants={itemVariants}
            >
              <h5 className="text-base font-semibold text-foreground">Notifications</h5>
              <motion.button
                type="button"
                className="text-sm text-muted-foreground transition hover:text-foreground"
                onClick={closeDropdown}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Close
              </motion.button>
            </motion.div>
            
            <NotificationList notifications={sampleNotifications} onSelect={closeDropdown} />

            <motion.div variants={itemVariants} className="mt-4">
              <Link
                to="/notifications"
                onClick={closeDropdown}
                className="block rounded-lg border border-border/60 px-4 py-2 text-center text-sm font-medium text-muted-foreground transition hover:bg-slate-100 hover:text-foreground dark:hover:bg-slate-800"
              >
                View all notifications
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export type NotificationItem = {
  id: number;
  name: string;
  message: string;
  meta: string;
  avatar: string;
  href: string;
};

export const sampleNotifications: NotificationItem[] = [
  {
    id: 1,
    name: "Terry Franci",
    message: "Requested access to Project Navigator",
    meta: "Project • 5 min ago",
    avatar: "https://source.boringavatars.com/marble/40/Terry?colors=0D5B8C,B30088,FFB35C,FFE568,9BFF99",
    href: "/notifications/1",
  },
  {
    id: 2,
    name: "Alena Franci",
    message: "Shared a new report with you",
    meta: "Analytics • 8 min ago",
    avatar: "https://source.boringavatars.com/marble/40/Alena?colors=0D5B8C,B30088,FFB35C,FFE568,9BFF99",
    href: "/notifications/2",
  },
  {
    id: 3,
    name: "Jocelyn Kenter",
    message: "Left feedback on your presentation",
    meta: "Review • 15 min ago",
    avatar: "https://source.boringavatars.com/marble/40/Jocelyn?colors=0D5B8C,B30088,FFB35C,FFE568,9BFF99",
    href: "/notifications/3",
  },
];
