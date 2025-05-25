import { LitElement, css, html } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import "https://early.webawesome.com/webawesome@3.0.0-alpha.12/dist/components/button/button.js";
import "https://early.webawesome.com/webawesome@3.0.0-alpha.12/dist/components/icon-button/icon-button.js";

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
      }
      span.toolbar-right {
        display: flex;
        justify-content: space-around;
        min-width: 114px;
      }
      wa-icon-button {
        font-size: var(--wa-font-size-3xl);
        color: var(--wa-color-brand-on-quiet);
      }
      wa-icon-button#flip {
        align-items: center;
        padding-left: 12px;
      }
      wa-icon-button#correct {
        color: var(--wa-color-success-on-quiet);
      }
      wa-icon-button#incorrect {
        color: var(--wa-color-danger-on-quiet);
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
  cards: { side1: string; side2: string }[] = [
    { side1: "No data", side2: "Still no data" },
  ];

  @property({ type: Number })
  remainingRounds = 3;

  @state()
  private _remainingCards = this.cards;

  @state()
  private _doneCards: typeof this.cards = [];

  @state()
  private _side: "side1" | "side2" = "side1";

  @query("#toolbar")
  toolbar!: HTMLSpanElement;

  connectedCallback() {
    super.connectedCallback();
    this._remainingCards = this.cards;
  }

  flipTemplate() {
    return html` <wa-icon-button
      id="flip"
      name="arrows-rotate"
      label="flip"
      title="flip"
      @click=${this.flipCard}
    >
    </wa-icon-button>`;
  }

  correctTemplate() {
    return html` <wa-icon-button
        name="check"
        id="correct"
        label="correct"
        title="correct"
        @click=${this.markCorrect}
      ></wa-icon-button>
      <wa-icon-button
        name="xmark"
        id="incorrect"
        label="incorrect"
        title="incorrect"
        @click=${this.markIncorrect}
      ></wa-icon-button>`;
  }

  render() {
    return html`
      <div id="wrapper">
        <header>
          <wa-icon-button
            name="house"
            href=${this.homeRoute}
            id="home"
            label="Home"
            title="home"
          >
            Home
          </wa-icon-button>
          <h1>${this.deckTitle}</h1>
        </header>
        <main>
          <div id="content">${this._remainingCards[0][this._side]}</div>
        </main>
        <footer>
          <span class="toolbar-left">
            <wa-icon-button
              id="reverse-deck"
              name=${this.deckIsReversed ? "caret-left" : "caret-right"}
              label=${this.deckIsReversed
                ? "Toggle deck order - currently reversed"
                : "Toggle deck order - currently normal"}
              title="Reverse deck order"
              @click=${this.reverseDeck}
            >
            </wa-icon-button>
          </span>
          <span class="toolbar-right">
            ${(this._side === "side1" && !this.deckIsReversed) ||
            (this._side === "side2" && this.deckIsReversed)
              ? this.flipTemplate()
              : this.correctTemplate()}
          </span>
        </footer>
      </div>
    `;
  }

  reverseDeck() {
    this.deckIsReversed = !this.deckIsReversed;
    if (this.deckIsReversed) {
      this._side = "side2";
    } else {
      this._side = "side1";
    }
  }

  flipCard() {
    this.flip("forward");
  }

  markCorrect() {
    this.flip("back");
    if (this._remainingCards.length !== 0) {
      this._doneCards.push(this._remainingCards.shift()!);
    }
    if (this._remainingCards.length === 0) {
      this.remainingRounds--;
      if (this.remainingRounds === 0) {
        document.location = this.homeRoute;
      }
      this._remainingCards = this._doneCards;
      this._doneCards = [];
    }
  }

  markIncorrect() {
    this.flip("back");
    const currentCard = this._remainingCards[0];
    this._remainingCards = this._remainingCards.slice(1).concat([currentCard]);
  }

  flip(flipDirection: "forward" | "back") {
    if (!this.deckIsReversed) {
      this._side = flipDirection === "forward" ? "side2" : "side1";
    } else {
      this._side = flipDirection === "forward" ? "side1" : "side2";
    }
  }
}
