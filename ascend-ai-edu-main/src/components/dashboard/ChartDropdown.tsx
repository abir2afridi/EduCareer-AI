import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChartDropdownProps {
  items?: { label: string; onSelect?: () => void }[];
}

export default function ChartDropdown({
  items = [
    { label: "View details" },
    { label: "Download report" },
    { label: "Export CSV" },
  ],
}: ChartDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 text-muted-foreground transition hover:text-foreground">
        <MoreHorizontal className="h-4 w-4" />
        <span className="sr-only">Open chart actions</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40 rounded-xl border border-border/60 p-1 text-sm">
        {items.map((item) => (
          <DropdownMenuItem
            key={item.label}
            className="cursor-pointer rounded-lg px-2.5 py-2 text-muted-foreground hover:text-foreground"
            onSelect={(event) => {
              event.preventDefault();
              item.onSelect?.();
            }}
          >
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
