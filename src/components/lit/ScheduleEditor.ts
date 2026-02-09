import { LitElement, css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { flashcardsStorageSchema } from "../../schemas/storage";
import {
  DEFAULT_LEARNING_SCHEDULE,
  type LearningSchedule,
} from "../../schemas/learningSchedule";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/input/input.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";

@customElement("schedule-editor")
export class ScheduleEditor extends LitElement {
  static styles = css`
    :host {
      display: block;
      box-sizing: border-box;
      width: 100%;
      max-width: 100%;
    }
    * {
      box-sizing: border-box;
    }
    .top-actions {
      display: flex;
      justify-content: flex-end;
      margin-bottom: var(--wa-space-m);
    }
    .schedule-grid {
      display: flex;
      flex-direction: column;
      gap: var(--wa-space-m);
      margin: var(--wa-space-m) 0;
    }
    .schedule-item {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--wa-space-s);
      padding: var(--wa-space-s);
      padding-top: var(--wa-space-xl);
      background-color: var(--wa-color-surface-default);
      border-radius: var(--wa-border-radius-s);
      border: 1px solid var(--wa-color-gray-90);
      position: relative;
    }
    .field-group {
      display: flex;
      flex-direction: column;
      gap: var(--wa-space-3xs);
      min-width: 0;
    }
    .field-label {
      font-size: var(--wa-font-size-2xs);
      color: var(--wa-color-gray-40);
      font-weight: var(--wa-font-weight-bold);
      text-transform: uppercase;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    wa-input {
      width: 100%;
      min-width: 0;
    }
    .actions {
      display: flex;
      gap: var(--wa-space-s);
      margin-top: var(--wa-space-m);
      flex-wrap: wrap;
    }
    .remove-btn {
      position: absolute;
      top: var(--wa-space-xs);
      right: var(--wa-space-xs);
      color: var(--wa-color-danger-60);
    }
    .help-text {
      font-size: var(--wa-font-size-xs);
      color: var(--wa-color-gray-40);
      margin-bottom: var(--wa-space-m);
    }
    .unit-hint {
      font-size: 0.8em;
      color: var(--wa-color-gray-50);
    }
    .scheduled-date {
      display: block;
      font-size: var(--wa-font-size-xs);
      color: var(--wa-color-gray-40);
      margin-top: var(--wa-space-3xs);
    }

    /* Desktop layout */
    @media (min-width: 768px) {
      .top-actions {
        margin-bottom: var(--wa-space-s);
      }
      .schedule-item {
        grid-template-columns: 1.5fr 1fr 1fr 1fr;
        align-items: end;
        padding: var(--wa-space-l);
        padding-right: var(--wa-space-3xl);
      }
      .remove-btn {
        position: static;
        box-shadow: none;
        margin-bottom: 2px;
      }
    }
  `;

  @property({ attribute: "set-path" })
  setPath: string = "";

  @state()
  private _schedule: LearningSchedule = [];

  connectedCallback() {
    super.connectedCallback();
    this._loadSchedule();
  }

  private _loadSchedule() {
    const rawData = localStorage.getItem("flashcards-data");
    const parsed = rawData ? JSON.parse(rawData) : {};
    const result = flashcardsStorageSchema.safeParse(parsed);
    const allData = result.success ? result.data : {};

    this._schedule = allData[this.setPath]?.settings?.learningSchedule || [
      ...DEFAULT_LEARNING_SCHEDULE,
    ];
  }

  private _save() {
    const rawData = localStorage.getItem("flashcards-data");
    const parsed = rawData ? JSON.parse(rawData) : {};
    const result = flashcardsStorageSchema.safeParse(parsed);
    const allData = result.success ? result.data : {};

    if (!this.setPath) return;

    if (!allData[this.setPath]) {
      allData[this.setPath] = { settings: {} };
    }
    const setData = allData[this.setPath];
    if (setData) {
      if (!setData.settings) setData.settings = {};
      setData.settings.learningSchedule = this._schedule;
    }

    localStorage.setItem("flashcards-data", JSON.stringify(allData));

    // Dispatch event so other components can refresh
    window.dispatchEvent(new CustomEvent("flashcards-data-changed"));
  }

  private _addStep() {
    this._schedule = [
      ...this._schedule,
      {
        minTimeSinceLastMilestone: 86400,
        numberOfSessions: 1,
        minTimeBetweenSessions: null,
        maxTimeBetweenSessions: null,
      },
    ];
  }

  private _removeStep(index: number) {
    this._schedule = this._schedule.filter((_, i) => i !== index);
  }

  private _reset() {
    this._schedule = [...DEFAULT_LEARNING_SCHEDULE];
  }

  private _updateField(
    index: number,
    field: keyof LearningSchedule[0],
    value: string,
  ) {
    const num = value === "" ? null : parseInt(value);
    const newSchedule = [...this._schedule];
    const step = newSchedule[index];
    if (step) {
      // @ts-expect-error - dynamic assignment
      step[field] = num;
      this._schedule = newSchedule;
    }
  }

  render() {
    return html`
      <div class="top-actions">
        <wa-button size="small" @click=${this._reset}
          >Restore Defaults</wa-button
        >
      </div>
      <p class="help-text">
        All times are in seconds.
        <span class="unit-hint">(1h = 3600, 1d = 86400)</span>
      </p>

      <div class="schedule-grid">
        ${this._schedule.map(
          (step, i) => html`
            <div class="schedule-item">
              <div class="field-group">
                <span class="field-label">Wait (Milestone)</span>
                <wa-input
                  type="number"
                  size="small"
                  .value=${step.minTimeSinceLastMilestone?.toString() || ""}
                  @input=${(e: Event) =>
                    this._updateField(
                      i,
                      "minTimeSinceLastMilestone",
                      (e.target as HTMLInputElement).value,
                    )}
                ></wa-input>
              </div>

              <div class="field-group">
                <span class="field-label">Sessions</span>
                <wa-input
                  type="number"
                  size="small"
                  .value=${step.numberOfSessions.toString()}
                  @input=${(e: Event) =>
                    this._updateField(
                      i,
                      "numberOfSessions",
                      (e.target as HTMLInputElement).value,
                    )}
                ></wa-input>
              </div>

              <div class="field-group">
                <span class="field-label">Min Gap</span>
                <wa-input
                  type="number"
                  size="small"
                  .value=${step.minTimeBetweenSessions?.toString() || ""}
                  placeholder="None"
                  @input=${(e: Event) =>
                    this._updateField(
                      i,
                      "minTimeBetweenSessions",
                      (e.target as HTMLInputElement).value,
                    )}
                ></wa-input>
              </div>

              <div class="field-group">
                <span class="field-label">Max Gap</span>
                <wa-input
                  type="number"
                  size="small"
                  .value=${step.maxTimeBetweenSessions?.toString() || ""}
                  placeholder="None"
                  @input=${(e: Event) =>
                    this._updateField(
                      i,
                      "maxTimeBetweenSessions",
                      (e.target as HTMLInputElement).value,
                    )}
                ></wa-input>
              </div>

              <wa-button
                circle
                size="small"
                class="remove-btn"
                @click=${() => this._removeStep(i)}
                title="Remove Step"
              >
                <wa-icon name="trash"></wa-icon>
              </wa-button>
            </div>
          `,
        )}
      </div>

      <div class="actions">
        <wa-button size="small" @click=${this._addStep}>
          <wa-icon slot="prefix" name="plus"></wa-icon>
          Add Step
        </wa-button>
        <wa-button size="small" variant="brand" @click=${this._save}
          >Save Schedule</wa-button
        >
      </div>
    `;
  }
}
