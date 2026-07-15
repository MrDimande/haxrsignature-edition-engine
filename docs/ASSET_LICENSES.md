# Asset licenses — Edition Primavera Lobolo (PR theme)

Assets shipped in Edition PR #7 (`feature/edition-primavera-lobolo-theme`).

| Asset | Used by | Notes |
|-------|---------|-------|
| `public/audio/famba-kwatsi.mp3` | Exclusively `theme/definitions/primavera-lobolo.ts` (Primavera Lobolo) | **Owner-confirmed authorisation** for use in the invitation. Credits are presented in the experience UI (title/artist/rights holder + disclaimer). **Not redistributed as a standalone download** — only embedded as ambient audio inside this theme. |
| `public/images/traditional-wedding/jessica-samuel-hero.png` | Primavera Lobolo experience / traditional wedding details | Client wedding visual for Jessica & Samuel traditional invite. |

## Audio policy

- Keep `famba-kwatsi.mp3` in this PR.
- Do not remove or replace without a new owner decision.
- Single copy in `public/audio/`; no duplicate assets for this track.

## Checks (Fase 1D — confirmed)

| Check | Result |
|-------|--------|
| lint | pass |
| `tsc --noEmit` | pass |
| `npm test` | pass |
| `npm run build` | pass |
| secret scan (diff) | clean |
