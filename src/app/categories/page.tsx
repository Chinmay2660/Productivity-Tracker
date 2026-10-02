"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import { Category } from "@/types/category";
import { LoadingState, ErrorState, EmptyState } from "@/components/common/StateViews";
import CategoryFormModal from "@/components/categories/CategoryFormModal";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<Category[]>("/api/categories?includeInactive=true");
      setCategories(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load subjects");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAddOrEdit(name: string) {
    try {
      if (editing) {
        await apiPatch(`/api/categories/${editing._id}`, { name });
        toast.success("Subject updated");
      } else {
        await apiPost("/api/categories", { name });
        toast.success("Subject added");
      }
      setEditing(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
      throw e;
    }
  }

  async function toggleActive(category: Category) {
    try {
      await apiPatch(`/api/categories/${category._id}`, { isActive: !category.isActive });
      toast.success(category.isActive ? "Subject deactivated" : "Subject reactivated");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Subjects</h1>
          <p className="text-sm text-slate-500">
            Categories are fully dynamic — add DSA, HTML, React, or anything else.
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          + Add Subject
        </button>
      </div>

      {loading && <LoadingState label="Loading subjects..." />}
      {error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && categories.length === 0 && (
        <EmptyState title="No subjects yet" description="Add your first subject to get started." />
      )}

      {!loading && !error && categories.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <div
              key={category._id}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4"
            >
              <div>
                <p className="font-medium text-slate-900">{category.name}</p>
                <span
                  className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    category.isActive
                      ? "bg-green-50 text-green-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {category.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => {
                    setEditing(category);
                    setModalOpen(true);
                  }}
                  className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium hover:bg-slate-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => toggleActive(category)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                    category.isActive
                      ? "border border-amber-300 text-amber-700 hover:bg-amber-50"
                      : "border border-green-300 text-green-700 hover:bg-green-50"
                  }`}
                >
                  {category.isActive ? "Deactivate" : "Reactivate"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CategoryFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSubmit={handleAddOrEdit}
        category={editing}
      />
    </div>
  );
}
