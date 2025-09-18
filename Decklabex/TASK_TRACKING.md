# 🎴 DeckLab Bolt — Task Tracking (Live Checklist)

This tracker reflects the real project status and drives our weekly execution. Cross-referenced with `generalplan.md` and business goals.

Legend: [x] Done  [ ] Pending  [~] In Progress  [!] Blocked

## Phase 1 — Foundation

- [x] Align Expo SDK 54 deps and pass `expo-doctor` (RN 0.81, React 19)
- [x] Consolidate app structure (use `Decklabex`, remove duplicate `/app`)
- [~] Finalize Expo Router tree and screen contracts
- [ ] Integrate Tamagui (tokens, themes, primitives, SSR-safe config)
- [ ] Harden TypeScript config (strict, path aliases, ambient types)
- [ ] Environment management (dotenv, secrets, CI-safe)
- [ ] API service layer (PokemonTCG, TCGPlayer, eBay, CardMarket) with RTK Query
- [ ] Firebase setup (Auth, Firestore, Crashlytics, Analytics)

## Phase 2 — Core Features

- [ ] Onboarding + Animated Welcome + Tutorial Carousel
- [ ] Auth flows (email/password, OAuth via AuthSession), profile, premium
- [ ] Advanced Search: 3 tabs (Top Cards, Sets, Pokédex), autocomplete
- [ ] Visual Filter Builder (Lucene-style), analytics events
- [ ] Card Detail: compact art, essential pricing (Damaged/NM/PSA10)
- [ ] Price charts (Victory Native, 30/90-day), live market overlays

## Phase 3 — Advanced

- [ ] Unified Collection + Binder (drag-drop, 9/18 grid, sort modes)
- [ ] AI Card Scanner + Pre-Grader (auto-focus, overlay, batch, reports)
- [ ] Live 3D Card Model (Skia shader, gyroscope controls)
- [ ] Gemini PCA assistant (chat/voice, actions for org & insights)

## Phase 4 — Polish & Launch

- [ ] Perf: lazy, virtualization, caching, code splitting, 60fps budget
- [ ] Offline-first sync, persistence, conflict resolution
- [ ] Accessibility AA, dynamic type, color contrast, screen reader labels
- [ ] QA: unit/integration/e2e, crash-free > 99.9%
- [ ] Docs: business + developer docs finalized, store assets

---

## Status Notes (rolling)

- SDK54 aligned, `expo-doctor` 17/17 passed.
- Removed `lucide-react-native`; migrated icons to `@expo/vector-icons`.
- Duplicate `/workspace/app` removed to prevent router confusion.