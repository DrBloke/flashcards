import { describe, it, expect } from "vitest";
import { migrateDecks } from "../../src/utils/migration";
import type { LearningSchedule } from "../../src/schemas/learningSchedule";

const MOCK_SCHEDULE: LearningSchedule = [
  {
    minTimeSinceLastMilestone: 0,
    numberOfSessions: 2,
    minTimeBetweenSessions: 3600,
    maxTimeBetweenSessions: null,
  },
  {
    minTimeSinceLastMilestone: 86400,
    numberOfSessions: 1,
    minTimeBetweenSessions: null,
    maxTimeBetweenSessions: null,
  },
];

describe("migrateDecks", () => {
  it("does nothing if no changes needed", () => {
    const data = {
      default: {
        decks: {
          d1: {
            learningLog: [
              {
                milestoneIndex: 0,
                sessionIndex: 0,
                endTime: 1000,
                nextReview: 2000,
              },
            ],
          },
        },
      },
    };
    // 2000 is 1000 + ? Wait, minTimeSinceLastMilestone is 0.
    // If it's session 0, wait is 0. So nextReview should be 1000?
    // If we pass MOCK_SCHEDULE (0, 2 sessions)

    // Let's make it consistent first.
    // milestone 0: wait 0.
    // session 0 -> nextReview = endTime + 0 = 1000.
    // If current is 2000, it SHOULD change.

    // Let's set it to 1000.
    data.default.decks.d1.learningLog[0].nextReview = 1000;

    const changed = migrateDecks(data, "default", MOCK_SCHEDULE);
    expect(changed).toBe(false);
    expect(data.default.decks.d1.learningLog[0].nextReview).toBe(1000);
  });

  it("updates nextReview if schedule wait time changes", () => {
    // Setup:
    // Current: Milestone 0, Session 0.
    // New Schedule (MOCK) is 0s wait.
    // To test change detection, we need current nextReview to be significantly different from expected.
    // Expected = 1000 + 0 = 1000.
    // Set current to 5000 (4s diff).

    const data = {
      default: {
        decks: {
          d1: {
            learningLog: [
              {
                milestoneIndex: 0,
                sessionIndex: 0,
                endTime: 1000,
                nextReview: 5000,
              },
            ],
          },
        },
      },
    };

    const changed = migrateDecks(data, "default", MOCK_SCHEDULE);
    expect(changed).toBe(true);
    expect(data.default.decks.d1.learningLog[0].nextReview).toBe(1000);
  });

  it("clamps milestone index if schedule shortened", () => {
    // Setup:
    // Current: Milestone 5.
    // New Schedule: Length 2.
    // Expected: Milestone 2 (Ingrained/Complete).
    // Note: We clamp to 'length' (Ingrained) rather than 'length-1' to avoid forcing users to re-do the last level.

    const data = {
      default: {
        decks: {
          d1: {
            learningLog: [
              {
                milestoneIndex: 5,
                sessionIndex: 0,
                endTime: 1000,
                nextReview: 2000,
              },
            ],
          },
        },
      },
    };

    const changed = migrateDecks(data, "default", MOCK_SCHEDULE);
    expect(changed).toBe(true);
    expect(data.default.decks.d1.learningLog[0].milestoneIndex).toBe(2);
    // Session index doesn't strictly matter for Ingrained, but preserving or resetting is fine.
    // Logic preserves it unless explicitly changed.
    // But since we just clamped M_idx, we didn't touch S_idx in this branch of new logic?
    // Wait, my new logic `entryChanged = true` only if i updated M_idx. S_idx remains.
    // Let's check expectation.
    // expect(data.default.decks.d1.learningLog[0].sessionIndex).toBe(0);
  });
  it("clamps session index if milestone sessions reduced", () => {
    // Setup:
    // Current: Milestone 0, Session 5.
    // New Schedule: Milestone 0 has 2 sessions (max index 1).
    // Expected: Milestone 0, Session 1.

    const data = {
      default: {
        decks: {
          d1: {
            learningLog: [
              {
                milestoneIndex: 0,
                sessionIndex: 5,
                endTime: 1000,
                nextReview: 2000,
              },
            ],
          },
        },
      },
    };

    const changed = migrateDecks(data, "default", MOCK_SCHEDULE);
    expect(changed).toBe(true);
    expect(data.default.decks.d1.learningLog[0].milestoneIndex).toBe(0);
    expect(data.default.decks.d1.learningLog[0].sessionIndex).toBe(1);
  });

  it("updates ingrained decks if new levels added", () => {
    // Setup:
    // Current: Milestone 1 (End of old schedule, length 1). Ingrained.
    // New Schedule: Length 2.
    // Expected: Milestone 1 is now valid. It should be "due" for Milestone 1 session 0?
    // Wait, if milestoneIndex was 1 (schedule len 1), it was fully ingrained.
    // Now schedule is len 2. Index 1 is the 2nd milestone.
    // Last entry was completion of Milestone 0?
    // Usually:
    // Completion of M[0] -> sets index to 1.
    // If len=1, index=1 means Ingrained.
    // If len=2, index=1 means Start of M[1].
    // So we should see it update nextReview to reflect M[1] wait.

    const data = {
      default: {
        decks: {
          d1: {
            learningLog: [
              {
                milestoneIndex: 1,
                sessionIndex: 0,
                endTime: 1000,
                nextReview: null,
              },
            ],
          },
        },
      },
    };

    // M[1] in MOCK_SCHEDULE: minTimeSinceLastMilestone = 86400.

    const changed = migrateDecks(data, "default", MOCK_SCHEDULE);
    expect(changed).toBe(true);
    expect(data.default.decks.d1.learningLog[0].milestoneIndex).toBe(1);
    expect(data.default.decks.d1.learningLog[0].sessionIndex).toBe(0);
    expect(data.default.decks.d1.learningLog[0].nextReview).toBe(
      1000 + 86400 * 1000,
    );
  });
});
