import type { ReactiveController, ReactiveControllerHost } from "lit";
import { z } from "zod";
import { deckSchema } from "../schemas/deck";
import { deckSessionSchema, type LearningLogEntry } from "../schemas/storage";
import { DEFAULT_LEARNING_SCHEDULE } from "../schemas/learningSchedule";
import { FlashcardStorage } from "./FlashcardStorage";
import { LearningAlgorithm } from "./LearningAlgorithm";

export class FlashcardSession implements ReactiveController {
  host: ReactiveControllerHost;

  deckId: string = "";
  setPath: string = "";
  deck?: z.infer<typeof deckSchema>;

  // Settings
  deckIsReversed = false;
  totalRounds = 3;

  // Session State
  remainingCards: z.infer<typeof deckSchema>["cards"] = [];
  doneCards: z.infer<typeof deckSchema>["cards"] = [];
  wrongFirstTime: number[] = [];
  currentRound = 0;
  sessionInitialized = false;
  sessionCompleted = false;
  startTime: number = 0;
  endTime: number = 0;
  duration: number = 0;
  learningLog: LearningLogEntry[] = [];

  // Progression State
  milestoneIndex = 0;
  sessionIndex = 0;
  isDue = true;
  isExtraSession = false;
  score = 0;
  showDemotionChoice = false;
  sessionMissedCount = 0;
  sessionStarted = false;
  studyMode: "all" | "struggling" = "all";
  isNewMilestone = false;
  isIngrained = false;
  strugglingCount = 0;
  cardFontSizes: Record<number, number> = {};
  schedule = DEFAULT_LEARNING_SCHEDULE;

  get currentMilestone() {
    return this.schedule[
      Math.min(this.milestoneIndex, this.schedule.length - 1)
    ];
  }

  constructor(host: ReactiveControllerHost) {
    this.host = host;
    host.addController(this);
  }

  hostConnected() {}

  updateContext(
    deckId: string,
    setPath: string,
    deck?: z.infer<typeof deckSchema>,
  ) {
    this.deckId = deckId;
    this.setPath = setPath;
    this.deck = deck;

    if (this.deck && !this.sessionInitialized) {
      // Validate deck
      const result = deckSchema.safeParse(this.deck);
      if (result.success) {
        this.initializeSession();
        this.sessionInitialized = true;
        this.host.requestUpdate();
      } else {
        console.error("Invalid deck data:", result.error);
      }
    }
  }

  saveSession() {
    if (!this.deck || !this.setPath) return;
    const deckData: z.infer<typeof deckSessionSchema> = {
      currentRound: this.currentRound,
      wrongFirstTime: this.wrongFirstTime,
      learningLog: this.learningLog,
      cardFontSizes: Object.fromEntries(
        Object.entries(this.cardFontSizes).map(([k, v]) => [k.toString(), v]),
      ),
    };
    FlashcardStorage.saveDeckData(this.setPath, this.deckId, deckData);
  }

  initializeSession() {
    if (!this.deck || !this.setPath) return;

    // Load Settings
    const settings = FlashcardStorage.getSettings(this.setPath);
    this.deckIsReversed = settings.reverseDeck === true;
    this.totalRounds = settings.totalRounds ?? 3;
    this.schedule = settings.learningSchedule || DEFAULT_LEARNING_SCHEDULE;

    // Load Progress
    const savedData = FlashcardStorage.loadDeckData(this.setPath, this.deckId);

    this.startTime = 0;
    this.endTime = 0;

    if (savedData) {
      this.learningLog = savedData.learningLog || [];
      this.wrongFirstTime = savedData.wrongFirstTime || [];
      this.currentRound = savedData.currentRound || 0;
      this.cardFontSizes = savedData.cardFontSizes
        ? Object.fromEntries(
            Object.entries(savedData.cardFontSizes).map(([k, v]) => [
              Number(k),
              v,
            ]),
          )
        : {};

      const status = LearningAlgorithm.getDeckStatus(
        this.learningLog,
        this.schedule,
      );

      this.milestoneIndex = status.milestoneIndex;
      this.sessionIndex = status.sessionIndex;
      this.isDue = status.state === "due" || status.state === "overdue"; // 'overdue' implies due
      this.isIngrained = status.state === "ingrained";

      // Re-align isDue for new/ingrained specifically if needed,
      // but LearningAlgorithm handles "new" (returns state='new')
      // and "ingrained" (state='ingrained').
      // FlashcardSession uses boolean flags.

      if (status.state === "new") {
        this.isDue = true;
      } else if (status.state === "ingrained") {
        this.isDue = false;
      } else if (status.state === "scheduled") {
        this.isDue = false;
      }
      // "overdue" -> isDue = true.
      // "due" -> isDue = true.
    } else {
      this.learningLog = [];
      this.wrongFirstTime = [];
      this.currentRound = 0;
      this.milestoneIndex = 0;
      this.sessionIndex = 0;
      this.isDue = true;
      this.isIngrained = false;
    }

    this.isNewMilestone = this.sessionIndex === 0;
    this.strugglingCount = this.wrongFirstTime.length;

    if (this.currentRound > 0) {
      this.startSession("all");
    }
  }

