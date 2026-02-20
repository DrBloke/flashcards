import { LitElement, css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { z } from "zod";
import { FlashcardStorage } from "../../core/FlashcardStorage";
import { flashcardsStorageSchema } from "../../schemas/storage";
import {
  DEFAULT_LEARNING_SCHEDULE,
  type Milestone,
} from "../../schemas/learningSchedule";
import "@awesome.me/webawesome/dist/components/badge/badge.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import "@awesome.me/webawesome/dist/components/tooltip/tooltip.js";
import { LearningAlgorithm } from "../../core/LearningAlgorithm";
import "@awesome.me/webawesome/dist/components/input/input.js";
import { formatDistanceToNow } from "date-fns";

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
      padding-left: var(--wa-space-xs);
      padding-right: var(--wa-space-xs);
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
    .progress-dot.ingrained {
      background-color: var(--wa-color-brand-60);
      border-color: var(--wa-color-brand-60);
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
      font-weight: var(--wa-font-weight-bold);
      color: var(--wa-color-gray-40);
    }
    .problem-cards.has-problems {
      color: var(--wa-color-danger-70);
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
      padding: var(--wa-space-3xs);
    }
    .milestone-entry {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: var(--wa-space-3xs) 0;
      border-bottom: 1px solid var(--wa-color-gray-90);
    }
    .milestone-entry:last-child {
      border-bottom: none;
    }
    .milestone-session {
      font-weight: var(--wa-font-weight-semibold);
      color: var(--wa-color-neutral-0);
    }
    .milestone-description {
      font-size: var(--wa-font-size-xs);
      color: var(--wa-color-neutral-80);
      line-height: 1.2;
    }
    .info-button {
      margin-left: var(--wa-space-2xs);
      color: var(--wa-color-gray-50);
      transition: var(--wa-transition-fast) color;
      background: none;
      border: none;
      padding: var(--wa-space-3xs);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--wa-border-radius-small);
    }
    .info-button wa-icon {
      font-size: 1.1rem;
      display: block;
    }
    .search-container {
      margin-bottom: var(--wa-space-m);
      max-width: 400px;
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

  @state()
  private _searchQuery = "";

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
    this._storageData = FlashcardStorage.getStoredData();
  }

  private _handleSearch(e: Event) {
    const input = e.target as HTMLElement & { value?: string };
    this._searchQuery = (input.value || "").toLowerCase().trim();
  }

  private _getDeckStatus(deckId: string) {
    const setData = this._storageData[this.setPath];
    const deckData = setData?.decks?.[deckId];
    const schedule =
      setData?.settings?.learningSchedule || DEFAULT_LEARNING_SCHEDULE;
    const learningLog = deckData?.learningLog || [];

    const status = LearningAlgorithm.getDeckStatus(learningLog, schedule);
    const problemCards = deckData?.wrongFirstTime?.length || 0;

    return {
      ...status,
      problemCards,
    };
  }

  private _getMilestoneDescription(milestone: Milestone) {
    return LearningAlgorithm.getMilestoneDescription(milestone);
  }

  render() {
    // Robustly handle decks property which might be a JSON string from Astro
    let decksArray = this.decks;
    if (typeof decksArray === "string") {
      try {
        decksArray = JSON.parse(decksArray);
      } catch (e) {
        console.error("Failed to parse decks property", e);
        decksArray = [];
      }
    }

    const filteredDecks = (decksArray || []).filter((deck) =>
      (deck.title || "").toLowerCase().includes(this._searchQuery),
    );

    const decksWithStatus = filteredDecks.map((deck) => ({
      deck,
      status: this._getDeckStatus(deck.id),
    }));

    const statusWeight = {
      ingrained: -1,
      overdue: 0,
      due: 1,
      scheduled: 2,
      new: 3,
    };
    // Adjust weight based on preference. Maybe ingrained is last.
    // Let's explicitly put ingrained last.
    // statusWeight['ingrained'] = 4;

    decksWithStatus.sort((a, b) => {
      const weightA =
        statusWeight[a.status.state as keyof typeof statusWeight] ?? 4;
      const weightB =
        statusWeight[b.status.state as keyof typeof statusWeight] ?? 4;
      if (weightA !== weightB) {
        return weightA - weightB;
      }
      return 0; // Stability: return 0 if weights are equal
    });

    return html`
      <div class="search-container">
        <wa-input
          id="deck-search"
          label="Search Decks"
          placeholder="Search decks..."
          clearable
          @input=${this._handleSearch}
          @wa-clear=${this._handleSearch}
        >
          <wa-icon name="magnifying-glass" slot="prefix"></wa-icon>
        </wa-input>
      </div>
      <table>
        <thead>
          <tr>
            <th>Deck</th>
            <th>Milestones</th>
            <th>Current Milestone</th>
            <th>Status</th>
            <th>Problem Cards</th>
          </tr>
        </thead>
        <tbody>
          ${decksWithStatus.map(({ deck, status }) => {
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

                      const isIngrained = status.state === "ingrained";

                      if (isIngrained) {
                        dotClass = "ingrained";
                        label += " (Ingrained)";
                      } else if (i < status.milestoneIndex) {
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
                    <button
                      id="milestones-info-${deck.id.replace(/\//g, "-")}"
                      class="info-button"
                      aria-label="All Milestones Info"
                    >
                      <wa-icon name="circle-info"></wa-icon>
                    </button>
                    <wa-tooltip
                      for="milestones-info-${deck.id.replace(/\//g, "-")}"
                    >
                      <div class="milestone-info">
                        ${schedule.map(
                          (m, i) => html`
                            <div class="milestone-entry">
                              <div
                                class="milestone-session"
                                style="${i === status.milestoneIndex
                                  ? "color: var(--wa-color-brand-80);"
                                  : ""}"
                              >
                                Milestone
                                ${i + 1}${i === status.milestoneIndex
                                  ? " (Current)"
                                  : ""}
                              </div>
                              <div class="milestone-description">
                                ${this._getMilestoneDescription(m)}
                              </div>
                            </div>
                          `,
                        )}
                      </div>
                    </wa-tooltip>
                  </div>
                </td>
                <td>
                  <div class="milestone-info">
                    <div class="progress-bar">
                      ${Array.from({ length: status.totalSessions }).map(
                        (_, i) => {
                          let dotClass = "";
                          let label = `Session ${i + 1}`;

                          if (status.state === "ingrained") {
                            dotClass = "ingrained";
                            label += " (Ingrained)";
                          } else if (i < status.sessionIndex) {
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
                      <button
                        id="info-${deck.id.replace(/\//g, "-")}"
                        class="info-button"
                        aria-label="Milestone Info"
                      >
                        <wa-icon name="circle-info"></wa-icon>
                      </button>
                      <wa-tooltip for="info-${deck.id.replace(/\//g, "-")}">
                        ${status.milestoneDescription}
                      </wa-tooltip>
                    </div>
                  </div>
                </td>
                <td
                  title="${status.nextReview
                    ? formatDistanceToNow(status.nextReview, {
                        addSuffix: true,
                      })
                    : ""}"
                >
                  <wa-badge
                    variant="${status.state === "due"
                      ? "warning"
                      : status.state === "overdue"
                        ? "danger"
                        : status.state === "new"
                          ? "success"
                          : status.state === "ingrained"
                            ? "brand"
                            : "neutral"}"
                  >
                    ${status.label}
                  </wa-badge>
                  ${status.state === "scheduled" && status.nextReview
                    ? html`<span class="scheduled-date"
                        >${formatDistanceToNow(status.nextReview, {
                          addSuffix: true,
                        })}</span
                      >`
                    : ""}
                </td>
                <td>
                  <span
                    class="problem-cards ${status.problemCards > 0
                      ? "has-problems"
                      : ""}"
                    >${status.problemCards}/${deck.totalCards}</span
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
