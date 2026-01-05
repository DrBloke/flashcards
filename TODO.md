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
- [ ] Learning log - single deck
- [ ] Learning log - set
- [ ] Markdown content
- [ ] Colours
- [ ] Maths, chemistry and diagrams
- [ ] Hierarchical menus
- [ ] Timer for session
- [ ] Smaller font option for when you have a lot of text
- [ ] isReversible - not all decks are
- [ ] Playwright tests
- [ ] Add meta description for SEO
- [ ] Animations and swiping
- [ ] Hydration of lit components
- [ ] PWA
- [ ] Images
- [ ] Voice
- [ ] Diagrams

## Nice to have

- [ ] Remote persistence and syncing
- [ ] Editable card decks
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

- [ ] Mark correct on last round re-renders first card before relocating. Render a success message instead.
- [ ] I think the use of side1 and side2 may be a poor choice. It should instead be an array. This would help when I have cards with more than two sides.