  startSession(mode: "all" | "struggling") {
    if (!this.deck || !this.setPath) return;
    this.studyMode = mode;
    this.sessionStarted = true;
    this.startTime = Date.now();

    if (this.isDue) {
      this.isExtraSession = false;
    } else {
      this.isExtraSession = true;
    }

    if (
      (!this.isExtraSession || this.isIngrained) &&
      this.currentRound === 0 &&
      mode === "all"
    ) {
      this.wrongFirstTime = [];
    }

    this.saveSession();

    let initialCards = [...this.deck.cards];
    if (this.currentRound > 0 || mode === "struggling") {
      initialCards = initialCards.filter((c) =>
        this.wrongFirstTime.includes(c.id),
      );
      if (initialCards.length === 0 && mode === "struggling") {
        initialCards = [...this.deck.cards];
        this.studyMode = "all";
      } else if (initialCards.length === 0 && this.currentRound > 0) {
        this.completeSession();
        this.host.requestUpdate();
        return;
      }
    }

    const allData = FlashcardStorage.getStoredData();
    const isShuffled = allData[this.setPath]?.settings?.shuffleDeck === true;
    if (isShuffled) {
      initialCards = this.shuffle(initialCards);
    }

    this.remainingCards = initialCards;
    this.host.requestUpdate();
  }

  shuffle(array: z.infer<typeof deckSchema>["cards"]) {
    const newArray = [...array];
    let currentIndex = newArray.length,
      randomIndex;
    while (currentIndex != 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [newArray[currentIndex], newArray[randomIndex]] = [
        newArray[randomIndex],
        newArray[currentIndex],
      ];
    }
    return newArray;
  }

  increaseFontSize() {
    const cardId = this.remainingCards[0]?.id;
    if (cardId === undefined) return;
    const currentSize = this.cardFontSizes[cardId] || 2.25;
    this.cardFontSizes = {
      ...this.cardFontSizes,
      [cardId]: currentSize + 0.1,
    };
    this.saveSession();
    this.host.requestUpdate();
  }

  decreaseFontSize() {
    const cardId = this.remainingCards[0]?.id;
    if (cardId === undefined) return;
    const currentSize = this.cardFontSizes[cardId] || 2.25;
    this.cardFontSizes = {
      ...this.cardFontSizes,
      [cardId]: Math.max(0.5, currentSize - 0.1),
    };
    this.saveSession();
    this.host.requestUpdate();
  }

  retryMilestone() {
    this.showDemotionChoice = false;
    this.sessionCompleted = false;
    this.sessionStarted = false;
    this.wrongFirstTime = [];
    this.saveSession();
    this.initializeSession();
    this.isDue = true;
    this.host.requestUpdate();
  }

  demoteToPreviousMilestone() {
    if (!this.deck || !this.setPath) return;
    this.showDemotionChoice = false;

    const lastEntry = this.learningLog[this.learningLog.length - 1];
    if (lastEntry) {
      const targetMilestoneIndex = this.milestoneIndex - 1;
      if (targetMilestoneIndex >= 0) {
        lastEntry.milestoneIndex = targetMilestoneIndex - 1;
        lastEntry.sessionIndex = 999;
        lastEntry.nextReview = Date.now();
        this.saveSession();

        this.sessionCompleted = false;
        this.sessionStarted = false;
        this.isDue = true;
        this.wrongFirstTime = [];
        this.initializeSession();
      }
    }
    this.host.requestUpdate();
  }

