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
- [ ] I think maybe the customisation of colours is wrong, and I might be downloading more CSS than I need to. Try inspecting the Web Awesome page to see what they're doing.

Why do you have to import CSS into JS file? can I just use a Link tag? I think this is sorted, but the main css has a lower precedence than the Awesome theme. That might become a problem. But maybe not if the main CSS is only used to define native elements in a way that doesn't effect things. Maybe the theme itself should be updated.

Note that the base paths are different for index and card pageq

default.css being imported in dev app is 64kB

- [ ] I'm disappointed in the size of the lit file being downloaded.
- [ ] Update Astro
- [ ] Shuffle
- [ ] Smaller font option for when you have a lot of text
- [ ] Refactor to use arrays for card sides for extensibility
- [ ] Parse data - I think card data should be parsed using Zod by the flashcard component (Maybe not)
- [ ] Home route should be a function callback?
- [ ] Focus on the buttons after flipping
- [ ] Don't reshow cards if right on first attempt (optional)
- [ ] Progress indicator
- [ ] Advance/Previous buttons
- [ ] Heriachical menus
- [ ] I'm not sure reversing the deck makes sense as a concept while session is in progress
- [ ] Add meta description for SEO
- [ ] Check the 301 redirection due to trailing slash
- [ ] Learning log - single deck
- [ ] Learning log - set
- [ ] Animations and swiping
- [ ] Markdown content
- [ ] ES lint for Astro not set up properly. See ES Lint section of Notes.md
- [ ] Multiple cards. Problem on first card.
- [ ] Maths, chemistry and diagrams
- [ ] Images
- [ ] Voice
- [ ] Diagrams
- [ ] Use browser built in translations to generate new languages and allow translations to other than English
- [ ] Remote persistence
- [ ] Editable card decks
- [ ] PWA
- [ ] AI scanning of decks
- [ ] Localisation
- [ ] Playwright tests
- [ ] Web Awesome - [check resources are set up correctly](https://webawesome.com/docs#setting-the-base-path)

## Issues

- [ ] Mark correct on last round re-renders first card before relocating. Render a success message instead.
- [ ] I think the use of side1 and side2 my be a poor choice. It should instead be an array. This would help when I have cards with more than two sides.
