import { describe, it, expect } from "vitest";
import { LearningAlgorithm } from "./LearningAlgorithm";
import { DEFAULT_LEARNING_SCHEDULE } from "../schemas/learningSchedule";
import type { LearningLogEntry } from "../schemas/storage";

describe("LearningAlgorithm", () => {
  describe("getDeckStatus", () => {
    it("should return 'new' state for empty log", () => {
      const status = LearningAlgorithm.getDeckStatus(
        [],
        DEFAULT_LEARNING_SCHEDULE,
      );
      expect(status.state).toBe("new");
      expect(status.milestoneIndex).toBe(0);
      expect(status.sessionIndex).toBe(0);
    });

    it("should return 'scheduled' when not due yet", () => {
      const future = Date.now() + 100000;
      const log: LearningLogEntry[] = [
        {
          milestoneIndex: 0,
          sessionIndex: 0,
          startTime: Date.now() - 2000,
          endTime: Date.now() - 1000,
          nextReview: future,
          isExtra: false,
          missedCount: 0,
        },
      ];
      const status = LearningAlgorithm.getDeckStatus(
        log,
        DEFAULT_LEARNING_SCHEDULE,
      );
      expect(status.state).toBe("scheduled");
      expect(status.nextReview).toBe(future);
    });

    it("should return 'due' when past nextReview", () => {
      const past = Date.now() - 100000;
      const log: LearningLogEntry[] = [
        {
          milestoneIndex: 0,
          sessionIndex: 0,
          startTime: Date.now() - 200000,
          endTime: Date.now() - 199000,
          nextReview: past,
          isExtra: false,
          missedCount: 0,
        },
      ];
      const status = LearningAlgorithm.getDeckStatus(
        log,
        DEFAULT_LEARNING_SCHEDULE,
      );
      expect(status.state).toBe("due");
    });

    it("should handle 'ingrained' status", () => {
      // Mock a schedule with 1 milestone for simplicity
      const schedule = [
        { ...DEFAULT_LEARNING_SCHEDULE[0], numberOfSessions: 1 },
      ];
      const log: LearningLogEntry[] = [
        {
          milestoneIndex: 0,
          sessionIndex: 0,
          startTime: Date.now() - 1000,
          endTime: Date.now(),
          nextReview: null, // Ingrained signal
          isExtra: false,
          missedCount: 0,
        },
      ];

      const status = LearningAlgorithm.getDeckStatus(log, schedule);
      expect(status.state).toBe("ingrained");
      expect(status.isIngrained).toBe(true);
    });
  });

  describe("calculateSessionResult", () => {
    it("should advance to next session within milestone", () => {
      const schedule = [
        { ...DEFAULT_LEARNING_SCHEDULE[0], numberOfSessions: 3 },
      ];
      // Current: Milestone 0, Session 0. Score 1.0 (Perfect)
      const result = LearningAlgorithm.calculateSessionResult(
        0,
        0,
        1.0,
        schedule,
        Date.now(),
      );

      expect(result.nextMilestoneIndex).toBe(0);
      expect(result.nextSessionIndex).toBe(1);
      expect(result.showDemotionChoice).toBe(false);
    });

    it("should advance to next milestone after completing last session with high score", () => {
      const schedule = [
        { ...DEFAULT_LEARNING_SCHEDULE[0], numberOfSessions: 1 },
        { ...DEFAULT_LEARNING_SCHEDULE[1], numberOfSessions: 1 },
      ];
      // Current: Milestone 0, Session 0 (Last). Score 1.0
      const result = LearningAlgorithm.calculateSessionResult(
        0,
        0,
        1.0,
        schedule,
        Date.now(),
      );

      expect(result.nextMilestoneIndex).toBe(1);
      expect(result.nextSessionIndex).toBe(0);
    });

    it("should repeat milestone if score is low but not terrible at end of milestone", () => {
      const schedule = [
        { ...DEFAULT_LEARNING_SCHEDULE[0], numberOfSessions: 1 },
      ];
      // Current: Milestone 0, Session 0. Score 0.5
      const result = LearningAlgorithm.calculateSessionResult(
        0,
        0,
        0.5,
        schedule,
        Date.now(),
      );

      expect(result.isRepeatingMilestone).toBe(true);
      expect(result.nextMilestoneIndex).toBe(0);
      expect(result.nextSessionIndex).toBe(0);
      expect(result.showDemotionChoice).toBe(false);
    });

    it("should show demotion choice if score is very low at end of milestone", () => {
      const schedule = [
        { ...DEFAULT_LEARNING_SCHEDULE[0], numberOfSessions: 1 },
      ];
      // Current: Milestone 0, Session 0. Score 0.2
      const result = LearningAlgorithm.calculateSessionResult(
        0,
        0,
        0.2,
        schedule,
        Date.now(),
      );

      // Interpreting logic: < 0.4 triggers demotion choice
      expect(result.showDemotionChoice).toBe(true);
    });

    it("should detect ingrained status when advancing past last milestone", () => {
      const schedule = [
        { ...DEFAULT_LEARNING_SCHEDULE[0], numberOfSessions: 1 },
      ];
      // Current: Milestone 0, Session 0. Score 1.0. Next would be index 1.
      const result = LearningAlgorithm.calculateSessionResult(
        0,
        0,
        1.0,
        schedule,
        Date.now(),
      );

      expect(result.nextMilestoneIndex).toBe(1);
      expect(result.isIngrained).toBe(true);
      expect(result.nextReview).toBe(null);
    });
  });
});
