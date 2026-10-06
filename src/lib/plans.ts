import { addIstDays, startOfDay } from "./utils";

export function generatePreparationPlan(input: {
  subjects: { _id: string; name: string; topics: { _id: string; name: string }[] }[];
  interviewDate: Date;
  dailyStudyMinutes: number;
}): { dayNumber: number; date: string; items: { subjectId: string; topicId?: string; label: string; estimatedMinutes: number; completed: boolean }[] }[] {
  const days: ReturnType<typeof generatePreparationPlan> = [];
  const start = startOfDay(new Date());
  const end = startOfDay(input.interviewDate);
  const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));
  const planDays = Math.min(totalDays, 14);

  const units: { subjectId: string; topicId?: string; label: string; minutes: number }[] = [];
  for (const subject of input.subjects) {
    if (subject.topics.length === 0) {
      units.push({ subjectId: subject._id, label: subject.name, minutes: 60 });
    } else {
      for (const topic of subject.topics) {
        units.push({
          subjectId: subject._id,
          topicId: topic._id,
          label: `${subject.name} — ${topic.name}`,
          minutes: 45,
        });
      }
    }
  }

  for (let d = 0; d < planDays; d++) {
    const date = addIstDays(start, d);
    const dayItems: (typeof days)[0]["items"] = [];
    let dayBudget = input.dailyStudyMinutes;

    while (units.length > 0 && dayBudget >= 30) {
      const unit = units.shift()!;
      const minutes = Math.min(unit.minutes, dayBudget);
      dayItems.push({
        subjectId: unit.subjectId,
        topicId: unit.topicId,
        label: unit.label,
        estimatedMinutes: minutes,
        completed: false,
      });
      dayBudget -= minutes;
    }

    days.push({
      dayNumber: d + 1,
      date: date.toISOString(),
      items: dayItems,
    });
  }

  return days;
}
