import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExternalLink, Loader2 } from "lucide-react";
import type { ToolRecord } from "@/data/tools";
import { incrementToolClick, listenToPublishedTools } from "@/lib/firebaseHelpers";

export default function Tools() {
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

  const handleOpenTool = async (tool: ToolRecord) => {
    try {
      await incrementToolClick(tool.id);
    } catch {
      // Non-blocking analytics
    }
    window.open(tool.url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-6">
      <Card className="glass">
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Tools</CardTitle>
              <CardDescription>
                Useful websites published by admins for your learning and productivity.
              </CardDescription>
            </div>
            <Badge variant="secondary" className="w-fit rounded-full px-3">
              {filteredTools.length} available
            </Badge>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="md:col-span-2">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tools (name, info, link...)"
                className="rounded-xl"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  type="button"
                  size="sm"
                  variant={categoryFilter === cat ? "default" : "outline"}
                  className="rounded-full"
                  onClick={() => setCategoryFilter(cat)}
                >
                  {cat === "all" ? "All" : cat}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="glass">
        <CardContent className="p-0">
          <ScrollArea className="max-h-[640px]">
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
                <Card key={tool.id} className="overflow-hidden border border-border/60 bg-background/90">
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
                        <a
                          href={tool.url}
                          target="_blank"
                          rel="noreferrer"
                          className="truncate text-xs font-medium text-primary hover:underline"
                        >
                          {tool.url}
                        </a>
                      </div>
                    </div>
                    <CardDescription className="line-clamp-3">{tool.description || "—"}</CardDescription>
                  </CardHeader>

                  <CardContent className="pb-6">
                    <Button
                      type="button"
                      className="w-full rounded-xl"
                      variant="secondary"
                      onClick={() => void handleOpenTool(tool)}
                    >
                      Open website
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
