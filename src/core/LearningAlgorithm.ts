import {
  type LearningSchedule,
  type Milestone,
} from "../schemas/learningSchedule";
import { type LearningLogEntry } from "../schemas/storage";
import { formatDuration } from "../utils/time";

export type DeckStatusState =
  | "new"
  | "due"
  | "overdue"
  | "scheduled"
  | "ingrained";

export interface DeckStatus {
  state: DeckStatusState;
  label: string;
  milestoneIndex: number;
  sessionIndex: number;
  totalSessions: number;
  milestoneDescription: string;
  nextReview: number | null;
  isIngrained: boolean;
}

export interface SessionResult {
  nextMilestoneIndex: number;
  nextSessionIndex: number;
  nextReview: number | null;
  isIngrained: boolean;
  isRepeatingMilestone: boolean;
  showDemotionChoice: boolean;
  score: number;
}

export class LearningAlgorithm {
  /**
   * Calculates the current status of a deck based on its learning log and schedule.
   */
  static getDeckStatus(
    learningLog: LearningLogEntry[],
    schedule: LearningSchedule,
  ): DeckStatus {
    if (!learningLog || learningLog.length === 0) {
      const currentMilestone = schedule[0];
      return {
        state: "new",
        label: "Ready",
        milestoneIndex: 0,
        sessionIndex: 0,
        totalSessions: currentMilestone.numberOfSessions,
        milestoneDescription: this.getMilestoneDescription(currentMilestone),
        nextReview: null,
        isIngrained: false,
      };
    }

    const lastEntry = learningLog[learningLog.length - 1];
    const now = Date.now();
    const nextReview = lastEntry.nextReview;
    const isDue = nextReview === null || now >= nextReview;

    let targetMilestoneIndex = lastEntry.milestoneIndex;
    let targetSessionIndex = lastEntry.sessionIndex;
    let isIngrained = false;

    // Ingrained detection
    // If we finished the last session of the last milestone
    if (targetMilestoneIndex >= schedule.length) {
      isIngrained = true;
    } else if (
      targetMilestoneIndex === schedule.length - 1 &&
      schedule[targetMilestoneIndex] &&
      targetSessionIndex ===
        schedule[targetMilestoneIndex].numberOfSessions - 1 &&
      lastEntry.nextReview === null &&
      !lastEntry.isExtra
    ) {
      isIngrained = true;
    } else if (lastEntry.isExtra && lastEntry.nextReview === null) {
      // Using the logic that if we are at max milestone index, we are ingrained
      if (targetMilestoneIndex >= schedule.length - 1) {
        const m = schedule[Math.min(targetMilestoneIndex, schedule.length - 1)];
        if (m && targetSessionIndex >= m.numberOfSessions - 1) {
          isIngrained = true;
        }
      }
    }

    if (isIngrained) {
      const lastMilestone = schedule[schedule.length - 1];
      return {
        state: "ingrained",
        label: "Ingrained",
        milestoneIndex: schedule.length,
        sessionIndex: lastMilestone.numberOfSessions,
        totalSessions: lastMilestone.numberOfSessions,
        milestoneDescription: "Fully ingrained into memory.",
        nextReview: null,
        isIngrained: true,
      };
    }

    // Determine next session target
    if (targetMilestoneIndex === -1) {
      targetMilestoneIndex = 0;
      targetSessionIndex = 0;
    } else if (lastEntry.isExtra) {
      // Stay at the same index if it was an extra session
      // But we need to ensure we don't return an invalid index if logical progression happened elsewhere?
      // For now, assume extra sessions don't advance the "next" pointer unless logic elsewhere updates it.
      // Actually, if we just finished an extra session, the "next" session to do is the SAME one we just did (or completed).
    } else if (
      targetSessionIndex <
      schedule[targetMilestoneIndex].numberOfSessions - 1
    ) {
      targetSessionIndex++;
    } else {
      // Move to next milestone
      targetMilestoneIndex = Math.min(
        targetMilestoneIndex + 1,
        schedule.length - 1,
      );
      targetSessionIndex = 0;
    }

    // Safety clamp (though should be handled by logic above)
    targetMilestoneIndex = Math.min(targetMilestoneIndex, schedule.length - 1);

    // Check for overdue
    let isOverdue = false;
    // We look at the LAST entry to see if we are overdue for the NEXT one?
    // The simplified logic from DeckList:
    const milestoneInLog = schedule[lastEntry.milestoneIndex];
    if (milestoneInLog && !lastEntry.isExtra) {
      // Determining if the *current wait* is overdue
      // We only track overdue if we are within a multi-session milestone?
      // DeckList logic:
      if (lastEntry.sessionIndex < milestoneInLog.numberOfSessions - 1) {
        if (milestoneInLog.maxTimeBetweenSessions !== null) {
          const overdueTime =
            lastEntry.endTime + milestoneInLog.maxTimeBetweenSessions * 1000;
          if (now > overdueTime) isOverdue = true;
        }
      }
    }

    let state: DeckStatusState = isDue ? "due" : "scheduled";
    if (isOverdue) state = "overdue";

    // Re-verify ingrained if we somehow advanced past end?
    // No, logic above handles "ingrained" return already.

    const currentMilestone = schedule[targetMilestoneIndex];

    return {
      state,
      label:
        state === "due" ? "Due" : state === "overdue" ? "Overdue" : "Scheduled",
      milestoneIndex: targetMilestoneIndex,
      sessionIndex: targetSessionIndex,
      totalSessions: currentMilestone.numberOfSessions,
      milestoneDescription: this.getMilestoneDescription(currentMilestone),
      nextReview: nextReview,
      isIngrained: false,
    };
  }

