import { LitElement, css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { z } from "zod";
import { flashcardsStorageSchema } from "../../schemas/storage";
import { DEFAULT_LEARNING_SCHEDULE } from "../../schemas/learningSchedule";
import "@awesome.me/webawesome/dist/components/badge/badge.js";

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
      background-color: var(--wa-color-gray-90);
    }
    .progress-dot.completed {
      background-color: var(--wa-color-success-60);
    }
    .progress-dot.current {
      background-color: var(--wa-color-brand-60);
      box-shadow: 0 0 0 2px var(--wa-color-brand-90);
    }
    .progress-dot.current.new {
      background-color: var(--wa-color-gray-90);
      box-shadow: 0 0 0 2px var(--wa-color-gray-80);
    }
    .progress-dot.current.due {
      background-color: var(--wa-color-warning-60);
      box-shadow: 0 0 0 2px var(--wa-color-warning-90);
    }
    .progress-dot.current.overdue {
      background-color: var(--wa-color-danger-60);
      box-shadow: 0 0 0 2px var(--wa-color-danger-90);
    }
    .progress-dot.current.scheduled {
      background-color: var(--wa-color-brand-60);
      box-shadow: 0 0 0 2px var(--wa-color-brand-90);
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
      return {
        state: "new" as const,
        label: "Ready",
        groupIndex: 0,
        sessionIndex: 0,
        problemCards: 0,
        nextReview: null,
      };
    }

    const lastEntry = deckData.learningLog[deckData.learningLog.length - 1];
    const now = Date.now();
    const nextReview = lastEntry.nextReview;
    const isDue = nextReview === null || now >= nextReview;

    // Determine the group and session we are waiting for
    let targetGroupIndex = lastEntry.sessionGroupIndex;
    let targetSessionIndex = lastEntry.sessionIndex;

    if (targetGroupIndex === -1) {
      targetGroupIndex = 0;
      targetSessionIndex = 0;
    } else if (lastEntry.isExtra) {
      // Stay at same index
    } else if (
      targetSessionIndex <
      schedule[targetGroupIndex].numberOfSessions - 1
    ) {
      targetSessionIndex++;
    } else {
      targetGroupIndex = Math.min(targetGroupIndex + 1, schedule.length - 1);
      targetSessionIndex = 0;
    }

    // Determine if overdue
    let isOverdue = false;
    const currentGroup = schedule[lastEntry.sessionGroupIndex];
    if (currentGroup && !lastEntry.isExtra) {
      if (lastEntry.sessionIndex < currentGroup.numberOfSessions - 1) {
        // Within a group
        if (currentGroup.maxTimeBetweenSessions !== null) {
          const overdueTime =
            lastEntry.endTime + currentGroup.maxTimeBetweenSessions * 1000;
          if (now > overdueTime) isOverdue = true;
        }
      }
    }

    let state: "due" | "overdue" | "scheduled" = isDue ? "due" : "scheduled";
    if (isOverdue) state = "overdue";

    return {
      state,
      label:
        state === "due" ? "Due" : state === "overdue" ? "Overdue" : "Scheduled",
      groupIndex: targetGroupIndex,
      sessionIndex: targetSessionIndex,
      problemCards: deckData.wrongFirstTime.length,
      nextReview: nextReview,
    };
  }

  render() {
    return html`
      <table>
        <thead>
          <tr>
            <th>Deck</th>
            <th>Progress</th>
            <th>Status</th>
            <th>Problem Cards</th>
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
                      if (i < status.groupIndex) dotClass = "completed";
                      else if (i === status.groupIndex)
                        dotClass = `current ${status.state}`;

                      return html`
                        <div
                          class="progress-dot ${dotClass}"
                          title="Group ${i + 1}${i === status.groupIndex
                            ? ` (${status.label})`
                            : ""}"
                        ></div>
                      `;
                    })}
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
