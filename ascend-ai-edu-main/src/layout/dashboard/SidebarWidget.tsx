export default function SidebarWidget() {
  return (
    <div className="mx-auto w-full max-w-[220px] rounded-2xl border border-border/60 bg-gradient-to-br from-brand-50 via-white to-blue-50 p-4 text-center shadow-theme-md dark:from-brand-500/10 dark:via-transparent dark:to-blue-950/20">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Pro Insights</p>
      <h3 className="mt-2 text-base font-semibold text-foreground">Unlock AI dashboards</h3>
      <p className="mt-2 text-xs text-muted-foreground">
        20+ smart widgets, cohort sentiment, and predictive alerts tailored for EduCareer teams.
      </p>
      <a
        href="/analytics"
        className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-theme-sm transition hover:bg-primary/90"
      >
        Explore premium
      </a>
    </div>
  );
}
