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
import TotalProgressCard from "@/components/dashboard/TotalProgressCard";
import TodayProgressCard from "@/components/dashboard/TodayProgressCard";
import SubjectStatsCard from "@/components/dashboard/SubjectStatsCard";
import IndividualProgressCard from "@/components/dashboard/IndividualProgressCard";
import StatTile from "@/components/dashboard/StatTile";
import Button from "@/components/common/Button";

interface DashboardData {
  people: Person[];
  categories: Category[];
  totalsByCategory: { categoryId: string; name: string; total: number }[];
  todayProgressByPerson: {
    personId: string;
    name: string;
    total: number;
    completed: number;
    percent: number;
  }[];
  statsBySubject: {
    categoryId: string;
    name: string;
    totalQuestions: number;
    NOT_STARTED: number;
    IN_PROGRESS: number;
    DONE: number;
    REVISED: number;
  }[];
  overallByPerson: {
    personId: string;
    name: string;
    NOT_STARTED: number;
    IN_PROGRESS: number;
    DONE: number;
    REVISED: number;
  }[];
  tasks: TaskWithDetails[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FiltersState>(DEFAULT_FILTERS);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskWithDetails | null>(null);
  const [editingTask, setEditingTask] = useState<TaskWithDetails | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { start, end } = resolveFilterRange(filters);
      const params = new URLSearchParams();
      if (start) params.set("start", start);
      if (end) params.set("end", end);
      const result = await apiGet<DashboardData>(`/api/dashboard?${params.toString()}`);
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.quickFilter, filters.customStart, filters.customEnd]);

  const filteredTasks = useMemo(() => {
    if (!data) return [];
    let tasks = data.tasks;
    if (filters.categoryId) tasks = tasks.filter((t) => t.categoryId === filters.categoryId);
    if (filters.personId)
      tasks = tasks.filter((t) => t.progress.some((p) => p.personId === filters.personId));
    if (filters.status)
      tasks = tasks.filter((t) => t.progress.some((p) => p.status === filters.status));
    if (filters.search) {
      const q = filters.search.toLowerCase();
      tasks = tasks.filter(
        (t) => t.content?.toLowerCase().includes(q) || t.link?.toLowerCase().includes(q)
      );
    }
    return tasks;
  }, [data, filters]);

  const activePeople = useMemo(() => (data ? data.people : []), [data]);
  const activeCategories = useMemo(() => (data ? data.categories : []), [data]);

  async function refreshSelectedTask() {
    if (!selectedTask) return;
    const fresh = await apiGet<TaskWithDetails>(`/api/tasks/${selectedTask._id}`);
    setSelectedTask(fresh);
    load();
  }

  if (loading && !data) return <LoadingState label="Loading dashboard..." />;
  if (error && !data) return <ErrorState message={error} onRetry={load} />;
  if (!data) return null;

  const totalQuestions = data.totalsByCategory.reduce((sum, t) => sum + t.total, 0);
  const avgToday = data.todayProgressByPerson.length
    ? Math.round(
        data.todayProgressByPerson.reduce((sum, p) => sum + p.percent, 0) /
          data.todayProgressByPerson.length
      )
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Technical Productivity Tracker
          </h1>
          <p className="text-sm text-slate-500">
            Track progress across every subject and every person, dynamically.
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <span className="text-base leading-none">+</span> Add Question
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon="📋" label="Total Questions" value={totalQuestions} accent="#25A6EE" />
        <StatTile icon="👥" label="Active People" value={activePeople.length} accent="#A361CF" />
        <StatTile icon="📚" label="Subjects" value={activeCategories.length} accent="#13C8A5" />
        <StatTile icon="⚡" label="Today's Avg" value={`${avgToday}%`} accent="#F59D02" />
      </div>

      <FilterBar
        filters={filters}
        onChange={setFilters}
        categories={activeCategories}
        people={activePeople}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TotalProgressCard totals={data.totalsByCategory} />
        <TodayProgressCard rows={data.todayProgressByPerson} />
      </div>

      <SubjectStatsCard stats={data.statsBySubject} />

      <IndividualProgressCard
        people={activePeople}
        categories={activeCategories}
        rangeTasks={data.tasks}
        overallByPerson={data.overallByPerson}
      />

      <div>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          <span className="text-base leading-none">🗂️</span> Questions
        </h2>
        {filteredTasks.length === 0 ? (
          <EmptyState
            title="No questions in this range"
            description="Try a different filter or add a new question."
          />
        ) : (
          <QuestionsTable
            tasks={filteredTasks}
            people={activePeople}
            onRowClick={setSelectedTask}
          />
        )}
      </div>

      <QuestionFormModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={load}
        categories={activeCategories}
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
        onSaved={load}
        categories={activeCategories}
        people={activePeople}
      />
    </div>
  );
}
