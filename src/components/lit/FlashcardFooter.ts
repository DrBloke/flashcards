import { customElement, property } from "lit/decorators.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/button-group/button-group.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import { flashcardStyles } from "./Flashcard.css";

import { LitElement, html, css } from "lit";

@customElement("flashcard-footer")
export class FlashcardFooter extends LitElement {
  static styles = [
    flashcardStyles,
    css`
      :host {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
      }
    `,
  ];

  @property({ type: Number })
  currentRound = 0;

  @property({ type: Number })
  totalRounds = 3;

  @property({ type: Number })
  cardsDone = 0;

  @property({ type: Number })
  cardsTotal = 0;

  @property({ type: Boolean })
  canFlip = false;

  @property({ type: Boolean })
  sessionCompleted = false;

  @property({ type: Boolean })
  sessionStarted = false;

  private _flipCard() {
    this.dispatchEvent(new CustomEvent("flip-card"));
  }

  private _markCorrect() {
    this.dispatchEvent(new CustomEvent("mark-correct"));
  }

  private _markIncorrect() {
    this.dispatchEvent(new CustomEvent("mark-incorrect"));
  }

  private _flipBack() {
    this.dispatchEvent(new CustomEvent("flip-back"));
  }

  render() {
    // If session not started and not completed, footer might be empty or different?
    // In original code: if (!sessionStarted && !sessionCompleted) return html``
    // The parent should decide whether to render this footer.

    const completedCards = this.cardsDone;
    // Assuming cardsTotal includes done cards?
    // In Flashcard.ts: totalInRound = _remainingCards.length + _doneCards.length

    return html`
      <span class="toolbar-left">
        <span class="cards-progress"
          >Cards: ${completedCards}/${this.cardsTotal}</span
        >
        <span class="rounds-progress"
          >Round:
          ${Math.min(this.currentRound + 1, this.totalRounds)}/${this
            .totalRounds}</span
        >
      </span>
      <span class="toolbar-center">
        ${!this.sessionStarted || this.sessionCompleted || this.canFlip
          ? ""
          : html`
              <wa-button
                id="back-flip"
                title="back to side 1"
                @click=${this._flipBack}
                variant="brand"
                appearance="filled"
              >
                <wa-icon name="arrow-left" label="back"></wa-icon>
              </wa-button>
            `}
      </span>
      <span class="toolbar-right">
        ${!this.sessionStarted || this.sessionCompleted
          ? ""
          : this.canFlip
            ? html` <wa-button
                id="flip"
                title="flip"
                @click=${this._flipCard}
                variant="brand"
              >
                <wa-icon
                  id="flip-icon"
                  name="arrows-rotate"
                  label="flip"
                ></wa-icon
                >&nbsp;&nbsp;Flip
              </wa-button>`
            : html`<wa-button-group>
                <wa-button
                  id="correct"
                  title="correct"
                  @click=${this._markCorrect}
                  variant="success"
                >
                  <wa-icon name="check" label="correct"></wa-icon>
                </wa-button>
                <wa-button
                  id="incorrect"
                  title="incorrect"
                  @click=${this._markIncorrect}
                  variant="danger"
                >
                  <wa-icon name="xmark" label="incorrect"></wa-icon>
                </wa-button>
              </wa-button-group>`}
      </span>
    `;
  }
}
