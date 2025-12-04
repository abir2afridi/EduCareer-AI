import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  CourseTopic,
  createEmptyColumn,
  createEmptyRow,
  createEmptyTopic,
  createRandomId,
} from "@/utils/courseBuilder";
import { GripVertical, Plus, Trash2 } from "lucide-react";

interface CourseListBuilderProps {
  topics: CourseTopic[];
  onChange: (value: CourseTopic[]) => void;
}

export function CourseListBuilder({ topics, onChange }: CourseListBuilderProps) {
  const [dragState, setDragState] = useState<{ type: "column" | "row"; topicId: string; id: string } | null>(null);

  const updateTopic = (topicId: string, updater: (topic: CourseTopic) => CourseTopic) => {
    onChange(
      topics.map((topic) => {
        if (topic.id !== topicId) return topic;
        return updater(topic);
      }),
    );
  };

  const addTopic = () => {
    onChange([...topics, createEmptyTopic(`Topic ${topics.length + 1}`)]);
  };

  const handleTopicNameChange = (topicId: string, name: string) => {
    updateTopic(topicId, (topic) => ({ ...topic, name }));
  };

  const handleAddColumn = (topic: CourseTopic) => {
    const newColumn = createEmptyColumn(`Column ${topic.columns.length + 1}`);
    updateTopic(topic.id, (current) => ({
      ...current,
      columns: [...current.columns, newColumn],
      rows: current.rows.map((row) => ({
        ...row,
        courses: [...row.courses, { id: createRandomId(), columnId: newColumn.id, name: "" }],
      })),
    }));
  };

  const handleAddRow = (topic: CourseTopic) => {
    const columnIds = topic.columns.map((column) => column.id);
    updateTopic(topic.id, (current) => ({ ...current, rows: [...current.rows, createEmptyRow(columnIds)] }));
  };

  const handleRemoveColumn = (topicId: string, columnId: string) => {
    updateTopic(topicId, (topic) => {
      if (topic.columns.length <= 1) return topic;
      return {
        ...topic,
        columns: topic.columns.filter((column) => column.id !== columnId),
        rows: topic.rows.map((row) => ({
          ...row,
          courses: row.courses.filter((course) => course.columnId !== columnId),
        })),
      };
    });
  };

  const handleRemoveRow = (topicId: string, rowId: string) => {
    updateTopic(topicId, (topic) => {
      if (topic.rows.length <= 1) return topic;
      return {
        ...topic,
        rows: topic.rows.filter((row) => row.id !== rowId),
      };
    });
  };

  const handleCourseChange = (topicId: string, rowId: string, columnId: string, value: string) => {
    updateTopic(topicId, (topic) => ({
      ...topic,
      rows: topic.rows.map((row) => {
        if (row.id !== rowId) return row;
        return {
          ...row,
          courses: row.courses.map((course) => (course.columnId === columnId ? { ...course, name: value } : course)),
        };
      }),
    }));
  };

  const handleRowTitleChange = (topicId: string, rowId: string, value: string) => {
    updateTopic(topicId, (topic) => ({
      ...topic,
      rows: topic.rows.map((row) => (row.id === rowId ? { ...row, title: value } : row)),
    }));
  };

  const handleColumnTitleChange = (topicId: string, columnId: string, value: string) => {
    updateTopic(topicId, (topic) => ({
      ...topic,
      columns: topic.columns.map((column) => (column.id === columnId ? { ...column, title: value } : column)),
    }));
  };

  const beginDrag = (payload: { type: "column" | "row"; topicId: string; id: string }) => {
    setDragState(payload);
  };

  const reorderWithinTopic = (topicId: string, targetId: string) => {
    if (!dragState || dragState.topicId !== topicId || dragState.id === targetId) return;
    updateTopic(topicId, (topic) => {
      if (dragState.type === "column") {
        const order = [...topic.columns];
        const sourceIndex = order.findIndex((column) => column.id === dragState.id);
        const targetIndex = order.findIndex((column) => column.id === targetId);
        if (sourceIndex === -1 || targetIndex === -1) return topic;
        order.splice(targetIndex, 0, order.splice(sourceIndex, 1)[0]);
        const columnOrder = order.map((column) => column.id);
        return {
          ...topic,
          columns: order,
          rows: topic.rows.map((row) => ({
            ...row,
            courses: columnOrder.map((columnId) => {
              const existing = row.courses.find((course) => course.columnId === columnId);
              return (
                existing ?? {
                  id: createRandomId(),
                  columnId,
                  name: "",
                }
              );
            }),
          })),
        };
      }

      const order = [...topic.rows];
      const sourceIndex = order.findIndex((row) => row.id === dragState.id);
      const targetIndex = order.findIndex((row) => row.id === targetId);
      if (sourceIndex === -1 || targetIndex === -1) return topic;
      order.splice(targetIndex, 0, order.splice(sourceIndex, 1)[0]);
      return { ...topic, rows: order };
    });
    setDragState(null);
  };

  const handleRemoveTopic = (topicId: string) => {
    if (topics.length <= 1) return;
    onChange(topics.filter((topic) => topic.id !== topicId));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Organize topics, rows, and columns. Drag headers or row handles to reorder.</p>
        </div>
        <Button onClick={addTopic} size="sm" variant="outline" className="gap-2">
          <Plus className="h-4 w-4" /> Add Topic
        </Button>
      </div>

      {topics.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
          No topics yet. Add your first topic to begin.
        </div>
      ) : (
        <div className="space-y-6">
          {topics.map((topic) => (
            <div key={topic.id} className="space-y-4 rounded-3xl border border-border/60 bg-white/80 p-5 shadow-sm dark:bg-slate-950/60">
              <div className="flex flex-wrap items-center gap-3">
                <Input
                  value={topic.name}
                  onChange={(event) => handleTopicNameChange(topic.id, event.target.value)}
                  placeholder="Topic name"
                  className="flex-1"
                />
                <Badge variant="outline" className="rounded-2xl border-dashed px-3 py-1 text-xs">
                  {topic.rows.length} rows · {topic.columns.length} columns
                </Badge>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => handleRemoveTopic(topic.id)}
                  disabled={topics.length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="w-48 min-w-[12rem] rounded-l-2xl bg-muted/60 p-2 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        Row title
                      </th>
                      {topic.columns.map((column) => (
                        <th
                          key={column.id}
                          draggable
                          onDragStart={() => beginDrag({ type: "column", topicId: topic.id, id: column.id })}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={(event) => {
                            event.preventDefault();
                            reorderWithinTopic(topic.id, column.id);
                          }}
                          className={cn(
                            "min-w-[12rem] bg-muted/60 p-2 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground",
                            column.id === topic.columns[topic.columns.length - 1]?.id && "rounded-r-2xl",
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                            <Input
                              value={column.title}
                              onChange={(event) => handleColumnTitleChange(topic.id, column.id, event.target.value)}
                              className="bg-white/80 text-xs"
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-muted-foreground"
                              onClick={() => handleRemoveColumn(topic.id, column.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </th>
                      ))}
                      <th className="w-32 text-center">
                        <Button size="sm" variant="ghost" onClick={() => handleAddColumn(topic)} className="gap-2">
                          <Plus className="h-4 w-4" /> Column
                        </Button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {topic.rows.map((row) => (
                      <tr key={row.id} className="border-b border-border/40 last:border-0">
                        <td
                          draggable
                          onDragStart={() => beginDrag({ type: "row", topicId: topic.id, id: row.id })}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={(event) => {
                            event.preventDefault();
                            reorderWithinTopic(topic.id, row.id);
                          }}
                          className="bg-muted/20 p-3"
                        >
                          <div className="flex items-center gap-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                            <Textarea
                              value={row.title ?? ""}
                              onChange={(event) => handleRowTitleChange(topic.id, row.id, event.target.value)}
                              placeholder="Row label (e.g., Year 1)"
                              className="min-h-[56px] bg-white/80"
                            />
                          </div>
                        </td>
                        {topic.columns.map((column) => (
                          <td key={`${row.id}-${column.id}`} className="p-3">
                            <Textarea
                              value={row.courses.find((course) => course.columnId === column.id)?.name ?? ""}
                              onChange={(event) => handleCourseChange(topic.id, row.id, column.id, event.target.value)}
                              placeholder="Course name"
                              className="min-h-[56px] bg-white/80"
                            />
                          </td>
                        ))}
                        <td className="text-center">
                          <Button size="icon" variant="ghost" onClick={() => handleRemoveRow(topic.id, row.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={topic.columns.length + 2} className="p-3 text-center">
                        <Button variant="outline" size="sm" className="gap-2" onClick={() => handleAddRow(topic)}>
                          <Plus className="h-4 w-4" /> Add Row
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
