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

@customElement("success-dialog")
export class SuccessDialog extends LitElement {
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
      color: var(--wa-color-success-60);
    }
    p {
      margin: 0;
      font-size: var(--wa-font-size-l);
      color: var(--wa-color-gray-10);
    }
  `;

  @property()
  message: string = "Operation successful";

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

  render() {
    return html`
      <wa-dialog label="Success">
        <div class="content">
          <wa-icon name="circle-check"></wa-icon>
          <p>${this.message}</p>
        </div>
        <div slot="footer">
          <wa-button variant="brand" @click=${this._handleClose}>OK</wa-button>
        </div>
      </wa-dialog>
    `;
  }
}
