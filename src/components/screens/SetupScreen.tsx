import { useMemo, useState } from 'react';
import { ArrowLeft, Check, TriangleAlert } from 'lucide-react';
import type { Match, Player } from '../../types/match';
import { PLAYER_COUNT, SCHEMA_VERSION } from '../../types/match';
import {
  validatePlayerNames,
  validateTargetScore,
} from '../../lib/validation';
import { LanguageToggle, useLanguage } from '../../LanguageContext';

const DEFAULT_NAMES = ['Joy', 'Bikash', 'Plabon', 'Sumon'];
const TARGET_PRESETS = [50, 100, 150];

interface SetupScreenProps {
  onCancel: () => void;
  onCreate: (match: Match) => Promise<void>;
}

/**
 * Match setup: four editable player names, a target score (preset or custom)
 * and an optional match name.
 */
export function SetupScreen({ onCancel, onCreate }: SetupScreenProps) {
  const { language, t, number } = useLanguage();
  const [names, setNames] = useState<string[]>(() => [...DEFAULT_NAMES]);
  const [matchName, setMatchName] = useState('');
  const [targetPreset, setTargetPreset] = useState<number | null>(100);
  const [customTarget, setCustomTarget] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const players = useMemo<Player[]>(
    () =>
      names.slice(0, PLAYER_COUNT).map((name, index) => ({
        id: `p${index + 1}`,
        name: name.trim(),
        seatIndex: index,
      })),
    [names],
  );

  const nameIssues = useMemo(
    () => validatePlayerNames(players.map((p) => ({ id: p.id, name: p.name }))),
    [players],
  );

  const hasEmptyName = Object.values(nameIssues).some(
    (issue) => issue === 'Name is required',
  );
  const hasDuplicateName = Object.values(nameIssues).some(
    (issue) => issue === 'Duplicate player name',
  );

  const targetValue = targetPreset !== null ? String(targetPreset) : customTarget;
  const targetError = validateTargetScore(targetValue);

  const canSubmit = !hasEmptyName && !targetError && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setFormError(null);
    try {
      const now = new Date().toISOString();
      const finalTarget = Number(targetValue);
      const match: Match = {
        id: `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
        name: matchName.trim() || `${t('Match')} ${new Date().toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US')}`,
        players,
        targetScore: finalTarget,
        scoringMode: 'standard',
        status: 'active',
        rounds: [],
        createdAt: now,
        updatedAt: now,
        completedAt: null,
        schemaVersion: SCHEMA_VERSION,
        enforceTrickTotal: true,
        expectedTrickTotal: 13,
      };
      await onCreate(match);
    } catch (cause) {
      setFormError(
        cause instanceof Error
          ? cause.message
          : t('Could not start this match. Please try again.'),
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="screen--light">
      <header className="topbar topbar--light">
        <button
          type="button"
          className="icon-btn"
          onClick={onCancel}
          aria-label={t('Back to match list')}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="topbar__title">{t('New Match')}</h1>
        <LanguageToggle />
      </header>

      <main className="screen-inner">
        {formError && (
          <div className="form-error" role="alert">
            {t(formError)}
          </div>
        )}

        <section className="card" style={{ marginBottom: 18 }}>
          <h2 className="card__title">{t('Players')}</h2>
          <div className="setup-grid">
            {names.map((name, index) => {
              const issue = nameIssues[`p${index + 1}`];
              const isError = issue === 'Name is required';
              return (
                <div key={index} className="field" style={{ marginBottom: 0 }}>
                  <label className="label" htmlFor={`player-${index}`}>
                    <span
                      className="player-seat"
                      style={{ marginRight: 8, verticalAlign: 'middle' }}
                      aria-hidden="true"
                    >
                      {number(index + 1)}
                    </span>
                    {t('Player {{number}}', { number: number(index + 1) })}
                  </label>
                  <input
                    id={`player-${index}`}
                    className="input"
                    type="text"
                    value={name}
                    maxLength={24}
                    autoComplete="off"
                    onChange={(event) => {
                      const next = [...names];
                      next[index] = event.target.value;
                      setNames(next);
                    }}
                    aria-invalid={isError}
                    aria-describedby={
                      issue ? `player-${index}-issue` : undefined
                    }
                  />
                  {issue && (
                    <p
                      id={`player-${index}-issue`}
                      className={isError ? 'field-error' : 'field-warning'}
                    >
                      {isError ? <TriangleAlert size={14} /> : <TriangleAlert size={14} />}
                      {t(issue)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          {hasDuplicateName && (
            <p
              className="field-warning"
              style={{ marginTop: 12 }}
              role="status"
            >
              <TriangleAlert size={14} />
              {t('Two players share a name. You can continue, but check it is not a typo.')}
            </p>
          )}
        </section>

        <section className="card" style={{ marginBottom: 18 }}>
          <h2 className="card__title">{t('Target Score')}</h2>
          <div className="target-options">
            {TARGET_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                className="chip"
                aria-pressed={targetPreset === preset}
                onClick={() => {
                  setTargetPreset(preset);
                  setCustomTarget('');
                }}
              >
                {targetPreset === preset && <Check size={14} aria-hidden="true" />}
                {number(preset)}
              </button>
            ))}
            <button
              type="button"
              className="chip"
              aria-pressed={targetPreset === null}
              onClick={() => {
                setTargetPreset(null);
                setCustomTarget('');
              }}
            >
              {targetPreset === null && <Check size={14} aria-hidden="true" />}
              {t('Custom')}
            </button>
          </div>

          <div className="field" style={{ marginBottom: 0 }}>
            <label className="label" htmlFor="target-score">
              {t('Target score (points)')}
            </label>
            <input
              id="target-score"
              className="input num"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={targetValue}
              disabled={targetPreset !== null}
              onChange={(event) => {
                setTargetPreset(null);
                setCustomTarget(event.target.value);
              }}
              aria-invalid={Boolean(targetError)}
              aria-describedby={targetError ? 'target-error' : undefined}
            />
            {targetError && (
              <p id="target-error" className="field-error" role="alert">
                <TriangleAlert size={14} />
                {t(targetError)}
              </p>
            )}
          </div>
        </section>

        <section className="card" style={{ marginBottom: 22 }}>
          <h2 className="card__title">{t('Match name (optional)')}</h2>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="label" htmlFor="match-name">
              {t('Name')}
            </label>
            <input
              id="match-name"
              className="input"
              type="text"
              value={matchName}
              maxLength={48}
              placeholder={`${t('Match')} ${new Date().toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US')}`}
              onChange={(event) => setMatchName(event.target.value)}
            />
          </div>
        </section>

        <button
          type="button"
          className="btn btn--forest btn--lg btn--block"
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          {submitting ? t('Starting…') : t('Start Match')}
        </button>

        <p className="muted" style={{ fontSize: '0.8rem', marginTop: 14, textAlign: 'center' }}>
          {t('Matches are saved on this device only. Clearing browser data will erase them.')}
        </p>
      </main>
    </div>
  );
}
