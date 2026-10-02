"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import { Category } from "@/types/category";
import { LoadingState, ErrorState, EmptyState } from "@/components/common/StateViews";
import CategoryFormModal from "@/components/categories/CategoryFormModal";
import Button from "@/components/common/Button";
import Card from "@/components/common/Card";
import Avatar from "@/components/common/Avatar";

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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Subjects</h1>
          <p className="text-sm text-slate-500">
            Categories are fully dynamic — add DSA, HTML, React, or anything else.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          <span className="text-base leading-none">+</span> Add Subject
        </Button>
      </div>

      {loading && <LoadingState label="Loading subjects..." />}
      {error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && categories.length === 0 && (
        <EmptyState icon="📚" title="No subjects yet" description="Add your first subject to get started." />
      )}

      {!loading && !error && categories.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Card
              key={category._id}
              className="flex items-center justify-between transition-shadow hover:shadow-softHover"
            >
              <div className="flex items-center gap-3">
                <Avatar name={category.name} size="lg" />
                <div>
                  <p className="font-semibold text-slate-900">{category.name}</p>
                  <span
                    className={`mt-0.5 inline-flex items-center gap-1 text-xs font-medium ${
                      category.isActive ? "text-emerald-600" : "text-slate-400"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        category.isActive ? "bg-emerald-500" : "bg-slate-300"
                      }`}
                    />
                    {category.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditing(category);
                    setModalOpen(true);
                  }}
                >
                  Edit
                </Button>
                <Button
                  variant={category.isActive ? "dangerOutline" : "outline"}
                  size="sm"
                  onClick={() => toggleActive(category)}
                  className={
                    !category.isActive
                      ? "!border-emerald-300 !text-emerald-700 hover:!bg-emerald-50"
                      : undefined
                  }
                >
                  {category.isActive ? "Deactivate" : "Reactivate"}
                </Button>
              </div>
            </Card>
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
