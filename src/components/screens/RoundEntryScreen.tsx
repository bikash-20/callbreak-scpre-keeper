import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Minus,
  Plus,
  Sparkles,
  TriangleAlert,
} from 'lucide-react';
import type { Match, PlayerRoundEntry } from '../../types/match';
import { calculateRoundScore } from '../../lib/scoring';
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

const COMMON_BIDS = [1, 2, 3, 4, 5, 6, 7, 8];

/**
 * Mobile-first round entry with rapid-stepper controls, one-tap "Made" shortcuts,
 * and live score previews.
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

  // In Callbreak, dealer rotates clockwise each round
  const dealerSeatIndex = (roundNumber - 1) % 4;

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
  const totalProgress =
    expectedTotal > 0 ? Math.min(100, (totalTricks / expectedTotal) * 100) : 0;
  const trickDiff = totalTricks - expectedTotal;

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

  const handleChange = (
    playerId: string,
    field: 'bid' | 'tricksWon',
    raw: string,
  ) => {
    if (field === 'bid') {
      let cleaned = raw;
      if (cleaned.startsWith('-')) {
        cleaned = '-' + cleaned.slice(1).replace(/[^0-9]/g, '');
      } else {
        cleaned = raw.replace(/[^0-9]/g, '');
      }
      if (!/^-?\d+$/.test(cleaned)) cleaned = raw.replace(/[^0-9]/g, '');
      setValues((current) => ({
        ...current,
        [playerId]: {
          ...(current[playerId] ?? { bid: '', tricksWon: '' }),
          [field]: cleaned,
        },
      }));
    } else {
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

  const stepBid = (playerId: string, delta: number) => {
    const current = parseBid(values[playerId]?.bid ?? '');
    let nextVal: number;
    if (current === null) {
      nextVal = delta > 0 ? 1 : 1;
    } else {
      nextVal = Math.min(13, Math.max(1, current + delta));
    }
    handleChange(playerId, 'bid', String(nextVal));
  };

  const stepTricks = (playerId: string, delta: number) => {
    const current = parseTricksWon(values[playerId]?.tricksWon ?? '');
    let nextVal: number;
    if (current === null) {
      nextVal = delta > 0 ? 0 : 0;
    } else {
      nextVal = Math.min(13, Math.max(0, current + delta));
    }
    handleChange(playerId, 'tricksWon', String(nextVal));
  };

  const setTricksToBid = (playerId: string) => {
    const bid = parseBid(values[playerId]?.bid ?? '');
    if (bid !== null && bid >= 0) {
      handleChange(playerId, 'tricksWon', String(bid));
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
            {t(
              'Editing this round recalculates every later round, the standings and the result.',
            )}
          </div>
        )}

        <div className="entry-list">
          {match.players.map((player) => {
            const preview = previewFor(player.id);
            const bidIssue = issueFor(player.id, 'bid');
            const tricksIssue = issueFor(player.id, 'tricksWon');
            const rowInvalid = Boolean(bidIssue || tricksIssue);
            const isDealer = player.seatIndex === dealerSeatIndex;
            const currentBid = values[player.id]?.bid ?? '';
            const currentTricks = values[player.id]?.tricksWon ?? '';
            const bidNum = parseBid(currentBid);
            const tricksNum = parseTricksWon(currentTricks);

            return (
              <section
                key={player.id}
                className={`entry-row${rowInvalid ? ' entry-row--invalid' : ''}${
                  isDealer ? ' entry-row--dealer' : ''
                }`}
                aria-label={`${player.name} ${t('bid and tricks won')}`}
              >
                <div className="entry-row__head">
                  <span className="player-seat" aria-hidden="true">
                    {number(player.seatIndex + 1)}
                  </span>
                  <div className="entry-row__player-meta">
                    <span className="entry-row__name">{player.name}</span>
                    {isDealer && (
                      <span className="dealer-badge" title={t('Dealer for this round')}>
                        <Sparkles size={11} aria-hidden="true" />
                        <span>{t('Dealer')}</span>
                      </span>
                    )}
                  </div>
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
                    {preview === null
                      ? '—'
                      : formatSignedScoreValue(preview, language)}
                  </span>
                </div>

                <div className="entry-row__inputs">
                  {/* BID INPUT WITH STEPPER */}
                  <div className="entry-input">
                    <label
                      className="entry-input__label"
                      htmlFor={`bid-${player.id}`}
                    >
                      {t('Bid')}
                    </label>
                    <div className="stepper-wrap">
                      <button
                        type="button"
                        className="stepper-btn"
                        onClick={() => stepBid(player.id, -1)}
                        disabled={bidNum !== null && bidNum <= 1}
                        aria-label={`${player.name} -1 bid`}
                      >
                        <Minus size={16} />
                      </button>
                      <input
                        id={`bid-${player.id}`}
                        className="input stepper-input"
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={13}
                        step={1}
                        value={currentBid}
                        onChange={(event) =>
                          handleChange(player.id, 'bid', event.target.value)
                        }
                        aria-invalid={Boolean(bidIssue)}
                        aria-describedby={
                          bidIssue ? `bid-error-${player.id}` : undefined
                        }
                        placeholder="1-13"
                      />
                      <button
                        type="button"
                        className="stepper-btn"
                        onClick={() => stepBid(player.id, 1)}
                        disabled={bidNum !== null && bidNum >= 13}
                        aria-label={`${player.name} +1 bid`}
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    {/* Quick bid selection chips */}
                    <div className="quick-chip-row" aria-label="Quick bid selection">
                      {COMMON_BIDS.map((n) => (
                        <button
                          key={n}
                          type="button"
                          className={`chip-xs ${
                            currentBid === String(n) ? 'chip-xs--active' : ''
                          }`}
                          onClick={() =>
                            handleChange(player.id, 'bid', String(n))
                          }
                          aria-label={`Bid ${n}`}
                        >
                          {number(n)}
                        </button>
                      ))}
                    </div>

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

                  {/* TRICKS WON INPUT WITH STEPPER */}
                  <div className="entry-input">
                    <div className="entry-input__label-row">
                      <label
                        className="entry-input__label"
                        htmlFor={`tricks-${player.id}`}
                      >
                        {t('Won')}
                      </label>
                      {bidNum !== null && bidNum > 0 && (
                        <button
                          type="button"
                          className={`chip-mini ${
                            tricksNum === bidNum ? 'chip-mini--active' : ''
                          }`}
                          onClick={() => setTricksToBid(player.id)}
                          title={t('Tap to set tricks won equal to bid')}
                        >
                          <Check size={11} aria-hidden="true" />
                          <span>
                            {t('Made')} ({number(bidNum)})
                          </span>
                        </button>
                      )}
                    </div>
                    <div className="stepper-wrap">
                      <button
                        type="button"
                        className="stepper-btn"
                        onClick={() => stepTricks(player.id, -1)}
                        disabled={tricksNum !== null && tricksNum <= 0}
                        aria-label={`${player.name} -1 trick won`}
                      >
                        <Minus size={16} />
                      </button>
                      <input
                        id={`tricks-${player.id}`}
                        className="input stepper-input"
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={13}
                        step={1}
                        value={currentTricks}
                        onChange={(event) =>
                          handleChange(player.id, 'tricksWon', event.target.value)
                        }
                        aria-invalid={Boolean(tricksIssue)}
                        aria-describedby={
                          tricksIssue ? `tricks-error-${player.id}` : undefined
                        }
                        placeholder="0"
                      />
                      <button
                        type="button"
                        className="stepper-btn"
                        onClick={() => stepTricks(player.id, 1)}
                        disabled={tricksNum !== null && tricksNum >= 13}
                        aria-label={`${player.name} +1 trick won`}
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    {/* Quick tricks chips */}
                    <div className="quick-chip-row" aria-label="Quick tricks selection">
                      {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => (
                        <button
                          key={n}
                          type="button"
                          className={`chip-xs ${
                            currentTricks === String(n) ? 'chip-xs--active' : ''
                          }`}
                          onClick={() =>
                            handleChange(player.id, 'tricksWon', String(n))
                          }
                          aria-label={`Won ${n} tricks`}
                        >
                          {number(n)}
                        </button>
                      ))}
                    </div>

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

        {/* STICKY TOTAL BAR */}
        <div className="total-bar">
          <div className="total-bar__head">
            <div>
              <span className="label" style={{ marginBottom: 2 }}>
                {t('Total tricks won')}
              </span>
              <span
                className={`total-bar__count ${
                  totalIsExact ? 'total-bar__count--ok' : 'total-bar__count--bad'
                }`}
                aria-live="polite"
              >
                {number(totalTricks)} / {number(expectedTotal)}
                {!totalIsExact && validation.fieldsValid && totalTricks > 0 && (
                  <span className="total-bar__diff">
                    ({trickDiff > 0 ? `+${number(trickDiff)} ${t('over')}` : `${number(Math.abs(trickDiff))} ${t('remaining')}`})
                  </span>
                )}
              </span>
            </div>
            {validation.totalIssue && (
              <span
                className="field-error"
                style={{ marginTop: 0, maxWidth: '58%', fontSize: '0.8rem' }}
                role="alert"
              >
                <TriangleAlert size={14} />
                {t(validation.totalIssue)}
              </span>
            )}
            {totalIsExact && (
              <span className="badge-exact" role="status">
                <Check size={14} />
                {t('Exact total ({{total}}/{{expected}})', {
                  total: number(totalTricks),
                  expected: number(expectedTotal),
                })}
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
              className={`total-bar__fill ${
                totalIsExact ? 'total-bar__fill--ok' : 'total-bar__fill--bad'
              }`}
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
