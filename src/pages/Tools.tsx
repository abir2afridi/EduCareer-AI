import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExternalLink, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ToolRecord } from "@/data/tools";
import { listenToPublishedTools } from "@/lib/firebaseHelpers";
import { useNavigate } from "react-router-dom";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export default function Tools() {
  const navigate = useNavigate();
  const [tools, setTools] = useState<ToolRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  useEffect(() => {
    const unsubscribe = listenToPublishedTools(
      (records) => {
        setTools(records);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        setIsLoading(false);
        setError(err.message);
      },
    );

    return () => unsubscribe();
  }, []);

  const sortedTools = useMemo(() => {
    return [...tools].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [tools]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    tools.forEach((tool) => {
      if (tool.category) set.add(tool.category);
    });
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [tools]);

  const filteredTools = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sortedTools.filter((tool) => {
      if (categoryFilter !== "all" && tool.category !== categoryFilter) return false;
      if (!q) return true;
      const haystack = `${tool.name} ${tool.description} ${tool.url} ${tool.category ?? ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [categoryFilter, search, sortedTools]);

  const handleViewTool = (tool: ToolRecord) => {
    navigate(`/dashboard/tools/${tool.id}`);
  };

  return (
    <div className="space-y-6">
      <Card className="glass overflow-hidden border border-blue-600/20 bg-gradient-to-r from-blue-700 to-blue-600 text-white">
        <CardHeader className="text-white">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="hidden h-32 w-32 shrink-0 rounded-3xl bg-slate-900/80 p-2 shadow-lg md:block">
                <DotLottieReact
                  src="https://lottie.host/98bb4772-4546-4c4f-b11d-3f18868cbcd2/tnTEWEGUS9.lottie"
                  loop
                  autoplay
                />
              </div>
              <div>
                <CardTitle className="text-white">Tools</CardTitle>
                <CardDescription className="text-white/80">
                  Useful websites published by admins for your learning and productivity.
                </CardDescription>
              </div>
            </div>
            <Badge variant="secondary" className="w-fit rounded-full px-3 text-blue-900">
              {filteredTools.length} available
            </Badge>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_420px] lg:items-center">
            <div className="max-w-xl">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tools (name, info, link...)"
                className="rounded-xl border-white/20 bg-white/10 text-white placeholder:text-white/60 focus-visible:ring-white/30"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full rounded-xl border-white/20 bg-white/10 text-white md:min-w-[220px]">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat === "all" ? "All Categories" : cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.slice(0, 8).map((cat) => (
              <Button
                key={cat}
                type="button"
                size="sm"
                variant={categoryFilter === cat ? "default" : "outline"}
                className="rounded-full whitespace-nowrap border-white/20 bg-white/10 text-white hover:bg-white/20"
                onClick={() => setCategoryFilter(cat)}
              >
                {cat === "all" ? "All" : cat}
              </Button>
            ))}
          </div>
        </CardHeader>
      </Card>

      <Card className="glass">
        <CardContent className="p-0">
          <div className="rounded-3xl bg-blue-600/5 dark:bg-blue-500/5">
            <ScrollArea className="h-[calc(100vh-360px)] min-h-[420px]">
            {isLoading && (
              <div className="py-12 text-center text-muted-foreground">
                <Loader2 className="mx-auto h-6 w-6 animate-spin" />
              </div>
            )}

            {!isLoading && error && (
              <div className="py-12 text-center text-destructive">Unable to load tools. {error}</div>
            )}

            {!isLoading && !error && filteredTools.length === 0 && (
              <div className="py-14 text-center text-sm text-muted-foreground">
                No tools have been published yet.
              </div>
            )}

            <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredTools.map((tool) => (
                <Card
                  key={tool.id}
                  className="flex h-full flex-col overflow-hidden border border-border/60 bg-background/90 transition hover:border-primary/40"
                >
                  {tool.bannerUrl ? (
                    <div className="h-24 w-full overflow-hidden bg-muted">
                      <img src={tool.bannerUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                    </div>
                  ) : null}

                  <CardHeader className="space-y-3">
                    <div className="flex items-center gap-3">
                      {tool.logoUrl ? (
                        <img
                          src={tool.logoUrl}
                          alt=""
                          className="h-10 w-10 rounded-xl border border-border/60 bg-white object-contain p-1"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-muted text-xs font-semibold text-muted-foreground">
                          {tool.name?.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <CardTitle className="truncate text-base">{tool.name}</CardTitle>
                        {tool.category ? (
                          <Badge variant="secondary" className="mt-1 w-fit rounded-full px-2">
                            {tool.category}
                          </Badge>
                        ) : null}
                        <div className="mt-1 line-clamp-1 break-all text-xs font-medium text-primary">
                          {tool.url}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="flex flex-1 flex-col gap-4 pb-6">
                    <CardDescription className="line-clamp-3">{tool.description || "—"}</CardDescription>
                    <Button
                      type="button"
                      className="mt-auto w-full rounded-xl"
                      variant="secondary"
                      onClick={() => handleViewTool(tool)}
                    >
                      View details
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
