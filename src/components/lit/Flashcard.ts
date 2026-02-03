import { LitElement, css, html, type PropertyValues } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import { z } from "zod";
import { deckSchema } from "../../schemas/deck";
import {
  flashcardsStorageSchema,
  deckSessionSchema,
  type LearningLogEntry,
} from "../../schemas/storage";
import { DEFAULT_LEARNING_SCHEDULE } from "../../schemas/learningSchedule";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
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
  private _sessionGroupIndex = 0;

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
  private _isFilterMissedOnly = false;

  @state()
  private _isHydrated = false;

  @query("#toolbar")
  toolbar!: HTMLSpanElement;

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
    };
    const allData = this._getStoredData();

    if (!allData[this.setPath]) {
      allData[this.setPath] = { settings: {}, decks: {} };
    }
    if (!allData[this.setPath].decks) {
      allData[this.setPath].decks = {};
    }
    allData[this.setPath].decks![this.deck.id] = deckData;
    localStorage.setItem("flashcards-data", JSON.stringify(allData));
  }

  private _clearSession() {
    if (!this.deck || !this.setPath) return;
    const allData = this._getStoredData();

    if (allData[this.setPath]?.decks) {
      delete allData[this.setPath].decks![this.deck.id];
      localStorage.setItem("flashcards-data", JSON.stringify(allData));
    }
  }

  private _initializeSession() {
    if (!this.deck || !this.setPath) return;
    const allData = this._getStoredData();
    const setData = allData[this.setPath] || { settings: {}, decks: {} };

    // Load settings
    this.deckIsReversed = setData.settings?.reverseDeck === true;
    this._side = this.deckIsReversed ? "side2" : "side1";
    this.totalRounds = setData.settings?.totalRounds ?? 3;

    const isShuffled = setData.settings?.shuffleDeck === true;
    const schedule =
      setData.settings?.learningSchedule || DEFAULT_LEARNING_SCHEDULE;

    // Load progress
    const savedData = setData.decks?.[this.deck.id];

    this._startTime = 0; // Will be set on first interaction
    this._endTime = 0;

    if (savedData) {
      this._learningLog = savedData.learningLog || [];
      this._wrongFirstTime = savedData.wrongFirstTime || [];
      this._currentRound = savedData.currentRound || 0;

      // Deduce current state from log
      if (this._learningLog.length === 0) {
        this._sessionGroupIndex = 0;
        this._sessionIndex = 0;
        this._isDue = true;
      } else {
        const lastEntry = this._learningLog[this._learningLog.length - 1];

        if (lastEntry.sessionGroupIndex === -1) {
          this._sessionGroupIndex = 0;
          this._sessionIndex = 0;
          this._isDue = true;
        } else {
          const currentGroup = schedule[lastEntry.sessionGroupIndex];

          if (lastEntry.isExtra) {
            // Stay at same index for the "real" session
            this._sessionGroupIndex = lastEntry.sessionGroupIndex;
            this._sessionIndex = lastEntry.sessionIndex;
          } else if (
            lastEntry.sessionIndex <
            currentGroup.numberOfSessions - 1
          ) {
            // Next session in same group
            this._sessionGroupIndex = lastEntry.sessionGroupIndex;
            this._sessionIndex = lastEntry.sessionIndex + 1;
          } else {
            // Move to next group (or stay at last)
            this._sessionGroupIndex = Math.min(
              lastEntry.sessionGroupIndex + 1,
              schedule.length - 1,
            );
            this._sessionIndex = 0;
          }

          const now = Date.now();
          if (!this._isExtraSession) {
            this._isDue =
              lastEntry.nextReview === null || now >= lastEntry.nextReview;
          } else {
            this._isDue = true;
          }
        }
      }
    } else {
      this._learningLog = [];
      this._wrongFirstTime = [];
      this._currentRound = 0;
      this._sessionGroupIndex = 0;
      this._sessionIndex = 0;
      this._isDue = true;
    }

    // Initialize cards
    let initialCards = [...this.deck.cards];

    // Apply filtering for rounds > 0 OR if specifically requested for extra session
    if (
      this._currentRound > 0 ||
      (this._isExtraSession && this._isFilterMissedOnly)
    ) {
      const filtered = initialCards.filter((card) =>
        this._wrongFirstTime.includes(card.id),
      );
      if (filtered.length > 0) {
        initialCards = filtered;
      } else if (this._currentRound > 0) {
        this._currentRound = 0;
        this._saveSession();
      }
    }

    if (isShuffled) {
      initialCards = this.shuffle(initialCards);
    }

    this._remainingCards = initialCards;
  }

  connectedCallback() {
    super.connectedCallback();
  }

  firstUpdated() {
    this._isHydrated = true;
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

  headerTemplate() {
    return html`<wa-button
        href=${this.homeRoute}
        id="home"
        title="home"
        variant="brand"
        appearance="filled"
      >
        <wa-icon name="house" label="Home"></wa-icon>
      </wa-button>
      <h1>${this.deck?.title}</h1>`;
  }

  footerTemplate() {
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

  startAnyway(missedOnly = false) {
    this._isFilterMissedOnly =
      typeof missedOnly === "boolean" ? missedOnly : false;
    this._isExtraSession = true;
    this._isDue = true;
    this._startTime = Date.now();
    this._initializeSession();
  }

  _retryGroup() {
    this._showDemotionChoice = false;
    this._sessionCompleted = false;
    this._isDue = true;
    this._wrongFirstTime = [];
    this._initializeSession();
  }

  _demoteToPreviousGroup() {
    if (!this.deck || !this.setPath) return;
    this._showDemotionChoice = false;

    const lastEntry = this._learningLog[this._learningLog.length - 1];
    if (lastEntry) {
      // To go back to [G-1, S=0], we make the last entry look like the end of [G-2]
      const targetGroupIndex = this._sessionGroupIndex - 1;

      lastEntry.sessionGroupIndex = targetGroupIndex - 1;
      lastEntry.sessionIndex = 999; // Represents "finished group"
      lastEntry.nextReview = Date.now(); // Available immediately
      this._saveSession();

      this._sessionCompleted = false;
      this._isDue = true;
      this._wrongFirstTime = [];
      this._initializeSession();
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
    const totalSeconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

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
              ? "Deck Completed"
              : "Needs Review"}
        </div>
        <div class="completed-stats">
          <p>Score: ${scorePercent}%</p>
          <p>Time spent: ${minutes}m ${seconds}s</p>
          ${this._score < 0.9
            ? html`<p>Cards to focus on: ${this._sessionMissedCount}</p>`
            : ""}
          ${this._learningLog[this._learningLog.length - 1]?.nextReview
            ? html`<p>
                Next review scheduled for:
                ${new Date(
                  this._learningLog[this._learningLog.length - 1]
                    .nextReview as number,
                ).toLocaleString()}
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
                <wa-button @click=${this._retryGroup} variant="brand"
                  >Retry Current Group</wa-button
                >
                ${this._sessionGroupIndex > 0
                  ? html`<wa-button
                      @click=${this._demoteToPreviousGroup}
                      variant="danger"
                      >Go Back to Previous Group</wa-button
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

  notDueTemplate() {
    const lastEntry = this._learningLog[this._learningLog.length - 1];
    const nextReview = lastEntry?.nextReview
      ? new Date(lastEntry.nextReview).toLocaleString()
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
            @click=${() => this.startAnyway(false)}
            variant="danger"
            appearance="outlined"
            >Study All Cards</wa-button
          >
          ${this._wrongFirstTime.length > 0
            ? html`
                <wa-button
                  @click=${() => this.startAnyway(true)}
                  variant="warning"
                  appearance="outlined"
                  >Study Stumbles Only
                  (${this._wrongFirstTime.length})</wa-button
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

  render() {
    const isCompleted =
      this._sessionCompleted ||
      (this._currentRound >= this.totalRounds && this.totalRounds > 0);

    if (!isCompleted && this._remainingCards.length === 0) {
      return html`<div>No cards available</div>`;
    }

    let mainContent;

    if (isCompleted) {
      mainContent = this.completedTemplate();
    } else if (!this._isDue) {
      mainContent = this.notDueTemplate();
    } else {
      const rawContent = this._remainingCards[0][this._side];
      const htmlContent = unified()
        .use(remarkParse)
        .use(remarkRehype)
        .use(rehypeSanitize)
        .use(rehypeStringify)
        .processSync(rawContent)
        .toString();
      mainContent = html`<div id="content">${unsafeHTML(htmlContent)}</div>`;
    }

    return html`
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
    if (this._currentRound === 0) {
      if (!this._wrongFirstTime.includes(currentCard.id)) {
        this._wrongFirstTime = [...this._wrongFirstTime, currentCard.id];
        this._saveSession();
      }
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

    let nextGroupIndex = this._sessionGroupIndex;
    let isRepeatingGroup = false;

    // Progression logic at the end of a session group
    const currentGroup = schedule[this._sessionGroupIndex];
    const isEndOfGroup =
      this._sessionIndex === currentGroup.numberOfSessions - 1;

    if (isEndOfGroup) {
      if (this._score >= 0.9) {
        // Mastered - move to next group
        nextGroupIndex = Math.min(
          this._sessionGroupIndex + 1,
          schedule.length - 1,
        );
      } else if (this._score >= 0.4) {
        // Passing but not mastered - repeat group
        isRepeatingGroup = true;
      } else {
        // Failed - show demotion choice (this will be handled by UI)
        this._showDemotionChoice = true;
        // For now, we don't finalize the log entry until they choose?
        // Actually, let's just complete the session and show the choices in completedTemplate.
      }
    } else {
      // mid-group progression
    }

    // Calculate nextReview
    let nextReview: number | null = null;
    const nextGroup = schedule[nextGroupIndex];

    if (nextGroupIndex > this._sessionGroupIndex) {
      // Moving to next group
      if (nextGroup.minTimeSinceLastSessionGroup !== null) {
        nextReview =
          this._endTime + nextGroup.minTimeSinceLastSessionGroup * 1000;
      }
    } else if (isRepeatingGroup) {
      // Repeating group
      if (nextGroup.minTimeSinceLastSessionGroup !== null) {
        nextReview =
          this._endTime + nextGroup.minTimeSinceLastSessionGroup * 1000;
      }
    } else {
      // Next session in same group
      if (currentGroup.minTimeBetweenSessions !== null) {
        nextReview = this._endTime + currentGroup.minTimeBetweenSessions * 1000;
      }
    }

    // Update log
    const newEntry: LearningLogEntry = {
      sessionGroupIndex: this._sessionGroupIndex,
      sessionIndex: this._sessionIndex,
      startTime: this._startTime,
      endTime: this._endTime,
      nextReview: nextReview,
      isExtra: this._isExtraSession,
      missedCount: missedCount,
    };

    if (isEndOfGroup && this._score < 0.9) {
      // If we didn't master the group, repeat it by default
      // by making the last entry look like the end of the previous group.
      newEntry.sessionGroupIndex = this._sessionGroupIndex - 1;
      newEntry.sessionIndex = 999;
      isRepeatingGroup = true;
    }

    this._learningLog = [...this._learningLog, newEntry];

    this._sessionMissedCount = missedCount;
    this._currentRound = 0;
    this._isFilterMissedOnly = false;

    // Reset wrong cards ONLY if we moved group or are specifically repeating group
    if (nextGroupIndex > this._sessionGroupIndex || isRepeatingGroup) {
      this._wrongFirstTime = [];
    }

    this._saveSession();
    this._sessionCompleted = true;
  }
}
