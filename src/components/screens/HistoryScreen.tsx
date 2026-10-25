import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Pencil,
  Undo2,
} from 'lucide-react';
import type { Match } from '../../types/match';
import { roundSummaries } from '../../lib/derive';
import { ConfirmDialog } from '../ConfirmDialog';
import { LanguageToggle, useLanguage } from '../../LanguageContext';
import { formatScoreValue, formatSignedScoreValue } from '../../lib/i18n';

interface HistoryScreenProps {
  match: Match;
  onBack: () => void;
  onEditRound: (roundIndex: number) => void;
  onUndo: () => Promise<void>;
}

/**
 * Round-by-round history. Every round can be inspected, and the latest round
 * can be undone. Editing a round recalculates everything after it.
 */
export function HistoryScreen({
  match,
  onBack,
  onEditRound,
  onUndo,
}: HistoryScreenProps) {
  const { language, t, number } = useLanguage();
  const [expanded, setExpanded] = useState<number | null>(null);
  const [confirmUndo, setConfirmUndo] = useState(false);
  const [undoing, setUndoing] = useState(false);
  const [undoError, setUndoError] = useState<string | null>(null);

  const summaries = useMemo(() => roundSummaries(match), [match]);
  const lastRoundIndex = match.rounds.length - 1;

  const handleUndo = async () => {
    if (undoing) return;
    setUndoing(true);
    setUndoError(null);
    try {
      await onUndo();
      setConfirmUndo(false);
    } catch (cause) {
      setUndoError(
        cause instanceof Error ? t(cause.message) : t('Could not undo the last round.'),
      );
      setConfirmUndo(false);
    } finally {
      setUndoing(false);
    }
  };

  if (match.rounds.length === 0) {
    return (
      <div className="screen--light">
        <header className="topbar topbar--light">
          <button
            type="button"
            className="icon-btn"
            onClick={onBack}
            aria-label={t('Back')}
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="topbar__title">{t('Round History')}</h1>
          <LanguageToggle />
        </header>
        <main className="screen-inner">
          <div className="empty-state">
            <span className="empty-state__icon" aria-hidden="true">
              <Undo2 size={26} />
            </span>
            <h2 className="empty-state__title">{t('No rounds yet')}</h2>
            <p className="empty-state__text">
            {t('Scores you save will appear here, with every bid, trick count and running total.')}
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="screen--light">
      <header className="topbar topbar--light">
        <button
          type="button"
          className="icon-btn"
          onClick={onBack}
          aria-label={t('Back')}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="topbar__title">
          {t('Round History')}
          <span className="topbar__sub">
            {match.name} · {number(match.rounds.length)}{' '}
            {t(match.rounds.length === 1 ? 'round' : 'rounds')}
          </span>
        </h1>
        <LanguageToggle />
      </header>

      <main className="screen-inner">
        {undoError && (
          <div className="form-error" role="alert">
            {t(undoError)}
          </div>
        )}
        <div className="history-list">
          {summaries.map((summary, index) => {
            const isOpen = expanded === index;
            return (
              <article key={summary.round.id} className="history-card">
                <button
                  type="button"
                  className="history-card__head"
                  onClick={() => setExpanded(isOpen ? null : index)}
                  aria-expanded={isOpen}
                >
                  <span>
                    <span className="history-card__round">
                      {t('Round {{number}}', {
                        number: number(summary.round.roundNumber),
                      })}
                    </span>
                    <span className="history-card__date">
                      {new Date(summary.round.createdAt).toLocaleString(
                        language === 'bn' ? 'bn-BD' : 'en-US',
                      )}
                    </span>
                  </span>
                  {isOpen ? (
                    <ChevronDown size={18} aria-hidden="true" />
                  ) : (
                    <ChevronRight size={18} aria-hidden="true" />
                  )}
                </button>

                {isOpen && (
                  <>
                    <div className="history-table-wrap">
                      <table className="history-table">
                        <thead>
                          <tr>
                            <th scope="col">{t('Player')}</th>
                            <th scope="col">{t('Bid')}</th>
                            <th scope="col">{t('Won')}</th>
                            <th scope="col">{t('Round')}</th>
                            <th scope="col">{t('Total')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {summary.round.playerEntries.map((entry) => {
                            const player = match.players.find(
                              (p) => p.id === entry.playerId,
                            );
                            const cumulative =
                              summary.cumulativeAfter[entry.playerId] ?? 0;
                            return (
                              <tr key={entry.playerId}>
                                <td>{player?.name ?? t('Unknown')}</td>
                                <td className="num">{number(entry.bid)}</td>
                                <td className="num">{number(entry.tricksWon)}</td>
                                <td
                                  className={`num ${
                                    entry.roundScore > 0
                                      ? 'pos'
                                      : entry.roundScore < 0
                                        ? 'neg'
                                        : ''
                                  }`}
                                >
                                  {formatSignedScoreValue(entry.roundScore, language)}
                                </td>
                                <td className="num">{formatScoreValue(cumulative, language)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div style={{ padding: '12px 16px 14px' }}>
                      <button
                        type="button"
                        className="btn btn--ghost btn--block"
                        onClick={() => onEditRound(index)}
                      >
                        <Pencil size={16} aria-hidden="true" />
                        {t('Edit Round {{number}}', {
                          number: number(summary.round.roundNumber),
                        })}
                      </button>
                    </div>
                  </>
                )}
              </article>
            );
          })}
        </div>

        <div style={{ marginTop: 18 }}>
          <button
            type="button"
            className="btn btn--danger btn--block"
            onClick={() => setConfirmUndo(true)}
            disabled={match.rounds.length === 0}
          >
            <Undo2 size={17} aria-hidden="true" />
            {t('Undo Last Round')}
          </button>
        </div>

        <p className="muted" style={{ fontSize: '0.8rem', marginTop: 12, textAlign: 'center' }}>
          {t('Editing a round recalculates every later round and the final result.')}
        </p>
      </main>

      {confirmUndo && (
        <ConfirmDialog
          title={t('Undo the last round?')}
          body={
            t('Round {{number}} will be removed and every total recalculated. This cannot be undone.', {
              number: number(match.rounds[lastRoundIndex]?.roundNumber ?? 0),
            })
          }
          confirmLabel={t('Undo Round')}
          destructive
          onConfirm={handleUndo}
          onCancel={() => setConfirmUndo(false)}
        />
      )}
    </div>
  );
}
