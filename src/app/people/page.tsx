"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import { Person } from "@/types/person";
import { LoadingState, ErrorState, EmptyState } from "@/components/common/StateViews";
import PersonFormModal from "@/components/people/PersonFormModal";
import Button from "@/components/common/Button";
import Card from "@/components/common/Card";
import Avatar from "@/components/common/Avatar";

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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">People</h1>
          <p className="text-sm text-slate-500">Manage the people practicing subjects together.</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          <span className="text-base leading-none">+</span> Add Person
        </Button>
      </div>

      {loading && <LoadingState label="Loading people..." />}
      {error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && people.length === 0 && (
        <EmptyState icon="👥" title="No people yet" description="Add your first person to get started." />
      )}

      {!loading && !error && people.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {people.map((person) => (
            <Card
              key={person._id}
              className="flex items-center justify-between transition-shadow hover:shadow-softHover"
            >
              <div className="flex items-center gap-3">
                <Avatar name={person.name} size="lg" />
                <div>
                  <p className="font-semibold text-slate-900">{person.name}</p>
                  <span
                    className={`mt-0.5 inline-flex items-center gap-1 text-xs font-medium ${
                      person.isActive ? "text-emerald-600" : "text-slate-400"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        person.isActive ? "bg-emerald-500" : "bg-slate-300"
                      }`}
                    />
                    {person.isActive ? "Active" : "Inactive"}
                  </span>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    Added {new Date(person.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditing(person);
                    setModalOpen(true);
                  }}
                >
                  Edit
                </Button>
                <Button
                  variant={person.isActive ? "dangerOutline" : "outline"}
                  size="sm"
                  onClick={() => toggleActive(person)}
                  className={
                    !person.isActive
                      ? "!border-emerald-300 !text-emerald-700 hover:!bg-emerald-50"
                      : undefined
                  }
                >
                  {person.isActive ? "Deactivate" : "Reactivate"}
                </Button>
              </div>
            </Card>
          ))}
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
