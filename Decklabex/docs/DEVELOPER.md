# DeckLab Bolt — Developer Documentation

## Stack
- Expo SDK 54, React Native 0.81, React 19
- Expo Router 6
- Redux Toolkit + RTK Query + Persist
- Firebase (Auth, Firestore), Expo modules
- Tamagui (planned)
- Skia, Reanimated 4

## Getting Started
```
npm install
npm run start
# iOS: requires Xcode; Android: Android Studio; Web supported
```

## Env Vars
Create .env with:
- POKEMON_TCG_API_KEY=
- TCGPLAYER_PUBLIC_KEY=, TCGPLAYER_PRIVATE_KEY=
- EBAY_APP_ID=
- CARDMARKET_APP_TOKEN=
- FIREBASE_* (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId)
- GEMINI_API_KEY=

## Project Structure
- app/ Expo Router screens
- src/services/ API clients and RTK Query endpoints
- src/store/ Redux store and slices
- src/components/ UI primitives and composites
- src/theme/ theming utilities

## Commands
- npm run lint, npm run type-check
- npm run web|ios|android

## Quality Gates
- 60fps animations, <2s screen loads
- No placeholders; all API calls real with error states
- Offline-first via RTK Query + persistence
- Accessibility AA, voiceover labels

## Conventions
- TypeScript strict; no any
- Meaningful names; early returns; guard invalid state
- RTK Query for all network calls with caching & retries

## Testing
- Unit: vitest/jest
- Integration: react-native-testing-library
- E2E: Maestro/Detox

## Release
- EAS Build & Submit; App Store Connect / Play Console
- Symbols to Crashlytics/Sentry; versioning via app.json