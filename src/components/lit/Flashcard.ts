import { LitElement, css, html } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
// import "https://early.webawesome.com/webawesome@3.0.0-alpha.12/dist/components/button/button.js";
// import "https://early.webawesome.com/webawesome@3.0.0-alpha.12/dist/components/icon-button/icon-button.js";
// import "@awesome.me/webawesome/dist/styles/themes/default.css";
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
    const isReversed = localStorage.getItem("reverseDeck") === "true";
    this.deckIsReversed = isReversed;
    if (this.deckIsReversed) {
      this._side = "side2";
    }
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
    return html`<span class="toolbar-left"> </span>
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

  flipCard() {
    this.flip("forward");
  }

  markCorrect() {
    this.flip("back");
    if (this._remainingCards.length !== 0) {
      const card = this._remainingCards[0];
      this._doneCards = [...this._doneCards, card];
      this._remainingCards = this._remainingCards.slice(1);
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
