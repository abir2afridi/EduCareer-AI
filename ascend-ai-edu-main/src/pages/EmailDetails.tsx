import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Reply, 
  ReplyAll, 
  Forward, 
  Archive, 
  Trash2, 
  Printer, 
  Download, 
  Star, 
  ChevronLeft,
  Clock,
  Tag as TagIcon,
  MoreVertical,
  FileText,
  FileSpreadsheet,
  FileArchive
} from "lucide-react";
import { EmailSidebar } from "./email/shared";

const attachments = [
  { 
    id: "project-brief", 
    name: "Project-Brief.pdf", 
    size: "2.1 MB",
    type: "pdf"
  },
  { 
    id: "schedule", 
    name: "Updated-Schedule.xlsx", 
    size: "485 KB",
    type: "sheet"
  },
  { 
    id: "assets", 
    name: "Brand-Assets.zip", 
    size: "9.4 MB",
    type: "zip"
  },
];

const emailContent = {
  subject: "Growth campaign assets and Q2 launch checklist",
  category: "Campaign",
  tag: "Promotional",
  date: "April 24, 2025 at 12:16 PM",
  conversationId: "#9082E",
  sender: {
    name: "Material UI Team",
    email: "marketing@material-ui.dev",
    initials: "MU",
    avatar: "/avatars/avatar-1.jpg"
  },
  recipients: {
    to: "you",
    cc: "growth@educareer.ai"
  },
  body: [
    "Hi EduCareer team,",
    "We are excited to collaborate on the upcoming launch. Attached you will find the latest brand assets, media plan, and rollout timeline. The creative team has polished the hero illustrations and updated the copy blocks to align with the latest messaging guidelines.",
    "Please review the checklist below and confirm if the content schedule still aligns with your student outreach campaign. We suggest running the teaser sequence two weeks prior to the launch date to increase anticipation and leverage the assistant-driven insights we discussed last time.",
  ],
  checklist: [
    "Review hero video and update captioning for accessibility.",
    "Finalize landing page modules and add AI assistant call-to-action.",
    "Confirm quiz integration tracking snippets across the journey."
  ],
  closing: [
    "Let us know if you want to iterate on the design direction before we lock the animation storyboard. We are ready to jump on a call to walk through the updates. Looking forward to your feedback!",
    "Warm regards,",
    "Laura Mitchell",
    "Growth Strategist, Material UI"
  ]
};

const timeline = [
  { 
    id: "today", 
    label: "Today", 
    description: "Quick reminder sent", 
    time: "09:45 AM",
    active: true
  },
  { 
    id: "yesterday", 
    label: "Yesterday", 
    description: "Reviewed the shared assets", 
    time: "04:12 PM",
    active: false
  },
  { 
    id: "monday", 
    label: "Mon, Apr 22", 
    description: "Initial proposal shared", 
    time: "11:02 AM",
    active: false
  },
];

const getFileIcon = (type: string) => {
  switch (type) {
    case 'pdf':
      return <FileText className="h-5 w-5 text-primary" />;
    case 'sheet':
      return <FileSpreadsheet className="h-5 w-5 text-emerald-500" />;
    case 'zip':
      return <FileArchive className="h-5 w-5 text-amber-500" />;
    default:
      return <FileText className="h-5 w-5 text-gray-400" />;
  }
};

