import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { formatDistance, formatDistanceToNow } from "date-fns";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import { flashcardStyles } from "./Flashcard.css";
import { type LearningLogEntry } from "../../schemas/storage";

@customElement("flashcard-completed-screen")
export class FlashcardCompletedScreen extends LitElement {
  static styles = flashcardStyles;

  @property({ type: Number })
  score = 0;

  @property({ type: Number })
  duration = 0;

  @property({ type: Number })
  sessionMissedCount = 0;

  @property({ type: Object })
  lastLogEntry?: LearningLogEntry;

  @property({ type: Boolean })
  showDemotionChoice = false;

  @property({ type: Number })
  milestoneIndex = 0;

  @property()
  homeRoute: string = "/";

  @property({ type: Boolean })
  isIngrained = false;

  private _retryMilestone() {
    this.dispatchEvent(new CustomEvent("retry-milestone"));
  }

  private _demoteToPreviousMilestone() {
    this.dispatchEvent(new CustomEvent("demote-milestone"));
  }

  render() {
    if (this.isIngrained) {
      // Check if this was the transition session (just became ingrained)
      // or an extra session on an ingrained deck.
      // If just became ingrained, lastLogEntry.endTime is very close to now.
      // But practically, if isIngrained is true, we should probably show "Session Complete" for extra sessions?
      // "The new message should appear on the end screen of the last session in the last milestone."
      // If we are here, we just completed a session.
      // If it was an "extra" session, isExtra would be true on the last log entry.
      // However, the transition session is NOT extra.

      const isTransition = !this.lastLogEntry?.isExtra;

      if (isTransition) {
        return html`
          <div id="content" class="completed-content">
            <wa-icon
              name="medal"
              label="Decks Ingrained"
              class="completed-icon"
              style="color: var(--wa-color-brand-60)"
            ></wa-icon>
            <div class="completed-title">Deck Ingrained!</div>
            <div class="completed-stats">
              <p>
                Congratulations, you have completed the final milestone and this
                deck is now ingrained into your memory. No more studying is
                required but you can continue to view this deck at any time.
              </p>
              ${this.sessionMissedCount > 0
                ? html`<p
                    style="margin-top: var(--wa-space-m); color: var(--wa-color-warning-60);"
                  >
                    You struggled with ${this.sessionMissedCount} cards in this
                    final push.
                  </p>`
                : ""}
            </div>
            <wa-button
              id="back-to-home"
              href=${this.homeRoute}
              title="Back to Decks"
              variant="brand"
              appearance="filled"
            >
              <wa-icon name="arrow-left" label="Back"></wa-icon>
              &nbsp;&nbsp;Back to Decks
            </wa-button>
          </div>
        `;
      } else {
        // Extra session completed on ingrained deck
        return html`
          <div id="content" class="completed-content">
            <wa-icon
              name="check-double"
              label="Session Complete"
              class="completed-icon"
              style="color: var(--wa-color-success-60)"
            ></wa-icon>
            <div class="completed-title">Session Complete</div>
            <div class="completed-stats">
              <p>Great job keeping this deck fresh!</p>
              ${this.sessionMissedCount > 0
                ? html`<p>Cards to focus on: ${this.sessionMissedCount}</p>`
                : ""}
            </div>
            <wa-button
              id="back-to-home"
              href=${this.homeRoute}
              title="Back to Decks"
              variant="brand"
              appearance="filled"
            >
              <wa-icon name="arrow-left" label="Back"></wa-icon>
              &nbsp;&nbsp;Back to Decks
            </wa-button>
          </div>
        `;
      }
    }

    const timeSpent = formatDistance(0, this.duration, {
      includeSeconds: true,
    });
    const scorePercent = Math.round(this.score * 100);
    const isMastered = this.score >= 0.9;
    const isGoodProgress = scorePercent >= 40;

    return html`
      <div id="content" class="completed-content">
        <wa-icon
          name=${isMastered ? "circle-check" : "circle-exclamation"}
          label="Completed"
          class="completed-icon"
          style="color: ${isMastered
            ? "var(--wa-color-success-60)"
            : "var(--wa-color-warning-60)"}"
        ></wa-icon>
        <div class="completed-title">
          ${isMastered
            ? "Mastered!"
            : isGoodProgress
              ? "Good Progress"
              : "Needs Review"}
        </div>
        <div class="completed-stats">
          <p>Score: ${scorePercent}%</p>
          <p>Time spent: ${timeSpent}</p>
          ${!isMastered
            ? html`<p>Cards to focus on: ${this.sessionMissedCount}</p>`
            : ""}
          ${this.lastLogEntry?.nextReview
            ? html`<p>
                ${this.lastLogEntry.sessionIndex === 999
                  ? "You passed, but to advance to the next milestone you need 90% mastery. Let's try this milestone again."
                  : html`Next review scheduled for:
                    ${formatDistanceToNow(
                      this.lastLogEntry.nextReview as number,
                      { addSuffix: true },
                    )}`}
              </p>`
            : ""}
        </div>

        ${this.showDemotionChoice
          ? html`
              <div class="demotion-choices">
                <p>
                  Your score was low (${scorePercent}%). What would you like to
                  do?
                </p>
                <wa-button @click=${this._retryMilestone} variant="brand"
                  >Retry Current Milestone</wa-button
                >
                ${this.milestoneIndex > 0
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
}
