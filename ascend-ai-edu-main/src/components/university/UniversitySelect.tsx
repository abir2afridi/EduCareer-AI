import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { publicUniversities, privateUniversities } from "@/constants/universities";
import { slugifyUniversityId } from "@/utils/courseBuilder";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ChevronsUpDown, Check } from "lucide-react";

export type UniversityOption = {
  id: string;
  name: string;
  category: "public" | "private";
};

const buildOptions = () => {
  const map = new Map<string, UniversityOption>();
  publicUniversities.forEach((name) => {
    const id = slugifyUniversityId(name);
    map.set(id, { id, name, category: "public" });
  });
  privateUniversities.forEach((name) => {
    const id = slugifyUniversityId(name);
    if (!map.has(id)) {
      map.set(id, { id, name, category: "private" });
    } else {
      const existing = map.get(id);
      if (existing) {
        existing.category = "public";
      }
    }
  });
  return Array.from(map.values());
};

export const universityOptions = buildOptions();

type UniversitySelectProps = {
  value?: string;
  onChange: (option: UniversityOption) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  options?: UniversityOption[];
};

export function UniversitySelect({ value, onChange, placeholder = "Select university", disabled, className, options }: UniversitySelectProps) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "public" | "private">("all");
  const [search, setSearch] = useState("");
  const baseOptions = useMemo(() => (options && options.length ? options : universityOptions), [options]);
  const selected = useMemo(() => baseOptions.find((option) => option.id === value), [baseOptions, value]);

  const visibleOptions = useMemo(
    () =>
      baseOptions.filter((option) => {
        const matchesFilter = filter === "all" || option.category === filter;
        if (!matchesFilter) return false;
        if (!search.trim()) return true;
        return option.name.toLowerCase().includes(search.toLowerCase());
      }),
    [baseOptions, filter, search],
  );

  const publicOptions = useMemo(() => visibleOptions.filter((option) => option.category === "public"), [visibleOptions]);
  const privateOptionsList = useMemo(() => visibleOptions.filter((option) => option.category === "private"), [visibleOptions]);

  const handleSelect = (option: UniversityOption) => {
    onChange(option);
    setOpen(false);
  };

  return (
    <Popover open={open && !disabled} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full justify-between rounded-xl", className)}
        >
          <div className="flex flex-col items-start text-left">
            <span className="text-sm font-medium text-foreground">{selected?.name ?? placeholder}</span>
            {selected && <Badge variant="secondary" className="mt-1 text-[10px]">{selected.category === "public" ? "Public" : "Private"}</Badge>}
          </div>
          <ChevronsUpDown className="h-4 w-4 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] rounded-2xl border border-border/60 bg-background/95 p-0 text-foreground shadow-2xl" align="start">
        <div className="border-b border-border/60 p-2">
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { key: "all" as const, label: "All" },
                { key: "public" as const, label: "Public" },
                { key: "private" as const, label: "Private" },
              ]
            ).map(({ key, label }) => (
              <Button
                key={key}
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setFilter(key)}
                className={cn(
                  "h-8 w-full border-border/60 text-xs font-medium",
                  filter === key && "border-primary bg-primary/10 text-primary",
                )}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
        <Command className="bg-transparent">
          <CommandInput
            placeholder="Search universities..."
            value={search}
            onValueChange={setSearch}
            className="border-b border-border/60"
          />
          <CommandEmpty className="px-3 py-4 text-sm text-muted-foreground">No university found.</CommandEmpty>
          <CommandList className="max-h-72">
            {filter !== "private" && publicOptions.length > 0 && (
              <CommandGroup heading="Public Universities">
                {publicOptions.map((option) => (
                  <CommandItem key={option.id} value={option.id} onSelect={() => handleSelect(option)}>
                    <Check className={cn("mr-2 h-4 w-4", selected?.id === option.id ? "opacity-100" : "opacity-0")} />
                    {option.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {filter !== "public" && privateOptionsList.length > 0 && (
              <CommandGroup heading="Private Universities">
                {privateOptionsList.map((option) => (
                  <CommandItem key={option.id} value={option.id} onSelect={() => handleSelect(option)}>
                    <Check className={cn("mr-2 h-4 w-4", selected?.id === option.id ? "opacity-100" : "opacity-0")} />
                    {option.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {visibleOptions.length === 0 && (
              <div className="px-3 py-4 text-sm text-muted-foreground">No university found.</div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
