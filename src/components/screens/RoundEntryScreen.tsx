import { useMemo, useState } from 'react';
import { ArrowLeft, TriangleAlert } from 'lucide-react';
import type { Match, PlayerRoundEntry } from '../../types/match';
import {
  calculateRoundScore,
} from '../../lib/scoring';
import {
  parseBid,
  parseTricksWon,
  validateRound,
  type PlayerInput,
} from '../../lib/validation';
import { LanguageToggle, useLanguage } from '../../LanguageContext';
import { formatSignedScoreValue } from '../../lib/i18n';

interface RoundEntryScreenProps {
  match: Match;
  /** The round being scored (new, or an existing one being edited). */
  roundNumber: number;
  /** Existing entries when editing a saved round. */
  initialEntries?: PlayerRoundEntry[];
  /** True when editing a round of a completed match. */
  isEditing: boolean;
  onCancel: () => void;
  onSave: (entries: PlayerRoundEntry[]) => Promise<void>;
}

/**
 * Round entry — all four players on one screen with live score previews.
 *
 * Nothing is computed until it is valid, and the user's inputs are never
 * modified behind their back: invalid values are reported and the round
 * cannot be saved.
 */
export function RoundEntryScreen({
  match,
  roundNumber,
  initialEntries,
  isEditing,
  onCancel,
  onSave,
}: RoundEntryScreenProps) {
  const { language, t, number } = useLanguage();
  const initialInputs = useMemo<Record<string, { bid: string; tricksWon: string }>>(
    () => {
      const map: Record<string, { bid: string; tricksWon: string }> = {};
      for (const player of match.players) {
        const existing = initialEntries?.find((entry) => entry.playerId === player.id);
        map[player.id] = {
          bid: existing ? String(existing.bid) : '',
          tricksWon: existing ? String(existing.tricksWon) : '',
        };
      }
      return map;
    },
    [match.players, initialEntries],
  );

  const [values, setValues] = useState(initialInputs);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const inputs: PlayerInput[] = useMemo(
    () =>
      match.players.map((player) => ({
        playerId: player.id,
        playerName: player.name,
        bid: values[player.id]?.bid ?? '',
        tricksWon: values[player.id]?.tricksWon ?? '',
      })),
    [match.players, values],
  );

  const validation = useMemo(
    () =>
      validateRound(inputs, {
        expectedTrickTotal: match.expectedTrickTotal,
        enforceTrickTotal: match.enforceTrickTotal,
      }),
    [inputs, match.expectedTrickTotal, match.enforceTrickTotal],
  );

  const expectedTotal = match.expectedTrickTotal;
  const totalTricks = validation.totalTricks;
  const totalIsExact = totalTricks === expectedTotal;
  const totalProgress = expectedTotal > 0 ? Math.min(100, (totalTricks / expectedTotal) * 100) : 0;

  const issueFor = (playerId: string, field: 'bid' | 'tricksWon') =>
    validation.fieldIssues.find(
      (issue) => issue.playerId === playerId && issue.field === field,
    )?.message;

  /** Live score preview for one player, or null when the input is incomplete. */
  const previewFor = (playerId: string): number | null => {
    const input = inputs.find((entry) => entry.playerId === playerId);
    if (!input) return null;
    const bid = parseBid(input.bid);
    const tricks = parseTricksWon(input.tricksWon);
    if (bid === null || tricks === null) return null;
    return calculateRoundScore(bid, tricks);
  };

  const handleChange = (playerId: string, field: 'bid' | 'tricksWon', raw: string) => {
    // Accept digits and optional leading minus for bids.
    if (field === 'bid') {
      // Allow minus sign only as first character, keep digits only
      let cleaned = raw;
      if (cleaned.startsWith('-')) {
        cleaned = '-' + cleaned.slice(1).replace(/[^0-9]/g, '');
      } else {
        cleaned = raw.replace(/[^0-9]/g, '');
      }
      // Limit to reasonable bid range (1-13 or -1 to -13)
      if (!/^-?\d+$/.test(cleaned)) cleaned = raw.replace(/[^0-9]/g, '');
      setValues((current) => ({
        ...current,
        [playerId]: {
          ...(current[playerId] ?? { bid: '', tricksWon: '' }),
          [field]: cleaned,
        },
      }));
    } else {
      // tricks-won: accept only digits
      const cleaned = raw.replace(/[^0-9]/g, '').slice(0, 2);
      setValues((current) => ({
        ...current,
        [playerId]: {
          ...(current[playerId] ?? { bid: '', tricksWon: '' }),
          [field]: cleaned,
        },
      }));
    }
  };
  const handleSave = async () => {
    if (!validation.valid || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      const entries: PlayerRoundEntry[] = match.players.map((player) => {
        const input = inputs.find((entry) => entry.playerId === player.id)!;
        const bid = parseBid(input.bid)!;
        const tricksWon = parseTricksWon(input.tricksWon)!;
        return {
          playerId: player.id,
          bid,
          tricksWon,
          roundScore: calculateRoundScore(bid, tricksWon),
        };
      });
      await onSave(entries);
    } catch (cause) {
      setSaveError(
        cause instanceof Error ? t(cause.message) : t('Could not save this round.'),
      );
      setSaving(false);
    }
  };

  return (
    <div className="screen--light">
      <header className="topbar topbar--light">
        <button
          type="button"
          className="icon-btn"
          onClick={onCancel}
          aria-label={t('Cancel')}
          disabled={saving}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="topbar__title">
          {isEditing
            ? t('Edit Round {{number}}', { number: number(roundNumber) })
            : t('Round {{number}}', { number: number(roundNumber) })}
          <span className="topbar__sub">
            {t('Target {{score}} points', { score: number(match.targetScore) })}
          </span>
        </h1>
        <LanguageToggle />
      </header>

      <main className="screen-inner">
        {saveError && (
          <div className="form-error" role="alert">
            {t(saveError)}
          </div>
        )}

        {isEditing && (
          <div className="notice notice--info" style={{ marginBottom: 16 }}>
            {t('Editing this round recalculates every later round, the standings and the result.')}
          </div>
        )}

        <div className="entry-list">
          {match.players.map((player) => {
            const preview = previewFor(player.id);
            const bidIssue = issueFor(player.id, 'bid');
            const tricksIssue = issueFor(player.id, 'tricksWon');
            const rowInvalid = Boolean(bidIssue || tricksIssue);

            return (
              <section
                key={player.id}
                className={`entry-row${rowInvalid ? ' entry-row--invalid' : ''}`}
                aria-label={`${player.name} ${t('bid and tricks won')}`}
              >
                <div className="entry-row__head">
                  <span className="player-seat" aria-hidden="true">
                    {number(player.seatIndex + 1)}
                  </span>
                  <span className="entry-row__name">{player.name}</span>
                  <span
                    className={`entry-row__score${
                      preview === null
                        ? ' entry-row__score--empty'
                        : preview > 0
                          ? ' entry-row__score--positive'
                          : preview < 0
                            ? ' entry-row__score--negative'
                            : ''
                    }`}
                    aria-live="polite"
                    aria-label={
                      preview === null
                        ? t('Round score not yet available')
                        : t('Round score {{score}}', {
                            score: formatSignedScoreValue(preview, language),
                          })
                    }
                  >
                    {preview === null ? '—' : formatSignedScoreValue(preview, language)}
                  </span>
                </div>

                <div className="entry-row__inputs">
                  <div className="entry-input">
                    <label
                      className="entry-input__label"
                      htmlFor={`bid-${player.id}`}
                    >
                      {t('Bid')}
                    </label>
                    <input
                      id={`bid-${player.id}`}
                      className="input"
                      type="number"
                      inputMode="numeric"
                      min={-13}
                      max={13}
                      step={1}
                      value={values[player.id]?.bid ?? ''}
                      onChange={(event) =>
                        handleChange(player.id, 'bid', event.target.value)
                      }
                      aria-invalid={Boolean(bidIssue)}
                      aria-describedby={bidIssue ? `bid-error-${player.id}` : undefined}
                      placeholder="-6 to 13"
                    />
                    {bidIssue && (
                      <p
                        id={`bid-error-${player.id}`}
                        className="field-error"
                        role="alert"
                      >
                        <TriangleAlert size={13} />
                        {t(bidIssue)}
                      </p>
                    )}
                  </div>

                  <div className="entry-input">
                    <label
                      className="entry-input__label"
                      htmlFor={`tricks-${player.id}`}
                    >
                      {t('Won')}
                    </label>
                    <input
                      id={`tricks-${player.id}`}
                      className="input"
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={13}
                      step={1}
                      value={values[player.id]?.tricksWon ?? ''}
                      onChange={(event) =>
                        handleChange(player.id, 'tricksWon', event.target.value)
                      }
                      aria-invalid={Boolean(tricksIssue)}
                      aria-describedby={
                        tricksIssue ? `tricks-error-${player.id}` : undefined
                      }
                      placeholder="0"
                    />
                    {tricksIssue && (
                      <p
                        id={`tricks-error-${player.id}`}
                        className="field-error"
                        role="alert"
                      >
                        <TriangleAlert size={13} />
                        {t(tricksIssue)}
                      </p>
                    )}
                  </div>
                </div>
              </section>
            );
          })}
        </div>

        <div className="total-bar">
          <div className="total-bar__head">
            <div>
              <span className="label" style={{ marginBottom: 2 }}>
                {t('Total tricks won')}
              </span>
              <span
                className={`total-bar__count ${totalIsExact ? 'total-bar__count--ok' : 'total-bar__count--bad'}`}
                aria-live="polite"
              >
                {number(totalTricks)} / {number(expectedTotal)}
              </span>
            </div>
            {validation.totalIssue && (
              <span className="field-error" style={{ marginTop: 0, maxWidth: '58%' }} role="alert">
                <TriangleAlert size={14} />
                {t(validation.totalIssue)}
              </span>
            )}
          </div>

          <div
            className="total-bar__track"
            role="progressbar"
            aria-valuenow={totalTricks}
            aria-valuemin={0}
            aria-valuemax={expectedTotal}
            aria-label={t('Total tricks won this round')}
          >
            <div
              className={`total-bar__fill ${totalIsExact ? 'total-bar__fill--ok' : 'total-bar__fill--bad'}`}
              style={{ width: `${totalProgress}%` }}
            />
          </div>

          <button
            type="button"
            className="btn btn--forest btn--lg btn--block"
            onClick={handleSave}
            disabled={!validation.valid || saving}
          >
            {saving
              ? t('Saving…')
              : isEditing
                ? t('Save Changes')
                : t('Save Round {{number}}', { number: number(roundNumber) })}
          </button>
        </div>
      </main>
    </div>
  );
}
