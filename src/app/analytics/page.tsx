"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { apiGet } from "@/lib/api";
import { LoadingState, ErrorState, EmptyState } from "@/components/common/StateViews";

interface AnalyticsData {
  categories: { categoryId: string; name: string }[];
  people: { personId: string; name: string }[];
  addedOverTime: { date: string; count: number }[];
  completedOverTime: { date: string; count: number }[];
  progressByPerson: {
    personId: string;
    name: string;
    NOT_STARTED: number;
    IN_PROGRESS: number;
    DONE: number;
    REVISED: number;
  }[];
  progressBySubject: {
    categoryId: string;
    name: string;
    NOT_STARTED: number;
    IN_PROGRESS: number;
    DONE: number;
    REVISED: number;
  }[];
  completedVsPending: {
    NOT_STARTED: number;
    IN_PROGRESS: number;
    DONE: number;
    REVISED: number;
  };
}

const PIE_COLORS = ["#EB5953", "#F3BF39", "#46AF6A", "#CB41A2"];
const STATUS_LABELS = ["Not Started", "In Progress", "Done", "Revised"];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const result = await apiGet<AnalyticsData>("/api/analytics");
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) return <LoadingState label="Loading analytics..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return null;

  const hasAnyData =
    data.addedOverTime.length > 0 ||
    data.completedOverTime.length > 0 ||
    data.progressByPerson.length > 0;

  if (!hasAnyData) {
    return (
      <EmptyState title="No analytics yet" description="Add some questions to see analytics here." />
    );
  }

  const pieData = STATUS_LABELS.map((label, i) => ({
    name: label,
    value: Object.values(data.completedVsPending)[i],
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="text-sm text-slate-500">
          Charts adapt automatically to any subject or person you add.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Questions Added Over Time">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.addedOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#25A6EE" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Questions Completed Over Time">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.completedOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#46AF6A" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Progress by Person">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.progressByPerson}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="DONE" stackId="a" fill="#46AF6A" name="Done" />
              <Bar dataKey="IN_PROGRESS" stackId="a" fill="#F3BF39" name="In Progress" />
              <Bar dataKey="REVISED" stackId="a" fill="#CB41A2" name="Revised" />
              <Bar dataKey="NOT_STARTED" stackId="a" fill="#EB5953" name="Not Started" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Progress by Subject">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.progressBySubject}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="DONE" stackId="a" fill="#46AF6A" name="Done" />
              <Bar dataKey="IN_PROGRESS" stackId="a" fill="#F3BF39" name="In Progress" />
              <Bar dataKey="REVISED" stackId="a" fill="#CB41A2" name="Revised" />
              <Bar dataKey="NOT_STARTED" stackId="a" fill="#EB5953" name="Not Started" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Completed vs Pending (Overall)">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={90} label>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
      {children}
    </div>
  );
}
