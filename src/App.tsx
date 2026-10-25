import { useState } from 'react';
import type { Match, PlayerRoundEntry, Round } from './types/match';
import { SCHEMA_VERSION } from './types/match';
import { useMatches } from './hooks/useMatches';
import { getScoringRule } from './lib/scoring';
import { evaluateWinner } from './lib/derive';
import { validateRound } from './lib/validation';
import {
  downloadFile,
  exportFileBaseName,
  exportMatchToCsv,
  shareExport,
} from './lib/export';
import { StorageError } from './lib/db';
import { useToast } from './components/Toast';
import { DashboardScreen } from './components/screens/DashboardScreen';
import { HistoryScreen } from './components/screens/HistoryScreen';
import { MatchListScreen } from './components/screens/MatchListScreen';
import { RoundEntryScreen } from './components/screens/RoundEntryScreen';
import { SettingsScreen } from './components/screens/SettingsScreen';
import { SetupScreen } from './components/screens/SetupScreen';
import { SummaryScreen } from './components/screens/SummaryScreen';
import { useLanguage } from './LanguageContext';
import { DownloadBanner } from './components/DownloadBanner';

type Screen =
  | 'matches'
  | 'setup'
  | 'dashboard'
  | 'round-entry'
  | 'history'
  | 'settings'
  | 'summary';
type RoundEntryOrigin = 'dashboard' | 'history';

function createId(prefix: string): string {
  const uuid = globalThis.crypto?.randomUUID?.();
  return `${prefix}_${uuid ?? `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`}`;
}

function updateMatchResult(match: Match, now: string): Match {
  const winner = evaluateWinner(match);
  return {
    ...match,
    status: winner ? 'completed' : 'active',
    completedAt: winner ? match.completedAt ?? now : null,
    updatedAt: now,
    schemaVersion: SCHEMA_VERSION,
  };
}

