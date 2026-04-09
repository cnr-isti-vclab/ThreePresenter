# AGENTS.md

Guidance for coding agents working in this repository.

## Project overview

- **ThreePresenter** is a framework-agnostic 3D viewer built on Three.js.
- Main library source is in `src/`.
- Public demo site and examples are in `docs/`.
- Build output goes to `dist/` (library bundle and type declarations).
- Any new feature should be documented by an example in `docs/examples/` and added to the examples catalog.
- Examples should be minimal, as short as possible, self-contained code that demonstrates the feature. They should not be full applications, but rather focused snippets that can be easily read and understood.

## Dev environment tips

- Use Node 20+ and npm.
- Install dependencies with:
  - `npm install`
- Main local workflows:
  - `npm run dev`  
    Watches `src/`, rebuilds, refreshes `docs/dist`, regenerates examples metadata, and serves docs at `http://localhost:8080/docs/`.
  - `npm run build`  
    Builds the library and regenerates `docs/examples/examples.json`.
  - `npm run build:docs`  
    Runs build and copies `dist/*` into `docs/dist/` for static docs hosting.
  - `npm run serve:docs`  
    Serves `docs/` at `http://localhost:8080`.

## Repository-specific rules

- Keep `three` as a peer dependency.
- Prefer edits in `src/` rather than `dist/`; `dist/` is generated.
- When adding/changing demo examples:
  - update `docs/examples/*.html` as needed
  - update `scripts/generate-examples.js` if the examples catalog changes
  - regenerate `docs/examples/examples.json` via `npm run build` (or run generator directly)
- Keep docs and scripts aligned: if commands change, update `README.md` and `docs/README.md`.

## Testing / verification instructions

- There is no full unit test suite yet; use build + smoke checks as baseline verification.
- Required checks before considering work complete:
  - `npm run build`
  - `npm run smoke:assets`
- For docs/demo workflow changes, also run:
  - `npm run build:docs`
  - `npm run serve:docs` and manually open `/examples/index.html`

## CI and deployment

- GitHub Pages workflow: `.github/workflows/gh-pages.yml`.
- CI deploy path is `npm run deploy`, which builds docs and API docs, then publishes `docs/`.

## Code style expectations

- TypeScript is `strict` (`tsconfig.json`); keep changes type-safe.
- Follow existing style in neighboring files.
- Prefer small, focused changes over broad refactors unless requested.
- Prefer short compact code over verbose patterns when clarity is maintained.
- Before adding new dependencies, consider if the functionality can be implemented with existing tools or simpler code.
- Avoid code bloating. Always prefer solutions that need less code with respect to ones that are implemented in more code. In particular, avoid duplication of code or functionalities. Also check always for leftover files and functions and ask for their removal. 
- Avoid introducing new heavy dependencies unless clearly necessary.

## Pull request instructions

- Keep PRs focused and describe user-visible impact.
