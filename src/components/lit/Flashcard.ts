import { LitElement, html, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { z } from "zod";
import { deckSchema } from "../../schemas/deck";
import {
  flashcardContainerStyles,
  flashcardContentStyles,
} from "./Flashcard.css";
import { FlashcardSession } from "../../core/FlashcardSession";
import { FlashcardStorage } from "../../core/FlashcardStorage";
import "./FlashcardHeader";
import "./FlashcardFooter";
import "./FlashcardStartScreen";
import "./FlashcardStudySession";
import "./FlashcardCompletedScreen";

@customElement("flashcard-deck")
export class FlashcardDeck extends LitElement {
  static styles = [flashcardContainerStyles, flashcardContentStyles];

  @property({ type: Object })
  deck?: z.infer<typeof deckSchema>;

  @property({ attribute: "deck-id" })
  deckId: string = "";

  @property({ attribute: "set-path" })
  setPath: string = "";

  @property({ attribute: "home-route" })
  homeRoute: string = "/";

  @state()
  private _side: "side1" | "side2" = "side1";

  session = new FlashcardSession(this);

  willUpdate(changedProperties: PropertyValues<this>) {
    if (
      changedProperties.has("deck") ||
      changedProperties.has("deckId") ||
      changedProperties.has("setPath")
    ) {
      if (this.deckId && this.setPath) {
        this.session.updateContext(this.deckId, this.setPath, this.deck);

        // Initialize side based on settings
        // We can't easily access settings here without the session loading them first needed?
        // Session loads settings in initializeSession().
        // We can check session.deckIsReversed.
        const settings = FlashcardStorage.getSettings(this.setPath);
        if (settings.reverseDeck) {
          this._side = "side2";
        } else {
          this._side = "side1";
        }
      }
    }
  }

  firstUpdated() {
    // Clear the SEO/SSR injected light DOM so that interactive
    // components like FlashcardHeader are properly rendered via fallback slots.
    this.innerHTML = "";
    // Attempt initial focus if needed
  }

  render() {
    const isCompleted =
      this.session.sessionCompleted ||
      (this.session.currentRound >= this.session.totalRounds &&
        this.session.totalRounds > 0);

    let mainContent;

    if (isCompleted) {
      mainContent = html`<flashcard-completed-screen
        .score=${this.session.score}
        .duration=${this.session.duration}
        .sessionMissedCount=${this.session.sessionMissedCount}
        .lastLogEntry=${this.session.learningLog[
          this.session.learningLog.length - 1
        ]}
        .showDemotionChoice=${this.session.showDemotionChoice}
        .milestoneIndex=${this.session.milestoneIndex}
        .isIngrained=${this.session.isIngrained}
        .homeRoute=${this.homeRoute}
        @retry-milestone=${() => this.session.retryMilestone()}
        @demote-milestone=${() => this.session.demoteToPreviousMilestone()}
      ></flashcard-completed-screen>`;
    } else if (!this.session.sessionStarted) {
      mainContent = html`<flashcard-start-screen
        .isDue=${this.session.isDue}
        .isNewMilestone=${this.session.isNewMilestone}
        .isIngrained=${this.session.isIngrained}
        .milestoneIndex=${this.session.milestoneIndex}
        .sessionIndex=${this.session.sessionIndex}
        .strugglingCount=${this.session.strugglingCount}
        .milestone=${this.session.currentMilestone}
        .lastReviewTimestamp=${this.session.learningLog[
          this.session.learningLog.length - 1
        ]?.nextReview}
        .homeRoute=${this.homeRoute}
        @start-session=${(e: CustomEvent) =>
          this.session.startSession(e.detail.mode)}
      ></flashcard-start-screen>`;
    } else if (this.session.remainingCards.length === 0) {
      mainContent = html`<div>No cards available</div>`;
    } else {
      const card = this.session.remainingCards[0];
      mainContent = html`<flashcard-study-session
        .card=${card}
        .side=${this._side}
        .fontSize=${this.session.cardFontSizes[card.id] || 2.25}
      ></flashcard-study-session>`;
    }

    const cardsTotal =
      this.session.remainingCards.length + this.session.doneCards.length;

    const questionSide = this.session.deckIsReversed ? "side2" : "side1";
    const canFlip = this._side === questionSide;

    return html`
      <div id="wrapper">
        <header role="banner">
          <slot name="header">
            <flashcard-header
              .title=${this.deck?.title}
              .homeRoute=${this.homeRoute}
              @increase-font=${() => this.session.increaseFontSize()}
              @decrease-font=${() => this.session.decreaseFontSize()}
            ></flashcard-header>
          </slot>
        </header>
        <main role="main"><slot></slot>${mainContent}</main>
        <footer role="contentinfo">
          <slot name="footer">
            <flashcard-footer
              .currentRound=${this.session.currentRound}
              .totalRounds=${this.session.totalRounds}
              .cardsDone=${this.session.doneCards.length}
              .cardsTotal=${cardsTotal}
              .sessionCompleted=${isCompleted}
              .sessionStarted=${this.session.sessionStarted}
              .canFlip=${canFlip}
              @flip-card=${this._flipCard}
              @flip-back=${this._flipBack}
              @mark-correct=${this._markCorrect}
              @mark-incorrect=${this._markIncorrect}
            ></flashcard-footer>
          </slot>
        </footer>
      </div>
    `;
  }

  async _flipCard() {
    if (this.session.startTime === 0) this.session.startTime = Date.now();
    this._flip("forward");
    await this.updateComplete;
    // Focus logic?
    // The footer buttons are inside shadow DOM of flashcard-footer.
    // referencing them by ID locally won't work.
    // But we can let the footer handle focus or just ignore for now as webawesome buttons might handle focus.
  }

  async _flipBack() {
    this._flip("back");
    await this.updateComplete;
  }

  async _markCorrect() {
    this._flip("back");
    const card = this.session.remainingCards[0];
    this.session.markCorrect(card);
    await this.updateComplete;
  }

  async _markIncorrect() {
    this._flip("back");
    const card = this.session.remainingCards[0];
    this.session.markIncorrect(card);
    await this.updateComplete;
  }

  _flip(flipDirection: "forward" | "back") {
    if (!this.session.deckIsReversed) {
      this._side = flipDirection === "forward" ? "side2" : "side1";
    } else {
      this._side = flipDirection === "forward" ? "side1" : "side2";
    }
  }
}
