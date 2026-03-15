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
        <CardHeader className="flex flex-row items-center justify-between">
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
        </CardHeader>
      </Card>

      <Card className="glass">
        <CardHeader>
          <CardTitle>Published websites</CardTitle>
          <CardDescription className="text-muted-foreground">Manage the list that appears on the student dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[560px]">
            <div className="divide-y divide-border/60">
              {isLoading && (
                <div className="py-10 text-center text-muted-foreground">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                </div>
              )}

              {!isLoading && loadError && (
                <div className="py-10 text-center text-destructive">Unable to load tools. {loadError}</div>
              )}

              {!isLoading && !loadError && sortedTools.length === 0 && (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No tools added yet. Use "Add Tool" to publish your first useful website.
                </div>
              )}

              {sortedTools.map((tool, index) => (
                <div key={tool.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-base font-semibold text-foreground">{tool.name}</h3>
                      <Badge variant={tool.published ? "default" : "secondary"} className="rounded-full px-3">
                        {tool.published ? "Published" : "Draft"}
                      </Badge>
                      <Badge variant="outline" className="rounded-full px-3">Order {tool.order}</Badge>
                      <Badge variant="outline" className="rounded-full px-3">Clicks {tool.clicksCount ?? 0}</Badge>
                      {tool.category ? (
                        <Badge variant="secondary" className="rounded-full px-3">{tool.category}</Badge>
                      ) : null}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{tool.description || "—"}</p>
                    <a
                      href={tool.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      Visit website <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => swapOrder(tool, "up")}
                      disabled={index === 0}
                      title="Move up"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => swapOrder(tool, "down")}
                      disabled={index === sortedTools.length - 1}
                      title="Move down"
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
                    <Button size="sm" variant="outline" className="rounded-xl" onClick={() => openEditDialog(tool)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button size="sm" variant="destructive" className="rounded-xl" onClick={() => confirmDelete(tool)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
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
