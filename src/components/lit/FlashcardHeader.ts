import { customElement, property } from "lit/decorators.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import { flashcardStyles } from "./Flashcard.css";

import { LitElement, html, css } from "lit";

@customElement("flashcard-header")
export class FlashcardHeader extends LitElement {
  static styles = [
    flashcardStyles,
    css`
      :host {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
      }
      h1 {
        font-size: var(--wa-font-size-xl);
        color: var(--wa-color-brand-on-quiet);
        margin: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        flex: 1;
        text-align: right;
      }
    `,
  ];

  @property()
  title: string = "";

  @property({ attribute: "home-route" })
  homeRoute: string = "/";

  private _increaseFontSize() {
    this.dispatchEvent(new CustomEvent("increase-font"));
  }

  private _decreaseFontSize() {
    this.dispatchEvent(new CustomEvent("decrease-font"));
  }

  render() {
    return html`
      <wa-button
        href=${this.homeRoute}
        id="home"
        title="home"
        variant="brand"
        appearance="filled"
      >
        <wa-icon name="house" label="Home"></wa-icon>
      </wa-button>
      <wa-button
        id="decrease-font"
        title="Decrease font size"
        @click=${this._decreaseFontSize}
        variant="brand"
        appearance="filled"
        style="margin-left: var(--wa-space-xs)"
      >
        <wa-icon
          name="magnifying-glass-minus"
          label="Decrease font size"
        ></wa-icon>
      </wa-button>
      <wa-button
        id="increase-font"
        title="Increase font size"
        @click=${this._increaseFontSize}
        variant="brand"
        appearance="filled"
        style="margin-left: var(--wa-space-3xs)"
      >
        <wa-icon
          name="magnifying-glass-plus"
          label="Increase font size"
        ></wa-icon>
      </wa-button>
      <h1>${this.title}</h1>
    `;
  }
}
