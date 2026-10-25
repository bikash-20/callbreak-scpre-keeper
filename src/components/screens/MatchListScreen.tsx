import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  ChevronRight,
  Download,
  Moon,
  PlayCircle,
  Plus,
  Sun,
  Trophy,
} from 'lucide-react';
import type { Match } from '../../types/match';
import { formatScoreValue } from '../../lib/i18n';
import { cumulativeScores, evaluateWinner } from '../../lib/derive';
import { useTheme } from '../../theme/ThemeContext';
import { LanguageToggle, useLanguage } from '../../LanguageContext';

interface MatchListScreenProps {
  matches: Match[];
  loading: boolean;
  error: string | null;
  skipped: number;
  onOpen: (match: Match) => void;
  onNewMatch: () => void;
  onRetry: () => void;
}

/**
 * The home screen: resume an active match, review a completed one, or start a
 * new one. Each match is stored independently.
 */
export function MatchListScreen({
  matches,
  loading,
  error,
  skipped,
  onOpen,
  onNewMatch,
  onRetry,
}: MatchListScreenProps) {
  const { mode, toggle } = useTheme();
  const { language, t, number } = useLanguage();
  const [query, setQuery] = useState('');

  const { active, completed } = useMemo(() => {
    const filtered = query.trim()
      ? matches.filter((match) =>
          match.name.toLowerCase().includes(query.trim().toLowerCase()),
        )
      : matches;
    return {
      active: filtered.filter((match) => match.status === 'active'),
      completed: filtered.filter((match) => match.status === 'completed'),
    };
  }, [matches, query]);

  const renderMatch = (match: Match) => {
    const totals = cumulativeScores(match);
    const winner = evaluateWinner(match);
    const leaderId = winner?.winnerIds[0] ?? '';
    const leaderName =
      match.players.find((player) => player.id === leaderId)?.name ?? '';
    const leaderScore = totals.get(leaderId) ?? 0;

    return (
      <button
        key={match.id}
        type="button"
        className="match-item"
        onClick={() => onOpen(match)}
      >
        <span
          className={`match-item__icon${match.status === 'completed' ? ' match-item__icon--completed' : ''}`}
          aria-hidden="true"
        >
          {match.status === 'completed' ? <Trophy size={21} /> : <PlayCircle size={21} />}
        </span>
        <span className="match-item__body">
          <span className="match-item__name">{match.name}</span>
          <span className="match-item__meta">
            <span
              className={`status-dot status-dot--${match.status === 'completed' ? 'completed' : 'active'}`}
            >
              {match.status === 'completed' ? t('Completed') : t('In progress')}
            </span>
            <span>
              {number(match.rounds.length)} {t(match.rounds.length === 1 ? 'round' : 'rounds')}
            </span>
            <span>{t('Target {{score}}', { score: number(match.targetScore) })}</span>
          </span>
          {match.status === 'completed' && winner && (
            <span className="match-item__meta">
              <span style={{ fontWeight: 650 }}>
                {winner.isTie
                  ? t('Tie: {{names}}', {
                      names: winner.winnerIds
                        .map((id) => match.players.find((p) => p.id === id)?.name)
                        .filter(Boolean)
                        .join(' & '),
                    })
                  : t('{{name}} won', { name: leaderName })}
              </span>
              {winner.isTie && (
                <span>{formatScoreValue(leaderScore, language)} {t('points')}</span>
              )}
            </span>
          )}
        </span>
        <ChevronRight size={18} aria-hidden="true" style={{ opacity: 0.4 }} />
      </button>
    );
  };

  return (
    <div className="screen--light">
      <header className="topbar topbar--light">
        <h1 className="topbar__title">{t('Callbreak Scorekeeper')}</h1>
        <LanguageToggle />
        <button
          type="button"
          className="icon-btn"
          onClick={toggle}
          aria-label={t('Switch to {{theme}} theme', {
            theme: t(mode === 'light' ? 'dark' : 'light'),
          })}
        >
          {mode === 'light' ? <Moon size={19} /> : <Sun size={19} />}
        </button>
      </header>

      <main className="screen-inner">
        {error && (
          <div className="form-error" role="alert">
            {t(error)}
            <button
              type="button"
              className="btn btn--ghost"
              onClick={onRetry}
              disabled={loading}
              style={{ marginTop: 10 }}
            >
              {loading ? t('Retrying…') : t('Retry loading matches')}
            </button>
          </div>
        )}

        {skipped > 0 && (
          <div className="notice notice--info" style={{ marginBottom: 16 }}>
            {t('{{count}} saved matches could not be read and were skipped. The rest of your matches are unaffected.', {
              count: number(skipped),
            })}
          </div>
        )}

        <div className="dash-head" style={{ marginBottom: 16 }}>
          <div>
            <h2 className="page-title">{t('Your Matches')}</h2>
            <p className="page-subtitle">
              {t('Stored on this device and available offline. Export important matches for a separate backup; browser storage is not guaranteed permanent.')}
            </p>
          </div>
        </div>

        {matches.length > 0 && (
          <div className="field" style={{ marginBottom: 18 }}>
            <label className="label" htmlFor="match-search">
              {t('Search matches')}
            </label>
            <input
              id="match-search"
              className="input"
              type="search"
              value={query}
              placeholder={t('Search by name')}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        )}

        <button
          type="button"
          className="btn btn--forest btn--lg btn--block"
          onClick={onNewMatch}
          style={{ marginBottom: 24 }}
        >
          <Plus size={20} aria-hidden="true" />
          {t('New Match')}
        </button>

        {loading ? (
          <p className="muted text-center">{t('Loading matches…')}</p>
        ) : matches.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state__icon" aria-hidden="true">
              <Download size={26} />
            </span>
            <h3 className="empty-state__title">{t('No matches yet')}</h3>
            <p className="empty-state__text">
              {t('Start a match to score rounds. Your matches stay on this device and work offline. Browser storage is not guaranteed permanent.')}
            </p>
          </div>
        ) : (
          <>
            {active.length > 0 && (
              <section style={{ marginBottom: 26 }}>
                <h3 className="section-title">{t('Active')}</h3>
                <div className="match-list">{active.map(renderMatch)}</div>
              </section>
            )}
            {completed.length > 0 && (
              <section>
                <h3 className="section-title">
                  <CheckCircle2
                    size={16}
                    aria-hidden="true"
                    style={{ verticalAlign: '-2px', marginRight: 6 }}
                  />
                  {t('Completed')}
                </h3>
                <div className="match-list">{completed.map(renderMatch)}</div>
              </section>
            )}
            {active.length === 0 && completed.length === 0 && (
              <p className="muted text-center">{t('No matches match your search.')}</p>
            )}
          </>
        )}
      </main>
    </div>
  );
}
