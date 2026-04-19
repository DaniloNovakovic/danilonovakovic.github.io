# Changelog

This file is a **personal log** of how the site evolved across major versions. It is not a strict semver release log (for that style, see [Keep a Changelog](https://keepachangelog.com/)); it is closer to a journal you can extend whenever the next “era” of the site ships.

---

## v3 (current) — Gamified portfolio

- Rebuilt as a **React + Vite** app with a **Phaser** side-scrolling world and **React** overlays for sections and mini-games (instead of static section scrolling).
- **Tailwind CSS v4** for layout and the “digital sketchbook” look (see `design/STYLE_GUIDE.md`).
- Content and world features are **config-driven** (`src/config/`) so adding a building or hobby is mostly data + one component/scene, not a full layout rewrite.
- Tooling: TypeScript, ESLint, Vitest for a small regression suite, GitHub Actions CI.

---

## v2 — Static multi-section site

- I tried to combine multiple designs/ideas of the pages I liked on the internet instead of making my own design from scratch (because I'm not a graphic designer).
- Everything scales with em/rem making it very easy with the help of fluid typography for content to look decent on the bigger screens.
- Got experience in setting up & working with SASS locally, as well as improving my skills in flexbox and css grids.
- Created my first usable component (project card) that I really liked — https://codepen.io/danilonovakovic/full/xJaxjd
- Each section takes at least 90vh or more which makes it look a lot better compared to v1.
- Navbar is responsive and always accessible.

---

## v1 — First GitHub Pages iteration

- This version of the site was a very basic one. I was learning how to use GitHub Pages; it served as a great project and place to apply knowledge as I was learning it, but ultimately I ended up deciding to redo everything from scratch in a new version (v2).

Things I disliked in v1:

- I used px/pt instead of em/rem, making it very hard to change font size and to do fluid typography (which I did not make anyway).
- While I did think about smaller/mobile screens I did **not** think about large screens, which made the site look bad on big monitors.
- There was not a lot of whitespace compared to the landing page: for example the hero took the whole viewport while other sections only took a small fraction of the screen, which felt uneven.
- I did not like that projects were shown with just words. It feels more interesting to show a snippet of the project with a picture and a short description than only the project name inside an `<a>` tag.
