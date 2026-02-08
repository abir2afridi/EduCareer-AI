import type { SVGProps } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  Box,
  CalendarDays,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  LineChart,
  ListChecks,
  Mail,
  MessageSquareText,
  NotebookTabs,
  PieChart,
  Plug,
  TrendingUp,
  UserCircle2,
  UsersRound,
} from "lucide-react";

export function ArrowDownIcon(props: SVGProps<SVGSVGElement>) {
  return <ArrowDownRight strokeWidth={1.8} {...props} />;
}

export function ArrowRightIcon(props: SVGProps<SVGSVGElement>) {
  return <ArrowRight strokeWidth={1.8} {...props} />;
}

export function BoxCubeIcon(props: SVGProps<SVGSVGElement>) {
  return <Box strokeWidth={1.8} {...props} />;
}

export function CalenderIcon(props: SVGProps<SVGSVGElement>) {
  return <CalendarDays strokeWidth={1.8} {...props} />;
}

export function ChartIcon(props: SVGProps<SVGSVGElement>) {
  return <TrendingUp strokeWidth={1.8} {...props} />;
}

export function ChatIcon(props: SVGProps<SVGSVGElement>) {
  return <MessageSquareText strokeWidth={1.8} {...props} />;
}

export function DocsIcon(props: SVGProps<SVGSVGElement>) {
  return <FileText strokeWidth={1.8} {...props} />;
}

export function GridIcon(props: SVGProps<SVGSVGElement>) {
  return <LayoutDashboard strokeWidth={1.8} {...props} />;
}

export function GroupIcon(props: SVGProps<SVGSVGElement>) {
  return <UsersRound strokeWidth={1.8} {...props} />;
}

export function ListIcon(props: SVGProps<SVGSVGElement>) {
  return <ListChecks strokeWidth={1.8} {...props} />;
}

export function MailIcon(props: SVGProps<SVGSVGElement>) {
  return <Mail strokeWidth={1.8} {...props} />;
}

export function PageIcon(props: SVGProps<SVGSVGElement>) {
  return <NotebookTabs strokeWidth={1.8} {...props} />;
}

export function PieChartIcon(props: SVGProps<SVGSVGElement>) {
  return <PieChart strokeWidth={1.8} {...props} />;
}

export function PlugInIcon(props: SVGProps<SVGSVGElement>) {
  return <Plug strokeWidth={1.8} {...props} />;
}

export function TaskIcon(props: SVGProps<SVGSVGElement>) {
  return <ClipboardCheck strokeWidth={1.8} {...props} />;
}

export function UserCircleIcon(props: SVGProps<SVGSVGElement>) {
  return <UserCircle2 strokeWidth={1.8} {...props} />;
}

export function AnalyticsIcon(props: SVGProps<SVGSVGElement>) {
  return <LineChart strokeWidth={1.8} {...props} />;
}

export function SidebarOpenIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0.583 1c0-.414.336-.75.75-.75h13.334c.414 0 .75.336.75.75s-.336.75-.75.75H1.333a.75.75 0 0 1-.75-.75Zm0 10c0-.414.336-.75.75-.75h13.334c.414 0 .75.336.75.75s-.336.75-.75.75H1.333a.75.75 0 0 1-.75-.75Zm.75-5.75a.75.75 0 0 0 0 1.5h6.667a.75.75 0 0 0 0-1.5H1.333Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function SidebarCloseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6.22 7.281a.75.75 0 0 1 1.06-1.06L12 10.94l4.719-4.718a.75.75 0 0 1 1.061 1.06L13.06 12l4.72 4.719a.75.75 0 0 1-1.061 1.06L12 13.061l-4.719 4.719a.75.75 0 0 1-1.06-1.06L10.939 12 6.22 7.281Z"
        fill="currentColor"
      />
    </svg>
  );
}
