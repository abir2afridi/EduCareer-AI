import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Pencil, Plus, Trash2, ExternalLink, Eye, EyeOff, ArrowUp, ArrowDown } from "lucide-react";
import { emptyToolPayload, type ToolPayload, type ToolRecord } from "@/data/tools";
import { createToolDoc, deleteToolDoc, listenToToolsAdmin, updateToolDoc } from "@/lib/firebaseHelpers";

const normalizeUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

export default function ToolsManagementPage() {
  const { toast } = useToast();
  const [tools, setTools] = useState<ToolRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [publishedFilter, setPublishedFilter] = useState<"all" | "published" | "draft">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<ToolRecord | null>(null);
  const [formState, setFormState] = useState<ToolPayload>(emptyToolPayload);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const unsubscribe = listenToToolsAdmin(
      (records) => {
        setTools(records);
        setIsLoading(false);
        setLoadError(null);
      },
      (error) => {
        setIsLoading(false);
        setLoadError(error.message);
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
      if (publishedFilter === "published" && !tool.published) return false;
      if (publishedFilter === "draft" && tool.published) return false;
      if (categoryFilter !== "all" && (tool.category ?? "") !== categoryFilter) return false;
      if (!q) return true;
      const haystack = `${tool.name} ${tool.description} ${tool.url} ${tool.category ?? ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [categoryFilter, publishedFilter, search, sortedTools]);

  const openAddDialog = () => {
    setActiveTool(null);
    setFormState({ ...emptyToolPayload, order: sortedTools.length });
    setIsDialogOpen(true);
  };

  const openEditDialog = (tool: ToolRecord) => {
    setActiveTool(tool);
    setFormState({
      name: tool.name ?? "",
      url: tool.url ?? "",
      description: tool.description ?? "",
      category: tool.category ?? "",
      logoUrl: tool.logoUrl ?? "",
      bannerUrl: tool.bannerUrl ?? "",
      published: Boolean(tool.published),
      order: typeof tool.order === "number" ? tool.order : 0,
    });
    setIsDialogOpen(true);
  };

  const handleInputChange = (field: keyof ToolPayload, value: string | number | boolean) => {
    setFormState((prev) => ({ ...prev, [field]: value } as ToolPayload));
  };

  const handleSubmit = async () => {
    if (!formState.name.trim() || !formState.url.trim()) {
      toast({ title: "Missing fields", description: "Website name and link are required.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: ToolPayload = {
        ...formState,
        name: formState.name.trim(),
        url: normalizeUrl(formState.url),
        description: formState.description.trim(),
        logoUrl: formState.logoUrl?.trim() || "",
        bannerUrl: formState.bannerUrl?.trim() || "",
        order: Number.isFinite(formState.order) ? Number(formState.order) : 0,
      };

      if (activeTool) {
        await updateToolDoc(activeTool.id, payload);
        toast({ title: "Tool updated", description: `${payload.name} has been updated.` });
      } else {
        await createToolDoc(payload);
        toast({ title: "Tool added", description: `${payload.name} has been added.` });
      }

      setIsDialogOpen(false);
      setActiveTool(null);
      setFormState(emptyToolPayload);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong.";
      toast({ title: "Action failed", description: message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = (tool: ToolRecord) => {
    setActiveTool(tool);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!activeTool) return;
    setIsDeleting(true);
    try {
      await deleteToolDoc(activeTool.id);
      toast({ title: "Tool deleted", description: `${activeTool.name} has been removed.` });
      setIsDeleteDialogOpen(false);
      setActiveTool(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to delete tool.";
      toast({ title: "Delete failed", description: message, variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  const togglePublished = async (tool: ToolRecord) => {
    try {
      await updateToolDoc(tool.id, { published: !tool.published });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update tool.";
      toast({ title: "Update failed", description: message, variant: "destructive" });
    }
  };

  const swapOrder = async (tool: ToolRecord, direction: "up" | "down") => {
    const currentIndex = sortedTools.findIndex((entry) => entry.id === tool.id);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= sortedTools.length) return;

    const target = sortedTools[targetIndex];
    try {
      await Promise.all([
        updateToolDoc(tool.id, { order: target.order }),
        updateToolDoc(target.id, { order: tool.order }),
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to reorder tools.";
      toast({ title: "Reorder failed", description: message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="glass">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Tools</CardTitle>
              <CardDescription>Publish useful websites so students can access them from their dashboard.</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-xl px-4" onClick={openAddDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Tool
                </Button>
              </DialogTrigger>
              <DialogContent className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border/60 bg-background/95 text-foreground backdrop-blur-xl dark:bg-slate-950/90">
                <DialogHeader>
                  <DialogTitle>{activeTool ? "Edit tool" : "Add new tool"}</DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    Provide website details. Students can view only published tools.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="tool-name">Website name</Label>
                      <Input
                        id="tool-name"
                        value={formState.name}
                        onChange={(event) => handleInputChange("name", event.target.value)}
                        placeholder="Khan Academy"
                        className="rounded-xl border border-border/60 bg-background/80 dark:bg-slate-900/60"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="tool-url">Website link</Label>
                      <Input
                        id="tool-url"
                        value={formState.url}
                        onChange={(event) => handleInputChange("url", event.target.value)}
                        placeholder="https://"
                        className="rounded-xl border border-border/60 bg-background/80 dark:bg-slate-900/60"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="tool-category">Category (optional)</Label>
                    <Input
                      id="tool-category"
                      value={formState.category ?? ""}
                      onChange={(event) => handleInputChange("category", event.target.value)}
                      placeholder="Admissions, Math, Programming"
                      className="rounded-xl border border-border/60 bg-background/80 dark:bg-slate-900/60"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="tool-description">Information</Label>
                    <Textarea
                      id="tool-description"
                      value={formState.description}
                      onChange={(event) => handleInputChange("description", event.target.value)}
                      placeholder="Why this tool is useful for students"
                      className="min-h-[100px] rounded-xl border border-border/60 bg-background/80 dark:bg-slate-900/60"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="tool-logo">Logo URL (optional)</Label>
                      <Input
                        id="tool-logo"
                        value={formState.logoUrl ?? ""}
                        onChange={(event) => handleInputChange("logoUrl", event.target.value)}
                        placeholder="https://"
                        className="rounded-xl border border-border/60 bg-background/80 dark:bg-slate-900/60"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="tool-banner">Banner URL (optional)</Label>
                      <Input
                        id="tool-banner"
                        value={formState.bannerUrl ?? ""}
                        onChange={(event) => handleInputChange("bannerUrl", event.target.value)}
                        placeholder="https://"
                        className="rounded-xl border border-border/60 bg-background/80 dark:bg-slate-900/60"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="tool-order">Sort order</Label>
                      <Input
                        id="tool-order"
                        type="number"
                        min={0}
                        step={1}
                        value={formState.order}
                        onChange={(event) => handleInputChange("order", Number(event.target.value))}
                        className="rounded-xl border border-border/60 bg-background/80 dark:bg-slate-900/60"
                      />
                    </div>
                    <div className="flex items-end gap-3">
                      <Button
                        type="button"
                        variant={formState.published ? "default" : "outline"}
                        className="rounded-xl"
                        onClick={() => handleInputChange("published", !formState.published)}
                      >
                        {formState.published ? (
                          <>
                            <Eye className="mr-2 h-4 w-4" /> Published
                          </>
                        ) : (
                          <>
                            <EyeOff className="mr-2 h-4 w-4" /> Draft
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" className="rounded-xl" onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {activeTool ? "Update" : "Save"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="md:col-span-2">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search tools (name, info, link...)"
                className="rounded-xl"
              />
            </div>
            <div className="flex flex-wrap items-center justify-start gap-2 md:justify-end">
              <Button
                type="button"
                size="sm"
                variant={publishedFilter === "all" ? "default" : "outline"}
                className="rounded-full"
                onClick={() => setPublishedFilter("all")}
              >
                All
              </Button>
              <Button
                type="button"
                size="sm"
                variant={publishedFilter === "published" ? "default" : "outline"}
                className="rounded-full"
                onClick={() => setPublishedFilter("published")}
              >
                Published
              </Button>
              <Button
                type="button"
                size="sm"
                variant={publishedFilter === "draft" ? "default" : "outline"}
                className="rounded-full"
                onClick={() => setPublishedFilter("draft")}
              >
                Draft
              </Button>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <Button
                key={cat}
                type="button"
                size="sm"
                variant={categoryFilter === cat ? "default" : "outline"}
                className="rounded-full whitespace-nowrap"
                onClick={() => setCategoryFilter(cat)}
              >
                {cat === "all" ? "All Categories" : cat}
              </Button>
            ))}
          </div>
        </CardHeader>
      </Card>

      <Card className="glass">
        <CardHeader>
          <CardTitle>Published websites</CardTitle>
          <CardDescription className="text-muted-foreground">Manage the list that appears on the student dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-360px)] min-h-[420px]">
            <div className="p-4">
              {isLoading ? (
                <div className="py-10 text-center text-muted-foreground">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                </div>
              ) : null}

              {!isLoading && loadError ? (
                <div className="py-10 text-center text-destructive">Unable to load tools. {loadError}</div>
              ) : null}

              {!isLoading && !loadError && filteredTools.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No tools match your search/filters.
                </div>
              ) : null}

              {!isLoading && !loadError && filteredTools.length > 0 ? (
                <div className="rounded-2xl border border-border/60 bg-background/70">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[320px]">Tool</TableHead>
                        <TableHead className="hidden lg:table-cell">Category</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Order</TableHead>
                        <TableHead className="text-right">Clicks</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTools.map((tool, index) => {
                        const disableReorder =
                          search.trim().length > 0 || publishedFilter !== "all" || categoryFilter !== "all";

                        return (
                          <TableRow key={tool.id}>
                            <TableCell>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <div className="min-w-0">
                                    <div className="truncate font-semibold text-foreground">{tool.name}</div>
                                    <a
                                      href={tool.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1 truncate text-xs font-medium text-primary hover:underline"
                                    >
                                      {tool.url}
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  </div>
                                </div>
                                <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{tool.description || "—"}</div>
                                {tool.category ? (
                                  <div className="mt-2 lg:hidden">
                                    <Badge variant="secondary" className="rounded-full px-3">{tool.category}</Badge>
                                  </div>
                                ) : null}
                              </div>
                            </TableCell>

                            <TableCell className="hidden lg:table-cell">
                              {tool.category ? (
                                <Badge variant="secondary" className="rounded-full px-3">{tool.category}</Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>

                            <TableCell>
                              <Badge variant={tool.published ? "default" : "secondary"} className="rounded-full px-3">
                                {tool.published ? "Published" : "Draft"}
                              </Badge>
                            </TableCell>

                            <TableCell className="text-right">
                              <span className="text-sm font-medium text-foreground">{tool.order}</span>
                            </TableCell>

                            <TableCell className="text-right">
                              <span className="text-sm font-medium text-foreground">{tool.clicksCount ?? 0}</span>
                            </TableCell>

                            <TableCell className="text-right">
                              <div className="flex flex-wrap justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="rounded-xl"
                                  onClick={() => swapOrder(tool, "up")}
                                  disabled={disableReorder || index === 0}
                                  title={disableReorder ? "Clear filters to reorder" : "Move up"}
                                >
                                  <ArrowUp className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="rounded-xl"
                                  onClick={() => swapOrder(tool, "down")}
                                  disabled={disableReorder || index === filteredTools.length - 1}
                                  title={disableReorder ? "Clear filters to reorder" : "Move down"}
                                >
                                  <ArrowDown className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="rounded-xl"
                                  onClick={() => togglePublished(tool)}
                                >
                                  {tool.published ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                                  {tool.published ? "Unpublish" : "Publish"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="rounded-xl"
                                  onClick={() => openEditDialog(tool)}
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="rounded-xl"
                                  onClick={() => confirmDelete(tool)}
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : null}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="rounded-3xl border border-border/60 bg-background/95 text-foreground backdrop-blur-xl dark:bg-slate-950/90">
          <DialogHeader>
            <DialogTitle>Delete tool</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <div className="py-4 text-sm text-muted-foreground">
            {activeTool ? `Delete ${activeTool.name}?` : "Delete this tool?"}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
