import { useMemo, useState } from 'react';
import {
  ChevronRight,
  Download,
  Moon,
  PlayCircle,
  Plus,
  Search,
  Sun,
  Trophy,
  X,
} from 'lucide-react';
import type { Match } from '../../types/match';
import { formatScoreValue } from '../../lib/i18n';
import { cumulativeScores, evaluateWinner } from '../../lib/derive';
import { useTheme } from '../../theme/ThemeContext';
import { LanguageToggle, useLanguage } from '../../LanguageContext';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';

interface MatchListScreenProps {
  matches: Match[];
  loading: boolean;
  error: string | null;
  skipped: number;
  onOpen: (match: Match) => void;
  onNewMatch: () => void;
  onRetry: () => void;
}

type FilterTab = 'all' | 'active' | 'completed';

/**
 * Mobile-first match list with real-time search, filter tabs, quick stats,
 * and seamless theme/install controls.
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
  const { state: installState, install } = useInstallPrompt();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const counts = useMemo(() => {
    let activeCount = 0;
    let completedCount = 0;
    for (const m of matches) {
      if (m.status === 'completed') completedCount++;
      else activeCount++;
    }
    return {
      all: matches.length,
      active: activeCount,
      completed: completedCount,
    };
  }, [matches]);

  const filteredMatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return matches.filter((match) => {
      if (activeTab === 'active' && match.status !== 'active') return false;
      if (activeTab === 'completed' && match.status !== 'completed') return false;
      if (q) {
        const nameMatches = match.name.toLowerCase().includes(q);
        const playerMatches = match.players.some((p) =>
          p.name.toLowerCase().includes(q),
        );
        return nameMatches || playerMatches;
      }
      return true;
    });
  }, [matches, query, activeTab]);

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
          className={`match-item__icon${
            match.status === 'completed' ? ' match-item__icon--completed' : ''
          }`}
          aria-hidden="true"
        >
          {match.status === 'completed' ? (
            <Trophy size={21} />
          ) : (
            <PlayCircle size={21} />
          )}
        </span>
        <span className="match-item__body">
          <span className="match-item__name">{match.name}</span>
          <span className="match-item__meta">
            <span
              className={`status-dot status-dot--${
                match.status === 'completed' ? 'completed' : 'active'
              }`}
            >
              {match.status === 'completed' ? t('Completed') : t('In progress')}
            </span>
            <span>
              {number(match.rounds.length)}{' '}
              {t(match.rounds.length === 1 ? 'round' : 'rounds')}
            </span>
            <span>
              {t('Target {{score}}', { score: number(match.targetScore) })}
            </span>
          </span>
          {match.status === 'completed' && winner && (
            <span className="match-item__meta">
              <span style={{ fontWeight: 650, color: 'var(--gold-deep)' }}>
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
                <span>
                  {formatScoreValue(leaderScore, language)} {t('points')}
                </span>
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

        {installState === 'can-install' && (
          <button
            type="button"
            className="icon-btn install-icon-btn"
            onClick={() => void install()}
            aria-label={t('Install App')}
            title={t('Install Callbreak Scorekeeper')}
          >
            <Download size={19} />
          </button>
        )}

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
            {t(
              '{{count}} saved matches could not be read and were skipped. The rest of your matches are unaffected.',
              { count: number(skipped) },
            )}
          </div>
        )}

        <div className="dash-head" style={{ marginBottom: 16 }}>
          <div>
            <h2 className="page-title">{t('Your Matches')}</h2>
            <p className="page-subtitle">
              {t(
                'Stored on this device and available offline. Export important matches for a separate backup; browser storage is not guaranteed permanent.',
              )}
            </p>
          </div>
        </div>

        {/* Quick Stats Pills */}
        {matches.length > 0 && (
          <div className="stats-pill-row">
            <span className="stats-pill">
              <strong>{number(counts.all)}</strong> {t('All')}
            </span>
            <span className="stats-pill stats-pill--active">
              <strong>{number(counts.active)}</strong> {t('In progress')}
            </span>
            <span className="stats-pill stats-pill--completed">
              <strong>{number(counts.completed)}</strong> {t('Completed')}
            </span>
          </div>
        )}

        {/* Search Bar */}
        {matches.length > 0 && (
          <div className="search-wrap">
            <Search size={18} className="search-icon" aria-hidden="true" />
            <input
              id="match-search"
              className="input search-input"
              type="search"
              value={query}
              placeholder={t('Search matches…')}
              onChange={(event) => setQuery(event.target.value)}
            />
            {query.trim() !== '' && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setQuery('')}
                aria-label={t('Clear search')}
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}

        {/* Filter Segmented Control */}
        {matches.length > 0 && (
          <div
            className="filter-tabs"
            role="tablist"
            aria-label="Filter matches"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'all'}
              className={`filter-tab${activeTab === 'all' ? ' filter-tab--active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              {t('All ({{count}})', { count: number(counts.all) })}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'active'}
              className={`filter-tab${activeTab === 'active' ? ' filter-tab--active' : ''}`}
              onClick={() => setActiveTab('active')}
            >
              {t('In Progress ({{count}})', { count: number(counts.active) })}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'completed'}
              className={`filter-tab${activeTab === 'completed' ? ' filter-tab--active' : ''}`}
              onClick={() => setActiveTab('completed')}
            >
              {t('Completed ({{count}})', {
                count: number(counts.completed),
              })}
            </button>
          </div>
        )}

        <button
          type="button"
          className="btn btn--forest btn--lg btn--block new-match-btn"
          onClick={onNewMatch}
          style={{ marginBottom: 20 }}
        >
          <Plus size={20} aria-hidden="true" />
          {t('New Match')}
        </button>

        {loading ? (
          <p className="muted text-center" style={{ padding: '32px 0' }}>
            {t('Loading matches…')}
          </p>
        ) : filteredMatches.length > 0 ? (
          <div className="match-list">{filteredMatches.map(renderMatch)}</div>
        ) : matches.length > 0 ? (
          <div className="empty-state">
            <h3 className="empty-state__title">
              {t('No matches match your search.')}
            </h3>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                setQuery('');
                setActiveTab('all');
              }}
              style={{ marginTop: 12 }}
            >
              {t('Clear search')}
            </button>
          </div>
        ) : (
          <div className="empty-state">
            <span className="empty-state__icon" aria-hidden="true">
              <Download size={26} />
            </span>
            <h3 className="empty-state__title">{t('No matches yet')}</h3>
            <p className="empty-state__text">
              {t(
                'Start a match to score rounds. Your matches stay on this device and work offline. Browser storage is not guaranteed permanent.',
              )}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
