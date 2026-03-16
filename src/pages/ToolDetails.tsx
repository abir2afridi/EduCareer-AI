import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, ExternalLink } from "lucide-react";
import type { ToolRecord } from "@/data/tools";
import { getPublishedToolDoc, incrementToolClick } from "@/lib/firebaseHelpers";

export default function ToolDetailsPage() {
  const navigate = useNavigate();
  const { toolId } = useParams<{ toolId: string }>();

  const [tool, setTool] = useState<ToolRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    void (async () => {
      try {
        const record = await getPublishedToolDoc(toolId ?? "");
        if (!isMounted) return;
        if (!record) {
          setTool(null);
          setError("Tool not found or not published.");
          return;
        }
        setTool(record);
      } catch (err) {
        if (!isMounted) return;
        const message = err instanceof Error ? err.message : "Unable to load tool.";
        setError(message);
      } finally {
        if (!isMounted) return;
        setIsLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [toolId]);

  const handleOpenWebsite = async () => {
    if (!tool) return;
    try {
      await incrementToolClick(tool.id);
    } catch {
      // non-blocking analytics
    }
    window.open(tool.url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" className="rounded-xl" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      <Card className="glass">
        {isLoading ? (
          <div className="py-16 text-center text-muted-foreground">
            <Loader2 className="mx-auto h-6 w-6 animate-spin" />
          </div>
        ) : error ? (
          <div className="py-12 text-center text-destructive">{error}</div>
        ) : tool ? (
          <>
            {tool.bannerUrl ? (
              <div className="h-40 w-full overflow-hidden rounded-t-3xl bg-muted">
                <img src={tool.bannerUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
              </div>
            ) : null}

            <CardHeader className="space-y-3">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-4">
                  {tool.logoUrl ? (
                    <img
                      src={tool.logoUrl}
                      alt=""
                      className="h-14 w-14 rounded-2xl border border-border/60 bg-white object-contain p-2"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border/60 bg-muted text-sm font-semibold text-muted-foreground">
                      {tool.name?.slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0">
                    <CardTitle className="text-xl leading-tight">{tool.name}</CardTitle>
                    <CardDescription className="mt-1 break-all">{tool.url}</CardDescription>
                    {tool.category ? (
                      <Badge variant="secondary" className="mt-2 w-fit rounded-full px-3">
                        {tool.category}
                      </Badge>
                    ) : null}
                  </div>
                </div>

                <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[220px]">
                  <Button type="button" className="rounded-xl" onClick={() => void handleOpenWebsite()}>
                    Open website
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => navigate("/dashboard/tools")}
                  >
                    Back to tools
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-semibold text-foreground">About</div>
                <div className="mt-1 text-sm text-muted-foreground">{tool.description || "—"}</div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                  <div className="text-xs text-muted-foreground">Views</div>
                  <div className="mt-1 text-base font-semibold text-foreground">{tool.clicksCount ?? 0}</div>
                </div>
              </div>
            </CardContent>
          </>
        ) : null}
      </Card>
    </div>
  );
}
