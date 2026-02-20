import { css } from "lit";

// shared styles for content and sub-components
export const flashcardContentStyles = css`
  :host {
    display: block;
  }
  #content {
    font-size: var(--wa-font-size-4xl);
    text-align: left;
    width: fit-content;
    max-width: 100%;
    word-wrap: break-word;
    overflow-wrap: break-word;
    hyphens: auto;
  }
  #content p {
    margin: 0 0 var(--wa-space-m) 0;
  }
  #content p:last-child {
    margin-bottom: 0;
  }
  #content h1,
  #content h2,
  #content h3,
  #content h4,
  #content h5,
  #content h6 {
    margin: 0 0 var(--wa-space-s) 0;
    line-height: var(--wa-line-height-tight);
  }
  #content pre {
    margin: var(--wa-space-m) 0;
    padding: var(--wa-space-m);
    border-radius: var(--wa-border-radius-m);
    overflow-x: auto;
    font-family: var(--wa-font-family-mono);
    font-size: var(--wa-font-size-s);
    line-height: var(--wa-line-height-normal);
  }
  #content code {
    font-family: var(--wa-font-family-mono);
    background-color: var(--wa-color-gray-95);
    padding: 0.2em 0.4em;
    border-radius: var(--wa-border-radius-s);
    font-size: 0.9em;
  }
  #content pre code {
    background-color: transparent;
    padding: 0;
    border-radius: 0;
    font-size: inherit;
  }
  span.toolbar-left {
    display: flex;
    flex-direction: column;
    gap: var(--wa-space-3xs);
    font-size: var(--wa-font-size-s);
    color: var(--wa-color-gray-20);
  }
  span.toolbar-right,
  span.toolbar-center {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  span.toolbar-left,
  span.toolbar-center,
  span.toolbar-right {
    flex: 1;
  }
  span.toolbar-right {
    justify-content: flex-end;
  }
  span.toolbar-left {
    justify-content: flex-start;
  }
  wa-button#home::part(base) {
    width: auto;
    padding: 0 var(--wa-space-s);
  }
  .completed-content {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--wa-space-m);
    font-size: 1rem;
  }
  .completed-icon {
    font-size: 4rem;
    color: var(--wa-color-success-60);
  }
  .completed-title {
    font-size: var(--wa-font-size-2xl);
    font-weight: var(--wa-font-weight-bold);
    color: var(--wa-color-gray-10);
  }
  .completed-stats {
    font-size: var(--wa-font-size-l);
    color: var(--wa-color-gray-30);
    margin-bottom: var(--wa-space-m);
  }
  .completed-stats p {
    margin: var(--wa-space-2xs) 0;
  }
  .demotion-choices {
    display: flex;
    flex-direction: column;
    gap: var(--wa-space-s);
    margin-top: var(--wa-space-m);
    padding: var(--wa-space-m);
    background-color: var(--wa-color-gray-95);
    border-radius: var(--wa-border-radius-m);
    border: 1px solid var(--wa-color-gray-80);
  }
  .demotion-choices p {
    margin: 0 0 var(--wa-space-xs) 0;
    font-weight: var(--wa-font-weight-bold);
    color: var(--wa-color-danger-70);
  }
`;

// Styles specific to the main FlashcardDeck container
export const flashcardContainerStyles = css`
  :host {
    display: block;
    height: 100%;
    width: 100%;
  }
  div#wrapper {
    display: flex;
    flex-direction: column;
    height: 100%;
    margin: 0 auto;
    background-color: var(--wa-color-surface-default);
  }
  /* Desktop and larger screens */
  @media (min-width: 768px) {
    :host {
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: var(--wa-color-gray-90);
      padding: var(--wa-space-xl);
    }
    div#wrapper {
      height: 85vh;
      max-height: 600px;
      width: 100%;
      max-width: 600px;
      border-radius: var(--wa-border-radius-l);
      box-shadow: var(--wa-shadow-l);
      overflow: hidden;
      border: 1px solid var(--wa-color-gray-80);
      background-color: var(--wa-color-surface-default);
    }
  }
  /* Extra large screens */
  @media (min-width: 1200px) {
    div#wrapper {
      max-width: 700px;
    }
  }
  header {
    flex-shrink: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--wa-space-m);
    border-bottom: 1px solid var(--wa-color-gray-90);
    background-color: var(--wa-color-surface-default);
    z-index: 1;
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
  main {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow-y: auto;
    overflow-x: hidden;
    padding: var(--wa-space-xl);
    min-height: 0;
    background-color: var(--wa-color-surface-default);
  }
  main > * {
    margin: auto 0;
  }
  footer {
    flex-shrink: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--wa-space-m);
    border-top: 1px solid var(--wa-color-gray-90);
    background-color: var(--wa-color-surface-default);
    z-index: 1;
  }
  ::slotted(h1[slot="header"]) {
    font-size: var(--wa-font-size-xl);
    color: var(--wa-color-brand-on-quiet);
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
    text-align: right;
  }
  ::slotted(#ssr-content) {
    font-size: var(--wa-font-size-4xl);
    text-align: left;
    width: fit-content;
    max-width: 100%;
    word-wrap: break-word;
    overflow-wrap: break-word;
    hyphens: auto;
  }
`;

// Backwards compatibility if needed, but we should update imports
export const flashcardStyles = flashcardContentStyles;
