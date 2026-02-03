# TODO

- [x] Global styles
- [x] External style sheet
- [x] Componentise
- [x] Collections
- [x] Flashcard interactivity
- [x] Remove if correct
- [x] Deploy
- [x] Issue with back to home on completion. Home needs to be configurable.
- [x] Make look good
- [x] Icon buttons
- [x] Italian flag fav iconPPP
- [x] Reimplement in Lit
- [x] Reverse deck
- [x] Refactor Web Awesome to use NPM
  - await for all to be defined
  - use updateComplete on re-rendering components or requestAnimationFrame if using multiple components that are updating
- [x] Buttons need borders, or maybe focus indicator will do
- [x] Refactor Flashcard HTML into more sections, e.g. header and footer
- [x] ES Lint and Prettify setup and run; If you use ESLint, make sure lint-staged runs it before Prettier, not after.
- [x] Update Astro
- [x] Shuffle
- [x] ES lint for Astro not set up properly. See ES Lint section of Notes.md
- [x] I'm not sure reversing the deck makes sense as a concept while session is in progress
- [x] Focus on the buttons after flipping
- [x] Progress indicator
- [x] Don't reshow cards if correct on first attempt (optional)
- [x] Convert deck info to single JSON object. Use ID.
- [x] Zod parsing
- [x] Look good on desktop
- [x] Need to scope stored data to a particular set
- [x] Flashcard.ts is not very DRY when accessing stored data
- [x] Markdown content
- [x] Flicker when completing deck in production. Says "No cards found" briefly.
- [x] Playwright tests
- [ ] Get rid of auto redirect to home on completion
- [ ] Redirect to home is unsafe
- [ ] Timer for session
- [ ] Learning log - single deck
- [ ] Learning log - set
- [ ] Maths, chemistry, code and diagrams
- [ ] Header and footer are too large on mobile portrait mode
- [ ] Colours
- [ ] Dark mode
- [ ] Hierarchical menus
- [ ] Add meta description for SEO - get from `set.json`
- [ ] Multiple side 2s for worked examples
- [ ] Smaller font option for when you have a lot of text - at card level JSON
- [ ] isReversible - not all decks are
- [ ] Magic date input parser for learning schedule
- [ ] Main in the component is an accessibility issue, also H1 tag. Hydration of the component could solve this?

## Phase 2

- [ ] Hydration of lit components
- [ ] Animations and swiping
- [ ] PWA
- [ ] Voice
- [ ] Remote persistence and syncing
- [ ] Editable card decks
- [ ] Printable

## Nice to have

- [ ] AI scanning of decks - Could use NotebookLM
- [ ] Advance/Previous buttons
- [ ] Default.css being imported in dev app is 64kB. I think this can be minimised by making specific CSS files and importing different ones into each page without excess styles.
- [ ] Each page should have its own stylesheet.
- [ ] Remove unused CSS
- [ ] Refactor to use arrays for card sides for extensibility
- [ ] Parse data - I think card data should be parsed using Zod by the flashcard component (Maybe not)
- [ ] Home route should be a function callback?
- [ ] Check the 301 redirection due to trailing slash
- [ ] Multiple cards. Problem on first card.
- [ ] Use browser built in translations to generate new languages and allow translations to other than English
- [ ] I'm disappointed in the size of the lit file being downloaded.
- [ ] Localisation
- [ ] Web Awesome - [check resources are set up correctly](https://webawesome.com/docs#setting-the-base-path)

## Issues

- [x] Mark correct on last round re-renders first card before relocating. Render a success message instead.

## Review

- [x] In `index.astro`, deck-id, deck-title and cards should be combined into a single object called deck. This should be validated by Zod, using the schema in `content.config.ts`.

- [x] This will require a change to the flashcard component to accept a deck object instead of deck-id, deck-title and cards. This should be validated by Zod, using the schema in `content.config.ts`.

- [ ] Initialise session looks a little over-complicated in `Flashcard.ts`. Also the `willUpdate` lifecycle method is not called when the component is first rendered. Is the right course of action?

## What next?

Handle multiple decks. That would enable construction of a test deck that will help with then doing markdown and then chem and math and code.
