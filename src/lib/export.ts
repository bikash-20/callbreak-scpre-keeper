/**
 * Match export — CSV and a plain-text summary, plus native sharing.
 *
 * Exporting is strictly read-only: it never mutates the saved match.
 */

import type { Match, WinnerResult } from '../types/match';
import { getScoringRule } from './scoring';
import { cumulativeScores, evaluateWinner, rankings } from './derive';
import { formatNumber, formatScoreValue, translate, type Language } from './i18n';

function label(value: string, language: Language): string {
  return translate(value, language);
}

function formatExportScore(units: number, language: Language): string {
  return formatScoreValue(units, language);
}

/** Escapes a value for CSV output. */
export function csvCell(value: string | number): string {
  const text = String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

/** Joins CSV rows into a single string. */
export function toCsv(rows: (string | number)[][]): string {
  return rows.map((row) => row.map(csvCell).join(',')).join('\n');
}

function playerName(match: Match, playerId: string): string {
  return match.players.find((player) => player.id === playerId)?.name ?? 'Unknown';
}

/**
 * Builds a CSV export of a match.
 *
 * Layout: a metadata block, then one row per player per round with bid,
 * tricks won, round score and cumulative score after that round.
 */
export function exportMatchToCsv(match: Match, language: Language = 'en'): string {
  const rule = getScoringRule(match.scoringMode);
  const winner = evaluateWinner(match);

  const rows: (string | number)[][] = [];

  rows.push([label('Match', language), match.name]);
  rows.push([label('Target score', language), formatNumber(match.targetScore, language)]);
  rows.push([label('Scoring mode', language), label(rule.label, language)]);
  rows.push([label('Status', language), label(match.status, language)]);
  rows.push([label('Total rounds', language), formatNumber(match.rounds.length, language)]);
  rows.push([label('Created', language), match.createdAt]);
  rows.push([label('Completed', language), match.completedAt ?? '']);
  rows.push([]);

  rows.push(
    ['Round', 'Player', 'Bid', 'Tricks won', 'Round score', 'Cumulative score'].map(
      (heading) => label(heading, language),
    ),
  );

  // Cumulative totals are recomputed as we walk the rounds so each row shows
  // the standing immediately after that round.
  const running = new Map<string, number>();
  for (const player of match.players) running.set(player.id, 0);

  for (const round of match.rounds) {
    for (const entry of round.playerEntries) {
      const score = rule.scoreRound(entry.bid, entry.tricksWon);
      const cumulative = (running.get(entry.playerId) ?? 0) + score;
      running.set(entry.playerId, cumulative);
      rows.push([
        formatNumber(round.roundNumber, language),
        playerName(match, entry.playerId),
        formatNumber(entry.bid, language),
        formatNumber(entry.tricksWon, language),
        formatExportScore(score, language),
        formatExportScore(cumulative, language),
      ]);
    }
  }

  rows.push([]);
  rows.push(['Final standings', 'Rank', 'Score'].map((heading) => label(heading, language)));
  const finalRanks = rankings(match);
  for (const row of finalRanks) {
    rows.push([
      playerName(match, row.playerId),
      formatNumber(row.rank, language),
      formatExportScore(row.score, language),
    ]);
  }

  rows.push([]);
  rows.push([label('Result', language), describeResult(match, winner, language)]);

  return toCsv(rows);
}

/**
 * A short human-readable description of the match outcome.
 */
export function describeResult(
  match: Match,
  winner: WinnerResult | null,
  language: Language = 'en',
): string {
  if (!winner) {
    return translate('No winner — target of {{score}} points was not reached.', language, {
      score: formatNumber(match.targetScore, language),
    });
  }
  if (winner.isTie) {
    const names = winner.winnerIds.map((id) => playerName(match, id)).join(' & ');
    return translate('Tie between {{names}} at {{score}} points.', language, {
      names,
      score: formatScoreValue(winner.topScore, language),
    });
  }
  const name = playerName(match, winner.winnerIds[0] ?? '');
  return translate('{{name}} wins with {{score}} points.', language, {
    name,
    score: formatScoreValue(winner.topScore, language),
  });
}

/**
 * Builds a plain-text summary of a match — readable in any chat app.
 */
export function exportMatchToText(match: Match, language: Language = 'en'): string {
  const rule = getScoringRule(match.scoringMode);
  const winner = evaluateWinner(match);
  const finalRanks = rankings(match);
  const totals = cumulativeScores(match);

  const lines: string[] = [];
  lines.push(`*${language === 'en' ? match.name.toUpperCase() : match.name}*`);
  lines.push(
    translate('Target: {{score}} points · {{rule}}', language, {
      score: formatNumber(match.targetScore, language),
      rule: label(rule.label, language),
    }),
  );
  lines.push('');

  lines.push(label('*Final standings*', language));
  for (const row of finalRanks) {
    const marker = row.rank === 1 ? '★ ' : `${formatNumber(row.rank, language)}. `;
    lines.push(`${marker}${playerName(match, row.playerId)} — ${formatScoreValue(row.score, language)}`);
  }

  lines.push('');
  lines.push(
    translate('*Result:* {{result}}', language, {
      result: describeResult(match, winner, language),
    }),
  );
  lines.push(
    translate('*Rounds played:* {{count}}', language, {
      count: formatNumber(match.rounds.length, language),
    }),
  );

  if (match.rounds.length > 0) {
    lines.push('');
    lines.push(label('*Round by round*', language));
    const running = new Map<string, number>();
    for (const player of match.players) running.set(player.id, 0);

    for (const round of match.rounds) {
      const parts: string[] = [];
      for (const entry of round.playerEntries) {
        const score = rule.scoreRound(entry.bid, entry.tricksWon);
        const cumulative = (running.get(entry.playerId) ?? 0) + score;
        running.set(entry.playerId, cumulative);
        parts.push(
          `${playerName(match, entry.playerId)} ${formatNumber(entry.bid, language)}/${formatNumber(entry.tricksWon, language)} (${formatScoreValue(score, language)})`,
        );
      }
      lines.push(
        translate('R{{number}}: {{parts}}', language, {
          number: formatNumber(round.roundNumber, language),
          parts: parts.join(' · '),
        }),
      );
    }
  }

  lines.push('');
  lines.push(
    translate('_Final totals — {{totals}}_', language, {
      totals: finalRanks
        .map((row) => `${playerName(match, row.playerId)} ${formatScoreValue(totals.get(row.playerId) ?? 0, language)}`)
        .join(', '),
    }),
  );

  return lines.join('\n');
}

/** Builds a filename-safe slug from a match name. */
export function exportFileBaseName(match: Match): string {
  const slug = match.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return slug || 'callbreak-match';
}

export type ExportFormat = 'csv' | 'text';

export interface ExportResult {
  /** True when the file was handed to the native share sheet. */
  shared: boolean;
  /** True when the file was downloaded instead. */
  downloaded: boolean;
}

/**
 * Shares the export through the device's native share sheet, falling back
 * to a file download where sharing is unavailable (desktop Firefox, older
 * Safari, or a browser that refuses to share this payload).
 *
 * Must be invoked from a user gesture.
 */
export async function shareExport(
  match: Match,
  format: ExportFormat,
  language: Language = 'en',
): Promise<ExportResult> {
  const isCsv = format === 'csv';
  const content = isCsv
    ? exportMatchToCsv(match, language)
    : exportMatchToText(match, language);
  const mime = isCsv ? 'text/csv' : 'text/plain';
  const extension = isCsv ? 'csv' : 'txt';
  const filename = `${exportFileBaseName(match)}.${extension}`;

  const file = new File([content], filename, { type: mime });

  const canShareFiles =
    typeof navigator !== 'undefined' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [file] }) &&
    typeof navigator.share === 'function';

  if (canShareFiles) {
    try {
      await navigator.share({ files: [file], title: match.name });
      return { shared: true, downloaded: false };
    } catch (error) {
      // A user cancelling the share sheet is not an error worth surfacing.
      if (error instanceof DOMException && error.name === 'AbortError') {
        return { shared: false, downloaded: false };
      }
      // Any other share failure falls through to the download path.
    }
  }

  downloadFile(filename, content, mime);
  return { shared: false, downloaded: true };
}

/**
 * Triggers a download of the given text content.
 */
export function downloadFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  // Give the browser a moment to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
