# Callbreak Scorekeeper

A mobile-first, offline-capable scorekeeper for four-player Callbreak. Create
multiple matches, record and edit rounds, review recalculated standings, and
export a match as CSV or text.

## Run locally

```sh
npm install
npm run dev
```

Run the checks and production build with:

```sh
npm test
npm run typecheck
npm run build
```

## Match storage

Match records and round history are stored locally in IndexedDB. Round edits
and saves update the match atomically, and cumulative scores are derived from
the saved rounds. The app can read and update matches offline after it has been
loaded.

Browser storage is not guaranteed permanent. Clearing browser site data,
uninstalling the app, or browser storage eviction can remove saved matches.
Export important matches to keep a separate backup.

## Language

Use the language control in the header or Match Settings to switch between
English and Bengali. The language preference is stored in local storage;
match data remains in IndexedDB.
