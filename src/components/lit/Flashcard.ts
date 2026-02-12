import { LitElement, css, html, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { z } from "zod";
import { deckSchema } from "../../schemas/deck";
import {
  flashcardsStorageSchema,
  deckSessionSchema,
  type LearningLogEntry,
} from "../../schemas/storage";
import { DEFAULT_LEARNING_SCHEDULE } from "../../schemas/learningSchedule";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import {
  formatDistance,
  formatDistanceToNow,
  formatDuration,
  intervalToDuration,
} from "date-fns";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/button-group/button-group.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";

@customElement("flashcard-deck")
export class FlashcardDeck extends LitElement {
  static styles = css`
    :host {
      display: block;
      height: 100%;
      width: 100%;
    }
    div#wrapper {
      display: flex;
      flex-direction: column;
      height: 100%;
      margin: 0 auto;
      background-color: var(--wa-color-surface-default);
    }
    /* Desktop and larger screens */
    @media (min-width: 768px) {
      :host {
        display: flex;
        justify-content: center;
        align-items: center;
        background-color: var(--wa-color-gray-90);
        padding: var(--wa-space-xl);
      }
      div#wrapper {
        height: 85vh;
        max-height: 600px;
        width: 100%;
        max-width: 600px;
        border-radius: var(--wa-border-radius-l);
        box-shadow: var(--wa-shadow-l);
        overflow: hidden;
        border: 1px solid var(--wa-color-gray-80);
        background-color: var(--wa-color-surface-default);
      }
    }
    /* Extra large screens */
    @media (min-width: 1200px) {
      div#wrapper {
        max-width: 700px;
      }
    }
    header {
      flex-shrink: 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--wa-space-m);
      border-bottom: 1px solid var(--wa-color-gray-90);
      background-color: var(--wa-color-surface-default);
      z-index: 1;
    }
    h1 {
      font-size: var(--wa-font-size-xl);
      color: var(--wa-color-brand-on-quiet);
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
      text-align: right;
    }
    main {
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      overflow-y: auto;
      overflow-x: hidden;
      padding: var(--wa-space-xl);
      min-height: 0;
      background-color: var(--wa-color-surface-default);
    }
    main > * {
      margin: auto 0;
    }
    #content {
      font-size: var(--wa-font-size-4xl);
      text-align: left;
      width: fit-content;
      max-width: 100%;
      word-wrap: break-word;
      overflow-wrap: break-word;
      hyphens: auto;
    }
    #content p {
      margin: 0 0 var(--wa-space-m) 0;
    }
    #content p:last-child {
      margin-bottom: 0;
    }
    #content h1,
    #content h2,
    #content h3,
    #content h4,
    #content h5,
    #content h6 {
      margin: 0 0 var(--wa-space-s) 0;
      line-height: var(--wa-line-height-tight);
    }
    #content pre {
      margin: var(--wa-space-m) 0;
      padding: var(--wa-space-m);
      border-radius: var(--wa-border-radius-m);
      overflow-x: auto;
      font-family: var(--wa-font-family-mono);
      font-size: var(--wa-font-size-s);
      line-height: var(--wa-line-height-normal);
    }
    #content code {
      font-family: var(--wa-font-family-mono);
      background-color: var(--wa-color-gray-95);
      padding: 0.2em 0.4em;
      border-radius: var(--wa-border-radius-s);
      font-size: 0.9em;
    }
    #content pre code {
      background-color: transparent;
      padding: 0;
      border-radius: 0;
      font-size: inherit;
    }
    footer {
      flex-shrink: 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--wa-space-m);
      border-top: 1px solid var(--wa-color-gray-90);
      background-color: var(--wa-color-surface-default);
      z-index: 1;
    }
    span.toolbar-left {
      display: flex;
      flex-direction: column;
      gap: var(--wa-space-3xs);
      font-size: var(--wa-font-size-s);
      color: var(--wa-color-gray-20);
    }
    span.toolbar-right {
      display: flex;
      align-items: center;
    }
    wa-button#home::part(base) {
      width: auto;
      padding: 0 var(--wa-space-s);
    }
    .completed-content {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--wa-space-m);
      font-size: 1rem;
    }
    .completed-icon {
      font-size: 4rem;
      color: var(--wa-color-success-60);
    }
    .completed-title {
      font-size: var(--wa-font-size-2xl);
      font-weight: var(--wa-font-weight-bold);
      color: var(--wa-color-gray-10);
    }
    .completed-stats {
      font-size: var(--wa-font-size-l);
      color: var(--wa-color-gray-30);
      margin-bottom: var(--wa-space-m);
    }
    .completed-stats p {
      margin: var(--wa-space-2xs) 0;
    }
    .demotion-choices {
      display: flex;
      flex-direction: column;
      gap: var(--wa-space-s);
      margin-top: var(--wa-space-m);
      padding: var(--wa-space-m);
      background-color: var(--wa-color-gray-95);
      border-radius: var(--wa-border-radius-m);
      border: 1px solid var(--wa-color-gray-80);
    }
    .demotion-choices p {
      margin: 0 0 var(--wa-space-xs) 0;
      font-weight: var(--wa-font-weight-bold);
      color: var(--wa-color-danger-70);
    }
    ::slotted(h1[slot="header"]) {
      font-size: var(--wa-font-size-xl);
      color: var(--wa-color-brand-on-quiet);
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
      text-align: right;
    }
    ::slotted(#content) {
      font-size: var(--wa-font-size-4xl);
      text-align: left;
      width: fit-content;
      max-width: 100%;
      word-wrap: break-word;
      overflow-wrap: break-word;
      hyphens: auto;
    }
  `;

  @property({ type: Object })
  deck?: z.infer<typeof deckSchema>;

  @property({ attribute: "deck-id" })
  deckId: string = "";

  @property({ attribute: "set-path" })
  setPath: string = "";

  @property({ attribute: "home-route" })
  homeRoute: string = "/";

  @property({ type: Boolean })
  deckIsReversed = false;

  @property({ type: Number })
  totalRounds = 3;

  @state()
  private _remainingCards: z.infer<typeof deckSchema>["cards"] = [];

  @state()
  private _doneCards: z.infer<typeof deckSchema>["cards"] = [];

  @state()
  private _wrongFirstTime: number[] = [];

  @state()
  private _side: "side1" | "side2" = "side1";

  @state()
  private _currentRound = 0;

  @state()
  private _sessionInitialized = false;

  @state()
  private _sessionCompleted = false;

  @state()
  private _startTime: number = 0;

  @state()
  private _endTime: number = 0;

  @state()
  private _duration: number = 0;

  @state()
  private _learningLog: LearningLogEntry[] = [];

  @state()
  private _milestoneIndex = 0;

  @state()
  private _sessionIndex = 0;

  @state()
  private _isDue = true;

  @state()
  private _isExtraSession = false;

  @state()
  private _score = 0;

  @state()
  private _showDemotionChoice = false;

  @state()
  private _sessionMissedCount = 0;

  @state()
  private _sessionStarted = false;

  @state()
  private _studyMode: "all" | "struggling" = "all";

  @state()
  private _isNewMilestone = false;

  @state()
  private _strugglingCount = 0;

  @state()
  private _cardFontSizes: Record<number, number> = {};

  private _getStoredData(): z.infer<typeof flashcardsStorageSchema> {
    const rawData = localStorage.getItem("flashcards-data");
    const parsed = rawData ? JSON.parse(rawData) : {};
    const result = flashcardsStorageSchema.safeParse(parsed);
    return result.success ? result.data : {};
  }

  willUpdate(changedProperties: PropertyValues<this>) {
    if (changedProperties.has("deck") && this.deck) {
      const result = deckSchema.safeParse(this.deck);
      if (result.success && !this._sessionInitialized) {
        this._initializeSession();
        this._sessionInitialized = true;
      } else if (!result.success) {
        console.error("Invalid deck data:", result.error);
      }
    }
  }

  private _saveSession() {
    if (!this.deck || !this.setPath) return;
    const deckData: z.infer<typeof deckSessionSchema> = {
      currentRound: this._currentRound,
      wrongFirstTime: this._wrongFirstTime,
      learningLog: this._learningLog,
      cardFontSizes: Object.fromEntries(
        Object.entries(this._cardFontSizes).map(([k, v]) => [k.toString(), v]),
      ),
    };
    const allData = this._getStoredData();

    if (!allData[this.setPath]) {
      allData[this.setPath] = { settings: {}, decks: {} };
    }
    if (!allData[this.setPath].decks) {
      allData[this.setPath].decks = {};
    }
    allData[this.setPath].decks![this.deckId] = deckData;
    localStorage.setItem("flashcards-data", JSON.stringify(allData));
  }

  private _initializeSession() {
    if (!this.deck || !this.setPath) return;
    const allData = this._getStoredData();
    const setData = allData[this.setPath] || { settings: {}, decks: {} };

    // Load settings
    this.deckIsReversed = setData.settings?.reverseDeck === true;
    this._side = this.deckIsReversed ? "side2" : "side1";
    this.totalRounds = setData.settings?.totalRounds ?? 3;

    const schedule =
      setData.settings?.learningSchedule || DEFAULT_LEARNING_SCHEDULE;

    // Load progress
    const savedData = setData.decks?.[this.deckId];

    this._startTime = 0;
    this._endTime = 0;

    if (savedData) {
      this._learningLog = savedData.learningLog || [];
      this._wrongFirstTime = savedData.wrongFirstTime || [];
      this._currentRound = savedData.currentRound || 0;
      this._cardFontSizes = savedData.cardFontSizes
        ? Object.fromEntries(
            Object.entries(savedData.cardFontSizes).map(([k, v]) => [
              Number(k),
              v,
            ]),
          )
        : {};

      if (this._learningLog.length === 0) {
        this._milestoneIndex = 0;
        this._sessionIndex = 0;
        this._isDue = true;
      } else {
        const lastEntry = this._learningLog[this._learningLog.length - 1];

        if (lastEntry.milestoneIndex === -1) {
          this._milestoneIndex = 0;
          this._sessionIndex = 0;
          this._isDue = true;
        } else {
          const currentMilestone = schedule[lastEntry.milestoneIndex];

          if (lastEntry.isExtra) {
            this._milestoneIndex = lastEntry.milestoneIndex;
            this._sessionIndex = lastEntry.sessionIndex;
          } else if (
            lastEntry.sessionIndex <
            currentMilestone.numberOfSessions - 1
          ) {
            this._milestoneIndex = lastEntry.milestoneIndex;
            this._sessionIndex = lastEntry.sessionIndex + 1;
          } else {
            this._milestoneIndex = Math.min(
              lastEntry.milestoneIndex + 1,
              schedule.length - 1,
            );
            this._sessionIndex = 0;
          }

          const now = Date.now();
          this._isDue =
            lastEntry.nextReview === null || now >= lastEntry.nextReview;
        }
      }
    } else {
      this._learningLog = [];
      this._wrongFirstTime = [];
      this._currentRound = 0;
      this._milestoneIndex = 0;
      this._sessionIndex = 0;
      this._isDue = true;
    }

    this._isNewMilestone = this._sessionIndex === 0;
    this._strugglingCount = this._wrongFirstTime.length;

    // If session is already in progress, start it automatically
    if (this._currentRound > 0) {
      this._startSession("all"); // Or maybe we need to save the study mode too? For now default to 'all'
    }
  }

  private _startSession(mode: "all" | "struggling") {
    if (!this.deck || !this.setPath) return;
    this._studyMode = mode;
    this._sessionStarted = true;
    this._startTime = Date.now();

    if (this._isDue) {
      this._isExtraSession = false;
      if (
        this._currentRound === 0 &&
        (this._isNewMilestone || mode === "all")
      ) {
        this._wrongFirstTime = [];
      }
    } else {
      this._isExtraSession = true;
      // Regardless of choice, wrongFirstTime NOT reset for extra session
    }

    this._saveSession();

    let initialCards = [...this.deck.cards];
    if (this._currentRound > 0 || mode === "struggling") {
      initialCards = initialCards.filter((c) =>
        this._wrongFirstTime.includes(c.id),
      );
      if (initialCards.length === 0 && mode === "struggling") {
        // Fallback if somehow empty and specifically requested struggling
        initialCards = [...this.deck.cards];
        this._studyMode = "all";
      } else if (initialCards.length === 0 && this._currentRound > 0) {
        // If we're resuming but no cards are wrong, complete the session
        this._completeSession();
        return;
      }
    }

    const allData = this._getStoredData();
    const isShuffled = allData[this.setPath]?.settings?.shuffleDeck === true;
    if (isShuffled) {
      initialCards = this.shuffle(initialCards);
    }

    this._remainingCards = initialCards;
  }

  firstUpdated() {
    // Clear light DOM content (SSR) so that shadow DOM content takes over
    // and we avoid duplicate IDs (e.g. #content) between light and shadow DOM.
    this.innerHTML = "";
    requestAnimationFrame(() => {
      this.shadowRoot?.getElementById("flip")?.focus();
    });
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

  private _increaseFontSize() {
    const cardId = this._remainingCards[0]?.id;
    if (cardId === undefined) return;
    const currentSize = this._cardFontSizes[cardId] || 2.25; // Default 4xl is ~2.25rem
    this._cardFontSizes = {
      ...this._cardFontSizes,
      [cardId]: currentSize + 0.1,
    };
    this._saveSession();
  }

  private _decreaseFontSize() {
    const cardId = this._remainingCards[0]?.id;
    if (cardId === undefined) return;
    const currentSize = this._cardFontSizes[cardId] || 2.25;
    this._cardFontSizes = {
      ...this._cardFontSizes,
      [cardId]: Math.max(0.5, currentSize - 0.1),
    };
    this._saveSession();
  }

  headerTemplate() {
    return html` <wa-button
        href=${this.homeRoute}
        id="home"
        title="home"
        variant="brand"
        appearance="filled"
      >
        <wa-icon name="house" label="Home"></wa-icon>
      </wa-button>
      <wa-button
        id="decrease-font"
        title="Decrease font size"
        @click=${this._decreaseFontSize}
        variant="brand"
        appearance="filled"
        style="margin-left: var(--wa-space-xs)"
      >
        <wa-icon
          name="magnifying-glass-minus"
          label="Decrease font size"
        ></wa-icon>
      </wa-button>
      <wa-button
        id="increase-font"
        title="Increase font size"
        @click=${this._increaseFontSize}
        variant="brand"
        appearance="filled"
        style="margin-left: var(--wa-space-3xs)"
      >
        <wa-icon
          name="magnifying-glass-plus"
          label="Increase font size"
        ></wa-icon>
      </wa-button>
      <h1>${this.deck?.title}</h1>`;
  }

  footerTemplate() {
    if (!this._sessionStarted && !this._sessionCompleted) {
      return html``;
    }
    const totalInRound = this._remainingCards.length + this._doneCards.length;
    const completedCards = this._doneCards.length;
    return html`<span class="toolbar-left">
        <span class="cards-progress"
          >Cards: ${completedCards}/${totalInRound}</span
        >
        <span class="rounds-progress"
          >Round:
          ${Math.min(this._currentRound + 1, this.totalRounds)}/${this
            .totalRounds}</span
        >
      </span>
      <span class="toolbar-right">
        ${this._sessionCompleted
          ? ""
          : (this._side === "side1" && !this.deckIsReversed) ||
              (this._side === "side2" && this.deckIsReversed)
            ? this.flipTemplate()
            : this.correctTemplate()}
      </span>`;
  }

  _retryMilestone() {
    this._showDemotionChoice = false;
    this._sessionCompleted = false;
    this._sessionStarted = false;
    this._wrongFirstTime = [];
    this._saveSession();
    this._initializeSession();
    this._isDue = true; // Ensure it's due after initialization
  }

  _demoteToPreviousMilestone() {
    if (!this.deck || !this.setPath) return;
    this._showDemotionChoice = false;

    const lastEntry = this._learningLog[this._learningLog.length - 1];
    if (lastEntry) {
      // To go back to [G-1, S=0], we make the last entry look like the end of [G-2]
      const targetMilestoneIndex = this._milestoneIndex - 1;

      if (targetMilestoneIndex >= 0) {
        lastEntry.milestoneIndex = targetMilestoneIndex - 1;
        lastEntry.sessionIndex = 999; // Represents "finished milestone"
        lastEntry.nextReview = Date.now(); // Available immediately
        this._saveSession();

        this._sessionCompleted = false;
        this._sessionStarted = false;
        this._isDue = true;
        this._wrongFirstTime = [];
        this._initializeSession();
      }
    }
  }

  flipTemplate() {
    return html` <wa-button
      id="flip"
      title="flip"
      @click=${this.flipCard}
      variant="brand"
    >
      <wa-icon id="flip-icon" name="arrows-rotate" label="flip"></wa-icon
      >&nbsp;&nbsp;Flip
    </wa-button>`;
  }

  correctTemplate() {
    return html` <wa-button-group>
      <wa-button
        id="correct"
        title="correct"
        @click=${this.markCorrect}
        variant="success"
      >
        <wa-icon name="check" label="correct"></wa-icon>
      </wa-button>
      <wa-button
        id="incorrect"
        title="incorrect"
        @click=${this.markIncorrect}
        variant="danger"
      >
        <wa-icon name="xmark" label="incorrect"></wa-icon>
      </wa-button>
    </wa-button-group>`;
  }

  completedTemplate() {
    const elapsed = this._duration;
    const timeSpent = formatDistance(0, elapsed, { includeSeconds: true });

    const scorePercent = Math.round(this._score * 100);

    return html`
      <div id="content" class="completed-content">
        <wa-icon
          name=${this._score >= 0.9 ? "circle-check" : "circle-exclamation"}
          label="Completed"
          class="completed-icon"
          style="color: ${this._score >= 0.9
            ? "var(--wa-color-success-60)"
            : "var(--wa-color-warning-60)"}"
        ></wa-icon>
        <div class="completed-title">
          ${this._score >= 0.9
            ? "Mastered!"
            : scorePercent >= 40
              ? "Good Progress"
              : "Needs Review"}
        </div>
        <div class="completed-stats">
          <p>Score: ${scorePercent}%</p>
          <p>Time spent: ${timeSpent}</p>
          ${this._score < 0.9
            ? html`<p>Cards to focus on: ${this._sessionMissedCount}</p>`
            : ""}
          ${this._learningLog[this._learningLog.length - 1]?.nextReview
            ? html`<p>
                ${this._learningLog[this._learningLog.length - 1]
                  ?.sessionIndex === 999
                  ? "You passed, but to advance to the next milestone you need 90% mastery. Let's try this milestone again."
                  : html`Next review scheduled for:
                    ${formatDistanceToNow(
                      this._learningLog[this._learningLog.length - 1]
                        .nextReview as number,
                      { addSuffix: true },
                    )}`}
              </p>`
            : ""}
        </div>

        ${this._showDemotionChoice
          ? html`
              <div class="demotion-choices">
                <p>
                  Your score was low (${scorePercent}%). What would you like to
                  do?
                </p>
                <wa-button @click=${this._retryMilestone} variant="brand"
                  >Retry Current Milestone</wa-button
                >
                ${this._milestoneIndex > 0
                  ? html`<wa-button
                      @click=${this._demoteToPreviousMilestone}
                      variant="danger"
                      >Go Back to Previous Milestone</wa-button
                    >`
                  : ""}
              </div>
            `
          : html`
              <wa-button
                id="back-to-home"
                href=${this.homeRoute}
                title="Back to Home"
                variant="brand"
                appearance="filled"
              >
                <wa-icon name="house" label="Home"></wa-icon>
                &nbsp;&nbsp;Back to Home
              </wa-button>
            `}
      </div>
    `;
  }

  startScreenTemplate() {
    if (this._isDue) {
      if (this._isNewMilestone) {
        // Find current milestone schedule
        const allData = this._getStoredData();
        const schedule =
          allData[this.setPath]?.settings?.learningSchedule ||
          DEFAULT_LEARNING_SCHEDULE;
        const milestone = schedule[this._milestoneIndex];

        return html`
          <div id="content" class="completed-content">
            <wa-icon
              name="calendar-check"
              label="New Milestone"
              class="completed-icon"
              style="color: var(--wa-color-brand-60)"
            ></wa-icon>
            <div class="completed-title">New Milestone</div>
            <div class="completed-stats">
              <p>Schedule for this milestone:</p>
              <p>
                ${milestone.numberOfSessions} sessions
                ${milestone.minTimeBetweenSessions
                  ? html`,
                    ${formatDuration(
                      intervalToDuration({
                        start: 0,
                        end: milestone.minTimeBetweenSessions * 1000,
                      }),
                    )}
                    apart`
                  : ""}
              </p>
            </div>
            <wa-button @click=${() => this._startSession("all")} variant="brand"
              >Start Milestone</wa-button
            >
          </div>
        `;
      } else {
        // Subsequent session in milestone
        return html`
          <div id="content" class="completed-content">
            <wa-icon
              name="arrows-rotate"
              label="Continue Session"
              class="completed-icon"
              style="color: var(--wa-color-brand-60)"
            ></wa-icon>
            <div class="completed-title">Session ${this._sessionIndex + 1}</div>
            ${this._strugglingCount > 0
              ? html`
                  <div class="completed-stats">
                    <p>There are ${this._strugglingCount} struggling words.</p>
                  </div>
                  <div
                    style="display: flex; gap: var(--wa-space-m); flex-wrap: wrap; justify-content: center"
                  >
                    <wa-button
                      @click=${() => this._startSession("struggling")}
                      variant="warning"
                      appearance="outlined"
                      >Study Struggling Only</wa-button
                    >
                    <wa-button
                      @click=${() => this._startSession("all")}
                      variant="brand"
                      >Study All Cards</wa-button
                    >
                  </div>
                `
              : html`
                  <div class="completed-stats">
                    <p>No struggling words yet.</p>
                  </div>
                  <wa-button
                    @click=${() => this._startSession("all")}
                    variant="brand"
                    >Start Session</wa-button
                  >
                `}
          </div>
        `;
      }
    } else {
      // Extra session (not due)
      const lastEntry = this._learningLog[this._learningLog.length - 1];
      const nextReview = lastEntry?.nextReview
        ? formatDistanceToNow(lastEntry.nextReview, { addSuffix: true })
        : "Soon";

      return html`
        <div id="content" class="completed-content">
          <wa-icon
            name="clock"
            label="Not Due"
            class="completed-icon"
            style="color: var(--wa-color-gray-40)"
          ></wa-icon>
          <div class="completed-title">Not due yet</div>
          <div class="completed-stats">
            <p>Next review scheduled for: ${nextReview}</p>
            <p
              style="font-size: var(--wa-font-size-s); color: var(--wa-color-danger-60); margin-top: var(--wa-space-m)"
            >
              Studying now will reset your review schedule.
            </p>
          </div>
          <div
            style="display: flex; gap: var(--wa-space-m); flex-wrap: wrap; justify-content: center"
          >
            <wa-button
              @click=${() => this._startSession("all")}
              variant="danger"
              appearance="outlined"
              >Study All Cards</wa-button
            >
            ${this._strugglingCount > 0
              ? html`
                  <wa-button
                    @click=${() => this._startSession("struggling")}
                    variant="warning"
                    appearance="outlined"
                    >Study Struggling Only (${this._strugglingCount})</wa-button
                  >
                `
              : ""}
            <wa-button href=${this.homeRoute} variant="brand"
              >Come Back Later</wa-button
            >
          </div>
        </div>
      `;
    }
  }

  render() {
    const isCompleted =
      this._sessionCompleted ||
      (this._currentRound >= this.totalRounds && this.totalRounds > 0);

    let mainContent;

    if (isCompleted) {
      mainContent = this.completedTemplate();
    } else if (!this._sessionStarted) {
      mainContent = this.startScreenTemplate();
    } else if (this._remainingCards.length === 0) {
      return html`<div>No cards available</div>`;
    } else {
      const card = this._remainingCards[0];
      const htmlContent = card[this._side];
      const fontSize = this._cardFontSizes[card.id];
      const style = fontSize ? `font-size: ${fontSize}rem` : "";
      mainContent = html`<div id="content" style=${style}>
        ${unsafeHTML(htmlContent)}
      </div>`;
    }

    return html`
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/katex.min.css"
      />
      <div id="wrapper">
        <header role="banner">
          <slot name="header">${this.headerTemplate()}</slot>
        </header>
        <main role="main"><slot></slot>${mainContent}</main>
        <footer role="contentinfo">
          <slot name="footer">${this.footerTemplate()}</slot>
        </footer>
      </div>
    `;
  }

  async flipCard() {
    if (this._startTime === 0) this._startTime = Date.now();
    this.flip("forward");
    await this.updateComplete;
    this.shadowRoot?.getElementById("correct")?.focus();
  }

  async markCorrect() {
    this.flip("back");
    const card = this._remainingCards[0];

    this._doneCards = [...this._doneCards, card];
    this._remainingCards = this._remainingCards.slice(1);

    if (
      this._currentRound === 0 &&
      !this._isExtraSession &&
      this._studyMode === "struggling"
    ) {
      this._wrongFirstTime = this._wrongFirstTime.filter(
        (id) => id !== card.id,
      );
      this._saveSession();
    }

    if (this._remainingCards.length === 0) {
      this._currentRound++;
      this._saveSession();

      if (this._currentRound >= this.totalRounds) {
        this._completeSession();
        return;
      }

      const nextRoundCards = this._doneCards.filter((card) =>
        this._wrongFirstTime.includes(card.id),
      );

      if (this._currentRound > 0 && nextRoundCards.length === 0) {
        this._completeSession();
        return;
      }

      this._remainingCards =
        this._currentRound > 0 ? nextRoundCards : this._doneCards;
      const allData = this._getStoredData();
      const isShuffled = allData[this.setPath]?.settings?.shuffleDeck === true;
      if (isShuffled) {
        this._remainingCards = this.shuffle(this._remainingCards);
      }
      this._doneCards = [];
    }
    await this.updateComplete;
    this.shadowRoot?.getElementById("flip")?.focus();
  }

  async markIncorrect() {
    this.flip("back");
    const currentCard = this._remainingCards[0];

    if (!this._wrongFirstTime.includes(currentCard.id)) {
      this._wrongFirstTime = [...this._wrongFirstTime, currentCard.id];
      this._saveSession();
    }

    this._remainingCards = this._remainingCards.slice(1).concat([currentCard]);
    await this.updateComplete;
    this.shadowRoot?.getElementById("flip")?.focus();
  }

  flip(flipDirection: "forward" | "back") {
    if (!this.deckIsReversed) {
      this._side = flipDirection === "forward" ? "side2" : "side1";
    } else {
      this._side = flipDirection === "forward" ? "side1" : "side2";
    }
  }

  private _completeSession() {
    if (!this.deck || !this.setPath) return;
    this._endTime = Date.now();
    this._duration = this._endTime - this._startTime;

    const totalCards = this.deck.cards.length;
    const missedCount = this._wrongFirstTime.length;
    this._score = totalCards > 0 ? (totalCards - missedCount) / totalCards : 1;

    const allData = this._getStoredData();
    const setData = allData[this.setPath] || { settings: {}, decks: {} };
    const schedule =
      setData.settings?.learningSchedule || DEFAULT_LEARNING_SCHEDULE;

    let nextMilestoneIndex = this._milestoneIndex;
    let isRepeatingMilestone = false;

    // Progression logic at the end of a milestone
    const currentMilestone = schedule[this._milestoneIndex];
    const isEndOfMilestone =
      this._sessionIndex === currentMilestone.numberOfSessions - 1;

    if (isEndOfMilestone) {
      if (this._score >= 0.9) {
        // Mastered - move to next milestone
        nextMilestoneIndex = Math.min(
          this._milestoneIndex + 1,
          schedule.length - 1,
        );
      } else if (this._score >= 0.4) {
        // Passing but not mastered - repeat milestone
        isRepeatingMilestone = true;
      } else {
        // Failed - show demotion choice (this will be handled by UI)
        this._showDemotionChoice = true;
        // For now, we don't finalize the log entry until they choose?
        // Actually, let's just complete the session and show the choices in completedTemplate.
      }
    } else {
      // mid-milestone progression
    }

    // Calculate nextReview
    let nextReview: number | null = null;
    const nextMilestone = schedule[nextMilestoneIndex];

    if (nextMilestoneIndex > this._milestoneIndex) {
      // Moving to next milestone
      if (nextMilestone.minTimeSinceLastMilestone !== null) {
        nextReview =
          this._endTime + nextMilestone.minTimeSinceLastMilestone * 1000;
      }
    } else if (isRepeatingMilestone) {
      // Repeating milestone - should be available immediately
      nextReview = this._endTime;
    } else {
      // Next session in same milestone
      if (currentMilestone.minTimeBetweenSessions !== null) {
        nextReview =
          this._endTime + currentMilestone.minTimeBetweenSessions * 1000;
      }
    }

    // Update log
    const newEntry: LearningLogEntry = {
      milestoneIndex: this._milestoneIndex,
      sessionIndex: this._sessionIndex,
      startTime: this._startTime,
      endTime: this._endTime,
      nextReview: nextReview,
      isExtra: this._isExtraSession,
      missedCount: missedCount,
    };

    if (isEndOfMilestone && this._score < 0.9) {
      // If we didn't master the milestone, repeat it by default
      // by making the last entry look like the end of the previous milestone.
      newEntry.milestoneIndex = this._milestoneIndex - 1;
      newEntry.sessionIndex = 999;
      isRepeatingMilestone = true;
    }

    this._learningLog = [...this._learningLog, newEntry];

    this._sessionMissedCount = missedCount;
    this._currentRound = 0;

    this._saveSession();
    this._sessionCompleted = true;
  }
}
