import { useMemo, useState } from "react";
import {
  Archive,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Mail,
  MoreVertical,
  Paperclip,
  RefreshCcw,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  EMAILS,
  FILTER_ITEMS,
  LABEL_ITEMS,
  MAILBOX_ITEMS,
  TAG_INTENT_STYLES,
  type EmailListItem,
} from "./email/shared";

const PRIMARY_TABS = ["Primary", "Social", "Promotions"] as const;

export default function EmailInbox() {
  const [activeMailbox, setActiveMailbox] = useState<(typeof MAILBOX_ITEMS)[number]["key"]>("inbox");
  const [activePrimaryTab, setActivePrimaryTab] = useState<(typeof PRIMARY_TABS)[number]>("Primary");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmailIds, setSelectedEmailIds] = useState<string[]>([]);
  const [starredEmailIds, setStarredEmailIds] = useState<string[]>([]);

  const filteredEmails = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return EMAILS;
    }

    return EMAILS.filter((email) =>
      [email.sender, email.subject, email.excerpt, email.tag].some((value) => value.toLowerCase().includes(term)),
    );
  }, [searchTerm]);

  const allChecked = filteredEmails.length > 0 && filteredEmails.every((email) => selectedEmailIds.includes(email.id));
  const isIndeterminate = !allChecked && selectedEmailIds.length > 0;

  const handleToggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedEmailIds(filteredEmails.map((email) => email.id));
    } else {
      setSelectedEmailIds([]);
    }
  };

  const handleToggleEmail = (id: string, checked: boolean) => {
    setSelectedEmailIds((prev) => {
      const isAlreadySelected = prev.includes(id);
      if (checked && !isAlreadySelected) {
        return [...prev, id];
      }
      if (!checked && isAlreadySelected) {
        return prev.filter((value) => value !== id);
      }
      return prev;
    });
  };

  const handleToggleStar = (id: string) => {
    setStarredEmailIds((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
    );
  };

  const renderMailRow = (email: EmailListItem) => {
    const isSelected = selectedEmailIds.includes(email.id);
    const isStarred = starredEmailIds.includes(email.id);
    const badgeClass = TAG_INTENT_STYLES[email.tag] ?? "bg-slate-100 text-slate-600 border-slate-200";

    return (
      <li key={email.id} className="border-b border-gray-200 last:border-b-0 dark:border-gray-800">
        <div
          className={cn(
            "flex cursor-pointer items-center px-4 py-4 transition hover:bg-gray-100 dark:hover:bg-white/[0.03]",
            isSelected ? "bg-gray-100/70 dark:bg-white/[0.05]" : undefined,
          )}
        >
          <div className="flex w-3/5 items-center gap-3 sm:w-1/5">
            <Checkbox
              checked={isSelected}
              onCheckedChange={(value) => handleToggleEmail(email.id, value === true)}
              className="h-4 w-4 rounded-[4px] border border-gray-300 transition data-[state=checked]:border-brand-500 data-[state=checked]:bg-brand-500 data-[state=checked]:text-white"
            />

            <button
              type="button"
              onClick={() => handleToggleStar(email.id)}
              className="text-gray-300 transition hover:text-amber-400"
              aria-label={isStarred ? "Unstar email" : "Star email"}
            >
              <Star
                className={cn("h-4 w-4", isStarred ? "fill-amber-400 text-amber-400" : "text-gray-300")}
                strokeWidth={1.6}
                fill={isStarred ? "currentColor" : "none"}
              />
            </button>

            <span className="truncate text-sm font-medium text-gray-700 dark:text-gray-200">{email.subject}</span>
          </div>

          <div className="hidden flex-1 items-center gap-3 text-sm text-gray-500 dark:text-gray-400 sm:flex">
            <span className="truncate">{email.excerpt}</span>
            <span className={cn("hidden items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium sm:inline-flex", badgeClass)}>
              {email.tag}
            </span>
          </div>

          <div className="ml-auto flex flex-1 items-center justify-end gap-3 sm:flex-none">
            <div className="hidden items-center gap-1 text-xs text-gray-400 sm:flex">
              <Paperclip className="h-4 w-4" />
              Attach
            </div>
            <span className="text-xs font-medium text-gray-400 dark:text-gray-500">{email.time}</span>
          </div>
        </div>
      </li>
    );
  };

  return (
    <div className="space-y-6">
      <div className="overflow-hidden sm:h-[calc(100vh-174px)] xl:h-[calc(100vh-186px)]">
        <div className="flex h-full flex-col gap-6 sm:gap-5 xl:flex-row">
          <aside className="flex flex-col rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] xl:w-1/5">
            <div className="pb-5">
              <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 p-3 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600">
                <Mail className="h-4 w-4" /> Compose
              </button>
            </div>

            <div className="no-scrollbar max-h-full overflow-auto py-6">
              <nav className="space-y-5">
                <div>
                  <h3 className="mb-3 text-xs font-medium uppercase leading-[18px] text-gray-700 dark:text-gray-400">MAILBOX</h3>
                  <ul className="flex flex-col gap-1">
                    {MAILBOX_ITEMS.map(({ key, label, count, icon: Icon }) => (
                      <li key={key}>
                        <button
                          type="button"
                          onClick={() => setActiveMailbox(key)}
                          className={cn(
                            "group flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition hover:bg-brand-50 hover:text-brand-500 dark:hover:bg-brand-500/[0.12] dark:hover:text-brand-400",
                            activeMailbox === key ? "bg-brand-50 text-brand-500 dark:bg-brand-500/[0.12] dark:text-brand-400" : "text-gray-500 dark:text-gray-400",
                          )}
                        >
                          <span className="flex items-center gap-3">
                            <Icon className="h-4 w-4" />
                            {label}
                            {count !== undefined && (
                              <span className="ml-auto rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                {count}
                              </span>
                            )}
                          </span>
                          {count ? (
                            <span
                              className={cn(
                                "text-xs font-semibold",
                                activeMailbox === key
                                  ? "text-brand-500 dark:text-brand-400"
                                  : "text-gray-700 dark:text-gray-300 group-hover:text-brand-500 dark:group-hover:text-brand-400",
                              )}
                            >
                              {count}
                            </span>
                          ) : null}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="mb-3 text-xs font-medium uppercase leading-[18px] text-gray-700 dark:text-gray-400">FILTER</h3>
                  <ul className="flex flex-col gap-1">
                    {FILTER_ITEMS.map(({ key, label, icon: Icon }) => (
                      <li key={key}>
                        <button
                          type="button"
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-500 transition hover:bg-brand-50 hover:text-brand-500 dark:text-gray-400 dark:hover:bg-brand-500/[0.12] dark:hover:text-brand-400"
                        >
                          <Icon className="h-4 w-4" />
                          {label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="mb-3 text-xs font-medium uppercase leading-[18px] text-gray-700 dark:text-gray-400">LABEL</h3>
                  <ul className="flex flex-col gap-1">
                    {LABEL_ITEMS.map((item) => (
                      <li key={item.key}>
                        <div className="flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-3">
                            <span className={cn("h-3 w-3 rounded-full", item.color)} />
                            {item.label}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </nav>
            </div>
          </aside>

          <section className="flex h-screen flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] xl:h-full xl:w-4/5">
            <div className="flex flex-col justify-between gap-3 border-b border-gray-200 p-4 dark:border-gray-800 sm:flex-row">
              <div className="flex w-full items-center gap-2">
                <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-500 dark:border-gray-800 dark:text-gray-400">
                  <Checkbox
                    checked={allChecked ? true : isIndeterminate ? "indeterminate" : false}
                    onCheckedChange={(value) => handleToggleAll(value === true)}
                    className="h-4 w-4 rounded-[4px] border border-gray-300 transition data-[state=checked]:border-brand-500 data-[state=checked]:bg-brand-500 data-[state=checked]:text-white"
                    aria-label="Select all emails"
                  />
                  Select
                  <ChevronDown className="h-4 w-4" />
                </div>

                <button className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white" aria-label="Refresh">
                  <RefreshCcw className="h-4 w-4" />
                </button>
                <button className="hidden h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white sm:flex" aria-label="Archive">
                  <Archive className="h-4 w-4" />
                </button>
                <button className="hidden h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-100 hover:text-error-600 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-error-400 sm:flex" aria-label="Delete">
                  <Trash2 className="h-4 w-4" />
                </button>
                <button className="hidden h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white sm:flex" aria-label="More actions">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>

              <div className="relative w-full sm:max-w-[236px]">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Search className="h-4 w-4" />
                </span>
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search..."
                  className="h-10 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pl-11 text-sm text-gray-800 shadow-theme-xs transition focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100 dark:border-gray-700 dark:text-gray-100 dark:focus:border-brand-700"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 text-sm dark:border-gray-800">
              <div className="flex items-center gap-2">
                {PRIMARY_TABS.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActivePrimaryTab(tab)}
                    className={cn(
                      "rounded-lg px-4 py-2 text-sm font-semibold transition",
                      activePrimaryTab === tab
                        ? "bg-brand-50 text-brand-500 dark:bg-brand-500/[0.12] dark:text-brand-400"
                        : "text-gray-500 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-400",
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
                <span>1-10 of {EMAILS.length}</span>
                <div className="flex items-center gap-1">
                  <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white" aria-label="Previous page">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white" aria-label="Next page">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="custom-scrollbar h-full overflow-auto">
              {filteredEmails.length ? (
                <ul>{filteredEmails.map(renderMailRow)}</ul>
              ) : (
                <div className="flex h-full items-center justify-center px-6 py-12 text-sm text-gray-500 dark:text-gray-400">
                  No emails match your search.
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 text-xs text-gray-500 dark:border-gray-800 dark:bg-[#171f2f] dark:text-gray-400">
              <span>Showing {filteredEmails.length > 0 ? "1-10" : "0"} of {EMAILS.length}</span>
              <div className="flex items-center gap-1">
                <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white" aria-label="Previous page">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white" aria-label="Next page">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
