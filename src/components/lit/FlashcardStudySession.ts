import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import { flashcardStyles } from "./Flashcard.css";
import { z } from "zod";
import { deckSchema } from "../../schemas/deck";

@customElement("flashcard-study-session")
export class FlashcardStudySession extends LitElement {
  static styles = flashcardStyles;

  @property({ type: Object })
  card?: z.infer<typeof deckSchema>["cards"][0];

  @property({ type: String })
  side: "side1" | "side2" = "side1";

  @property({ type: Number })
  fontSize = 2.25;

  render() {
    if (!this.card) return html`<div>No card</div>`;

    const htmlContent = this.card[this.side];
    const style = `font-size: ${this.fontSize}rem`;

    return html`
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/katex.min.css"
      />
      <div id="content" style=${style}>${unsafeHTML(htmlContent)}</div>
    `;
  }
}
