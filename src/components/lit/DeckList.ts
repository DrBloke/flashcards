import { LitElement, css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { z } from "zod";
import { flashcardsStorageSchema } from "../../schemas/storage";
import {
  DEFAULT_LEARNING_SCHEDULE,
  type Milestone,
} from "../../schemas/learningSchedule";
import "@awesome.me/webawesome/dist/components/badge/badge.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import "@awesome.me/webawesome/dist/components/tooltip/tooltip.js";

interface DeckEntry {
  id: string;
  title: string;
  totalCards: number;
}

@customElement("deck-list")
export class DeckList extends LitElement {
  static styles = css`
    :host {
      display: block;
      margin-top: var(--wa-space-l);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: var(--wa-font-size-m);
      color: var(--wa-color-gray-10);
    }
    th,
    td {
      text-align: left;
      padding: var(--wa-space-s) var(--wa-space-m);
      border-bottom: 1px solid var(--wa-color-gray-90);
    }
    th {
      font-weight: var(--wa-font-weight-bold);
      background-color: var(--wa-color-gray-95);
      color: var(--wa-color-gray-30);
      text-transform: uppercase;
      font-size: var(--wa-font-size-xs);
      letter-spacing: 0.05em;
    }
    tr:hover td {
      background-color: var(--wa-color-gray-98);
    }
    .deck-title a {
      color: var(--wa-color-brand-30);
      text-decoration: none;
      font-weight: var(--wa-font-weight-medium);
    }
    .deck-title a:hover {
      text-decoration: underline;
    }
    .progress-bar {
      display: flex;
      gap: 2px;
      align-items: center;
    }
    .progress-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: transparent;
      border: 1px solid var(--wa-color-gray-80);
      flex-shrink: 0;
    }
    .progress-dot.completed {
      background-color: var(--wa-color-success-60);
      border-color: var(--wa-color-success-60);
    }
    .progress-dot.current {
      background-color: var(--wa-color-brand-60);
      border-color: var(--wa-color-brand-60);
      box-shadow: 0 0 0 2px var(--wa-color-brand-90);
    }
    .progress-dot.current.new {
      background-color: transparent;
      border-color: var(--wa-color-gray-80);
      box-shadow: 0 0 0 2px var(--wa-color-gray-90);
    }
    .progress-dot.current.due {
      background-color: var(--wa-color-warning-60);
      border-color: var(--wa-color-warning-60);
      box-shadow: 0 0 0 2px var(--wa-color-warning-90);
    }
    .progress-dot.current.overdue {
      background-color: var(--wa-color-danger-60);
      border-color: var(--wa-color-danger-60);
      box-shadow: 0 0 0 2px var(--wa-color-danger-90);
    }
    .progress-dot.current.scheduled {
      background-color: var(--wa-color-brand-60);
      border-color: var(--wa-color-brand-60);
      box-shadow: 0 0 0 2px var(--wa-color-brand-90);
    }
    .visually-hidden {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
    .progress-container {
      display: flex;
      flex-direction: column;
      gap: var(--wa-space-3xs);
    }
    .problem-cards {
      color: var(--wa-color-danger-60);
      font-weight: var(--wa-font-weight-bold);
    }
    .scheduled-date {
      display: block;
      font-size: var(--wa-font-size-xs);
      color: var(--wa-color-gray-40);
      margin-top: var(--wa-space-3xs);
    }
    .milestone-info {
      display: flex;
      flex-direction: column;
      gap: var(--wa-space-3xs);
    }
    .milestone-session {
      font-weight: var(--wa-font-weight-semibold);
      color: var(--wa-color-gray-10);
    }
    .milestone-description {
      font-size: var(--wa-font-size-xs);
      color: var(--wa-color-gray-40);
      line-height: 1.2;
    }
    .info-button {
      margin-left: var(--wa-space-2xs);
      color: var(--wa-color-gray-50);
      transition: var(--wa-transition-fast) color;
    }
    .info-button:hover {
      color: var(--wa-color-brand-60);
    }
    .info-button wa-icon {
      font-size: 1.1rem;
      display: block;
    }
  `;

  @property({ type: Array })
  decks: DeckEntry[] = [];

  @property({ attribute: "set-path" })
  setPath: string = "";

  @property({ attribute: "base-url" })
  baseUrl: string = "/";

  @state()
  private _storageData: z.infer<typeof flashcardsStorageSchema> = {};

  connectedCallback() {
    super.connectedCallback();
    this._loadStorage();
    // Listen for storage changes in other tabs
    window.addEventListener("storage", () => this._loadStorage());
    // Listen for local changes (e.g. from ScheduleEditor)
    window.addEventListener("flashcards-data-changed", () =>
      this._loadStorage(),
    );
  }

  private _loadStorage() {
    const rawData = localStorage.getItem("flashcards-data");
    const parsed = rawData ? JSON.parse(rawData) : {};
    const result = flashcardsStorageSchema.safeParse(parsed);
    if (result.success) {
      this._storageData = result.data;
    }
  }

  private _getDeckStatus(deckId: string) {
    const setData = this._storageData[this.setPath];
    const deckData = setData?.decks?.[deckId];
    const schedule =
      setData?.settings?.learningSchedule || DEFAULT_LEARNING_SCHEDULE;

    if (!deckData || deckData.learningLog.length === 0) {
      const currentMilestone = schedule[0];
      return {
        state: "new" as const,
        label: "Ready",
        milestoneIndex: 0,
        sessionIndex: 0,
        totalSessions: currentMilestone.numberOfSessions,
        milestoneDescription: this._getMilestoneDescription(currentMilestone),
        problemCards: 0,
        nextReview: null,
      };
    }

    const lastEntry = deckData.learningLog[deckData.learningLog.length - 1];
    const now = Date.now();
    const nextReview = lastEntry.nextReview;
    const isDue = nextReview === null || now >= nextReview;

    // Determine the group and session we are waiting for
    let targetMilestoneIndex = lastEntry.milestoneIndex;
    let targetSessionIndex = lastEntry.sessionIndex;

    if (targetMilestoneIndex === -1) {
      targetMilestoneIndex = 0;
      targetSessionIndex = 0;
    } else if (lastEntry.isExtra) {
      // Stay at same index
    } else if (
      targetSessionIndex <
      schedule[targetMilestoneIndex].numberOfSessions - 1
    ) {
      targetSessionIndex++;
    } else {
      targetMilestoneIndex = Math.min(
        targetMilestoneIndex + 1,
        schedule.length - 1,
      );
      targetSessionIndex = 0;
    }

    // Determine if overdue
    let isOverdue = false;
    const milestoneInLog = schedule[lastEntry.milestoneIndex];
    if (milestoneInLog && !lastEntry.isExtra) {
      if (lastEntry.sessionIndex < milestoneInLog.numberOfSessions - 1) {
        // Within a group
        if (milestoneInLog.maxTimeBetweenSessions !== null) {
          const overdueTime =
            lastEntry.endTime + milestoneInLog.maxTimeBetweenSessions * 1000;
          if (now > overdueTime) isOverdue = true;
        }
      }
    }

    let state: "due" | "overdue" | "scheduled" = isDue ? "due" : "scheduled";
    if (isOverdue) state = "overdue";

    const currentMilestone = schedule[targetMilestoneIndex];

    return {
      state,
      label:
        state === "due" ? "Due" : state === "overdue" ? "Overdue" : "Scheduled",
      milestoneIndex: targetMilestoneIndex,
      sessionIndex: targetSessionIndex,
      totalSessions: currentMilestone.numberOfSessions,
      milestoneDescription: this._getMilestoneDescription(currentMilestone),
      problemCards: deckData.wrongFirstTime.length,
      nextReview: nextReview,
    };
  }

  private _getMilestoneDescription(milestone: Milestone) {
    const {
      numberOfSessions,
      minTimeBetweenSessions,
      minTimeSinceLastMilestone,
    } = milestone;

    let desc = `${numberOfSessions} session${numberOfSessions > 1 ? "s" : ""}`;

    if (numberOfSessions > 1 && minTimeBetweenSessions) {
      const hours = minTimeBetweenSessions / 3600;
      desc += ` with at least ${hours} ${hours === 1 ? "hour" : "hours"} between each`;
    }

    if (minTimeSinceLastMilestone && minTimeSinceLastMilestone > 0) {
      const hours = minTimeSinceLastMilestone / 3600;
      desc += ` (after ${hours}h wait)`;
    }

    return desc;
  }

  render() {
    return html`
      <table>
        <thead>
          <tr>
            <th>Deck</th>
            <th>Milestones</th>
            <th>Current Milestone</th>
            <th>Status</th>
            <th>Problem Cards</th>
          </tr>
          </tr>
        </thead>
        <tbody>
          ${this.decks.map((deck) => {
            const status = this._getDeckStatus(deck.id);
            const schedule =
              this._storageData[this.setPath]?.settings?.learningSchedule ||
              DEFAULT_LEARNING_SCHEDULE;

            return html`
              <tr>
                <td class="deck-title">
                  <a href="${this.baseUrl}${this.setPath}/${deck.id}"
                    >${deck.title}</a
                  >
                </td>
                <td>
                  <div class="progress-bar">
                    ${schedule.map((_, i) => {
                      let dotClass = "";
                      let label = `Milestone ${i + 1}`;
                      if (i < status.milestoneIndex) {
                        dotClass = "completed";
                        label += " (Completed)";
                      } else if (i === status.milestoneIndex) {
                        dotClass = `current ${status.state}`;
                        label += ` (Current: ${status.label})`;
                      } else {
                        label += " (Pending)";
                      }

                      return html`
                        <div class="progress-dot ${dotClass}" title="${label}">
                          <span class="visually-hidden">${label}</span>
                        </div>
                      `;
                    })}
                  </div>
                </td>
                <td>
                  <div class="milestone-info">
                    <div class="progress-bar">
                      ${Array.from({ length: status.totalSessions }).map(
                        (_, i) => {
                          let dotClass = "";
                          let label = `Session ${i + 1}`;
                          if (i < status.sessionIndex) {
                            dotClass = "completed";
                            label += " (Completed)";
                          } else if (i === status.sessionIndex) {
                            dotClass = `current ${status.state}`;
                            label += ` (Current: ${status.label})`;
                          } else {
                            label += " (Pending)";
                          }

                          return html`
                            <div
                              class="progress-dot ${dotClass}"
                              title="${label}"
                            >
                              <span class="visually-hidden">${label}</span>
                            </div>
                          `;
                        },
                      )}
                      <wa-button
                        id="info-${deck.id.replace(/\//g, "-")}"
                        variant="text"
                        size="small"
                        class="info-button"
                        label="Milestone Info"
                        title="${status.milestoneDescription}"
                      >
                        <wa-icon name="circle-info"></wa-icon>
                      </wa-button>
                      <wa-tooltip for="info-${deck.id.replace(/\//g, "-")}">
                        ${status.milestoneDescription}
                      </wa-tooltip>
                    </div>
                  </div>
                </td>
                <td
                  title="${status.nextReview
                    ? new Date(status.nextReview).toLocaleString()
                    : ""}"
                >
                  <wa-badge
                    variant="${status.state === "due"
                      ? "warning"
                      : status.state === "overdue"
                        ? "danger"
                        : status.state === "new"
                          ? "success"
                          : "neutral"}"
                  >
                    ${status.label}
                  </wa-badge>
                  ${status.state === "scheduled" && status.nextReview
                    ? html`<span class="scheduled-date"
                        >${new Date(status.nextReview).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}</span
                      >`
                    : ""}
                </td>
                <td>
                  <span class="problem-cards"
                    >${status.problemCards > 0
                      ? status.problemCards
                      : "-"}</span
                  >
                </td>
              </tr>
            `;
          })}
        </tbody>
      </table>
    `;
  }
}
