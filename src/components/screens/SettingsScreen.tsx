import { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  Moon,
  Share,
  Smartphone,
  Sun,
  Trash2,
  TriangleAlert,
  X,
} from 'lucide-react';
import type { Match } from '../../types/match';
import { evaluateWinner } from '../../lib/derive';
import { validateTargetScore } from '../../lib/validation';
import { ConfirmDialog } from '../ConfirmDialog';
import { useTheme } from '../../theme/ThemeContext';
import { LanguageToggle, useLanguage } from '../../LanguageContext';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';

interface SettingsScreenProps {
  match: Match;
  onBack: () => void;
  onSave: (match: Match) => Promise<void>;
  onDelete: () => Promise<void>;
}

/**
 * Match settings: rename, target score, trick rules, theme, language,
 * and PWA install management & banner toggle.
 */
export function SettingsScreen({
  match,
  onBack,
  onSave,
  onDelete,
}: SettingsScreenProps) {
  const { mode, setMode } = useTheme();
  const { language, setLanguage, t, number } = useLanguage();
  const {
    state: installState,
    install,
    dismiss,
    showBanner,
    dismissed,
  } = useInstallPrompt();

  const [name, setName] = useState(match.name);
  const [target, setTarget] = useState(String(match.targetScore));
  const [enforceTotal, setEnforceTotal] = useState(match.enforceTrickTotal);
  const [expectedTotal, setExpectedTotal] = useState(
    String(match.expectedTrickTotal),
  );
  const [confirmTarget, setConfirmTarget] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [installing, setInstalling] = useState(false);

  const targetError = validateTargetScore(target);
  const newTarget = Number(target) || match.targetScore;
  const totalValue = Number(expectedTotal);
  const totalError =
    enforceTotal &&
    (!Number.isInteger(totalValue) || totalValue < 0 || totalValue > 13)
      ? t('Expected total must be a whole number between 0 and 13')
      : null;

  const targetChanged = newTarget !== match.targetScore;

  const targetWarning = (() => {
    if (!targetChanged) return null;
    const winner = evaluateWinner(match);
    if (winner) {
      return t(
        'This match is already complete. Changing the target will re-evaluate the result.',
      );
    }
    const projected = { ...match, targetScore: newTarget };
    const newWinner = evaluateWinner(projected);
    if (newWinner) {
      const winnerName = match.players.find(
        (p) => p.id === newWinner.winnerIds[0],
      )?.name;
      return t(
        'The current standings already meet {{score}} points, so this match would end immediately with {{name}} winning.',
        {
          score: number(newTarget),
          name: winnerName ?? '',
        },
      );
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
        expectedTrickTotal: Number.isInteger(totalValue)
          ? totalValue
          : match.expectedTrickTotal,
        updatedAt: now,
      });
      setConfirmTarget(false);
    } catch (cause) {
      setError(
        cause instanceof Error ? t(cause.message) : t('Could not save settings.'),
      );
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
      setError(
        cause instanceof Error
          ? t(cause.message)
          : t('Could not delete this match.'),
      );
      setConfirmDelete(false);
    }
  };

  const handleInstallClick = async () => {
    if (installState === 'can-install') {
      setInstalling(true);
      try {
        await install();
      } finally {
        setInstalling(false);
      }
    } else {
      setShowInstructions(true);
    }
  };

  const handleToggleBanner = () => {
    if (dismissed) {
      showBanner();
    } else {
      dismiss();
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

        {/* MATCH SETTINGS CARD */}
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
              aria-describedby={
                targetError ? 'settings-target-error' : undefined
              }
            />
            {targetError && (
              <p id="settings-target-error" className="field-error" role="alert">
                <TriangleAlert size={14} />
                {t(targetError)}
              </p>
            )}
          </div>

          <div className="setting-row">
            <div>
              <label
                className="setting-row__label"
                htmlFor="enforce-total-switch"
              >
                {t('Enforce trick total')}
              </label>
              <p className="setting-row__hint">
                {t(
                  'Standard Callbreak deals 13 tricks each round, so the four trick counts must add up to 13. Turn this off for house-rule variants.',
                )}
              </p>
            </div>
            <button
              id="enforce-total-switch"
              type="button"
              role="switch"
              aria-checked={enforceTotal}
              className="switch"
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
                aria-describedby={
                  totalError ? 'settings-total-error' : undefined
                }
              />
              {totalError && (
                <p
                  id="settings-total-error"
                  className="field-error"
                  role="alert"
                >
                  <TriangleAlert size={14} />
                  {t(totalError)}
                </p>
              )}
            </div>
          )}
        </section>

        {/* PWA INSTALLATION CARD */}
        <section className="card" style={{ marginBottom: 18 }}>
          <h2 className="card__title">{t('App Installation')}</h2>

          <div className="install-status-row">
            <div className="install-status-icon">
              <Smartphone size={22} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 650, fontSize: '0.95rem' }}>
                  Callbreak Scorekeeper
                </span>
                {installState === 'installed' ? (
                  <span className="badge-installed">
                    <CheckCircle2 size={12} /> {t('Installed as Web App')}
                  </span>
                ) : (
                  <span className="badge-ready">
                    {installState === 'can-install'
                      ? t('Ready to install')
                      : t('Offline Ready')}
                  </span>
                )}
              </div>
              <p className="setting-row__hint" style={{ marginTop: 4 }}>
                {installState === 'installed'
                  ? t(
                      'Running standalone on your device. Works completely offline.',
                    )
                  : t(
                      'Install Callbreak on your device for quick offline access.',
                    )}
              </p>
            </div>
          </div>

          {installState !== 'installed' && (
            <div style={{ marginTop: 14 }}>
              <button
                type="button"
                className="btn btn--primary btn--block"
                onClick={handleInstallClick}
                disabled={installing}
              >
                <Download size={16} />
                <span>
                  {installing
                    ? t('Working…')
                    : installState === 'can-install'
                      ? t('Install App')
                      : installState === 'ios-instructions'
                        ? t('How to Install')
                        : t('Installation Guide')}
                </span>
              </button>
            </div>
          )}

          <div className="setting-row" style={{ marginTop: 14 }}>
            <div>
              <label
                className="setting-row__label"
                htmlFor="banner-toggle-switch"
              >
                {t('Show install banner')}
              </label>
              <p className="setting-row__hint">
                {t(
                  'Display the install banner at the bottom of the screen.',
                )}
              </p>
            </div>
            <button
              id="banner-toggle-switch"
              type="button"
              role="switch"
              aria-checked={!dismissed}
              className="switch"
              onClick={handleToggleBanner}
            />
          </div>
        </section>

        {/* APPEARANCE CARD */}
        <section className="card" style={{ marginBottom: 18 }}>
          <h2 className="card__title">{t('Appearance')}</h2>

          <div className="setting-row">
            <div>
              <span className="setting-row__label">{t('Theme')}</span>
              <p className="setting-row__hint">
                {mode === 'dark' ? t('Dark theme') : t('Light theme')}
              </p>
            </div>
            <button
              type="button"
              className="chip"
              onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
              aria-label={t(
                mode === 'dark' ? 'Switch to light' : 'Switch to dark',
              )}
            >
              {mode === 'dark' ? (
                <>
                  <Sun size={15} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                  {t('Light')}
                </>
              ) : (
                <>
                  <Moon size={15} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                  {t('Dark')}
                </>
              )}
            </button>
          </div>

          <div className="setting-row">
            <div>
              <span className="setting-row__label">{t('Language')}</span>
              <p className="setting-row__hint">
                {language === 'bn' ? 'বাংলা' : 'English'}
              </p>
            </div>
            <button
              type="button"
              className="chip"
              onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
            >
              {language === 'en' ? 'বাংলা' : 'English'}
            </button>
          </div>
        </section>

        {/* DATA & DANGER CARD */}
        <section className="card" style={{ marginBottom: 24 }}>
          <h2 className="card__title">{t('Data')}</h2>
          <p className="muted" style={{ fontSize: '0.86rem', lineHeight: 1.5 }}>
            {t(
              "Matches are stored only on this device. Clearing your browser's site data, or uninstalling the app, will permanently erase them.",
            )}
          </p>
          <button
            type="button"
            className="btn btn--danger btn--block"
            onClick={() => setConfirmDelete(true)}
            style={{ marginTop: 16 }}
          >
            <Trash2 size={16} />
            {t('Delete this match')}
          </button>
        </section>

        {/* PRIMARY SAVE BUTTON */}
        <button
          type="button"
          className="btn btn--forest btn--lg btn--block"
          onClick={handleSave}
          disabled={Boolean(targetError || totalError || busy)}
          style={{ marginBottom: 20 }}
        >
          {busy ? t('Saving…') : t('Save Settings')}
        </button>

        {/* CONFIRM TARGET CHANGE MODAL */}
        <ConfirmDialog
          open={confirmTarget}
          title={t('Change Target')}
          message={
            targetWarning ??
            t(
              'The target will change from {{oldScore}} to {{newScore}} points. Existing rounds are kept, and the result is re-evaluated.',
              {
                oldScore: number(match.targetScore),
                newScore: number(newTarget),
              },
            )
          }
          confirmLabel={t('Confirm')}
          cancelLabel={t('Cancel')}
          onConfirm={handleSave}
          onCancel={() => setConfirmTarget(false)}
        />

        {/* CONFIRM DELETE MODAL */}
        <ConfirmDialog
          open={confirmDelete}
          title={t('Delete this match?')}
          message={t(
            '{{count}} of its rounds will be permanently deleted from this device. This cannot be undone.',
            { count: number(match.rounds.length) },
          )}
          confirmLabel={t('Delete Match')}
          cancelLabel={t('Cancel')}
          destructive
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />

        {/* INSTRUCTIONS MODAL */}
        {showInstructions && (
          <div
            className="install-instructions"
            onClick={() => setShowInstructions(false)}
            role="dialog"
            aria-modal="true"
          >
            <div
              className="install-instructions__modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="install-instructions__header">
                <h3>{t('Install App')}</h3>
                <button
                  type="button"
                  onClick={() => setShowInstructions(false)}
                  aria-label={t('Close dialog')}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="install-instructions__content">
                {installState === 'ios-instructions' ? (
                  <>
                    <p>
                      <strong>{t('On iOS Safari:')}</strong>
                    </p>
                    <ol>
                      <li>
                        {t('Tap the Share button')}{' '}
                        <Share
                          size={14}
                          style={{ verticalAlign: 'middle' }}
                        />
                      </li>
                      <li>{t('Scroll down and tap "Add to Home Screen"')}</li>
                      <li>{t('Tap "Add" in the top right corner')}</li>
                    </ol>
                  </>
                ) : (
                  <>
                    <p>
                      <strong>{t('On Chrome/Edge:')}</strong>
                    </p>
                    <ol>
                      <li>{t('Click the menu (3 dots) in the top right')}</li>
                      <li>
                        {t(
                          'Click "Install Callbreak Scorekeeper..." or "Add to Home screen"',
                        )}
                      </li>
                      <li>{t('Click "Install"')}</li>
                    </ol>
                    <p>
                      <strong>{t('On Firefox:')}</strong>
                    </p>
                    <ol>
                      <li>{t('Click the menu (3 lines)')}</li>
                      <li>{t('Click "Install" or "Add to Home Screen"')}</li>
                    </ol>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
