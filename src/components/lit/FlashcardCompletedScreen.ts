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

  private _retryMilestone() {
    this.dispatchEvent(new CustomEvent("retry-milestone"));
  }

  private _demoteToPreviousMilestone() {
    this.dispatchEvent(new CustomEvent("demote-milestone"));
  }

  render() {
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
