import { useMemo } from 'react';
import {
  ArrowLeft,
  Flag,
  History,
  Settings,
  Share2,
  Trophy,
} from 'lucide-react';
import type { Match } from '../../types/match';
import { cumulativeScores, evaluateWinner, latestRoundScores, rankings } from '../../lib/derive';
import { formatScoreValue } from '../../lib/i18n';
import { LanguageToggle, useLanguage } from '../../LanguageContext';
import { PlayerCard } from '../PlayerCard';

interface DashboardScreenProps {
  match: Match;
  onEnterRound: () => void;
  onHistory: () => void;
  onSettings: () => void;
  onExport: () => void;
  onBack: () => void;
}

/**
 * The match dashboard: current round, target score, the four player cards with
 * live standings, and the primary "Enter Round" action.
 */
export function DashboardScreen({
  match,
  onEnterRound,
  onHistory,
  onSettings,
  onExport,
  onBack,
}: DashboardScreenProps) {
  const { language, t, number } = useLanguage();
  const totals = useMemo(() => cumulativeScores(match), [match]);
  const ranked = useMemo(() => rankings(match), [match]);
  const latest = useMemo(() => latestRoundScores(match), [match]);
  const winner = useMemo(() => evaluateWinner(match), [match]);

  const currentRound = match.rounds.length + 1;
  const leaderId = ranked[0]?.playerId;
  const isComplete = match.status === 'completed';

  return (
    <div className="screen--dark">
      <header className="topbar">
        <button
          type="button"
          className="icon-btn"
          onClick={onBack}
          aria-label={t('Back to match list')}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="topbar__title">
          {match.name}
          <span className="topbar__sub">
            {isComplete
              ? t('Match complete')
              : t('Round {{number}}', { number: number(currentRound) })}
          </span>
        </h1>
        <LanguageToggle />
        <button
          type="button"
          className="icon-btn"
          onClick={onHistory}
          aria-label={t('Round history')}
        >
          <History size={20} />
        </button>
        <button
          type="button"
          className="icon-btn"
          onClick={onSettings}
          aria-label={t('Match settings')}
        >
          <Settings size={20} />
        </button>
      </header>

      <main className="screen-inner">
        <div className="dash-head">
          <div style={{ minWidth: 0 }}>
            <h2 className="dash-match-name">{match.name}</h2>
            <div className="dash-meta">
              <span className="meta-pill meta-pill--target">
                <Flag size={13} aria-hidden="true" />
                {t('Target Score:')} {number(match.targetScore)} {t('points')}
              </span>
              <span className="meta-pill">
                <Trophy size={13} aria-hidden="true" />
                {isComplete
                  ? `${number(match.rounds.length)} ${t(match.rounds.length === 1 ? 'round' : 'rounds')}`
                  : t('Round {{number}} of play', { number: number(currentRound) })}
              </span>
            </div>
          </div>
        </div>

        {winner && (
          <div
            className="notice"
            style={{
              background: 'rgba(184,165,248,0.16)',
              color: 'var(--gold)',
              marginBottom: 16,
            }}
            role="status"
          >
            {winner.isTie
              ? t('Tie between {{names}} at {{score}} points.', {
                  names: winner.winnerIds
                    .map((id) => match.players.find((p) => p.id === id)?.name)
                    .filter(Boolean)
                    .join(' & '),
                  score: formatScoreValue(winner.topScore, language),
                })
              : t('{{name}} has won with {{score}} points.', {
                  name: match.players.find((p) => p.id === winner.winnerIds[0])?.name ?? '',
                  score: formatScoreValue(winner.topScore, language),
                })}
          </div>
        )}

        <div className="player-grid">
          {match.players.map((player) => {
            const rank = ranked.find((row) => row.playerId === player.id)?.rank ?? 0;
            return (
              <PlayerCard
                key={player.id}
                player={player}
                score={totals.get(player.id) ?? 0}
                latestRoundScore={latest.get(player.id) ?? null}
                rank={rank}
                targetScore={match.targetScore}
                isLeader={rank === 1 && leaderId === player.id}
              />
            );
          })}
        </div>

        <div className="stack" style={{ marginTop: 22 }}>
          {!isComplete ? (
            <button
              type="button"
              className="btn btn--primary btn--lg btn--block"
              onClick={onEnterRound}
            >
              {t('Enter Round {{number}}', { number: number(currentRound) })}
            </button>
          ) : (
            <button
              type="button"
              className="btn btn--primary btn--lg btn--block"
              onClick={onHistory}
            >
              {t('View Final Summary')}
            </button>
          )}

          <div className="btn-row">
            <button type="button" className="btn btn--ghost-dark" onClick={onHistory}>
              <History size={17} aria-hidden="true" />
              {t('History')}
            </button>
            <button type="button" className="btn btn--ghost-dark" onClick={onExport}>
              <Share2 size={17} aria-hidden="true" />
              {t('Export')}
            </button>
          </div>
        </div>

        <p
          className="muted-dark"
          style={{ fontSize: '0.78rem', textAlign: 'center', marginTop: 20 }}
        >
          {t('Saved on this device and works offline. Export important matches for a backup; browser storage is not guaranteed permanent.')}
        </p>
      </main>
    </div>
  );
}
