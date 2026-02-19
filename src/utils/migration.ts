import { type LearningSchedule } from "../schemas/learningSchedule";

export function migrateDecks(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  allData: any,
  setPath: string,
  newSchedule: LearningSchedule,
) {
  const setData = allData[setPath];
  if (!setData || !setData.decks) return false;

  let hasChanges = false;

  for (const deckId in setData.decks) {
    const deckData = setData.decks[deckId];
    if (!deckData.learningLog || deckData.learningLog.length === 0) continue;

    const lastEntry = deckData.learningLog[deckData.learningLog.length - 1];
    let { milestoneIndex, sessionIndex } = lastEntry;
    let entryChanged = false;

    // 1. Clamp milestone index if it exceeds the new schedule length
    // If it moves beyond schedule, clamp to schedule.length (Ingrained)
    // Note: We clamp to 'length' so they are marked as ingrained/complete, rather than 'length-1' which forces them to repeat the last level.
    if (milestoneIndex > newSchedule.length) {
      milestoneIndex = newSchedule.length;
      entryChanged = true;
    }

    const isIngrained = milestoneIndex >= newSchedule.length;

    if (!isIngrained) {
      // Case: User is within the schedule (Active)

      // 2. Transition from Ingrained -> Active (New levels added)
      // Detected by null nextReview (Ingrained) but now index is valid
      if (lastEntry.nextReview === null) {
        const milestone = newSchedule[milestoneIndex];
        const expectedWait = milestone.minTimeSinceLastMilestone || 0;
        lastEntry.nextReview = lastEntry.endTime + expectedWait * 1000;
        sessionIndex = 0; // Restart session count for the new level
        entryChanged = true;
      } else {
        // 3. Standard Active Updates (Recalculate waits, clamp sessions)

        const milestone = newSchedule[milestoneIndex];
        // Clamp session index if current milestone sessions reduced
        if (milestone && sessionIndex >= milestone.numberOfSessions) {
          sessionIndex = milestone.numberOfSessions - 1;
          entryChanged = true;
        }

        // Recalculate nextReview based on new wait times
        let expectedWait = 0;
        if (sessionIndex === 0) {
          expectedWait = milestone.minTimeSinceLastMilestone || 0;
        } else {
          expectedWait = milestone.minTimeBetweenSessions || 0;
        }

        const newNextReview = lastEntry.endTime + expectedWait * 1000;
        // Check if the change is significant (> 1s)
        if (Math.abs(newNextReview - lastEntry.nextReview) > 1000) {
          lastEntry.nextReview = newNextReview;
          entryChanged = true;
        }
      }
    }
    // Else: User is Ingrained. No updates needed unless we want to enforce nextReview=null?
    // Usually ingrained cards have nextReview=null. If they had a date, we might clear it?
    // But let's leave as is for now to minimize side effects.

    if (entryChanged) {
      lastEntry.milestoneIndex = milestoneIndex;
      lastEntry.sessionIndex = sessionIndex;
      hasChanges = true;
    }
  }

  return hasChanges;
}
