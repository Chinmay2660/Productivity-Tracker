"use client";

import Card, { CardHeader } from "@/components/ui/Card";
import SubjectCompletionChart from "@/components/analytics/d3/SubjectCompletionChart";
import MockScoresChart from "@/components/analytics/d3/MockScoresChart";
import type { AnalyticsData } from "@/types";

interface AnalyticsChartsProps {
  data: AnalyticsData;
}

export default function AnalyticsCharts({ data }: AnalyticsChartsProps) {
  const subjectChart = (data.subjectCompletion ?? []).map((d) => ({
    label: d.name,
    value: d.percent,
  }));

  const mockChart = (data.mockInterviewScores ?? []).map((d) => ({
    label: d.date,
    value: d.score,
    subject: d.subject,
  }));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader title="Subject Completion" />
        <div className="h-56">
          <SubjectCompletionChart data={subjectChart} />
        </div>
      </Card>

      {mockChart.length > 0 && (
        <Card>
          <CardHeader title="Mock Interview Scores" />
          <div className="h-56">
            <MockScoresChart data={mockChart} />
          </div>
        </Card>
      )}
    </div>
  );
}
