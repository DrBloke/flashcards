import { z } from "zod";

export const milestoneSchema = z.object({
  minTimeSinceLastMilestone: z.number().nullable(), // seconds
  numberOfSessions: z.number(),
  minTimeBetweenSessions: z.number().nullable(), // seconds
  maxTimeBetweenSessions: z.number().nullable(), // seconds
});

export const learningScheduleSchema = z.array(milestoneSchema);

export type Milestone = z.infer<typeof milestoneSchema>;
export type LearningSchedule = z.infer<typeof learningScheduleSchema>;

export const DEFAULT_LEARNING_SCHEDULE: LearningSchedule = [
  {
    minTimeSinceLastMilestone: 0,
    numberOfSessions: 5,
    minTimeBetweenSessions: 3600, // 1 hour
    maxTimeBetweenSessions: 10800, // 3 hours
  },
  {
    minTimeSinceLastMilestone: 28800, // 8 hours
    numberOfSessions: 3,
    minTimeBetweenSessions: 3600,
    maxTimeBetweenSessions: 18000, // 5 hours
  },
  {
    minTimeSinceLastMilestone: 115200, // 32 hours? (from user notes)
    numberOfSessions: 2,
    minTimeBetweenSessions: 3600,
    maxTimeBetweenSessions: 36000, // 10 hours
  },
  {
    minTimeSinceLastMilestone: 172800, // 2 days
    numberOfSessions: 1,
    minTimeBetweenSessions: null,
    maxTimeBetweenSessions: null,
  },
  {
    minTimeSinceLastMilestone: 259200, // 3 days
    numberOfSessions: 1,
    minTimeBetweenSessions: null,
    maxTimeBetweenSessions: null,
  },
  {
    minTimeSinceLastMilestone: 604800, // 7 days
    numberOfSessions: 1,
    minTimeBetweenSessions: null,
    maxTimeBetweenSessions: null,
  },
  {
    minTimeSinceLastMilestone: 1209600, // 14 days
    numberOfSessions: 1,
    minTimeBetweenSessions: null,
    maxTimeBetweenSessions: null,
  },
  {
    minTimeSinceLastMilestone: 2592000, // 30 days
    numberOfSessions: 1,
    minTimeBetweenSessions: null,
    maxTimeBetweenSessions: null,
  },
];
