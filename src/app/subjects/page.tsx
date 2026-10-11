"use client";

import { useEffect, useState, useCallback } from "react";
import { useUser } from "@/components/providers/UserProvider";
import { apiGet, apiPost, apiPatch, apiDelete, getErrorMessage } from "@/lib/api";
import { canManageGroup } from "@/lib/group-roles";
import Card from "@/components/ui/Card";
import Chip from "@/components/ui/Chip";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import Modal from "@/components/ui/Modal";
import Switch from "@/components/ui/Switch";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { SubjectsGridSkeleton, SubjectsPageSkeleton, ErrorState, EmptyState } from "@/components/ui/StateViews";
import ProgressBar from "@/components/ui/ProgressBar";
import { ConfidenceBadge } from "@/components/ui/Badge";
import { formatSubjectTrack } from "@/lib/utils";
import toast from "react-hot-toast";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import type { ContentScope, GroupRole, SubjectWithStats } from "@/types";

export default function SubjectsPage() {
  const { user } = useUser();
  const confirm = useConfirm();
  const [subjects, setSubjects] = useState<SubjectWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<ContentScope>("group");
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectWithStats | null>(null);
  const [newName, setNewName] = useState("");
  const [newTotalQuestions, setNewTotalQuestions] = useState("");
  const [useForMockInterview, setUseForMockInterview] = useState(true);
  const [trackEnabled, setTrackEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [canManageGroupTracks, setCanManageGroupTracks] = useState(false);

  const load = useCallback(async () => {
    if (!user?.activeGroupId && tab === "group") {
      setLoading(false);
      setSubjects([]);
      setCanManageGroupTracks(false);
      return;
    }
    setLoading(true);
    try {
      const url =
        tab === "group"
          ? `/api/subjects?groupId=${user!.activeGroupId}&scope=group&includeInactive=1`
          : `/api/subjects?scope=personal&includeInactive=1`;
      if (tab === "group" && user?.activeGroupId) {
        const [data, groupHeader] = await Promise.all([
          apiGet<SubjectWithStats[]>(url),
          apiGet<{ myRole: GroupRole | null }>(
            `/api/groups/${user.activeGroupId}?view=header`
          ),
        ]);
        setSubjects(data);
        setCanManageGroupTracks(canManageGroup(groupHeader.myRole));
      } else {
        const data = await apiGet<SubjectWithStats[]>(url);
        setSubjects(data);
        setCanManageGroupTracks(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load subjects");
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, [user, tab]);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => {
    setNewName("");
    setNewTotalQuestions("");
    setUseForMockInterview(true);
    setTrackEnabled(true);
    setEditingSubject(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (subject: SubjectWithStats) => {
    setEditingSubject(subject);
    setNewName(subject.name);
    setNewTotalQuestions(subject.totalQuestions ? String(subject.totalQuestions) : "");
    setUseForMockInterview(subject.useForMockInterview !== false);
    setTrackEnabled(subject.isActive !== false);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const createSubject = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await apiPost("/api/subjects", {
        ...(tab === "group" ? { groupId: user?.activeGroupId } : {}),
        name: newName,
        scope: tab,
        ...(newTotalQuestions ? { totalQuestions: Number(newTotalQuestions) } : {}),
        ...(tab === "group" ? { useForMockInterview } : {}),
      });
      toast.success(tab === "group" ? "Group track created" : "Personal track created");
      closeModal();
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to create subject"));
    } finally {
      setSaving(false);
    }
  };

  const saveSubject = async () => {
    if (!editingSubject || !newName.trim()) return;
    if (editingSubject.isActive !== false && !trackEnabled) {
      const ok = await confirm({
        title: "Disable track?",
        message: `Disable "${editingSubject.name}"? Questions on this track will be hidden until you re-enable it.`,
        confirmLabel: "Disable",
      });
      if (!ok) return;
    }
    const totalQuestions = newTotalQuestions ? Number(newTotalQuestions) : 0;
    if (!Number.isFinite(totalQuestions) || totalQuestions < 0) {
      toast.error("Enter a valid target count");
      return;
    }
    setSaving(true);
    try {
      const updated = await apiPatch<SubjectWithStats>(`/api/subjects/${editingSubject._id}`, {
        name: newName.trim(),
        totalQuestions,
        isActive: trackEnabled,
        ...(tab === "group" ? { useForMockInterview } : {}),
      });
      setSubjects((prev) =>
        prev.map((s) =>
          s._id === editingSubject._id
            ? {
                ...s,
                ...updated,
                name: newName.trim(),
                totalQuestions,
                completionPercent:
                  totalQuestions > 0
                    ? Math.min(100, Math.round((s.questionCount / totalQuestions) * 100))
                    : 0,
              }
            : s
        )
      );
      toast.success("Track updated");
      closeModal();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update track"));
    } finally {
      setSaving(false);
    }
  };

  const canDeleteTrack = tab === "personal" || canManageGroupTracks;

  const deleteTrack = async (subject: SubjectWithStats) => {
    const ok = await confirm({
      title: "Delete track?",
      message: `Delete "${subject.name}" and all ${subject.questionCount} question${
        subject.questionCount === 1 ? "" : "s"
      } on it? This cannot be undone.`,
      confirmLabel: "Delete track",
    });
    if (!ok) return;
    setDeletingId(subject._id);
    try {
      await apiDelete(`/api/subjects/${subject._id}`);
      setSubjects((prev) => prev.filter((s) => s._id !== subject._id));
      if (editingSubject?._id === subject._id) closeModal();
      toast.success("Track deleted");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to delete track"));
    } finally {
      setDeletingId(null);
    }
  };

  const setModalTrackEnabled = async (nextActive: boolean) => {
    if (
      editingSubject &&
      editingSubject.isActive !== false &&
      !nextActive
    ) {
      const ok = await confirm({
        title: "Disable track?",
        message: `Disable "${editingSubject.name}"? Questions on this track will be hidden until you re-enable it.`,
        confirmLabel: "Disable",
      });
      if (!ok) return;
    }
    setTrackEnabled(nextActive);
  };

  const toggleTrackActive = async (subject: SubjectWithStats, nextActive: boolean) => {
    if (!nextActive) {
      const ok = await confirm({
        title: "Disable track?",
        message: `Disable "${subject.name}"? Questions on this track will be hidden until you re-enable it.`,
        confirmLabel: "Disable",
      });
      if (!ok) return;
    }
    setTogglingId(subject._id);
    try {
      const updated = await apiPatch<SubjectWithStats>(`/api/subjects/${subject._id}`, {
        isActive: nextActive,
      });
      setSubjects((prev) =>
        prev.map((s) => (s._id === subject._id ? { ...s, ...updated, isActive: nextActive } : s))
      );
      toast.success(nextActive ? "Track enabled" : "Track disabled");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update track"));
    } finally {
      setTogglingId(null);
    }
  };

  const sortedSubjects = [...subjects].sort((a, b) => {
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
    return (a.order ?? 0) - (b.order ?? 0);
  });

  if (initialLoad && loading) {
    return <SubjectsPageSkeleton />;
  }

  if (error && subjects.length === 0) {
    return <ErrorState message={error} onRetry={load} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Tracks</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {tab === "group"
              ? "Shared tracks for your group’s question bank."
              : "Your private tracks for solo practice."}
          </p>
        </div>
        <Button size="sm" onClick={openCreateModal}>
          Add {tab === "group" ? "Group" : "Personal"} Track
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["group", "personal"] as ContentScope[]).map((scope) => (
          <Chip
            key={scope}
            variant="brand"
            active={tab === scope}
            onClick={() => setTab(scope)}
            className="!px-4 !py-1.5 !text-sm"
          >
            {scope === "group" ? "Group Tracks" : "My Tracks"}
          </Chip>
        ))}
      </div>

      {loading ? (
        <SubjectsGridSkeleton />
      ) : subjects.length === 0 ? (
        <EmptyState
          title={tab === "group" ? "No group tracks yet" : "No personal tracks yet"}
          description={
            tab === "group"
              ? "Add a track for your group to organize questions."
              : "Add personal tracks for your question bank."
          }
          action={<Button onClick={openCreateModal}>Add Track</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {sortedSubjects.map((s) => (
            <Card key={s._id} className={!s.isActive ? "opacity-75" : undefined}>
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-[var(--foreground)]">
                      {formatSubjectTrack(s)}
                    </h3>
                    {!s.isActive && (
                      <Chip variant="muted" className="!px-2 !py-0.5 !text-[10px]">
                        Disabled
                      </Chip>
                    )}
                    <ConfidenceBadge confidence={s.confidence} />
                  </div>
                  <ProgressBar value={s.completionPercent} className="mt-3" />
                  <p className="mt-1.5 text-xs text-[var(--muted)]">
                    {s.questionCount}
                    {s.totalQuestions > 0 ? ` / ${s.totalQuestions}` : ""} questions ·{" "}
                    {s.completionPercent}% prepared
                  </p>
                  {tab === "group" && (
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {s.useForMockInterview !== false
                        ? "Included in mock interviews"
                        : "Excluded from mock interviews"}
                    </p>
                  )}
                </div>
                <div
                  className="flex shrink-0 items-center gap-0.5"
                  role="group"
                  aria-label={`Actions for ${s.name}`}
                >
                  {togglingId === s._id ? (
                    <Loader2
                      className="h-4 w-4 animate-spin text-[var(--muted)]"
                      aria-label="Updating track"
                    />
                  ) : (
                    <Switch
                      checked={s.isActive !== false}
                      disabled={deletingId === s._id}
                      aria-label={`${s.isActive !== false ? "Disable" : "Enable"} ${s.name}`}
                      onCheckedChange={(next) => toggleTrackActive(s, next)}
                    />
                  )}
                  <IconButton label={`Edit ${s.name}`} onClick={() => openEditModal(s)}>
                    <Pencil className="h-4 w-4" strokeWidth={2} aria-hidden />
                  </IconButton>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={showModal}
        onClose={closeModal}
        title={
          editingSubject
            ? `Edit ${tab === "group" ? "Group" : "Personal"} Track`
            : tab === "group"
              ? "Add Group Track"
              : "Add Personal Track"
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Track name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Track name"
              className="mt-1 w-full rounded-lg border border-[var(--input-border)] px-4 py-2.5 text-sm dark:border-[var(--input-border)] dark:bg-[var(--input-bg)]"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Target count</label>
            <input
              type="number"
              min={0}
              value={newTotalQuestions}
              onChange={(e) => setNewTotalQuestions(e.target.value)}
              onWheel={(e) => e.currentTarget.blur()}
              placeholder="Target count (optional)"
              className="mt-1 w-full rounded-lg border border-[var(--input-border)] px-4 py-2.5 text-sm dark:border-[var(--input-border)] dark:bg-[var(--input-bg)]"
            />
          </div>
          <div className="flex items-center justify-between gap-4 rounded-lg border border-[var(--border)] p-3 text-sm">
            <div className="min-w-0">
              <p className="font-medium text-[var(--foreground)]">Track enabled</p>
              <p className="mt-0.5 text-xs text-[var(--muted)]">
                When off, questions on this track are hidden from lists, dashboard, and analytics.
              </p>
            </div>
            <Switch
              checked={trackEnabled}
              disabled={saving}
              aria-label="Track enabled"
              onCheckedChange={setModalTrackEnabled}
            />
          </div>
          {tab === "group" && (
            <label className="flex items-start gap-3 rounded-lg border border-[var(--border)] p-3 text-sm">
              <input
                type="checkbox"
                checked={useForMockInterview}
                onChange={(e) => setUseForMockInterview(e.target.checked)}
                className="mt-0.5"
                disabled={!trackEnabled}
              />
              <span>
                <span className="font-medium text-[var(--foreground)]">Use for mock interviews</span>
                <span className="mt-0.5 block text-[var(--muted)]">
                  When enabled, one done question from this track can be picked per member mock.
                </span>
              </span>
            </label>
          )}
          <div className="flex items-center justify-between gap-2 border-t border-[var(--border)] pt-4">
            {editingSubject && canDeleteTrack ? (
              <IconButton
                label="Delete track"
                variant="danger"
                disabled={saving || deletingId === editingSubject._id}
                onClick={() => deleteTrack(editingSubject)}
              >
                {deletingId === editingSubject._id ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Trash2 className="h-4 w-4" strokeWidth={2} aria-hidden />
                )}
              </IconButton>
            ) : (
              <span aria-hidden />
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" size="sm" onClick={closeModal} disabled={saving}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={editingSubject ? saveSubject : createSubject}
                disabled={saving || !newName.trim()}
              >
                {saving ? "Saving…" : editingSubject ? "Save changes" : "Save track"}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
