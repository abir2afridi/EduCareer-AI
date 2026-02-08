import {
  Archive,
  Ban,
  FileText,
  Inbox,
  Mail,
  Send,
  Tag,
  Trash2,
  AlertCircle,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type EmailListItem = {
  id: string;
  sender: string;
  subject: string;
  excerpt: string;
  tag: keyof typeof TAG_INTENT_STYLES;
  time: string;
};

export const MAILBOX_ITEMS = [
  { key: "inbox", label: "Inbox", count: 36, icon: Inbox },
  { key: "sent", label: "Sent", icon: Send },
  { key: "drafts", label: "Drafts", icon: FileText },
  { key: "spam", label: "Spam", count: 2, icon: Ban },
  { key: "trash", label: "Trash", icon: Trash2 },
  { key: "archive", label: "Archive", icon: Archive },
] as const;

export const FILTER_ITEMS = [
  { key: "starred", label: "Starred", icon: Star },
  { key: "important", label: "Important", icon: AlertCircle },
] as const;

export const LABEL_ITEMS = [
  { key: "personal", label: "Personal", color: "bg-emerald-500" },
  { key: "work", label: "Work", color: "bg-blue-500" },
  { key: "payments", label: "Payments", color: "bg-amber-500" },
  { key: "invoices", label: "Invoices", color: "bg-rose-500" },
  { key: "blank", label: "Blank", color: "bg-slate-400" },
] as const;

export const EMAILS: EmailListItem[] = [
  {
    id: "material-ui",
    sender: "Contact For \"Website Design\"",
    subject: "Hello Dear Alexander",
    excerpt: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent at rutrum mi...",
    tag: "Important",
    time: "12:16 pm",
  },
  {
    id: "wise",
    sender: "Material UI",
    subject: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    excerpt: "Nam vestibulum eleifend magna quis porta...",
    tag: "Social",
    time: "12:16 pm",
  },
  {
    id: "search-console",
    sender: "Search Console",
    subject: "Performance insight for Apr 24",
    excerpt: "Maecenas nec leo non justo suscipit consectetur...",
    tag: "Updates",
    time: "Apr 24",
  },
  {
    id: "paypal",
    sender: "Paypal",
    subject: "Payment received – April 30",
    excerpt: "Aliquam ornare consequat quam et consequat ullamcorper...",
    tag: "Billing",
    time: "Apr 30",
  },
  {
    id: "google-meet",
    sender: "Google Meet",
    subject: "Upcoming meeting with Growth Team",
    excerpt: "Suspendisse potenti. Proin tincidunt nisl quis vulputate gravida...",
    tag: "Meetings",
    time: "Apr 16",
  },
  {
    id: "loom",
    sender: "Loom",
    subject: "Weekly highlights and updates",
    excerpt: "Nullam tincidunt sodales diam, non posuere elit dignissim...",
    tag: "Updates",
    time: "Apr 05",
  },
  {
    id: "airbnb",
    sender: "Airbnb",
    subject: "Trip itinerary for May",
    excerpt: "Suspendisse potenti. Proin tincidunt nisl quis vulputate gravida...",
    tag: "Travel",
    time: "Apr 05",
  },
  {
    id: "facebook",
    sender: "Facebook",
    subject: "Campaign performance summary",
    excerpt: "Praesent at rutrum mi. Aenean ex leo non justo suscipit...",
    tag: "Promotional",
    time: "Feb 25",
  },
  {
    id: "instagram",
    sender: "Instagram",
    subject: "March analytics available",
    excerpt: "Nam vestibulum eleifend magna quis porta...",
    tag: "Promotional",
    time: "Feb 20",
  },
];

export const TAG_INTENT_STYLES: Record<string, string> = {
  Important: "bg-red-50 text-red-600 border-red-200",
  Social: "bg-emerald-50 text-emerald-600 border-emerald-200",
  Promotional: "bg-sky-50 text-sky-600 border-sky-200",
  Billing: "bg-amber-50 text-amber-600 border-amber-200",
  Meetings: "bg-purple-50 text-purple-600 border-purple-200",
  Travel: "bg-rose-50 text-rose-600 border-rose-200",
  Updates: "bg-slate-100 text-slate-600 border-slate-200",
};

interface EmailSidebarProps {
  activeMailbox?: (typeof MAILBOX_ITEMS)[number]["key"];
}

export function EmailSidebar({ activeMailbox = "inbox" }: EmailSidebarProps) {
  return (
    <aside className="rounded-3xl border border-border/60 bg-white/95 p-6 shadow-sm">
      <Button className="w-full rounded-2xl py-5 text-base font-semibold shadow-theme-sm" size="lg">
        <Mail className="mr-2 h-4 w-4" /> Compose
      </Button>

      <div className="mt-8 space-y-6 text-sm">
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Mailbox</h4>
          <nav className="space-y-1">
            {MAILBOX_ITEMS.map(({ key, label, count, icon: Icon }) => (
              <button
                key={key}
                type="button"
                className={cn(
                  "flex w-full items-center justify-between rounded-xl px-3 py-2 transition",
                  key === activeMailbox
                    ? "bg-primary/10 font-semibold text-primary"
                    : "text-muted-foreground hover:bg-slate-100",
                )}
              >
                <span className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {label}
                </span>
                {count ? <span className="text-xs font-semibold">{count}</span> : null}
              </button>
            ))}
          </nav>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Filter</h4>
          <div className="space-y-2">
            {FILTER_ITEMS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-muted-foreground transition hover:bg-slate-100"
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Label</h4>
          <div className="space-y-2">
            {LABEL_ITEMS.map((item) => (
              <div key={item.key} className="flex items-center justify-between rounded-xl px-3 py-2 text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span className={cn("h-3 w-3 rounded-full", item.color)} />
                  {item.label}
                </div>
                <Tag className="h-4 w-4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}

export const EMAIL_DETAIL = {
  subject: "Growth campaign assets and Q2 launch checklist",
  categoryLabel: "Campaign",
  label: "Promotional" as const,
  sentAt: "April 24, 2025 at 12:16 PM",
  conversationId: "#9082E",
  sender: {
    name: "Material UI Team",
    email: "marketing@material-ui.dev",
    initials: "MU",
  },
  recipients: {
    to: "you",
    cc: "growth@educareer.ai",
  },
  paragraphs: [
    "Hi EduCareer team, We are excited to collaborate on the upcoming launch. Attached you will find the latest brand assets, media plan, and rollout timeline. The creative team has polished the hero illustrations and updated the copy blocks to align with the latest messaging guidelines.",
    "Please review the checklist below and confirm if the content schedule still aligns with your student outreach campaign. We suggest running the teaser sequence two weeks prior to the launch date to increase anticipation and leverage the assistant-driven insights we discussed last time.",
  ],
  checklist: [
    "Review hero video and update captioning for accessibility.",
    "Finalize landing page modules and add AI assistant call-to-action.",
    "Confirm quiz integration tracking snippets across the journey.",
  ],
  closing: ["Warm regards,", "Laura Mitchell", "Growth Strategist, Material UI"],
  attachments: [
    { id: "project-brief", name: "Project-Brief.pdf", size: "2.1 MB" },
    { id: "schedule", name: "Updated-Schedule.xlsx", size: "485 KB" },
    { id: "assets", name: "Brand-Assets.zip", size: "9.4 MB" },
  ] as const,
  timeline: [
    { id: "today", label: "Today", description: "Quick reminder sent", time: "09:45 AM" },
    { id: "yesterday", label: "Yesterday", description: "Reviewed the shared assets", time: "04:12 PM" },
    { id: "monday", label: "Mon, Apr 22", description: "Initial proposal shared", time: "11:02 AM" },
  ] as const,
};
