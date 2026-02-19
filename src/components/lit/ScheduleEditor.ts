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
import "@awesome.me/webawesome/dist/components/dialog/dialog.js";
import {
  NotificationDialog,
  type NotificationVariant,
} from "./NotificationDialog";

interface WaDialog extends HTMLElement {
  show(): void;
  hide(): void;
  open: boolean;
}
import { formatDuration, parseDuration } from "../../utils/time";
import { migrateDecks } from "../../utils/migration";

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
    .remove-group {
      display: contents;
    }
    .spacer {
      display: none;
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
    .error-text {
      color: var(--wa-color-danger-60);
      display: flex;
      align-items: center;
      gap: var(--wa-space-2xs);
    }

    /* Desktop layout */
    @media (min-width: 768px) {
      .top-actions {
        margin-bottom: var(--wa-space-s);
      }
      .schedule-item {
        grid-template-columns: 1.5fr 1fr 1fr 1fr auto;
        align-items: start; /* Align to top so labels align, errors expand downwards */
        padding: var(--wa-space-l);
        /* padding-right removed as button is now in grid */
      }
      .remove-group {
        display: flex; /* Mimic .field-group */
        flex-direction: column;
        gap: var(--wa-space-3xs); /* Mimic .field-group gap */
      }
      .spacer {
        display: block;
        visibility: hidden;
      }
      .remove-btn {
        position: static;
        margin-top: 0;
        margin-bottom: auto;
      }
    }

    .error-msg {
      color: var(--wa-color-danger-60);
      font-size: var(--wa-font-size-2xs);
      margin-top: 4px;
      display: flex;
      align-items: center;
      gap: var(--wa-space-2xs);
    }

    wa-input[data-invalid] {
      --border-color: var(--wa-color-danger-60);
    }
    /* Target shadow DOM part for stronger override if needed */
    wa-input[data-invalid]::part(base) {
      border-color: var(--wa-color-danger-60);
    }
  `;

  @property({ attribute: "set-path" })
  setPath: string = "";

  @state()
  private _schedule: LearningSchedule = [];

  @state()
  private _errors: Record<string, string> = {};

  @state()
  private _draftValues: Record<string, string> = {};

  // For managing focus after dialog close
  private _firstInvalidField: string | null = null;

  @state()
  private _notificationVariant: NotificationVariant = "success";

  @state()
  private _notificationMessage: string = "";

  @state()
  private _notificationHeadline: string = "";

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

  private _showErrorDialog() {
    const dialog = this.shadowRoot?.querySelector("#error-dialog") as WaDialog;
    if (dialog) return dialog.show();
  }

  private _handleDialogClose() {
    // Find the first invalid field and focus it
    // We need to find the key of the first error in _errors
    // Iterating keys might not be in DOM order, so let's find input with existing error
    const keys = Object.keys(this._errors);
    if (keys.length > 0) {
      // Sort keys to find the "first" one by index
      const sortedKeys = keys.sort((a, b) => {
        const [idxA] = a.split("-").map(Number);
        const [idxB] = b.split("-").map(Number);
        return idxA - idxB;
      });

      const firstKey = sortedKeys[0];
      // Construct ID or selector?
      // We don't have IDs on inputs, we need to add them or use a sophisticated selector
      // Let's add data-field-key to inputs for easy selection
      const input = this.shadowRoot?.querySelector(
        `wa-input[data-field-key="${firstKey}"]`,
      ) as HTMLElement;
      if (input) {
        input.focus();
      }
    }
  }

  private _requestSave() {
    if (!this.setPath) return;

    // Check if there are any errors or draft values (unsaved changes that are invalid)
    if (Object.keys(this._errors).length > 0) {
      this._showErrorDialog();
      return;
    }

    this._notificationVariant = "confirm";
    this._notificationHeadline = "Confirm Save";
    this._notificationMessage =
      "Changing the schedule will update all existing decks in this set. \n\n" +
      "• Review times will be recalculated based on the new schedule.\n" +
      "• Decks may move to different milestones if the number of sessions changes.\n\n" +
      "Are you sure you want to save these changes?";

    this.requestUpdate();
    this.updateComplete.then(() => {
      const dialog = this.shadowRoot?.querySelector(
        "notification-dialog",
      ) as NotificationDialog;
      dialog?.show();
    });
  }

  private _executeSave() {
    const rawData = localStorage.getItem("flashcards-data");
    const parsed = rawData ? JSON.parse(rawData) : {};
    const result = flashcardsStorageSchema.safeParse(parsed);
    const allData = result.success ? result.data : {};

    if (!allData[this.setPath]) {
      allData[this.setPath] = { settings: {} };
    }
    const setData = allData[this.setPath];
    if (setData) {
      if (!setData.settings) setData.settings = {};
      setData.settings.learningSchedule = this._schedule;
    }

    localStorage.setItem("flashcards-data", JSON.stringify(allData));

    // Migration: Update existing decks to fit new schedule
    if (migrateDecks(allData, this.setPath, this._schedule)) {
      localStorage.setItem("flashcards-data", JSON.stringify(allData));
    }

    // Dispatch event so other components can refresh
    window.dispatchEvent(new CustomEvent("flashcards-data-changed"));

    this._notificationVariant = "success";
    this._notificationHeadline = "Success";
    this._notificationMessage = "Schedule saved successfully";

    this.requestUpdate();
    this.updateComplete.then(() => {
      const dialog = this.shadowRoot?.querySelector(
        "notification-dialog",
      ) as NotificationDialog;
      dialog?.show();
    });
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
    this._errors = {};
    this._draftValues = {};
  }

  private _reset() {
    this._schedule = [...DEFAULT_LEARNING_SCHEDULE];
    this._errors = {};
    this._draftValues = {};
  }

  private _updateField(
    index: number,
    field: keyof LearningSchedule[0],
    value: string,
  ) {
    const key = `${index}-${field}`;

    // Clear previous error/draft
    const newErrors = { ...this._errors };
    delete newErrors[key];
    const newDrafts = { ...this._draftValues };
    delete newDrafts[key];

    let num: number | null = null;

    if (field === "numberOfSessions") {
      num = parseInt(value);
      if (isNaN(num)) {
        num = 1;
      }
    } else {
      // Time fields
      if (value.trim() === "") {
        // Empty handling
        if (field !== "numberOfSessions") {
          num = null;
        } else {
          num = 1;
        }
      } else {
        num = parseDuration(value);
        if (num === null) {
          // Invalid format!
          this._errors = { ...newErrors, [key]: "Invalid format" };
          this._draftValues = { ...newDrafts, [key]: value };
          this.requestUpdate(); // Ensure re-render to show error
          return;
        }
      }
    }

    this._errors = newErrors; // Clear error if valid
    this._draftValues = newDrafts; // Clear draft if valid

    const newSchedule = [...this._schedule];
    const step = newSchedule[index];
    if (step) {
      // @ts-expect-error - dynamic assignment
      step[field] = num;
      this._schedule = newSchedule;
    }
    this.requestUpdate();
  }

  private _getValue(
    index: number,
    field: keyof LearningSchedule[0],
    value: number | null,
  ) {
    const key = `${index}-${field}`;
    if (typeof this._draftValues[key] !== "undefined") {
      return this._draftValues[key];
    }
    if (field === "numberOfSessions") {
      return value?.toString() || "";
    }
    return formatDuration(value);
  }

  private _getError(index: number, field: keyof LearningSchedule[0]) {
    const key = `${index}-${field}`;
    return this._errors[key];
  }

  render() {
    return html`
      <style>
        .error-msg {
          color: var(--wa-color-danger-60);
          font-size: var(--wa-font-size-2xs);
          margin-top: 4px;
          display: flex;
          align-items: center;
          gap: var(--wa-space-2xs);
        }
        /* Target the internal input border if possible using variables */
        wa-input[data-invalid] {
          --border-color: var(--wa-color-danger-60);
          --focus-border-color: var(--wa-color-danger-60);
        }
      </style>
      <div class="top-actions">
        <wa-button size="small" @click=${this._reset}
          >Restore Defaults</wa-button
        >
      </div>
      <p class="help-text">
        Values can use units like 1d, 1h, 30m, 10s.
        <span class="unit-hint">(Default is seconds)</span>
      </p>

      <div class="schedule-grid">
        ${this._schedule.map(
          (step, i) => html`
            <div class="schedule-item">
              <div class="field-group">
                <span class="field-label">Min time since last session</span>
                <wa-input
                  type="text"
                  size="small"
                  data-field-key="${i}-minTimeSinceLastMilestone"
                  .value=${this._getValue(
                    i,
                    "minTimeSinceLastMilestone",
                    step.minTimeSinceLastMilestone,
                  )}
                  ?data-invalid=${!!this._getError(
                    i,
                    "minTimeSinceLastMilestone",
                  )}
                  @change=${(e: Event) =>
                    this._updateField(
                      i,
                      "minTimeSinceLastMilestone",
                      (e.target as HTMLInputElement).value,
                    )}
                ></wa-input>
                ${this._getError(i, "minTimeSinceLastMilestone")
                  ? html`<div class="error-msg">
                      <wa-icon name="circle-exclamation"></wa-icon>
                      Invalid time format (e.g. 1d, 2h, 30m)
                    </div>`
                  : ""}
              </div>

              <div class="field-group">
                <span class="field-label">Number of sessions</span>
                <wa-input
                  type="number"
                  size="small"
                  .value=${this._getValue(
                    i,
                    "numberOfSessions",
                    step.numberOfSessions,
                  )}
                  @input=${(e: Event) =>
                    this._updateField(
                      i,
                      "numberOfSessions",
                      (e.target as HTMLInputElement).value,
                    )}
                ></wa-input>
              </div>

              <div class="field-group">
                <span class="field-label">Time between sessions</span>
                <wa-input
                  type="text"
                  size="small"
                  data-field-key="${i}-minTimeBetweenSessions"
                  .value=${this._getValue(
                    i,
                    "minTimeBetweenSessions",
                    step.minTimeBetweenSessions,
                  )}
                  placeholder="None"
                  ?data-invalid=${!!this._getError(i, "minTimeBetweenSessions")}
                  @change=${(e: Event) =>
                    this._updateField(
                      i,
                      "minTimeBetweenSessions",
                      (e.target as HTMLInputElement).value,
                    )}
                ></wa-input>
                ${this._getError(i, "minTimeBetweenSessions")
                  ? html`<div class="error-msg">
                      <wa-icon name="circle-exclamation"></wa-icon>
                      Invalid time format (e.g. 1d, 2h, 30m)
                    </div>`
                  : ""}
              </div>

              <div class="field-group">
                <span class="field-label">Overdue time</span>
                <wa-input
                  type="text"
                  size="small"
                  data-field-key="${i}-maxTimeBetweenSessions"
                  .value=${this._getValue(
                    i,
                    "maxTimeBetweenSessions",
                    step.maxTimeBetweenSessions,
                  )}
                  placeholder="None"
                  ?data-invalid=${!!this._getError(i, "maxTimeBetweenSessions")}
                  @change=${(e: Event) =>
                    this._updateField(
                      i,
                      "maxTimeBetweenSessions",
                      (e.target as HTMLInputElement).value,
                    )}
                ></wa-input>
                ${this._getError(i, "maxTimeBetweenSessions")
                  ? html`<div class="error-msg">
                      <wa-icon name="circle-exclamation"></wa-icon>
                      Invalid time format (e.g. 1d, 2h, 30m)
                    </div>`
                  : ""}
              </div>

              <div class="field-group remove-group">
                <span class="field-label spacer">Remove</span>
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
            </div>
          `,
        )}
      </div>

      <div class="actions">
        <wa-button size="small" @click=${this._addStep}>
          <wa-icon slot="prefix" name="plus"></wa-icon>
          Add Step
        </wa-button>
        <wa-button size="small" variant="brand" @click=${this._requestSave}
          >Save Schedule</wa-button
        >
      </div>

      <wa-dialog
        label="Validation Errors"
        id="error-dialog"
        @wa-after-hide=${this._handleDialogClose}
      >
        <p>Please fix the following validation errors before saving:</p>
        <ul>
          <li>
            Ensure all time fields use valid formats (e.g. "1d", "30m", "10s").
          </li>
          <li>Double-check highlighted fields.</li>
        </ul>
        <div slot="footer">
          <wa-button variant="brand" @click=${() => this._closeDialog()}
            >OK</wa-button
          >
        </div>
      </wa-dialog>
      <notification-dialog
        .variant=${this._notificationVariant}
        .message=${this._notificationMessage}
        .headline=${this._notificationHeadline}
        @confirm=${this._executeSave}
      ></notification-dialog>
    `;
  }

  private _closeDialog() {
    const dialog = this.shadowRoot?.querySelector("#error-dialog") as WaDialog;
    if (dialog) {
      dialog.open = false;
      dialog.hide();
    }
  }
}
