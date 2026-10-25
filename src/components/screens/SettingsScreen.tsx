import { useState } from 'react';
import { ArrowLeft, Moon, Sun, TriangleAlert } from 'lucide-react';
import type { Match } from '../../types/match';
import { evaluateWinner } from '../../lib/derive';
import { validateTargetScore } from '../../lib/validation';
import { ConfirmDialog } from '../ConfirmDialog';
import { useTheme } from '../../theme/ThemeContext';
import { LanguageToggle, useLanguage } from '../../LanguageContext';

interface SettingsScreenProps {
  match: Match;
  onBack: () => void;
  onSave: (match: Match) => Promise<void>;
  onDelete: () => Promise<void>;
}

/**
 * Match settings: rename, change the target score, adjust the trick-total
 * rule, switch theme and delete the match.
 */
export function SettingsScreen({ match, onBack, onSave, onDelete }: SettingsScreenProps) {
  const { mode, setMode } = useTheme();
  const { language, setLanguage, t, number } = useLanguage();
  const [name, setName] = useState(match.name);
  const [target, setTarget] = useState(String(match.targetScore));
  const [enforceTotal, setEnforceTotal] = useState(match.enforceTrickTotal);
  const [expectedTotal, setExpectedTotal] = useState(String(match.expectedTrickTotal));
  const [confirmTarget, setConfirmTarget] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const targetError = validateTargetScore(target);
  const newTarget = Number(target) || match.targetScore;
  const totalValue = Number(expectedTotal);
  const totalError =
    enforceTotal && (!Number.isInteger(totalValue) || totalValue < 0 || totalValue > 13)
      ? t('Expected total must be a whole number between 0 and 13')
      : null;

  const targetChanged = newTarget !== match.targetScore;

  /**
   * Changing the target can immediately finish the match, so we say so
   * explicitly before applying it.
   */
  const targetWarning = (() => {
    if (!targetChanged) return null;
    const winner = evaluateWinner(match);
    if (winner) {
      return t('This match is already complete. Changing the target will re-evaluate the result.');
    }
    // Would the current standings already meet the new target?
    const projected = { ...match, targetScore: newTarget };
    const newWinner = evaluateWinner(projected);
    if (newWinner) {
      const name = match.players.find((p) => p.id === newWinner.winnerIds[0])?.name;
      return t('The current standings already meet {{score}} points, so this match would end immediately with {{name}} winning.', {
        score: number(newTarget),
        name: name ?? '',
      });
    }
    return null;
  })();

  const handleSave = async () => {
    if (targetError || totalError || busy) return;
    if (targetChanged && targetWarning && !confirmTarget) {
      setConfirmTarget(true);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const now = new Date().toISOString();
      await onSave({
        ...match,
        name: name.trim() || match.name,
        targetScore: newTarget,
        enforceTrickTotal: enforceTotal,
        expectedTrickTotal: Number.isInteger(totalValue) ? totalValue : match.expectedTrickTotal,
        updatedAt: now,
      });
      setConfirmTarget(false);
    } catch (cause) {
      setError(cause instanceof Error ? t(cause.message) : t('Could not save settings.'));
      setConfirmTarget(false);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setError(null);
    try {
      await onDelete();
      setConfirmDelete(false);
    } catch (cause) {
      setError(cause instanceof Error ? t(cause.message) : t('Could not delete this match.'));
      setConfirmDelete(false);
    }
  };

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
        <h1 className="topbar__title">{t('Match Settings')}</h1>
        <LanguageToggle />
      </header>

      <main className="screen-inner">
        {error && (
          <div className="form-error" role="alert">
            {t(error)}
          </div>
        )}

        <section className="card" style={{ marginBottom: 18 }}>
          <h2 className="card__title">{t('Match')}</h2>

          <div className="field">
            <label className="label" htmlFor="settings-name">
              {t('Match name')}
            </label>
            <input
              id="settings-name"
              className="input"
              type="text"
              value={name}
              maxLength={48}
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          <div className="field">
            <label className="label" htmlFor="settings-target">
              {t('Target score (points)')}
            </label>
            <input
              id="settings-target"
              className="input num"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={target}
              onChange={(event) => setTarget(event.target.value)}
              aria-invalid={Boolean(targetError)}
              aria-describedby={targetError ? 'settings-target-error' : undefined}
            />
            {targetError && (
              <p id="settings-target-error" className="field-error" role="alert">
                <TriangleAlert size={14} />
                {t(targetError)}
              </p>
            )}
          </div>

          <div className="setting-row">
            <div style={{ flex: 1 }}>
              <div className="setting-row__label">{t('Enforce trick total')}</div>
              <div className="setting-row__hint">
                {t('Standard Callbreak deals 13 tricks each round, so the four trick counts must add up to 13. Turn this off for house-rule variants.')}
              </div>
            </div>
            <button
              type="button"
              className="switch"
              role="switch"
              aria-checked={enforceTotal}
              aria-label={t('Enforce trick total')}
              onClick={() => setEnforceTotal((current) => !current)}
            />
          </div>

          {enforceTotal && (
            <div className="field" style={{ marginTop: 14 }}>
              <label className="label" htmlFor="settings-expected-total">
                {t('Expected total tricks')}
              </label>
              <input
                id="settings-expected-total"
                className="input num"
                type="number"
                inputMode="numeric"
                min={0}
                max={13}
                step={1}
                value={expectedTotal}
                onChange={(event) => setExpectedTotal(event.target.value)}
                aria-invalid={Boolean(totalError)}
                aria-describedby={totalError ? 'settings-total-error' : undefined}
              />
              {totalError && (
                <p id="settings-total-error" className="field-error" role="alert">
                  <TriangleAlert size={14} />
                  {t(totalError)}
                </p>
              )}
            </div>
          )}
        </section>

        <section className="card" style={{ marginBottom: 18 }}>
          <h2 className="card__title">{t('Appearance')}</h2>
          <div className="setting-row">
            <div style={{ flex: 1 }}>
              <div className="setting-row__label">{t('Theme')}</div>
              <div className="setting-row__hint">
                {t(mode === 'light' ? 'Light theme' : 'Dark theme')}
              </div>
            </div>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}
            >
              {mode === 'light' ? <Moon size={16} aria-hidden="true" /> : <Sun size={16} aria-hidden="true" />}
              {t('Switch to {{theme}} theme', {
                theme: t(mode === 'light' ? 'dark' : 'light'),
              })}
            </button>
          </div>
          <div className="setting-row">
            <div style={{ flex: 1 }}>
              <div className="setting-row__label">{t('Language')}</div>
              <div className="setting-row__hint">
                {t(language === 'bn' ? 'Bengali' : 'English')}
              </div>
            </div>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
              aria-label={t(language === 'en' ? 'Language: Bengali' : 'Language: English')}
            >
              {t(language === 'en' ? 'Bengali' : 'English')}
            </button>
          </div>
        </section>

        <section className="card" style={{ marginBottom: 22 }}>
          <h2 className="card__title">{t('Data')}</h2>
          <div className="notice notice--danger" style={{ marginBottom: 16 }}>
            {t("Matches are stored only on this device. Clearing your browser's site data, or uninstalling the app, will permanently erase them.")}
          </div>
          <button
            type="button"
            className="btn btn--danger btn--block"
            onClick={() => setConfirmDelete(true)}
          >
            {t('Delete this match')}
          </button>
        </section>

        <section className="card" style={{ marginBottom: 22 }}>
          <h2 className="card__title">{t('About')}</h2>
          <div className="setting-row" style={{ marginBottom: 16 }}>
            <span className="setting-row__label" style={{ color: 'var(--ink)', fontWeight: 600 }}>
              Developed by
            </span>
            <span className="setting-row__value shimmer" style={{ color: 'var(--gold)', fontFamily: 'inherit', userSelect: 'none' }}>
              bikash talukder
            </span>
          </div>
          <div className="setting-row" style={{ marginBottom: 16 }}>
            <span className="setting-row__label" style={{ color: 'var(--ink)', fontWeight: 600 }}>
              Version
            </span>
            <span className="setting-row__value" style={{ color: 'var(--ink-soft)' }}>
              2.0.0
            </span>
          </div>
        </section>

        <button
          type="button"
          className="btn btn--forest btn--lg btn--block"
          onClick={handleSave}
          disabled={Boolean(targetError || totalError) || busy}
        >
          {busy ? t('Saving…') : t('Save Settings')}
        </button>

        {targetChanged && (
          <p className="muted" style={{ fontSize: '0.82rem', marginTop: 12, textAlign: 'center' }}>
            {t('The target score has changed. Save to apply it.')}
          </p>
        )}
      </main>

      {confirmTarget && (
        <ConfirmDialog
          title={t('Change the target score?')}
          body={
            <>
              {targetWarning && (
                <div className="notice" style={{ marginBottom: 12 }}>
                  <TriangleAlert size={14} /> {targetWarning}
                </div>
              )}
              {t('The target will change from {{oldScore}} to {{newScore}} points. Existing rounds are kept, and the result is re-evaluated.', {
                oldScore: number(match.targetScore),
                newScore: number(newTarget),
              })}
            </>
          }
          confirmLabel={t('Change Target')}
          onConfirm={handleSave}
          onCancel={() => setConfirmTarget(false)}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title={t('Delete this match?')}
          body={
            <>
              <strong>{match.name}</strong>{' '}
              {t('{{count}} of its rounds will be permanently deleted from this device. This cannot be undone.', {
                count: number(match.rounds.length),
              })}
            </>
          }
          confirmLabel={t('Delete Match')}
          destructive
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}
