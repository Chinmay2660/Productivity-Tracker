import type { IndexDescription } from "mongodb";
import type { Model } from "mongoose";

/** Legacy indexes from before mock rounds — block per-round slot/session rows. */
const STALE_INDEXES: Record<string, string[]> = {
  mockinterviewslots: ["groupId_1_intervieweeId_1"],
  mockinterviewsessions: ["groupId_1_intervieweeId_1"],
};

/** syncIndexes() must not run on these — it fights manual partial-index setup. */
const MANUAL_INDEX_COLLECTIONS = new Set(["practicequestions"]);

const PRACTICE_QUESTION_INDEXES: IndexDescription[] = [
  { key: { userId: 1, groupId: 1 }, name: "userId_1_groupId_1", background: true },
  { key: { groupId: 1, scope: 1 }, name: "groupId_1_scope_1", background: true },
  { key: { groupId: 1, practiceDate: 1 }, name: "groupId_1_practiceDate_1", background: true },
  { key: { userId: 1, practiceDate: 1 }, name: "userId_1_practiceDate_1", background: true },
  {
    key: { userId: 1, sourceGroupQuestionId: 1 },
    name: "userId_1_sourceGroupQuestionId_1",
    unique: true,
    background: true,
    partialFilterExpression: { sourceGroupQuestionId: { $type: "objectId" } },
  },
];

async function dropStaleIndexes(model: Model<unknown>): Promise<void> {
  const collection = model.collection;
  const stale = STALE_INDEXES[collection.collectionName] ?? [];
  if (stale.length === 0) return;

  const indexes = await collection.indexes();
  for (const name of stale) {
    if (indexes.some((i) => i.name === name)) {
      await collection.dropIndex(name);
    }
  }
}

async function ensurePracticeQuestionIndexes(model: Model<unknown>): Promise<void> {
  const collection = model.collection;
  let indexes = await collection.indexes();

  const personalCopyIndex = indexes.find((i) => i.name === "userId_1_sourceGroupQuestionId_1");
  if (personalCopyIndex && !personalCopyIndex.partialFilterExpression) {
    await collection.dropIndex("userId_1_sourceGroupQuestionId_1");
    indexes = await collection.indexes();
  }

  for (const spec of PRACTICE_QUESTION_INDEXES) {
    const existing = indexes.find((i) => i.name === spec.name);
    if (spec.name === "userId_1_sourceGroupQuestionId_1") {
      if (existing?.partialFilterExpression) continue;
    } else if (existing) {
      continue;
    }

    await collection.createIndex(spec.key, {
      name: spec.name,
      unique: spec.unique,
      background: spec.background,
      partialFilterExpression: spec.partialFilterExpression,
    });
  }
}

async function syncModelIndexes(model: Model<unknown>): Promise<void> {
  await dropStaleIndexes(model);

  if (MANUAL_INDEX_COLLECTIONS.has(model.collection.collectionName)) {
    await ensurePracticeQuestionIndexes(model);
    return;
  }

  await model.syncIndexes();
}

export function isDuplicateKeyError(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  if ((err as { code?: number }).code === 11000) return true;
  const writeErrors = (err as { writeErrors?: { code?: number }[] }).writeErrors;
  return writeErrors?.some((e) => e.code === 11000) ?? false;
}

let mockInterviewIndexesReady: Promise<void> | null = null;

/** Fast path before mock slot/session writes — drops legacy groupId+intervieweeId indexes. */
export async function ensureMockInterviewIndexes(): Promise<void> {
  if (!mockInterviewIndexesReady) {
    mockInterviewIndexesReady = (async () => {
      const [{ default: MockInterviewSlot }, { default: MockInterviewSession }] =
        await Promise.all([
          import("@/models/MockInterviewSlot"),
          import("@/models/MockInterviewSession"),
        ]);
      await syncModelIndexes(MockInterviewSlot as Model<unknown>);
      await syncModelIndexes(MockInterviewSession as Model<unknown>);
    })().catch((err) => {
      mockInterviewIndexesReady = null;
      throw err;
    });
  }
  await mockInterviewIndexesReady;
}

let databaseIndexesReady: Promise<void> | null = null;

export async function ensureDatabaseIndexes(): Promise<void> {
  if (!databaseIndexesReady) {
    databaseIndexesReady = (async () => {
      const [
        { default: MockInterviewSlot },
        { default: MockInterviewSession },
        { default: MockInterviewRound },
        { default: MockInterview },
        { default: QuestionProgress },
        { default: PrepTask },
        { default: PracticeQuestion },
        { default: PreparationPlan },
        { default: TopicProgress },
      ] = await Promise.all([
        import("@/models/MockInterviewSlot"),
        import("@/models/MockInterviewSession"),
        import("@/models/MockInterviewRound"),
        import("@/models/MockInterview"),
        import("@/models/QuestionProgress"),
        import("@/models/PrepTask"),
        import("@/models/PracticeQuestion"),
        import("@/models/PreparationPlan"),
        import("@/models/TopicProgress"),
      ]);

      const models = [
        MockInterviewSlot,
        MockInterviewSession,
        MockInterviewRound,
        MockInterview,
        QuestionProgress,
        PrepTask,
        PracticeQuestion,
        PreparationPlan,
        TopicProgress,
      ];

      for (const model of models) {
        try {
          await syncModelIndexes(model as Model<unknown>);
        } catch (err) {
          console.error(
            `[db-indexes] failed for ${model.collection.collectionName}:`,
            err instanceof Error ? err.message : err
          );
        }
      }
    })();
  }
  await databaseIndexesReady;
}
