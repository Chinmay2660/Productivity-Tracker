"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useUser } from "@/components/providers/UserProvider";
import { apiGet, apiPost, apiPatch, apiDelete, getErrorMessage } from "@/lib/api";
import Button from "@/components/ui/Button";
import Chip from "@/components/ui/Chip";
import MultiSelect from "@/components/ui/MultiSelect";
import FormField from "@/components/ui/FormField";
import Modal from "@/components/ui/Modal";
import MotivationBanner from "@/components/dashboard/MotivationBanner";
import {
  QuestionsPageSkeleton,
  ErrorState,
  EmptyState,
} from "@/components/ui/StateViews";
import QuestionListView, { type QuestionListItem } from "@/components/questions/QuestionListView";
import {
  formatSubjectTrack,
  joinQuestionFields,
  splitQuestionFields,
  questionPracticeDay,
  toDateInputValue,
  QUESTION_DATE_PERIODS,
  normalizeQuestionStatus,
  DEFAULT_QUESTION_TABLE_SORT,
  toggleQuestionSort,
  type QuestionDatePeriod,
  type QuestionSortField,
  type QuestionSortDir,
} from "@/lib/utils";
import TablePagination from "@/components/ui/TablePagination";
import QuestionTableSearch from "@/components/questions/QuestionTableSearch";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import toast from "react-hot-toast";
import {
  triggerQuestionPointsBurst,
  type QuestionPointBurst,
} from "@/lib/question-points-burst";
import { canManageGroup } from "@/lib/group-roles";
import { SlidersHorizontal, X } from "lucide-react";
import { QUESTION_STATUS_ORDER, QUESTION_STATUS_META } from "@/lib/utils";
import type { ContentScope, GroupRole, PracticeQuestion, QuestionStatus, Subject } from "@/types";

type QuestionWithSubject = PracticeQuestion & { subjectName: string; trackLabel: string };

type PagedQuestions = {
  items: QuestionWithSubject[];
  total: number;
  page: number;
  limit: number;
};

const PAGE_SIZE = 10;
const MODAL_FIELD =
  "w-full min-w-0 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]";

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <span className="w-20 shrink-0 text-sm font-medium text-[var(--muted)]">
        {label}
      </span>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