  /**
   * Calculates the result of a completed session.
   */
  static calculateSessionResult(
    currentMilestoneIndex: number,
    currentSessionIndex: number,
    score: number,
    schedule: LearningSchedule,
    endTime: number,
  ): SessionResult {
    const totalMilestones = schedule.length;
    // Clamp index
    const effectiveMilestoneIndex = Math.min(
      currentMilestoneIndex,
      totalMilestones - 1,
    );
    const currentMilestone = schedule[effectiveMilestoneIndex];

    let nextMilestoneIndex = currentMilestoneIndex;
    let nextSessionIndex = currentSessionIndex;
    let isRepeatingMilestone = false;
    let isIngrained = false;

    // Check if we are at the end of the current milestone structure
    const isEndOfMilestone =
      currentSessionIndex === currentMilestone.numberOfSessions - 1;

    // Logic for advancing or repeating
    if (isEndOfMilestone) {
      if (score >= 0.9) {
        nextMilestoneIndex = currentMilestoneIndex + 1;
        nextSessionIndex = 0;
      } else if (score >= 0.4) {
        isRepeatingMilestone = true;
        nextSessionIndex = 0; // Repeat from start of milestone?

        if (score >= 0.4 && score < 0.9) {
          isRepeatingMilestone = true;
          // If repeating, we stay at same milestone, session 0.
          nextMilestoneIndex = currentMilestoneIndex;
          nextSessionIndex = 0; // Or do we repeat the *last* session? Usually repeat whole milestone.
        }
      } else {
        // Not end of milestone, simply advance session
        nextSessionIndex = currentSessionIndex + 1;
      }
    }

    // Check ingrained status
    // If we advanced PAST the last milestone
    if (nextMilestoneIndex >= totalMilestones) {
      isIngrained = true;
      // Cap it for safety if needed, but ">= length" is the signal
    }

    // Calculate Next Review Time
    let nextReview: number | null = null;

    if (isIngrained) {
      nextReview = null;
    } else {
      const nextMilestone =
        schedule[Math.min(nextMilestoneIndex, totalMilestones - 1)];

      if (nextMilestoneIndex > currentMilestoneIndex) {
        // Advancing to new milestone
        if (nextMilestone.minTimeSinceLastMilestone !== null) {
          nextReview = endTime + nextMilestone.minTimeSinceLastMilestone * 1000;
        } else {
          nextReview = endTime; // default?
        }
      } else if (isRepeatingMilestone) {
        nextReview = endTime; // Repeat immediately?
      } else {
        // Advancing within milestone
        if (currentMilestone.minTimeBetweenSessions !== null) {
          nextReview = endTime + currentMilestone.minTimeBetweenSessions * 1000;
        } else {
          nextReview = endTime;
        }
      }
    }

    return {
      nextMilestoneIndex,
      nextSessionIndex,
      nextReview,
      isIngrained,
      isRepeatingMilestone,
      showDemotionChoice: isEndOfMilestone && score < 0.4,
      score,
    };
  }

  static getMilestoneDescription(milestone: Milestone): string {
    const {
      numberOfSessions,
      minTimeBetweenSessions,
      minTimeSinceLastMilestone,
    } = milestone;

    let desc = `${numberOfSessions} session${numberOfSessions > 1 ? "s" : ""}`;

    if (numberOfSessions > 1 && minTimeBetweenSessions) {
      // Helper needed for formatting duration, we can keep using date-fns or our util
      const waitTime = this.formatDuration(minTimeBetweenSessions);
      desc += ` with at least ${waitTime} between each`;
    }

    if (minTimeSinceLastMilestone && minTimeSinceLastMilestone > 0) {
      const waitTime = this.formatDuration(minTimeSinceLastMilestone);
      desc += ` (after ${waitTime} wait)`;
    }

    return desc;
  }

  private static formatDuration(seconds: number): string {
    return formatDuration(seconds);
  }
}
