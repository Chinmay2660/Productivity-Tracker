"use client";

import { useEffect, useMemo, useState } from "react";
import { apiGet } from "@/lib/api";
import { Category } from "@/types/category";
import { Person } from "@/types/person";
import { TaskWithDetails } from "@/types/task";
import { resolveFilterRange } from "@/lib/utils";
import { LoadingState, ErrorState, EmptyState } from "@/components/common/StateViews";
import FilterBar, { DEFAULT_FILTERS, FiltersState } from "@/components/questions/FilterBar";
import QuestionsTable from "@/components/questions/QuestionsTable";
import QuestionFormModal from "@/components/questions/QuestionFormModal";
import QuestionDetailsModal from "@/components/questions/QuestionDetailsModal";
import QuestionEditModal from "@/components/questions/QuestionEditModal";
import Button from "@/components/common/Button";

export default function QuestionsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [tasks, setTasks] = useState<TaskWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FiltersState>({ ...DEFAULT_FILTERS, quickFilter: "all" });
  const [addOpen, setAddOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskWithDetails | null>(null);
  const [editingTask, setEditingTask] = useState<TaskWithDetails | null>(null);

  async function loadStaticData() {
    const [cats, ppl] = await Promise.all([
      apiGet<Category[]>("/api/categories"),
      apiGet<Person[]>("/api/people"),
    ]);
    setCategories(cats);
    setPeople(ppl);
  }

  async function loadTasks() {
    setLoading(true);
    setError(null);
    try {
      const { start, end } = resolveFilterRange(filters);
      const params = new URLSearchParams();
      if (start) params.set("start", start);
      if (end) params.set("end", end);
      if (filters.categoryId) params.set("categoryId", filters.categoryId);
      if (filters.personId) params.set("personId", filters.personId);
      if (filters.status) params.set("status", filters.status);
      if (filters.search) params.set("search", filters.search);

      const data = await apiGet<TaskWithDetails[]>(`/api/tasks?${params.toString()}`);
      setTasks(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load questions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStaticData();
  }, []);

  useEffect(() => {
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const activePeople = useMemo(() => people.filter((p) => p.isActive), [people]);

  async function refreshSelectedTask() {
    if (!selectedTask) return;
    const fresh = await apiGet<TaskWithDetails>(`/api/tasks/${selectedTask._id}`);
    setSelectedTask(fresh);
    loadTasks();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Questions</h1>
          <p className="text-sm text-slate-500">All questions across every subject and person.</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <span className="text-base leading-none">+</span> Add Question
        </Button>
      </div>

      <div className="mb-4">
        <FilterBar filters={filters} onChange={setFilters} categories={categories} people={people} />
      </div>

      {loading && <LoadingState label="Loading questions..." />}
      {error && <ErrorState message={error} onRetry={loadTasks} />}
      {!loading && !error && tasks.length === 0 && (
        <EmptyState
          title="No questions found"
          description="Try adjusting filters or add a new question."
        />
      )}
      {!loading && !error && tasks.length > 0 && (
        <QuestionsTable tasks={tasks} people={activePeople} onRowClick={setSelectedTask} />
      )}

      <QuestionFormModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={loadTasks}
        categories={categories.filter((c) => c.isActive)}
        people={activePeople}
      />

      <QuestionDetailsModal
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onChanged={refreshSelectedTask}
        onEdit={(task) => {
          setSelectedTask(null);
          setEditingTask(task);
        }}
      />

      <QuestionEditModal
        task={editingTask}
        onClose={() => setEditingTask(null)}
        onSaved={loadTasks}
        categories={categories.filter((c) => c.isActive)}
        people={activePeople}
      />
    </div>
  );
}
