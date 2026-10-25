import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Match } from '../types/match';
import {
  deleteMatch as dbDeleteMatch,
  listMatches,
  putMatch as dbPutMatch,
  requestPersistentStorage,
  StorageError,
  updateMatch as dbUpdateMatch,
} from '../lib/db';

interface UseMatchesResult {
  matches: Match[];
  loading: boolean;
  /** Number of records that could not be read and were skipped. */
  skipped: number;
  error: string | null;
  refresh: () => Promise<void>;
  saveMatch: (match: Match) => Promise<void>;
  updateMatch: (id: string, update: (current: Match) => Match) => Promise<Match>;
  removeMatch: (id: string) => Promise<void>;
}

/**
 * Loads every saved match and exposes create/update/delete operations.
 *
 * The list is the source of truth for the match list screen; individual
 * screens hold the match they are editing.
 */
export function useMatches(): UseMatchesResult {
  const [matches, setMatches] = useState<Match[]>([]);
  const [skipped, setSkipped] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const result = await listMatches();
      setMatches(result.matches);
      setSkipped(result.skipped);
      setError(null);
    } catch (cause) {
      setError(
        cause instanceof StorageError
          ? cause.message
          : 'Could not load your saved matches.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    // Ask the browser to keep our data around under storage pressure.
    void requestPersistentStorage();
  }, [refresh]);

  const saveMatch = useCallback(async (match: Match) => {
    await dbPutMatch(match);
    await refresh();
  }, [refresh]);

  const updateMatch = useCallback(
    async (id: string, update: (current: Match) => Match) => {
      const updated = await dbUpdateMatch(id, update);
      await refresh();
      return updated;
    },
    [refresh],
  );

  const removeMatch = useCallback(
    async (id: string) => {
      await dbDeleteMatch(id);
      await refresh();
    },
    [refresh],
  );

  return useMemo(
    () => ({
      matches,
      loading,
      skipped,
      error,
      refresh,
      saveMatch,
      updateMatch,
      removeMatch,
    }),
    [matches, loading, skipped, error, refresh, saveMatch, updateMatch, removeMatch],
  );
}
