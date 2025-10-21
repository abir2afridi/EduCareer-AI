import { ReactNode, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BookOpen, ChevronDown, GraduationCap, Lightbulb } from "lucide-react";

const NAV_TABS = [
  {
    title: "Discover",
    Component: DiscoverContent,
  },
  {
    title: "Programs",
    Component: ProgramsContent,
  },
  {
    title: "Resources",
    Component: ResourcesContent,
  },
].map((tab, idx) => ({ ...tab, id: idx + 1 }));

export const ShiftingDropdown = () => {
  return (
    <div className="relative hidden gap-3 md:flex">
      <Tabs />
    </div>
  );
};

const Tabs = () => {
  const [selected, setSelected] = useState<number | null>(null);
  const [dir, setDir] = useState<null | "l" | "r">(null);

  const handleSetSelected = (val: number | null) => {
    if (typeof selected === "number" && typeof val === "number") {
      setDir(selected > val ? "r" : "l");
    } else if (val === null) {
      setDir(null);
    }

    setSelected(val);
  };

  return (
    <div
      onMouseLeave={() => handleSetSelected(null)}
      className="relative flex h-fit gap-2"
    >
      {NAV_TABS.map((tab) => (
        <Tab
          key={tab.id}
          tab={tab.id}
          selected={selected}
          handleSetSelected={handleSetSelected}
        >
          {tab.title}
        </Tab>
      ))}

      <AnimatePresence mode="wait">{selected && <Content dir={dir} selected={selected} />}</AnimatePresence>
    </div>
  );
};

const Tab = ({
  children,
  tab,
  handleSetSelected,
  selected,
}: {
  children: ReactNode;
  tab: number;
  handleSetSelected: (val: number | null) => void;
  selected: number | null;
}) => {
  return (
    <button
      id={`shift-tab-${tab}`}
      onMouseEnter={() => handleSetSelected(tab)}
      onClick={() => handleSetSelected(tab)}
      className={`flex items-center gap-1 rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em] transition-colors duration-150 ease-out ${
        selected === tab
          ? "bg-black text-white shadow-sm"
          : "text-neutral-600 hover:bg-neutral-200"
      }`}
    >
      <span>{children}</span>
      <ChevronDown
        className={`h-4 w-4 transition-transform duration-200 ${
          selected === tab ? "rotate-180" : ""
        }`}
      />
    </button>
  );
};

const Content = ({
  selected,
  dir,
}: {
  selected: number | null;
  dir: null | "l" | "r";
}) => {
  return (
    <motion.div
      id="overlay-content"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className="absolute left-0 top-[calc(100%_+_20px)] w-[420px] rounded-2xl border border-neutral-200 bg-white/95 backdrop-blur-md p-5 shadow-xl"
    >
      <Bridge />
      <Nub selected={selected} />

      {NAV_TABS.map((tab) => (
        <div className="overflow-hidden" key={tab.id}>
          {selected === tab.id && (
            <motion.div
              initial={{ opacity: 0, x: dir === "l" ? 100 : dir === "r" ? -100 : 0 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <tab.Component />
            </motion.div>
          )}
        </div>
      ))}
    </motion.div>
  );
};

const Bridge = () => <div className="absolute -top-5 left-0 right-0 h-5" />;

const Nub = ({ selected }: { selected: number | null }) => {
  const [left, setLeft] = useState(0);

  useEffect(() => {
    const moveNub = () => {
      if (!selected) return;

      const hoveredTab = document.getElementById(`shift-tab-${selected}`);
      const overlayContent = document.getElementById("overlay-content");

      if (!hoveredTab || !overlayContent) return;

      const tabRect = hoveredTab.getBoundingClientRect();
      const { left: contentLeft } = overlayContent.getBoundingClientRect();
      const tabCenter = tabRect.left + tabRect.width / 2 - contentLeft;

      setLeft(tabCenter);
    };

    moveNub();
    window.addEventListener("resize", moveNub);
    return () => window.removeEventListener("resize", moveNub);
  }, [selected]);

  return (
    <motion.span
      style={{ clipPath: "polygon(0 0, 100% 0, 50% 50%, 0% 100%)" }}
      animate={{ left }}
      transition={{ type: "spring", stiffness: 340, damping: 24 }}
      className="absolute left-1/2 top-0 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-tl border border-neutral-200 bg-white"
    />
  );
};

function DiscoverContent() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4 text-left text-sm text-neutral-600">
        <div className="space-y-1">
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-900">Why EduCareer</h3>
          <a href="#work" className="block transition-colors hover:text-black">
            Adaptive Pathways
          </a>
          <a href="#about" className="block transition-colors hover:text-black">
            Insight Hub
          </a>
        </div>
        <div className="space-y-1">
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-900">Impact</h3>
          <a href="#about" className="block transition-colors hover:text-black">
            Skills Intelligence
          </a>
          <a href="#about" className="block transition-colors hover:text-black">
            Career Outcomes
          </a>
        </div>
        <div className="space-y-1">
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-900">Get Started</h3>
          <a href="#contact" className="block transition-colors hover:text-black">
            Book a demo
          </a>
          <a href="/auth/signup" className="block transition-colors hover:text-black">
            Create account
          </a>
        </div>
      </div>
      <button className="ml-auto flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.24em] text-neutral-900 transition-colors hover:text-black">
        <span>View more</span>
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function ProgramsContent() {
  return (
    <div className="grid grid-cols-3 gap-4 divide-x divide-neutral-200 text-neutral-600">
      <a
        href="#"
        className="flex flex-col items-center justify-center gap-2 py-2 transition-colors hover:text-black"
      >
        <BookOpen className="h-5 w-5 text-neutral-900" />
        <span className="text-xs uppercase tracking-[0.2em]">Campus</span>
      </a>
      <a
        href="#"
        className="flex flex-col items-center justify-center gap-2 py-2 transition-colors hover:text-black"
      >
        <GraduationCap className="h-5 w-5 text-neutral-900" />
        <span className="text-xs uppercase tracking-[0.2em]">Career</span>
      </a>
      <a
        href="#"
        className="flex flex-col items-center justify-center gap-2 py-2 transition-colors hover:text-black"
      >
        <Lightbulb className="h-5 w-5 text-neutral-900" />
        <span className="text-xs uppercase tracking-[0.2em]">Employers</span>
      </a>
    </div>
  );
}

function ResourcesContent() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <a href="#">
          <div className="mb-2 h-16 w-full overflow-hidden rounded-lg bg-neutral-100" />
          <h4 className="text-sm font-semibold text-neutral-900">Student Success Playbook</h4>
          <p className="text-xs text-neutral-500">Guides for coaching learners from orientation to internship placement.</p>
        </a>
        <a href="#">
          <div className="mb-2 h-16 w-full overflow-hidden rounded-lg bg-neutral-100" />
          <h4 className="text-sm font-semibold text-neutral-900">Institutional Impact Report</h4>
          <p className="text-xs text-neutral-500">Analytics templates for measuring retention, skills growth, and employer outcomes.</p>
        </a>
      </div>
      <button className="ml-auto flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.24em] text-neutral-900 transition-colors hover:text-black">
        <span>Explore resource hub</span>
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

export default ShiftingDropdown;