  markCorrect(card: z.infer<typeof deckSchema>["cards"][0]) {
    this.doneCards = [...this.doneCards, card];
    this.remainingCards = this.remainingCards.slice(1);

    if (
      (!this.isExtraSession || this.isIngrained) &&
      this.currentRound === 0 &&
      this.studyMode === "struggling"
    ) {
      this.wrongFirstTime = this.wrongFirstTime.filter((id) => id !== card.id);
      this.saveSession();
    }

    if (this.remainingCards.length === 0) {
      this.currentRound++;
      this.saveSession();

      if (this.currentRound >= this.totalRounds) {
        this.completeSession();
        this.host.requestUpdate();
        return;
      }

      const nextRoundCards = this.doneCards.filter((c) =>
        this.wrongFirstTime.includes(c.id),
      );

      if (this.currentRound > 0 && nextRoundCards.length === 0) {
        this.completeSession();
        this.host.requestUpdate();
        return;
      }

      this.remainingCards =
        this.currentRound > 0 ? nextRoundCards : this.doneCards;

      const allData = FlashcardStorage.getStoredData();
      const isShuffled = allData[this.setPath]?.settings?.shuffleDeck === true;
      if (isShuffled) {
        this.remainingCards = this.shuffle(this.remainingCards);
      }
      this.doneCards = [];
    }
    this.host.requestUpdate();
  }

  markIncorrect(card: z.infer<typeof deckSchema>["cards"][0]) {
    if (!this.wrongFirstTime.includes(card.id)) {
      this.wrongFirstTime = [...this.wrongFirstTime, card.id];
      this.saveSession();
    }
    this.remainingCards = this.remainingCards.slice(1).concat([card]);
    this.host.requestUpdate();
  }

  completeSession() {
    if (!this.deck || !this.setPath) return;
    this.endTime = Date.now();
    this.duration = this.endTime - this.startTime;

    const totalCards = this.deck.cards.length;
    const missedCount = this.wrongFirstTime.length;
    this.score = totalCards > 0 ? (totalCards - missedCount) / totalCards : 1;

    const settings = FlashcardStorage.getSettings(this.setPath);
    const schedule = settings.learningSchedule || DEFAULT_LEARNING_SCHEDULE;

    const result = LearningAlgorithm.calculateSessionResult(
      this.milestoneIndex,
      this.sessionIndex,
      this.score,
      schedule,
      this.endTime,
    );

    // Check for showDemotionChoice
    // NOTE: FlashcardSession original logic set showDemotionChoice but didn't prevent completion?
    // Actually if showDemotionChoice is true, do we still save the log?
    // Original code:
    // ...
    // } else { this.showDemotionChoice = true; }
    // ...
    // this.saveSession(); this.sessionCompleted = true;
    // So yes, it completes the session and shows the choice on the completed screen.

    if (result.showDemotionChoice) {
      this.showDemotionChoice = true;
    }

    this.isIngrained = result.isIngrained;
    const nextReview = result.nextReview;

    // We don't update this.milestoneIndex/sessionIndex here immediately for the *current* display
    // because completeSession is called at the END.
    // However, the *next* state is what matters for "Next Review".
    // AND the log entry uses current indices.

    const newEntry: LearningLogEntry = {
      milestoneIndex: this.milestoneIndex,
      sessionIndex: this.sessionIndex,
      startTime: this.startTime,
      endTime: this.endTime,
      nextReview: nextReview,
      isExtra: this.isExtraSession,
      missedCount: missedCount,
    };

    const currentMilestone =
      schedule[Math.min(this.milestoneIndex, schedule.length - 1)];
    const isEndOfMilestone =
      this.sessionIndex === currentMilestone.numberOfSessions - 1;

    if (isEndOfMilestone && this.score < 0.9) {
      newEntry.milestoneIndex = this.milestoneIndex - 1;
      newEntry.sessionIndex = 999;
    }

    this.learningLog = [...this.learningLog, newEntry];
    this.sessionMissedCount = missedCount;
    this.currentRound = 0;

    this.saveSession();
    this.sessionCompleted = true;
    this.host.requestUpdate();
  }
}