export default function QuestionsPage() {
  const { user } = useUser();
  const [questions, setQuestions] = useState<QuestionWithSubject[]>([]);
  const [pointBurst, setPointBurst] = useState<QuestionPointBurst | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [datePeriod, setDatePeriod] = useState<QuestionDatePeriod>("today");
  const [sortBy, setSortBy] = useState<QuestionSortField>(DEFAULT_QUESTION_TABLE_SORT.sortBy);
  const [sortDir, setSortDir] = useState<QuestionSortDir>(DEFAULT_QUESTION_TABLE_SORT.sortDir);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [questionTitle, setQuestionTitle] = useState("");
  const [questionDescription, setQuestionDescription] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [link, setLink] = useState("");
  const [practiceDate, setPracticeDate] = useState("");
  const [scope, setScope] = useState<ContentScope>("group");
  const [canAddGroupQuestions, setCanAddGroupQuestions] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [scopeFilter, setScopeFilter] = useState<"all" | ContentScope>("all");
  const [statusFilter, setStatusFilter] = useState<QuestionStatus[]>([]);
  const [subjectFilter, setSubjectFilter] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const hasDateRange = Boolean(dateFrom || dateTo);
  const activeFilterCount =
    (scopeFilter !== "all" ? 1 : 0) +
    (statusFilter.length ? 1 : 0) +
    (subjectFilter.length ? 1 : 0) +
    (dateFrom || dateTo ? 1 : 0);
  const [draft, setDraft] = useState<{
    scope: "all" | ContentScope;
    status: QuestionStatus[];
    subject: string[];
    from: string;
    to: string;
  }>({ scope: "all", status: [], subject: [], from: "", to: "" });
  const openFilters = () => {
    setDraft({ scope: scopeFilter, status: statusFilter, subject: subjectFilter, from: dateFrom, to: dateTo });
    setShowFilters(true);
  };
  const applyFilters = () => {
    setScopeFilter(draft.scope);
    setStatusFilter(draft.status);
    setSubjectFilter(draft.subject);
    setDateFrom(draft.from);
    setDateTo(draft.to);
    if (draft.from || draft.to) setDatePeriod("all");
    setPage(1);
    setShowFilters(false);
  };
  const clearFilters = () => {
    setScopeFilter("all");
    setStatusFilter([]);
    setSubjectFilter([]);
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };
  const debouncedSearch = useDebouncedValue(searchInput, 300);

  const groupSubjects = useMemo(
    () => subjects.filter((s) => s.scope === "group"),
    [subjects]
  );
  const personalSubjects = useMemo(
    () => subjects.filter((s) => s.scope === "personal"),
    [subjects]
  );
  const modalSubjects = scope === "group" ? groupSubjects : personalSubjects;
  const trackOptions = editingId ? subjects.filter((s) => s.scope === scope) : modalSubjects;

  const activeGroupId = user?.activeGroupId;

  // Subjects + role rarely change: fetch once per group (and after edits that need it), not per page/filter.
  const loadMeta = useCallback(async () => {
    if (!activeGroupId) return;
    try {
      const [subjectData, groupHeader] = await Promise.all([
        apiGet<Subject[]>(`/api/subjects?groupId=${activeGroupId}&minimal=1`),
        apiGet<{ myRole: GroupRole | null }>(`/api/groups/${activeGroupId}?view=header`),
      ]);
      setSubjects(subjectData);
      setCanAddGroupQuestions(canManageGroup(groupHeader.myRole));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load questions");
    }
  }, [activeGroupId]);

  const load = useCallback(async () => {
    if (!activeGroupId) {
      setLoading(false);
      setInitialLoad(false);
      return;
    }
    setLoading(true);
    try {
      const searchQ = debouncedSearch.trim()
        ? `&search=${encodeURIComponent(debouncedSearch.trim())}`
        : "";
      const questionUrl = `/api/practice-questions?groupId=${activeGroupId}&scope=${scopeFilter}${statusFilter.length ? `&status=${statusFilter.join(",")}` : ""}${subjectFilter.length ? `&subjectId=${subjectFilter.join(",")}` : ""}${dateFrom ? `&dateFrom=${dateFrom}` : ""}${dateTo ? `&dateTo=${dateTo}` : ""}&page=${page}&limit=${PAGE_SIZE}&period=${datePeriod}&sortBy=${sortBy}&sortDir=${sortDir}${searchQ}`;
      const questionData = await apiGet<PagedQuestions>(questionUrl);
      setQuestions(questionData.items);
      setTotal(questionData.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load questions");
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, [activeGroupId, page, datePeriod, sortBy, sortDir, debouncedSearch, scopeFilter, statusFilter, subjectFilter, dateFrom, dateTo]);

  useEffect(() => { loadMeta(); }, [loadMeta]);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    document.getElementById("app-main")?.scrollTo({ top: 0 });
  }, [page]);

  useEffect(() => {
    const available = scope === "group" ? groupSubjects : personalSubjects;
    if (available.length > 0 && !available.some((s) => s._id === subjectId)) {
      setSubjectId(available[0]._id);
    }
  }, [scope, groupSubjects, personalSubjects, subjectId]);

  useEffect(() => {
    if (!canAddGroupQuestions && scope === "group") {
      setScope("personal");
    }
  }, [canAddGroupQuestions, scope]);

  const handleSort = (field: QuestionSortField) => {
    const next = toggleQuestionSort(field, sortBy, sortDir);
    setSortBy(next.sortBy);
    setSortDir(next.sortDir);
    setPage(1);
  };

  const resetForm = () => {
    setEditingId(null);
    setQuestionTitle("");
    setQuestionDescription("");
    setLink("");
    setPracticeDate("");
    setScope(canAddGroupQuestions ? "group" : "personal");
    setSubjectId(
      (canAddGroupQuestions ? groupSubjects[0] : personalSubjects[0])?._id ??
        personalSubjects[0]?._id ??
        ""
    );
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (q: QuestionListItem) => {
    const full = questions.find((item) => item._id === q._id);
    if (!full) return;
    setEditingId(full._id);
    const parts = splitQuestionFields(full.content);
    setQuestionTitle(parts.title);
    setQuestionDescription(parts.description);
    setLink(full.link ?? "");
    setPracticeDate(questionPracticeDay(full));
    setScope(full.scope);
    setSubjectId(full.subjectId);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const saveQuestion = async () => {
    if (!questionTitle.trim() || !subjectId || !user?.activeGroupId) return;
    const payload = {
      title: questionTitle.trim(),
      description: questionDescription.trim(),
      link: link.trim() || undefined,
      subjectId,
      practiceDate: practiceDate.trim() ? practiceDate : null,
    };
    const mergedContent = joinQuestionFields(payload.title, payload.description);
    setSaving(true);
    try {
      if (editingId) {
        const updated = await apiPatch<QuestionWithSubject>(`/api/practice-questions/${editingId}`, payload);
        const subject = subjects.find((s) => s._id === subjectId);
        setQuestions((prev) =>
          prev.map((q) =>
            q._id === editingId
              ? {
                  ...q,
                  ...updated,
                  content: mergedContent,
                  link: payload.link,
                  subjectId,
                  practiceDate: practiceDate.trim() || undefined,
                  subjectName: subject?.name ?? q.subjectName,
                  trackLabel: subject ? formatSubjectTrack(subject) : q.trackLabel,
                }
              : q
          )
        );
        toast.success("Question updated");
      } else {
        await apiPost("/api/practice-questions", {
          groupId: user.activeGroupId,
          scope,
          ...payload,
        });
        toast.success("Question added");
        if (page !== 1) setPage(1);
        else load();
      }
      closeModal();
    } catch (err) {
      toast.error(getErrorMessage(err, editingId ? "Failed to update question" : "Failed to add question"));
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id: string, status: QuestionStatus) => {
    const normalized = normalizeQuestionStatus(status);
    const current = questions.find((q) => String(q._id) === String(id));
    if (!current) return;
    const previousStatus = normalizeQuestionStatus(current.status ?? "not_started");

    setQuestions((prev) =>
      prev.map((q) => (String(q._id) === String(id) ? { ...q, status: normalized } : q))
    );

    try {
      const updated = await apiPatch<QuestionWithSubject & { pointsEarnedNow?: number }>(
        `/api/practice-questions/${id}`,
        { status: normalized }
      );
      setQuestions((prev) =>
        prev.map((q) =>
          String(q._id) === String(id)
            ? {
                ...q,
                status: normalizeQuestionStatus(updated.status ?? normalized),
              }
            : q
        )
      );
      triggerQuestionPointsBurst(setPointBurst, id, updated.pointsEarnedNow);
      if (normalized === "add_to_todo") {
        toast.success("Added to Tasks");
      }
    } catch (err) {
      setQuestions((prev) =>
        prev.map((q) => (String(q._id) === String(id) ? { ...q, status: previousStatus } : q))
      );
      toast.error(getErrorMessage(err, "Failed to update question"));
    }
  };

  const deleteQuestion = async (id: string) => {
    setLoading(true);
    try {
      await apiDelete(`/api/practice-questions/${id}`);
      toast.success("Question deleted");
      const remainingOnPage = questions.length - 1;
      const newTotal = total - 1;
      const newTotalPages = Math.max(1, Math.ceil(newTotal / PAGE_SIZE));
      if (remainingOnPage === 0 && page > 1 && page > newTotalPages) {
        setPage(newTotalPages);
      } else {
        load();
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to delete question"));
      setLoading(false);
    }
  };

  if (user && !user.activeGroupId) {
    return (
      <EmptyState
        title="No active group"
        description="Join or create a group to start tracking practice questions."
        action={
          <Link href="/groups">
            <Button>Browse Groups</Button>
          </Link>
        }
      />
    );
  }

  if (initialLoad && loading) {
    return <QuestionsPageSkeleton />;
  }
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Questions</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {total} question{total === 1 ? "" : "s"} — track daily practice progress
          </p>
        </div>
        <Button size="sm" onClick={openCreateModal}>
          Add Question
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
        <QuestionTableSearch
          value={searchInput}
          onChange={setSearchInput}
          className="max-w-md flex-1"
        />
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={openFilters}
            aria-haspopup="dialog"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
            Filters{activeFilterCount ? ` (${activeFilterCount})` : ""}
          </Button>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-3.5 w-3.5" aria-hidden /> Clear
            </Button>
          )}
        </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {QUESTION_DATE_PERIODS.map(({ id, label }) => (
            <Chip
              key={id}
              variant="brand"
              // A custom From/To range replaces the quick tabs, so none is highlighted while it's active.
              active={!hasDateRange && datePeriod === id}
              onClick={() => {
                // Picking a tab drops the custom range, otherwise the range would keep overriding it.
                setDateFrom("");
                setDateTo("");
                setDatePeriod(id);
                setPage(1);
              }}
              className="!px-3 !py-1.5 !text-sm"
            >
              {label}
            </Chip>
          ))}
        </div>
      </div>

      {questions.length === 0 && !loading ? (
        <EmptyState
          title={
            debouncedSearch.trim()
              ? "No questions match your search"
              : datePeriod !== "all"
                ? "No matching questions"
                : "No questions yet"
          }
          description={
            debouncedSearch.trim()
              ? "Try a different title or track name."
              : datePeriod !== "all"
                ? "Try another period or add a question."
                : "Add practice questions to track your preparation."
          }
          action={
            debouncedSearch.trim() ? (
              <Button variant="outline" onClick={() => setSearchInput("")}>Clear search</Button>
            ) : (
              <Button onClick={openCreateModal}>Add Question</Button>
            )
          }
        />
      ) : (
        <>
          <QuestionListView
            questions={questions}
            onStatusChange={updateStatus}
            pointBurst={pointBurst}
            onEdit={openEditModal}
            onDelete={deleteQuestion}
            showScope
            showActions
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={handleSort}
            loading={loading}
            localSearch={searchInput}
          />

          <TablePagination
            page={page}
            total={total}
            pageSize={PAGE_SIZE}
            loading={loading}
            onPageChange={setPage}
            summaryExtra={
              datePeriod !== "all"
                ? QUESTION_DATE_PERIODS.find((p) => p.id === datePeriod)?.label
                : undefined
            }
          />
        </>
      )}

      <MotivationBanner />

      <Modal open={showFilters} onClose={() => setShowFilters(false)} title="Filters" size="sm">
        <div className="space-y-4">
          <FilterRow label="Scope">
            <select
              value={draft.scope}
              onChange={(e) => setDraft((d) => ({ ...d, scope: e.target.value as "all" | ContentScope }))}
              className="w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-1.5 text-sm text-[var(--foreground)] sm:min-w-0 sm:flex-1"
            >
              <option value="all">All</option>
              <option value="group">Group</option>
              <option value="personal">Personal</option>
            </select>
          </FilterRow>
          <FilterRow label="Status">
            <MultiSelect
              placeholder="All statuses"
              options={QUESTION_STATUS_ORDER.map((st) => ({ value: st, label: QUESTION_STATUS_META[st].label }))}
              value={draft.status}
              onChange={(next) => setDraft((d) => ({ ...d, status: next as QuestionStatus[] }))}
            />
          </FilterRow>
          <FilterRow label="Track">
            <MultiSelect
              placeholder="All tracks"
              options={subjects.map((sb) => ({ value: sb._id, label: sb.name }))}
              value={draft.subject}
              onChange={(next) => setDraft((d) => ({ ...d, subject: next }))}
            />
          </FilterRow>
          <FilterRow label="Date">
            <div className="grid w-full grid-cols-2 gap-2">
              <label className="text-xs text-[var(--muted)]">
                From
                <input
                  type="date"
                  value={draft.from}
                  max={draft.to || undefined}
                  onChange={(e) => setDraft((d) => ({ ...d, from: e.target.value }))}
                  className="mt-0.5 w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-2 py-1.5 text-sm text-[var(--foreground)]"
                />
              </label>
              <label className="text-xs text-[var(--muted)]">
                To
                <input
                  type="date"
                  value={draft.to}
                  min={draft.from || undefined}
                  onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value }))}
                  className="mt-0.5 w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-2 py-1.5 text-sm text-[var(--foreground)]"
                />
              </label>
            </div>
          </FilterRow>
          <div className="flex justify-between gap-2 pt-2">
            <Button variant="ghost" size="sm"
              onClick={() => setDraft({ scope: "all", status: [], subject: [], from: "", to: "" })}>
              Reset
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowFilters(false)}>Cancel</Button>
              <Button size="sm" onClick={applyFilters}>Apply</Button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={showModal}
        onClose={closeModal}
        title={editingId ? "Edit Question" : "Add Question"}
        size="lg"
      >
        <div className="space-y-5">
          <FormField label="Title">
            <input
              type="text"
              value={questionTitle}
              onChange={(e) => setQuestionTitle(e.target.value)}
              placeholder="TCP vs UDP"
              className={MODAL_FIELD}
              autoFocus
            />
          </FormField>
          <FormField label="Description">
            <textarea
              value={questionDescription}
              onChange={(e) => setQuestionDescription(e.target.value)}
              placeholder="Explain connection-oriented vs connectionless delivery, use cases, and trade-offs."
              rows={3}
              className={MODAL_FIELD}
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Track">
              {trackOptions.length === 0 ? (
                <p className="rounded-lg border border-dashed border-[var(--border)] px-3 py-2 text-sm text-[var(--muted)]">
                  No {scope} tracks yet.{" "}
                  <Link href="/subjects" className="text-brand hover:underline">Create one</Link>
                </p>
              ) : (
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className={MODAL_FIELD}
                >
                  {trackOptions.map((s) => (
                    <option key={s._id} value={s._id}>
                      {formatSubjectTrack(s)}
                    </option>
                  ))}
                </select>
              )}
            </FormField>
            <FormField
              label="Visibility"
              hint={
                !editingId && !canAddGroupQuestions
                  ? "Group questions require admin or co-admin."
                  : undefined
              }
            >
              {!editingId && canAddGroupQuestions ? (
                <select
                  value={scope}
                  onChange={(e) => setScope(e.target.value as ContentScope)}
                  className={MODAL_FIELD}
                >
                  <option value="group">Group — shared with everyone</option>
                  <option value="personal">Personal — only you</option>
                </select>
              ) : (
                <div className={`${MODAL_FIELD} flex items-center text-[var(--muted)]`}>
                  {scope === "group" ? "Group — shared with everyone" : "Personal — only you"}
                </div>
              )}
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Practice date" hint="Leave empty to keep in All only until scheduled.">
              <input
                type="date"
                value={practiceDate}
                onChange={(e) => setPracticeDate(e.target.value)}
                className={`${MODAL_FIELD} input-date-end`}
              />
            </FormField>
            <FormField label="Link (optional)">
              <input
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://..."
                className={MODAL_FIELD}
              />
            </FormField>
          </div>

          {!editingId && (
            <p className="text-xs text-[var(--muted)]">
              New questions start as <strong>Not Started</strong>. Use <strong>Add to do</strong> to queue one in Tasks.
            </p>
          )}
          <div className="flex justify-end gap-2 border-t border-[var(--border)] pt-4">
            <Button variant="ghost" onClick={closeModal} disabled={saving}>
              Cancel
            </Button>
            <Button
              onClick={saveQuestion}
              loading={saving}
              disabled={!questionTitle.trim() || !subjectId || trackOptions.length === 0}
            >
              {saving ? "Saving…" : editingId ? "Save Changes" : "Save Question"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
