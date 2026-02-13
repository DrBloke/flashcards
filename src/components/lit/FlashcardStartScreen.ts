import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import {
  formatDuration,
  intervalToDuration,
  formatDistanceToNow,
} from "date-fns";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import { flashcardStyles } from "./Flashcard.css";
import { type Milestone } from "../../schemas/learningSchedule";

@customElement("flashcard-start-screen")
export class FlashcardStartScreen extends LitElement {
  static styles = flashcardStyles;

  @property({ type: Boolean })
  isDue = false;

  @property({ type: Boolean })
  isNewMilestone = false;

  @property({ type: Number })
  milestoneIndex = 0;

  @property({ type: Number })
  sessionIndex = 0;

  @property({ type: Number })
  strugglingCount = 0;

  @property({ type: Object })
  milestone?: Milestone;

  @property({ type: Number })
  lastReviewTimestamp: number | null = null;

  @property()
  homeRoute: string = "/";

  private _startSession(mode: "all" | "struggling") {
    this.dispatchEvent(
      new CustomEvent("start-session", {
        detail: { mode },
      }),
    );
  }

  render() {
    if (this.isDue) {
      if (this.isNewMilestone) {
        return html`
          <div id="content" class="completed-content">
            <wa-icon
              name="calendar-check"
              label="New Milestone"
              class="completed-icon"
              style="color: var(--wa-color-brand-60)"
            ></wa-icon>
            <div class="completed-title">New Milestone</div>
            ${this.milestone
              ? html`<div class="completed-stats">
                  <p>Schedule for this milestone:</p>
                  <p>
                    ${this.milestone.numberOfSessions} sessions
                    ${this.milestone.minTimeBetweenSessions
                      ? html`,
                        ${formatDuration(
                          intervalToDuration({
                            start: 0,
                            end: this.milestone.minTimeBetweenSessions * 1000,
                          }),
                        )}
                        apart`
                      : ""}
                  </p>
                </div>`
              : ""}
            <wa-button @click=${() => this._startSession("all")} variant="brand"
              >Start Milestone</wa-button
            >
          </div>
        `;
      } else {
        return html`
          <div id="content" class="completed-content">
            <wa-icon
              name="arrows-rotate"
              label="Continue Session"
              class="completed-icon"
              style="color: var(--wa-color-brand-60)"
            ></wa-icon>
            <div class="completed-title">Session ${this.sessionIndex + 1}</div>
            ${this.strugglingCount > 0
              ? html`
                  <div class="completed-stats">
                    <p>There are ${this.strugglingCount} struggling words.</p>
                  </div>
                  <div
                    style="display: flex; gap: var(--wa-space-m); flex-wrap: wrap; justify-content: center"
                  >
                    <wa-button
                      @click=${() => this._startSession("struggling")}
                      variant="warning"
                      appearance="outlined"
                      >Study Struggling Only</wa-button
                    >
                    <wa-button
                      @click=${() => this._startSession("all")}
                      variant="brand"
                      >Study All Cards</wa-button
                    >
                  </div>
                `
              : html`
                  <div class="completed-stats">
                    <p>No struggling words yet.</p>
                  </div>
                  <wa-button
                    @click=${() => this._startSession("all")}
                    variant="brand"
                    >Start Session</wa-button
                  >
                `}
          </div>
        `;
      }
    } else {
      const nextReview = this.lastReviewTimestamp
        ? formatDistanceToNow(this.lastReviewTimestamp, { addSuffix: true })
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
              @click=${() => this._startSession("all")}
              variant="danger"
              appearance="outlined"
              >Study All Cards</wa-button
            >
            ${this.strugglingCount > 0
              ? html`
                  <wa-button
                    @click=${() => this._startSession("struggling")}
                    variant="warning"
                    appearance="outlined"
                    >Study Struggling Only (${this.strugglingCount})</wa-button
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
  }
}
