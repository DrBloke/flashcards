import { LitElement, css, html, type PropertyValues } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import { z } from "zod";
import { deckSchema } from "../../schemas/deck";
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
        border-radius: var(--wa-border-radius-xl);
        box-shadow: var(--wa-shadow-2xl);
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
      border-bottom: 1px solid var(--wa-color-gray-100);
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
      justify-content: center;
      align-items: center;
      overflow-y: auto;
      overflow-x: hidden;
      padding: var(--wa-space-xl);
      min-height: 0;
      background-color: var(--wa-color-surface-default);
    }
    #content {
      font-size: var(--wa-font-size-4xl);
      text-align: center;
      width: 100%;
      word-wrap: break-word;
      overflow-wrap: break-word;
      hyphens: auto;
    }
    footer {
      flex-shrink: 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--wa-space-m);
      border-top: 1px solid var(--wa-color-gray-100);
      background-color: var(--wa-color-surface-default);
      z-index: 1;
    }
    span.toolbar-left {
      display: flex;
      flex-direction: column;
      gap: var(--wa-space-3xs);
      font-size: var(--wa-font-size-s);
      color: var(--wa-color-gray-600);
    }
    span.toolbar-right {
      display: flex;
      align-items: center;
    }
    wa-button#home::part(base) {
      width: auto;
      padding: 0 var(--wa-space-s);
    }
  `;

  @property({ type: Object })
  deck?: z.infer<typeof deckSchema>;

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

  @query("#toolbar")
  toolbar!: HTMLSpanElement;

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
    if (!this.deck) return;
    const deckData = {
      currentRound: this._currentRound,
      wrongFirstTime: this._wrongFirstTime,
    };
    localStorage.setItem(`deck-${this.deck.id}`, JSON.stringify(deckData));
  }

  private _clearSession() {
    if (!this.deck) return;
    localStorage.removeItem(`deck-${this.deck.id}`);
  }

  private _initializeSession() {
    if (!this.deck) return;
    // Load settings
    this.deckIsReversed = localStorage.getItem("reverseDeck") === "true";
    this._side = this.deckIsReversed ? "side2" : "side1";

    // Load progress
    const savedData = localStorage.getItem(`deck-${this.deck.id}`);
    const savedTotalRounds = localStorage.getItem("totalRounds");

    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        const schema = z.object({
          currentRound: z.number(),
          wrongFirstTime: z.array(z.number()),
        });
        const result = schema.safeParse(parsed);

        if (result.success) {
          this._currentRound = result.data.currentRound;
          this._wrongFirstTime = result.data.wrongFirstTime;
        } else {
          console.error("Invalid session data in localStorage:", result.error);
          this._clearSession();
        }
      } catch (e) {
        console.error("Error parsing session data:", e);
        this._clearSession();
      }
    }

    if (savedTotalRounds !== null) {
      this.totalRounds = parseInt(savedTotalRounds, 10);
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

    const isShuffled = localStorage.getItem("shuffleDeck") === "true";
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
          >Round: ${this._currentRound + 1}/${this.totalRounds}</span
        >
      </span>
      <span class="toolbar-right">
        ${(this._side === "side1" && !this.deckIsReversed) ||
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

  render() {
    if (this._remainingCards.length === 0) {
      return html`<div>No cards available</div>`;
    }
    return html`
      <div id="wrapper">
        <header>${this.headerTemplate()}</header>
        <main>
          <div id="content">${this._remainingCards[0][this._side]}</div>
        </main>
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
        this._clearSession();
        window.location.href = this.homeRoute;
        return;
      }

      this._saveSession();

      const nextRoundCards = this._doneCards.filter((card) =>
        this._wrongFirstTime.includes(card.id),
      );

      if (this._currentRound > 0 && nextRoundCards.length === 0) {
        this._clearSession();
        window.location.href = this.homeRoute;
        return;
      }

      this._remainingCards =
        this._currentRound > 0 ? nextRoundCards : this._doneCards;

      const isShuffled = localStorage.getItem("shuffleDeck") === "true";
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
}
