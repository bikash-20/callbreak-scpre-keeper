import { useMemo } from 'react';
import {
  ArrowLeft,
  FileText,
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
 * The end-of-match summary: winner or tie, final standings, totals and the
 * full round-by-round record.
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

      <section className="winner-hero">
        <div className="winner-animation">
          <span className="winner-hero__crest" aria-hidden="true">
            <Trophy size={30} />
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
        <section style={{ marginBottom: 24 }}>
          <h3 className="section-title">
            <Users size={16} aria-hidden="true" style={{ verticalAlign: '-2px', marginRight: 6 }} />
            {t('Final standings')}
          </h3>
          <div className="standings">
            {ranked.map((row) => {
              const player = match.players.find((p) => p.id === row.playerId);
              const isWinner = Boolean(winner?.winnerIds.includes(row.playerId));
              return (
                <div
                  key={row.playerId}
                  className={`standing-row${isWinner ? ' standing-row--winner' : ''}`}
                >
                  <span className="standing-row__rank" aria-hidden="true">
                    {number(row.rank)}
                  </span>
                  <span className="standing-row__name">
                    {player?.name ?? t('Unknown')}
                    {isWinner && (
                      <span
                        style={{
                          marginLeft: 8,
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          color: 'var(--gold-deep)',
                          letterSpacing: '0.05em',
                        }}
                      >
                        {t(isTie ? 'TIED' : 'WINNER')}
                      </span>
                    )}
                  </span>
                  <span className="standing-row__score">
                    {formatScoreValue(row.score, language)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section style={{ marginBottom: 24 }}>
          <h3 className="section-title">
            <FileText size={16} aria-hidden="true" style={{ verticalAlign: '-2px', marginRight: 6 }} />
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
                <div className="history-card__head" style={{ cursor: 'default' }}>
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
                        const player = match.players.find((p) => p.id === entry.playerId);
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

        <section style={{ marginBottom: 24 }}>
          <h3 className="section-title">          {t('Export & share')}</h3>
          <div className="btn-row">
            <button type="button" className="btn btn--ghost" onClick={onExportText}>
              <Share2 size={17} aria-hidden="true" />
              {t('Share Summary')}
            </button>
            <button type="button" className="btn btn--ghost" onClick={onExportCsv}>
              <Table2 size={17} aria-hidden="true" />
              {t('Download CSV')}
            </button>
          </div>
        </section>

        <div className="btn-row">
          <button type="button" className="btn btn--forest" onClick={onNewMatch}>
            {t('New Match')}
          </button>
          <button type="button" className="btn btn--ghost" onClick={onMatchList}>
            {t('Match List')}
          </button>
        </div>
      </main>
    </div>
  );
}
