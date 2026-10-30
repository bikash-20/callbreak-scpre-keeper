import { useMemo } from 'react';
import {
  ArrowLeft,
  FileText,
  Plus,
  Share2,
  Table2,
  Trophy,
  Users,
} from 'lucide-react';
import type { Match } from '../../types/match';
import { evaluateWinner, rankings, roundSummaries } from '../../lib/derive';
import { LanguageToggle, useLanguage } from '../../LanguageContext';
import { formatScoreValue, formatSignedScoreValue } from '../../lib/i18n';

interface SummaryScreenProps {
  match: Match;
  onBack: () => void;
  onNewMatch: () => void;
  onMatchList: () => void;
  onExportCsv: () => void;
  onExportText: () => void;
}

/**
 * The end-of-match celebration & summary: confetti animation, podium rankings,
 * round-by-round ledger, and export actions.
 */
export function SummaryScreen({
  match,
  onBack,
  onNewMatch,
  onMatchList,
  onExportCsv,
  onExportText,
}: SummaryScreenProps) {
  const { language, t, number } = useLanguage();
  const winner = useMemo(() => evaluateWinner(match), [match]);
  const ranked = useMemo(() => rankings(match), [match]);
  const summaries = useMemo(() => roundSummaries(match), [match]);

  const winnerNames =
    winner?.winnerIds
      .map((id) => match.players.find((player) => player.id === id)?.name)
      .filter(Boolean)
      .join(' & ') ?? '';

  const isTie = Boolean(winner?.isTie);
  const headline = winner
    ? isTie
      ? t("IT'S A TIE!")
      : t('{{name}} wins!', { name: winnerNames })
    : t('MATCH ENDED');

  // Compute player accuracy stats (% of rounds where trick >= bid)
  const playerStats = useMemo(() => {
    const stats: Record<string, { madeCount: number; totalRounds: number }> = {};
    for (const p of match.players) {
      stats[p.id] = { madeCount: 0, totalRounds: match.rounds.length };
    }
    for (const round of match.rounds) {
      for (const entry of round.playerEntries) {
        if (entry.tricksWon >= entry.bid && stats[entry.playerId]) {
          stats[entry.playerId]!.madeCount++;
        }
      }
    }
    return stats;
  }, [match]);

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
        <h1 className="topbar__title">{t('Match Summary')}</h1>
        <LanguageToggle />
      </header>

      {/* HERO SECTION WITH CONFETTI */}
      <section className="winner-hero">
        <div className="confetti-container" aria-hidden="true">
          {Array.from({ length: 28 }).map((_, i) => (
            <span
              key={i}
              className={`confetti-piece piece-${i % 5}`}
              style={{
                left: `${(i * 3.6) % 100}%`,
                animationDelay: `${(i * 0.14).toFixed(2)}s`,
              }}
            />
          ))}
        </div>

        <div className="winner-animation">
          <span className="winner-hero__crest" aria-hidden="true">
            <Trophy size={32} />
          </span>
          <p className="winner-hero__eyebrow">
            {t(isTie ? 'Tied at the top' : 'Winner')}
          </p>
          <h2 className="winner-hero__name">{headline}</h2>
          {winner && (
            <>
              <p className="winner-hero__score">
                {formatScoreValue(winner.topScore, language)} {t('points')}
              </p>
              <p className="winner-hero__target">
                {t('Target score:')} {number(match.targetScore)} {t('points')}
              </p>
            </>
          )}
        </div>
      </section>

      <main className="screen-inner">
        {/* FINAL STANDINGS PODIUM */}
        <section style={{ marginBottom: 24 }}>
          <h3 className="section-title">
            <Users
              size={16}
              aria-hidden="true"
              style={{ verticalAlign: '-2px', marginRight: 6 }}
            />
            {t('Final standings')}
          </h3>
          <div className="standings">
            {ranked.map((row, idx) => {
              const player = match.players.find((p) => p.id === row.playerId);
              const isWinner = Boolean(
                winner?.winnerIds.includes(row.playerId),
              );
              const stats = playerStats[row.playerId];
              const accuracy =
                stats && stats.totalRounds > 0
                  ? Math.round((stats.madeCount / stats.totalRounds) * 100)
                  : 0;

              return (
                <div
                  key={row.playerId}
                  className={`standing-row${
                    isWinner ? ' standing-row--winner' : ''
                  }`}
                >
                  <span className="standing-row__rank" aria-hidden="true">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : number(row.rank)}
                  </span>
                  <div className="standing-row__body">
                    <span className="standing-row__name">
                      {player?.name ?? t('Unknown')}
                      {isWinner && (
                        <span className="standing-winner-tag">
                          {t(isTie ? 'TIED' : 'WINNER')}
                        </span>
                      )}
                    </span>
                    <span className="standing-row__sub">
                      {t('Bid accuracy')}: {number(accuracy)}% ({number(stats?.madeCount ?? 0)}/{number(match.rounds.length)})
                    </span>
                  </div>
                  <span className="standing-row__score">
                    {formatScoreValue(row.score, language)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* ACTION BUTTONS */}
        <div className="btn-row" style={{ marginBottom: 24 }}>
          <button
            type="button"
            className="btn btn--primary"
            onClick={onNewMatch}
          >
            <Plus size={18} aria-hidden="true" />
            {t('New Match')}
          </button>
          <button
            type="button"
            className="btn btn--forest"
            onClick={onExportText}
          >
            <Share2 size={17} aria-hidden="true" />
            {t('Share Summary')}
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={onExportCsv}
          >
            <Table2 size={17} aria-hidden="true" />
            {t('Download CSV')}
          </button>
        </div>

        {/* ROUND BY ROUND HISTORICAL TABLE */}
        <section style={{ marginBottom: 24 }}>
          <h3 className="section-title">
            <FileText
              size={16}
              aria-hidden="true"
              style={{ verticalAlign: '-2px', marginRight: 6 }}
            />
            {t('Round by round')}
          </h3>
          <p className="muted" style={{ fontSize: '0.86rem', marginBottom: 12 }}>
            {t('{{count}} rounds played', {
              count: number(match.rounds.length),
            })}
          </p>
          <div className="history-list">
            {summaries.map((summary) => (
              <div key={summary.round.id} className="history-card">
                <div
                  className="history-card__head"
                  style={{ cursor: 'default' }}
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
                </div>
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
                              {formatSignedScoreValue(
                                entry.roundScore,
                                language,
                              )}
                            </td>
                            <td className="num">
                              {formatScoreValue(
                                summary.cumulativeAfter[entry.playerId] ?? 0,
                                language,
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </section>

        <button
          type="button"
          className="btn btn--ghost btn--block"
          onClick={onMatchList}
          style={{ marginBottom: 16 }}
        >
          {t('Match List')}
        </button>
      </main>
    </div>
  );
}
