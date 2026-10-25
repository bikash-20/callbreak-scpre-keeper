import { Crown } from 'lucide-react';
import { pointsToUnits } from '../lib/scoring';
import type { Player } from '../types/match';
import { useLanguage } from '../LanguageContext';
import { formatScoreValue, formatSignedScoreValue } from '../lib/i18n';

interface PlayerCardProps {
  player: Player;
  /** Cumulative score in tenths of a point. */
  score: number;
  /** Most recent round score in tenths of a point; null before the first round. */
  latestRoundScore: number | null;
  rank: number;
  targetScore: number;
  /** True when this player currently leads. */
  isLeader: boolean;
}

/**
 * A compact dashboard card for one player: rank, name, cumulative score,
 * latest round delta and progress toward the target.
 */
export function PlayerCard({
  player,
  score,
  latestRoundScore,
  rank,
  targetScore,
  isLeader,
}: PlayerCardProps) {
  const { language, t, number } = useLanguage();
  const targetUnits = pointsToUnits(targetScore);
  // Progress is clamped to 0-100%; a negative score shows no progress.
  const progress = targetUnits > 0 ? Math.min(100, Math.max(0, (score / targetUnits) * 100)) : 0;
  const reachedTarget = score >= targetUnits;

  const deltaClass =
    latestRoundScore === null
      ? 'delta--flat'
      : latestRoundScore > 0
        ? 'delta--positive'
        : latestRoundScore < 0
          ? 'delta--negative'
          : 'delta--flat';

  return (
    <article
      className={`player-card${isLeader ? ' player-card--leader' : ''}`}
      aria-label={`${player.name}, ${t('rank {{rank}}', { rank: number(rank) })}, ${formatScoreValue(score, language)} ${t('points')}`}
    >
      <div className="player-card__top">
        <span className="player-card__rank" aria-hidden="true">
          {number(rank)}
        </span>
        {isLeader && (
          <span className="player-card__leader-tag">
            <Crown size={12} aria-hidden="true" />
            {t('Leader')}
          </span>
        )}
      </div>

      <h3 className="player-card__name" title={player.name}>
        {player.name}
      </h3>

      <div
        className={`player-card__score${score < 0 ? ' player-card__score--negative' : ''}`}
      >
        {formatScoreValue(score, language)}
      </div>

      <div className="player-card__latest">
        <span className="muted-dark" style={{ fontSize: '0.78rem' }}>
          {latestRoundScore === null ? t('No rounds yet') : t('Last round')}
        </span>
        {latestRoundScore !== null && (
          <span className={`delta ${deltaClass}`}>
            {formatSignedScoreValue(latestRoundScore, language)}
          </span>
        )}
      </div>

      <div className="progress">
        <div
          className="progress__track"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={t('{{name}} progress toward {{score}} points', {
            name: player.name,
            score: number(targetScore),
          })}
        >
          <div className="progress__fill" style={{ width: `${progress}%` }} />
        </div>
        <p className="progress__label">
          {reachedTarget
            ? t('Target reached ({{score}})', { score: number(targetScore) })
            : `${formatScoreValue(Math.max(0, targetUnits - score), language)} ${t('to go')}`}
        </p>
      </div>
    </article>
  );
}