export default function EmailDetails() {
  const navigate = useNavigate();
  
  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-10 w-10 rounded-lg border-stroke p-0 hover:bg-primary/5 hover:text-primary dark:border-strokedark dark:bg-meta-4 dark:hover:bg-meta-4/80"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-xl font-bold text-black dark:text-white">Email Details</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-10 rounded-lg border-stroke px-4 text-sm font-medium hover:bg-primary/5 hover:text-primary dark:border-strokedark dark:bg-meta-4 dark:hover:bg-meta-4/80"
          >
            <Archive className="mr-2 h-4 w-4" />
            Archive
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-10 rounded-lg border-stroke px-4 text-sm font-medium text-danger hover:bg-danger/5 hover:text-danger dark:border-strokedark dark:bg-meta-4 dark:hover:bg-danger/20"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-10 w-10 rounded-lg border-stroke p-0 hover:bg-primary/5 hover:text-primary dark:border-strokedark dark:bg-meta-4 dark:hover:bg-meta-4/80"
          >
            <Printer className="h-5 w-5" />
          </Button>
          <div className="relative">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-10 w-10 rounded-lg border-stroke p-0 hover:bg-primary/5 hover:text-primary dark:border-strokedark dark:bg-meta-4 dark:hover:bg-meta-4/80"
            >
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)_320px]">
        <div className="">
          <EmailSidebar />
        </div>
        <section className="overflow-hidden rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="border-b border-stroke p-6 dark:border-strokedark">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary dark:bg-primary/20">
                    {emailContent.tag}
                  </span>
                  <span className="text-xs font-medium uppercase tracking-wider text-bodydark2">
                    {emailContent.category}
                  </span>
                </div>
                <h1 className="mb-2 text-2xl font-bold text-black dark:text-white">
                  {emailContent.subject}
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-sm text-bodydark2">
                  <span>Sent on {emailContent.date}</span>
                  <span className="h-1 w-1 rounded-full bg-bodydark"></span>
                  <span>Conversation ID {emailContent.conversationId}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-10 rounded-lg border-stroke px-4 text-sm font-medium hover:bg-primary/5 hover:text-primary dark:border-strokedark dark:bg-meta-4 dark:hover:bg-meta-4/80"
                >
                  <Reply className="mr-2 h-4 w-4" />
                  Reply
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-10 w-10 rounded-lg border-stroke p-0 hover:bg-primary/5 hover:text-primary dark:border-strokedark dark:bg-meta-4 dark:hover:bg-meta-4/80"
                >
                  <ReplyAll className="h-5 w-5" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-10 w-10 rounded-lg border-stroke p-0 hover:bg-primary/5 hover:text-primary dark:border-strokedark dark:bg-meta-4 dark:hover:bg-meta-4/80"
                >
                  <Forward className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-start">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 text-center text-xl font-bold leading-[48px] text-primary">
                  {emailContent.sender.initials}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-medium text-black dark:text-white">{emailContent.sender.name}</h3>
                    <span className="text-sm text-bodydark2">&lt;{emailContent.sender.email}&gt;</span>
                  </div>
                  <div className="mt-1 space-y-1 text-sm text-bodydark2">
                    <p>To: <span className="font-medium text-black dark:text-white">{emailContent.recipients.to}</span></p>
                    {emailContent.recipients.cc && (
                      <p>Cc: <span className="font-medium text-black dark:text-white">{emailContent.recipients.cc}</span></p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <div className="inline-flex overflow-hidden rounded-lg border border-stroke dark:border-strokedark">
                  <button className="flex items-center gap-1.5 border-r border-stroke bg-gray-2 px-4 py-2 text-sm font-medium text-body hover:bg-gray-3 dark:border-strokedark dark:bg-meta-4 dark:text-bodydark2 dark:hover:bg-meta-4/80">
                    <Star className="h-4 w-4 text-amber-400" />
                    <span>Star</span>
                  </button>
                  <button className="flex items-center gap-1.5 border-r border-stroke bg-gray-2 px-4 py-2 text-sm font-medium text-body hover:bg-gray-3 dark:border-strokedark dark:bg-meta-4 dark:text-bodydark2 dark:hover:bg-meta-4/80">
                    <Clock className="h-4 w-4" />
                    <span>Mark as unread</span>
                  </button>
                  <button className="flex items-center gap-1.5 bg-gray-2 px-4 py-2 text-sm font-medium text-body hover:bg-gray-3 dark:bg-meta-4 dark:text-bodydark2 dark:hover:bg-meta-4/80">
                    <TagIcon className="h-4 w-4" />
                    <span>Labels</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="prose max-w-none dark:prose-invert">
              <div className="space-y-4 text-base leading-relaxed text-body dark:text-bodydark">
                {emailContent.body.map((paragraph, index) => (
                  <p key={index} className="text-justify">{paragraph}</p>
                ))}
                
                <ul className="space-y-3 pl-6">
                  {emailContent.checklist.map((item, index) => (
                    <li key={index} className="relative pl-5">
                      <span className="absolute left-0 top-2.5 h-2 w-2 rounded-full bg-primary"></span>
                      {item}
                    </li>
                  ))}
                </ul>
                
                <div className="space-y-4 pt-4">
                  {emailContent.closing.map((line, index) => (
                    <p 
                      key={index} 
                      className={index === 0 ? "pt-4" : index === 1 ? "font-medium text-black dark:text-white" : ""}
                    >
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-10 border-t border-stroke pt-6 dark:border-strokedark">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-base font-medium text-black dark:text-white">Attachments ({attachments.length})</h3>
                <button className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80">
                  <Download className="h-4 w-4" />
                  <span>Download all</span>
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {attachments.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between rounded-lg border border-stroke bg-gray p-4 transition hover:border-primary hover:bg-primary/5 dark:border-strokedark dark:bg-boxdark-2 dark:hover:border-primary"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-md bg-white dark:bg-meta-4">
                        {getFileIcon(file.type)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-black dark:text-white">{file.name}</p>
                        <p className="text-xs text-bodydark2">{file.size}</p>
                      </div>
                    </div>
                    <button className="ml-2 rounded-md p-1.5 text-body hover:bg-gray-2 hover:text-primary dark:text-bodydark dark:hover:bg-meta-4/50">
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-base font-medium text-black dark:text-white">Activity</h3>
              <button className="text-sm font-medium text-primary hover:text-primary/80">
                View history
              </button>
            </div>
            
            <div className="space-y-6">
              {timeline.map((item) => (
                <div key={item.id} className="relative pl-6">
                  <div className={cn(
                    "absolute left-0 top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white dark:border-boxdark",
                    item.active 
                      ? "bg-primary ring-2 ring-primary/20" 
                      : "bg-gray-300 dark:bg-graydark"
                  )}>
                    {item.active && (
                      <span className="h-1.5 w-1.5 rounded-full bg-white"></span>
                    )}
                  </div>
                  <p className="text-xs font-medium uppercase tracking-wider text-bodydark2">
                    {item.label}
                  </p>
                  <p className="mt-1 text-sm font-medium text-black dark:text-white">
                    {item.description}
                  </p>
                  <p className="mt-1 text-xs text-bodydark2">
                    {item.time}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
            <h3 className="mb-5 text-base font-medium text-black dark:text-white">Email Information</h3>
            <div className="space-y-4 text-sm text-bodydark2">
              <div>
                <p className="mb-1 text-sm font-medium text-black dark:text-white">From</p>
                <p className="text-body dark:text-bodydark">{emailContent.sender.email}</p>
              </div>
              <div>
                <p className="mb-1 text-sm font-medium text-black dark:text-white">To</p>
                <p className="text-body dark:text-bodydark">{emailContent.recipients.to}</p>
              </div>
              {emailContent.recipients.cc && (
                <div>
                  <p className="mb-1 text-sm font-medium text-black dark:text-white">Cc</p>
                  <p className="text-body dark:text-bodydark">{emailContent.recipients.cc}</p>
                </div>
              )}
              <div>
                <p className="mb-1 text-sm font-medium text-black dark:text-white">Date</p>
                <p className="text-body dark:text-bodydark">{emailContent.date}</p>
              </div>
              <div>
                <p className="mb-1 text-sm font-medium text-black dark:text-white">Subject</p>
                <p className="text-body dark:text-bodydark">{emailContent.subject}</p>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-black dark:text-white">Labels</p>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary dark:bg-primary/20">
                    {emailContent.tag}
                  </span>
                  <span className="rounded bg-meta-2/10 px-2.5 py-1 text-xs font-medium text-meta-2 dark:bg-meta-2/20">
                    {emailContent.category}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
