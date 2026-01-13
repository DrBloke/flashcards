import { LitElement, css, html, type PropertyValues } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import { z } from "zod";
import { deckSchema } from "../../schemas/deck";
import { flashcardsStorageSchema } from "../../schemas/storage";
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

  private _saveSession(duration?: number) {
    if (!this.deck || !this.setPath) return;
    const deckData = {
      currentRound: this._currentRound,
      wrongFirstTime: this._wrongFirstTime,
      startTime: this._startTime,
      duration: duration,
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

    // Load progress
    const savedData = setData.decks?.[this.deck.id];

    if (savedData) {
      this._currentRound = savedData.currentRound;
      this._wrongFirstTime = savedData.wrongFirstTime;
      this._startTime = savedData.startTime || Date.now();
      this._duration = savedData.duration || 0;
    } else {
      this._startTime = Date.now();
    }

    // Initialize cards
    let initialCards = [...this.deck.cards];

    // Apply filtering for rounds > 1
    if (this._currentRound > 0) {
      const filtered = initialCards.filter((card) =>
        this._wrongFirstTime.includes(card.id),
      );
      if (filtered.length > 0) {
        initialCards = filtered;
      } else {
        // Fallback: If resume data is inconsistent (e.g. round > 0 but no wrong cards recorded)
        // Reset to round 0 to avoid "No cards available"
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
    const elapsed = this._duration || this._endTime - this._startTime;
    const totalSeconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const struggling = this._wrongFirstTime.length;

    return html`
      <div id="content" class="completed-content">
        <wa-icon
          name="circle-check"
          label="Completed"
          class="completed-icon"
        ></wa-icon>
        <div class="completed-title">Deck completed!</div>
        <div class="completed-stats">
          <p>Time spent: ${minutes}m ${seconds}s</p>
          <p>Cards struggling with: ${struggling}</p>
        </div>
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
        <header>${this.headerTemplate()}</header>
        <main>${mainContent}</main>
        <footer>${this.footerTemplate()}</footer>
      </div>
    `;
  }

  async flipCard() {
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

      if (this._currentRound === this.totalRounds) {
        this._completeSession();
        return;
      }

      this._saveSession();

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
    this._endTime = Date.now();
    this._duration = this._endTime - this._startTime;
    this._saveSession(this._duration);
    this._sessionCompleted = true;
  }
}
