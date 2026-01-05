import { LitElement, css, html, type PropertyValues } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/button-group/button-group.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";

@customElement("flashcard-deck")
export class FlashcardDeck extends LitElement {
  static styles = css`
    :host {
      div#wrapper {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        height: 100%;
      }
      header {
        display: flex;
        justify-content: space-between;
        padding: var(--wa-space-xs) var(--wa-space-xs);
      }
      h1 {
        font-size: var(--wa-font-size-2xl);
        color: var(--wa-color-brand-on-quiet);
        margin: 0;
      }
      main {
        flex-grow: 1;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: var(--wa-font-size-4xl);
      }
      footer {
        display: flex;
        justify-content: space-between;
        padding: var(--wa-space-xs) var(--wa-space-xs);
      }
      span.toolbar-left {
        display: flex;
        justify-content: space-between;
        min-width: 190px;
      }
      span.toolbar-right {
        display: flex;
        justify-content: space-around;
        min-width: 114px;
      }
      button::part(base) {
        width: 100px;
      }
    }
  `;

  @property({ attribute: "deck-title" })
  deckTitle: string = "Title";

  @property({ attribute: "home-route" })
  homeRoute: string = "/";

  @property({ type: Boolean })
  deckIsReversed = false;

  @property({ type: Array })
  cards: { id: number; side1: string; side2: string }[] = [];

  @property({ type: Number })
  totalRounds = 3;

  @state()
  private _remainingCards: typeof this.cards = [];

  @state()
  private _doneCards: typeof this.cards = [];

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

  // Generate a unique identifier for this deck based on its title
  private getDeckId(): string {
    return this.deckTitle
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join("");
  }

  willUpdate(changedProperties: PropertyValues<this>) {
    if (changedProperties.has("cards") || changedProperties.has("deckTitle")) {
      // Initialize session only when we have actual cards and a non-default title
      if (
        this.cards.length > 0 &&
        this.deckTitle !== "Title" &&
        !this._sessionInitialized
      ) {
        this._initializeSession();
        this._sessionInitialized = true;
      }
    }
  }

  private _initializeSession() {
    const deckId = this.getDeckId();

    // Load settings
    this.deckIsReversed = localStorage.getItem("reverseDeck") === "true";
    this._side = this.deckIsReversed ? "side2" : "side1";

    // Load progress
    const savedCurrentRound = localStorage.getItem(`currentRound${deckId}`);
    const savedTotalRounds = localStorage.getItem("totalRounds");
    const savedWrongFirstTime = localStorage.getItem(`wrongFirstTime${deckId}`);

    if (savedCurrentRound !== null) {
      this._currentRound = parseInt(savedCurrentRound, 10);
    }
    if (savedTotalRounds !== null) {
      this.totalRounds = parseInt(savedTotalRounds, 10);
    }
    if (savedWrongFirstTime !== null) {
      this._wrongFirstTime = JSON.parse(savedWrongFirstTime);
    }

    // Initialize cards
    let initialCards = [...this.cards];

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
        localStorage.setItem(`currentRound${deckId}`, "0");
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

  shuffle(array: typeof this.cards) {
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
      <h1>${this.deckTitle}</h1>`;
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
    const deckId = this.getDeckId();

    if (this._remainingCards.length === 0) {
      this._currentRound++;

      if (this._currentRound === this.totalRounds) {
        localStorage.removeItem(`currentRound${deckId}`);
        localStorage.removeItem(`wrongFirstTime${deckId}`);
        window.location.href = this.homeRoute;
        return;
      }

      localStorage.setItem(
        `currentRound${deckId}`,
        this._currentRound.toString(),
      );

      const nextRoundCards = this._doneCards.filter((card) =>
        this._wrongFirstTime.includes(card.id),
      );

      if (this._currentRound > 0 && nextRoundCards.length === 0) {
        localStorage.removeItem(`currentRound${deckId}`);
        localStorage.removeItem(`wrongFirstTime${deckId}`);
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
    const deckId = this.getDeckId();

    if (this._currentRound === 0) {
      if (!this._wrongFirstTime.includes(currentCard.id)) {
        this._wrongFirstTime = [...this._wrongFirstTime, currentCard.id];
        localStorage.setItem(
          `wrongFirstTime${deckId}`,
          JSON.stringify(this._wrongFirstTime),
        );
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
