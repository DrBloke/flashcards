import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import "https://early.webawesome.com/webawesome@3.0.0-alpha.12/dist/components/button/button.js";
import "https://early.webawesome.com/webawesome@3.0.0-alpha.12/dist/components/icon-button/icon-button.js";


@customElement('flashcard-deck')
export class FlashcardDeck extends LitElement {
  static styles = css`
    :host {
        div#wrapper {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            height: 100%;
        }
        header {
            display: flex;
            justify-content: space-between;
            padding: var(--wa-space-xs) var(--wa-space-xs);
        }
        h1 {
            font-size: var(--wa-font-size-2xl);
            color: var(--wa-color-brand-on-quiet);
            margin: 0;
        }
        main {
            flex-grow: 1;
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: var(--wa-font-size-4xl);
        }
        footer {
            display: flex;
            justify-content: flex-end;
            padding: var(--wa-space-xs) var(--wa-space-xs);
        }
        span.toolbar {
            display: flex;
            justify-content: space-around;
            min-width: 114px;
        }
        wa-icon-button {
            font-size: var(--wa-font-size-3xl);
            color: var(--wa-color-brand-on-quiet);
        }
        wa-icon-button#flip {
            align-items: center;
            padding-left: 12px;
        }
        wa-icon-button#correct {
            color: var(--wa-color-success-on-quiet);
        }
        wa-icon-button#incorrect {
            color: var(--wa-color-danger-on-quiet);
        }
    }
  `;

  // Declare reactive properties
  @property()
  name?: string = 'World';

  render() {
    return html`
      <div id="wrapper">
         <header>
             <wa-icon-button
                 name="house"
                 href="homeRouteHere"
                 id="home"
                 label="Home"
                 title="home">Home</wa-icon-button
             >
             <h1>Title</h1>
         </header>
         <main>
             <div id="content">Flashcard content appears here</div>
         </main>
         <footer>
             <span class="toolbar">
                 <wa-icon-button
                     name="rotate"
                     label="flip"
                     title="flip"
                     id="flip">Flip</wa-icon-button
                 >
             </span>
         </footer>
      </div>
`;
  }
}