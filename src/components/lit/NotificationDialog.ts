import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/dialog/dialog.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";

interface WaDialog extends HTMLElement {
  show(): void;
  hide(): void;
  open: boolean;
}

export type NotificationVariant = "success" | "error" | "confirm";

@customElement("notification-dialog")
export class NotificationDialog extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
    .content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--wa-space-m);
      text-align: center;
      padding: var(--wa-space-m) 0;
    }
    wa-icon {
      font-size: var(--wa-font-size-4xl);
    }
    .icon-success {
      color: var(--wa-color-success-60);
    }
    .icon-error {
      color: var(--wa-color-danger-60);
    }
    .icon-confirm {
      color: var(--wa-color-primary-60);
    }
    p {
      margin: 0;
      font-size: var(--wa-font-size-l);
      color: var(--wa-color-gray-10);
      white-space: pre-wrap;
    }
  `;

  @property()
  variant: NotificationVariant = "success";

  @property()
  message: string = "";

  @property()
  headline: string = "";

  show() {
    const dialog = this.shadowRoot?.querySelector(
      "wa-dialog",
    ) as unknown as WaDialog;
    if (dialog) {
      dialog.show();
    }
  }

  hide() {
    const dialog = this.shadowRoot?.querySelector(
      "wa-dialog",
    ) as unknown as WaDialog;
    if (dialog) {
      dialog.open = false;
      dialog.hide();
    }
  }

  private _handleClose() {
    this.hide();
    this.dispatchEvent(new CustomEvent("close"));
  }

  private _handleConfirm() {
    this.hide();
    this.dispatchEvent(new CustomEvent("confirm"));
  }

  private _getIcon() {
    switch (this.variant) {
      case "success":
        return html`<wa-icon
          name="circle-check"
          class="icon-success"
        ></wa-icon>`;
      case "error":
        return html`<wa-icon
          name="circle-exclamation"
          class="icon-error"
        ></wa-icon>`;
      case "confirm":
        return html`<wa-icon
          name="circle-question"
          class="icon-confirm"
        ></wa-icon>`;
    }
  }

  private _getHeadline() {
    if (this.headline) return this.headline;
    switch (this.variant) {
      case "success":
        return "Success";
      case "error":
        return "Error";
      case "confirm":
        return "Confirmation";
    }
  }

  render() {
    return html`
      <wa-dialog
        label="${this._getHeadline()}"
        @wa-after-hide=${this._handleClose}
      >
        <div class="content">
          ${this._getIcon()}
          <p>${this.message}</p>
        </div>
        <div slot="footer">
          ${this.variant === "confirm"
            ? html`
                <wa-button @click=${this._handleClose}>Cancel</wa-button>
                <wa-button variant="brand" @click=${this._handleConfirm}
                  >Confirm</wa-button
                >
              `
            : html`
                <wa-button variant="brand" @click=${this._handleClose}
                  >OK</wa-button
                >
              `}
        </div>
      </wa-dialog>
    `;
  }
}
