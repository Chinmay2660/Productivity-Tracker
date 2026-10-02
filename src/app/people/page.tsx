"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import { Person } from "@/types/person";
import { LoadingState, ErrorState, EmptyState } from "@/components/common/StateViews";
import PersonFormModal from "@/components/people/PersonFormModal";

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Person | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<Person[]>("/api/people?includeInactive=true");
      setPeople(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load people");
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
        await apiPatch(`/api/people/${editing._id}`, { name });
        toast.success("Person updated");
      } else {
        await apiPost("/api/people", { name });
        toast.success("Person added");
      }
      setEditing(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
      throw e;
    }
  }

  async function toggleActive(person: Person) {
    try {
      await apiPatch(`/api/people/${person._id}`, { isActive: !person.isActive });
      toast.success(person.isActive ? "Person deactivated" : "Person reactivated");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">People</h1>
          <p className="text-sm text-slate-500">Manage the people practicing subjects together.</p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          + Add Person
        </button>
      </div>

      {loading && <LoadingState label="Loading people..." />}
      {error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && people.length === 0 && (
        <EmptyState title="No people yet" description="Add your first person to get started." />
      )}

      {!loading && !error && people.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Added</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {people.map((person) => (
                <tr key={person._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{person.name}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        person.isActive
                          ? "bg-green-50 text-green-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {person.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(person.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditing(person);
                          setModalOpen(true);
                        }}
                        className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium hover:bg-slate-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => toggleActive(person)}
                        className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                          person.isActive
                            ? "border border-amber-300 text-amber-700 hover:bg-amber-50"
                            : "border border-green-300 text-green-700 hover:bg-green-50"
                        }`}
                      >
                        {person.isActive ? "Deactivate" : "Reactivate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <PersonFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSubmit={handleAddOrEdit}
        person={editing}
      />
    </div>
  );
}