export function App() {
  const {
    matches,
    loading,
    skipped,
    error,
    refresh,
    saveMatch,
    updateMatch,
    removeMatch,
  } = useMatches();
  const { show } = useToast();
  const { language } = useLanguage();
  const [screen, setScreen] = useState<Screen>('matches');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [editingRoundId, setEditingRoundId] = useState<string | null>(null);
  const [roundEntryOrigin, setRoundEntryOrigin] = useState<RoundEntryOrigin>('dashboard');

  const openMatch = (match: Match) => {
    setSelectedMatch(match);
    setScreen('dashboard');
  };

  const createMatch = async (match: Match) => {
    await saveMatch(match);
    setSelectedMatch(match);
    setScreen('dashboard');
  };

  const openRoundEntry = (origin: RoundEntryOrigin, roundId: string | null = null) => {
    if (!selectedMatch) return;
    setEditingRoundId(roundId);
    setRoundEntryOrigin(origin);
    setScreen('round-entry');
  };

  const saveRound = async (entries: PlayerRoundEntry[]) => {
    if (!selectedMatch) throw new StorageError('Open a match before saving a round.');
    const now = new Date().toISOString();
    const saved = await updateMatch(selectedMatch.id, (current) => {
      if (
        entries.length !== current.players.length ||
        current.players.some(
          (player) => !entries.some((entry) => entry.playerId === player.id),
        )
      ) {
        throw new StorageError('The player list changed. Reopen the round and try again.');
      }

      const inputs = current.players.map((player) => {
        const entry = entries.find((item) => item.playerId === player.id);
        return {
          playerId: player.id,
          playerName: player.name,
          bid: String(entry?.bid ?? ''),
          tricksWon: String(entry?.tricksWon ?? ''),
        };
      });
      const validation = validateRound(inputs, {
        expectedTrickTotal: current.expectedTrickTotal,
        enforceTrickTotal: current.enforceTrickTotal,
      });
      if (!validation.valid) {
        throw new StorageError(
          validation.totalIssue ??
            validation.fieldIssues[0]?.message ??
            'The round is no longer valid. Reopen it and try again.',
        );
      }

      const scoringRule = getScoringRule(current.scoringMode);
      const playerEntries = inputs.map((input) => {
        const bid = Number(input.bid);
        const tricksWon = Number(input.tricksWon);
        return {
          playerId: input.playerId,
          bid,
          tricksWon,
          roundScore: scoringRule.scoreRound(bid, tricksWon),
        };
      });
      const rounds = [...current.rounds];
      const existingIndex = editingRoundId
        ? rounds.findIndex((round) => round.id === editingRoundId)
        : -1;
      if (editingRoundId && existingIndex < 0) {
        throw new StorageError(
          'That round no longer exists. Reopen the match history.',
        );
      }

      const previous = existingIndex >= 0 ? rounds[existingIndex] : undefined;
      const round: Round = {
        id: previous?.id ?? createId('round'),
        roundNumber: previous?.roundNumber ?? rounds.length + 1,
        playerEntries,
        createdAt: previous?.createdAt ?? now,
        updatedAt: now,
      };
      if (existingIndex >= 0) rounds[existingIndex] = round;
      else rounds.push(round);

      return updateMatchResult({ ...current, rounds }, now);
    });
    setSelectedMatch(saved);
    setEditingRoundId(null);
    if (editingRoundId) {
      setScreen(roundEntryOrigin);
    } else {
      setScreen(saved.status === 'completed' ? 'summary' : 'dashboard');
    }
  };

  const undoLastRound = async () => {
    if (!selectedMatch) throw new StorageError('Open a match before undoing a round.');
    const now = new Date().toISOString();
    const saved = await updateMatch(selectedMatch.id, (current) =>
      updateMatchResult({ ...current, rounds: current.rounds.slice(0, -1) }, now),
    );
    setSelectedMatch(saved);
  };

  const saveSettings = async (settings: Match) => {
    const now = new Date().toISOString();
    const saved = await updateMatch(settings.id, (current) =>
      updateMatchResult(
        {
          ...current,
          name: settings.name,
          targetScore: settings.targetScore,
          enforceTrickTotal: settings.enforceTrickTotal,
          expectedTrickTotal: settings.expectedTrickTotal,
        },
        now,
      ),
    );
    setSelectedMatch(saved);
  };

  const deleteSelectedMatch = async () => {
    if (!selectedMatch) return;
    await removeMatch(selectedMatch.id);
    setSelectedMatch(null);
    setScreen('matches');
  };

  const exportText = async () => {
    if (!selectedMatch) return;
    try {
      const result = await shareExport(selectedMatch, 'text', language);
      if (result.shared || result.downloaded) {
        show({
          message: result.shared ? 'Summary shared.' : 'Summary downloaded.',
          variant: 'success',
        });
      }
    } catch (cause) {
      show({
        message: cause instanceof Error ? cause.message : 'Could not export this summary.',
        variant: 'error',
      });
    }
  };

  const exportCsv = () => {
    if (!selectedMatch) return;
    try {
      downloadFile(
        `${exportFileBaseName(selectedMatch)}.csv`,
        exportMatchToCsv(selectedMatch, language),
        'text/csv',
      );
      show({ message: 'Match history downloaded as CSV.', variant: 'success' });
    } catch (cause) {
      show({
        message: cause instanceof Error ? cause.message : 'Could not export match history.',
        variant: 'error',
      });
    }
  };

  return (
    <div className="app-container">
      <DownloadBanner
        onDismiss={() => {}}
        message="Install Callbreak Scorekeeper to your home screen"
      />
      {screen === 'matches' && (
        <MatchListScreen
          matches={matches}
          loading={loading}
          error={error}
          skipped={skipped}
          onOpen={openMatch}
          onNewMatch={() => setScreen('setup')}
          onRetry={() => void refresh()}
        />
      )}
      {screen === 'setup' && <SetupScreen onCancel={() => setScreen('matches')} onCreate={createMatch} />}
      {!selectedMatch && (
        <MatchListScreen
          matches={matches}
          loading={loading}
          error={error}
          skipped={skipped}
          onOpen={openMatch}
          onNewMatch={() => setScreen('setup')}
          onRetry={() => void refresh()}
        />
      )}
      {screen === 'dashboard' && selectedMatch && (
        <DashboardScreen
          match={selectedMatch}
          onEnterRound={() => openRoundEntry('dashboard')}
          onHistory={() => setScreen('history')}
          onSettings={() => setScreen('settings')}
          onExport={() => void exportText()}
          onBack={() => setScreen('matches')}
        />
      )}
      {screen === 'round-entry' && selectedMatch && (
        <RoundEntryScreen
          match={selectedMatch}
          roundNumber={editingRoundId
            ? selectedMatch.rounds.find((round) => round.id === editingRoundId)?.roundNumber ?? selectedMatch.rounds.length + 1
            : selectedMatch.rounds.length + 1}
          initialEntries={editingRoundId
            ? selectedMatch.rounds.find((round) => round.id === editingRoundId)?.playerEntries
            : undefined}
          isEditing={Boolean(editingRoundId)}
          onCancel={() => {
            setEditingRoundId(null);
            setScreen(roundEntryOrigin);
          }}
          onSave={saveRound}
        />
      )}
      {screen === 'history' && selectedMatch && (
        <HistoryScreen
          match={selectedMatch}
          onBack={() => setScreen('dashboard')}
          onEditRound={(index) => {
            const round = selectedMatch.rounds[index];
            if (round) openRoundEntry('history', round.id);
          }}
          onUndo={undoLastRound}
        />
      )}
      {screen === 'settings' && selectedMatch && (
        <SettingsScreen
          match={selectedMatch}
          onBack={() => setScreen('dashboard')}
          onSave={saveSettings}
          onDelete={deleteSelectedMatch}
        />
      )}
      {screen === 'summary' && selectedMatch && (
        <SummaryScreen
          match={selectedMatch}
          onBack={() => setScreen('dashboard')}
          onNewMatch={() => setScreen('setup')}
          onMatchList={() => setScreen('matches')}
          onExportText={() => void exportText()}
          onExportCsv={exportCsv}
        />
      )}
    </div>
  );
}
