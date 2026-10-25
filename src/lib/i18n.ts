export type Language = 'en' | 'bn';

type TranslationValues = Record<string, string | number>;

const BENGALI_TRANSLATIONS: Record<string, string> = {
  'Callbreak Scorekeeper': 'কলব্রেক স্কোরকিপার',
  'New Match': 'নতুন ম্যাচ',
  'Your Matches': 'আপনার ম্যাচগুলো',
  'Stored on this device and available offline. Export important matches for a separate backup; browser storage is not guaranteed permanent.':
    'এই ডিভাইসে সংরক্ষিত এবং অফলাইনেও ব্যবহার করা যাবে। গুরুত্বপূর্ণ ম্যাচের আলাদা ব্যাকআপ রাখুন; ব্রাউজারের সংরক্ষণ স্থায়ী থাকার নিশ্চয়তা নেই।',
  'Search matches': 'ম্যাচ খুঁজুন',
  'Search by name': 'নাম দিয়ে খুঁজুন',
  'Retrying…': 'আবার চেষ্টা হচ্ছে…',
  'Retry loading matches': 'ম্যাচ লোড করতে আবার চেষ্টা করুন',
  'Loading matches…': 'ম্যাচ লোড হচ্ছে…',
  'No matches yet': 'এখনও কোনো ম্যাচ নেই',
  'Start a match to score rounds. Your matches stay on this device and work offline. Browser storage is not guaranteed permanent.':
    'রাউন্ডের স্কোর রাখতে একটি ম্যাচ শুরু করুন। ম্যাচগুলো এই ডিভাইসে থাকবে এবং অফলাইনেও চলবে। ব্রাউজারের সংরক্ষণ স্থায়ী থাকার নিশ্চয়তা নেই।',
  Active: 'চলমান',
  Completed: 'সম্পন্ন',
  completed: 'সম্পন্ন',
  'In progress': 'চলছে',
  dark: 'গাঢ়',
  light: 'হালকা',
  'Switch to {{theme}} theme': '{{theme}} থিম চালু করুন',
  round: 'রাউন্ড',
  rounds: 'রাউন্ড',
  'No matches match your search.': 'আপনার খোঁজার সঙ্গে কোনো ম্যাচ মেলেনি।',
  '{{count}} saved matches could not be read and were skipped. The rest of your matches are unaffected.':
    '{{count}}টি সংরক্ষিত ম্যাচ পড়া যায়নি, তাই সেগুলো বাদ দেওয়া হয়েছে। বাকি ম্যাচগুলো ঠিক আছে।',
  'Target {{score}}': 'লক্ষ্য {{score}}',
  'Round {{number}} for {{name}}': 'রাউন্ড {{number}} — {{name}}',
  'Tie: {{names}}': '{{names}}-এর মধ্যে সমতা',
  '{{name}} won': '{{name}} জিতেছে',
  'Round {{number}} of play': 'খেলার রাউন্ড {{number}}',
  'Target Score': 'লক্ষ্য স্কোর',
  'Target score (points)': 'লক্ষ্য স্কোর (পয়েন্ট)',
  'Player {{number}}': 'খেলোয়াড় {{number}}',
  points: 'পয়েন্ট',
  'Match name (optional)': 'ম্যাচের নাম (ঐচ্ছিক)',
  Name: 'নাম',
  Players: 'খেলোয়াড়',
  Custom: 'কাস্টম',
  'Start Match': 'ম্যাচ শুরু করুন',
  'Starting…': 'শুরু হচ্ছে…',
  'Matches are saved on this device only. Clearing browser data will erase them.':
    'ম্যাচগুলো শুধু এই ডিভাইসে সংরক্ষিত। ব্রাউজারের ডেটা মুছে ফেললে ম্যাচগুলোও মুছে যাবে।',
  'Back to match list': 'ম্যাচের তালিকায় ফিরুন',
  'Match complete': 'ম্যাচ শেষ',
  'Round history': 'রাউন্ডের ইতিহাস',
  'Match settings': 'ম্যাচের সেটিংস',
  'Target Score:': 'লক্ষ্য স্কোর:',
  'rounds of play': 'রাউন্ড খেলা হয়েছে',
  'Tie between {{names}} at {{score}} points.': '{{names}}-এর মধ্যে {{score}} পয়েন্টে সমতা।',
  '{{name}} has won with {{score}} points.': '{{name}} {{score}} পয়েন্ট নিয়ে জিতেছে।',
  'Round {{number}}': 'রাউন্ড {{number}}',
  'Enter Round {{number}}': 'রাউন্ড {{number}} লিখুন',
  'View Final Summary': 'চূড়ান্ত ফল দেখুন',
  History: 'ইতিহাস',
  Export: 'এক্সপোর্ট',
  'Saved on this device and works offline. Export important matches for a backup; browser storage is not guaranteed permanent.':
    'এই ডিভাইসে সংরক্ষিত এবং অফলাইনেও চলে। গুরুত্বপূর্ণ ম্যাচের ব্যাকআপ রাখুন; ব্রাউজারের সংরক্ষণ স্থায়ী থাকার নিশ্চয়তা নেই।',
  Leader: 'এগিয়ে',
  'rank {{rank}}': 'স্থান {{rank}}',
  '{{name}} progress toward {{score}} points': '{{score}} পয়েন্টের লক্ষ্যে {{name}}-এর অগ্রগতি',
  'No rounds yet': 'এখনও কোনো রাউন্ড নেই',
  'Last round': 'সর্বশেষ রাউন্ড',
  'Target reached ({{score}})': 'লক্ষ্যে পৌঁছেছে ({{score}})',
  'to go': 'বাকি',
  'Round History': 'রাউন্ডের ইতিহাস',
  'Scores you save will appear here, with every bid, trick count and running total.':
    'আপনার সংরক্ষিত স্কোর, প্রতিটি ডাক, জেতা কৌশল ও মোট স্কোর এখানে দেখা যাবে।',
  Player: 'খেলোয়াড়',
  Bid: 'ডাক',
  Won: 'জিতেছে',
  Round: 'রাউন্ড',
  Total: 'মোট',
  'Edit Round {{number}}': 'রাউন্ড {{number}} সম্পাদনা করুন',
  'Undo Last Round': 'সর্বশেষ রাউন্ড বাতিল করুন',
  'Editing a round recalculates every later round and the final result.':
    'কোনো রাউন্ড সম্পাদনা করলে পরের সব রাউন্ড ও চূড়ান্ত ফল আবার হিসাব হবে।',
  'Undo the last round?': 'সর্বশেষ রাউন্ড বাতিল করবেন?',
  'Round {{number}} will be removed and every total recalculated. This cannot be undone.':
    'রাউন্ড {{number}} মুছে যাবে এবং সব মোট স্কোর আবার হিসাব হবে। এটি ফিরিয়ে আনা যাবে না।',
  'Undo Round': 'রাউন্ড বাতিল',
  Back: 'ফিরে যান',
  Cancel: 'বাতিল',
  'Match Settings': 'ম্যাচের সেটিংস',
  Match: 'ম্যাচ',
  'Match name': 'ম্যাচের নাম',
  'Enforce trick total': 'মোট কৌশলের সংখ্যা মিলিয়ে নিন',
  'Standard Callbreak deals 13 tricks each round, so the four trick counts must add up to 13. Turn this off for house-rule variants.':
    'প্রচলিত কলব্রেকে প্রতি রাউন্ডে ১৩টি কৌশল থাকে, তাই চারজনের জেতা কৌশলের যোগফল ১৩ হতে হবে। ঘরোয়া নিয়মে খেললে এটি বন্ধ করুন।',
  'Expected total tricks': 'মোট কৌশলের প্রত্যাশিত সংখ্যা',
  Appearance: 'দেখতে যেমন',
  Theme: 'থিম',
  'Light theme': 'হালকা থিম',
  'Dark theme': 'গাঢ় থিম',
  'Switch to dark': 'গাঢ় থিম চালু করুন',
  'Switch to light': 'হালকা থিম চালু করুন',
  Data: 'ডেটা',
  "Matches are stored only on this device. Clearing your browser's site data, or uninstalling the app, will permanently erase them.":
    'ম্যাচগুলো শুধু এই ডিভাইসে সংরক্ষিত। ব্রাউজারের সাইট ডেটা মুছে ফেললে বা অ্যাপ আনইনস্টল করলে সেগুলো স্থায়ীভাবে মুছে যাবে।',
  'Delete this match': 'এই ম্যাচ মুছে ফেলুন',
  'Save Settings': 'সেটিংস সংরক্ষণ করুন',
  'Saving…': 'সংরক্ষণ হচ্ছে…',
  'The target score has changed. Save to apply it.':
    'লক্ষ্য স্কোর বদলেছে। পরিবর্তনটি প্রয়োগ করতে সংরক্ষণ করুন।',
  'Language': 'ভাষা',
  'Change Target': 'লক্ষ্য পরিবর্তন করুন',
  'Delete this match?': 'এই ম্যাচ মুছে ফেলবেন?',
  'Delete Match': 'ম্যাচ মুছে ফেলুন',
  '{{count}} of its rounds will be permanently deleted from this device. This cannot be undone.':
    'এর {{count}}টি রাউন্ড এই ডিভাইস থেকে স্থায়ীভাবে মুছে যাবে। এটি ফিরিয়ে আনা যাবে না।',
  Confirm: 'নিশ্চিত করুন',
  'Working…': 'কাজ চলছে…',
  'Edit Round': 'রাউন্ড সম্পাদনা করুন',
  'Target {{score}} points': 'লক্ষ্য {{score}} পয়েন্ট',
  'Editing this round recalculates every later round, the standings and the result.':
    'এই রাউন্ড সম্পাদনা করলে পরের রাউন্ড, অবস্থান ও ফল আবার হিসাব হবে।',
  'Round score not yet available': 'রাউন্ডের স্কোর এখনও পাওয়া যায়নি',
  'Round score {{score}}': 'রাউন্ডের স্কোর {{score}}',
  'bid and tricks won': 'ডাক ও জেতা কৌশল',
  'Bid is required': 'ডাকের সংখ্যা লিখুন',
  'Bid must be a whole number': 'ডাকের সংখ্যা পূর্ণসংখ্যা হতে হবে',
  'Tricks won is required': 'জেতা কৌশলের সংখ্যা লিখুন',
  'Tricks won must be a whole number': 'জেতা কৌশলের সংখ্যা পূর্ণসংখ্যা হতে হবে',
  'too many': 'বেশি',
  'too few': 'কম',
  'Total tricks won': 'জেতা কৌশলের মোট',
  'Total tricks won this round': 'এই রাউন্ডে জেতা কৌশলের মোট',
  'Save Changes': 'পরিবর্তন সংরক্ষণ করুন',
  'Save Round {{number}}': 'রাউন্ড {{number}} সংরক্ষণ করুন',
  'Match Summary': 'ম্যাচের সারাংশ',
  "IT'S A TIE!": 'সমতা!',
  'MATCH ENDED': 'ম্যাচ শেষ',
  'Tied at the top': 'শীর্ষে সমতা',
  Winner: 'বিজয়ী',
  'Final standings': 'চূড়ান্ত অবস্থান',
  TIED: 'সমতায়',
  WINNER: 'বিজয়ী',
  'Round by round': 'রাউন্ড অনুযায়ী',
  '{{count}} rounds played': '{{count}} রাউন্ড খেলা হয়েছে',
  'Target score:': 'লক্ষ্য স্কোর:',
  '{{name}} wins!': '{{name}} জিতেছে!',
  Unknown: 'অজানা',
  'Share Summary': 'সারাংশ শেয়ার করুন',
  'Download CSV': 'CSV ডাউনলোড করুন',
  'Match List': 'ম্যাচের তালিকা',
  'Summary shared.': 'সারাংশ শেয়ার করা হয়েছে।',
  'Summary downloaded.': 'সারাংশ ডাউনলোড হয়েছে।',
  'Match history downloaded as CSV.': 'ম্যাচের ইতিহাস CSV হিসেবে ডাউনলোড হয়েছে।',
  'Could not export this summary.': 'এই সারাংশ এক্সপোর্ট করা যায়নি।',
  'Could not export match history.': 'ম্যাচের ইতিহাস এক্সপোর্ট করা যায়নি।',
  'Could not save this round.': 'এই রাউন্ড সংরক্ষণ করা যায়নি।',
  'Could not undo the last round.': 'সর্বশেষ রাউন্ড বাতিল করা যায়নি।',
  'Could not start this match. Please try again.':
    'ম্যাচ শুরু করা যায়নি। আবার চেষ্টা করুন।',
  'Could not save settings.': 'সেটিংস সংরক্ষণ করা যায়নি।',
  'Could not delete this match.': 'এই ম্যাচ মুছে ফেলা যায়নি।',
  'Open a match before saving a round.': 'রাউন্ড সংরক্ষণের আগে একটি ম্যাচ খুলুন।',
  'Open a match before undoing a round.': 'রাউন্ড বাতিলের আগে একটি ম্যাচ খুলুন।',
  'The player list changed. Reopen the round and try again.':
    'খেলোয়াড়ের তালিকা বদলেছে। রাউন্ডটি আবার খুলে চেষ্টা করুন।',
  'The round is no longer valid. Reopen it and try again.':
    'রাউন্ডটি আর বৈধ নেই। আবার খুলে চেষ্টা করুন।',
  'That round no longer exists. Reopen the match history.':
    'রাউন্ডটি আর নেই। ম্যাচের ইতিহাস আবার খুলুন।',
  'Name is required': 'নাম লিখতে হবে',
  'Duplicate player name': 'একই খেলোয়াড়ের নাম একাধিকবার আছে',
  'Two players share a name. You can continue, but check it is not a typo.':
    'দুই খেলোয়াড়ের নাম একই। এগোনো যাবে, তবে বানানটি যাচাই করুন।',
  'Target score is required': 'লক্ষ্য স্কোর লিখুন',
  'Target score must be a whole number': 'লক্ষ্য স্কোর পূর্ণসংখ্যা হতে হবে',
  'Target score must be a positive number': 'লক্ষ্য স্কোর শূন্যের বেশি হতে হবে',
  'Expected total must be a whole number between 0 and 13':
    'মোট কৌশলের সংখ্যা ০ থেকে ১৩-এর মধ্যে পূর্ণসংখ্যা হতে হবে',
  'The current standings already meet {{score}} points, so this match would end immediately with {{name}} winning.':
    'বর্তমান অবস্থানেই {{score}} পয়েন্ট পূরণ হয়েছে, তাই {{name}} জিতে ম্যাচটি এখনই শেষ হবে।',
  'The target will change from {{oldScore}} to {{newScore}} points. Existing rounds are kept, and the result is re-evaluated.':
    'লক্ষ্য {{oldScore}} থেকে {{newScore}} পয়েন্ট হবে। আগের রাউন্ডগুলো থাকবে এবং ফল আবার হিসাব হবে।',
  'Export & share': 'এক্সপোর্ট ও শেয়ার',
  'This match is already complete. Changing the target will re-evaluate the result.':
    'এই ম্যাচ ইতিমধ্যে শেষ। লক্ষ্য বদলালে ফল আবার হিসাব হবে।',
  'Close dialog': 'ডায়ালগ বন্ধ করুন',
  'Language: Bengali': 'ভাষা: বাংলা',
  'Language: English': 'ভাষা: ইংরেজি',
  Bengali: 'বাংলা',
  English: 'English',
  'Target score': 'লক্ষ্য স্কোর',
  'Scoring mode': 'স্কোরের নিয়ম',
  'Status': 'অবস্থা',
  'Total rounds': 'মোট রাউন্ড',
  'Created': 'তৈরি হয়েছে',
  'Result': 'ফলাফল',
  'No winner — target of {{score}} points was not reached.':
    'কেউ জেতেনি — {{score}} পয়েন্টের লক্ষ্য পূরণ হয়নি।',
  '{{name}} wins with {{score}} points.':
    '{{name}} {{score}} পয়েন্ট নিয়ে জিতেছে।',
  'Target: {{score}} points · {{rule}}': 'লক্ষ্য: {{score}} পয়েন্ট · {{rule}}',
  '*Final standings*': '*চূড়ান্ত অবস্থান*',
  '*Result:* {{result}}': '*ফলাফল:* {{result}}',
  '*Rounds played:* {{count}}': '*খেলা রাউন্ড:* {{count}}',
  '*Round by round*': '*রাউন্ড অনুযায়ী*',
  '_Final totals — {{totals}}_': '_চূড়ান্ত মোট — {{totals}}_',
  'FINAL STANDINGS': 'চূড়ান্ত অবস্থান',
  'R{{number}}: {{parts}}': 'রাউন্ড {{number}}: {{parts}}',
  Rank: 'স্থান',
  Score: 'স্কোর',
  'Cumulative score': 'সর্বমোট স্কোর',
  'Tricks won': 'জেতা কৌশল',
  'Round score': 'রাউন্ডের স্কোর',
  'Standard Callbreak': 'প্রচলিত কলব্রেক',
  'active': 'চলমান',
};

function localizeDigits(value: string | number, language: Language): string {
  const text = String(value);
  const bengaliDigits = '০১২৩৪৫৬৭৮৯';
  return language === 'bn' ? text.replace(/\d/g, (digit) => bengaliDigits.charAt(Number(digit))) : text;
}

function translateDynamic(message: string, language: Language): string | undefined {
  if (language === 'en') return undefined;
  const capture = (match: RegExpMatchArray, index: number) => match[index] ?? '';

  let match = message.match(/^Bid must be between (\d+) and (\d+)$/);
  if (match) return `ডাকের সংখ্যা ${localizeDigits(capture(match, 1), language)} থেকে ${localizeDigits(capture(match, 2), language)}-এর মধ্যে হতে হবে`;

  match = message.match(/^Tricks won must be between (\d+) and (\d+)$/);
  if (match) return `জেতা কৌশলের সংখ্যা ${localizeDigits(capture(match, 1), language)} থেকে ${localizeDigits(capture(match, 2), language)}-এর মধ্যে হতে হবে`;

  match = message.match(/^Tricks won must total (\d+) — currently (\d+) \((\d+) (too many|too few)\)\.$/);
  if (match) {
    const direction = capture(match, 4) === 'too many' ? 'বেশি' : 'কম';
    return `জেতা কৌশলের মোট সংখ্যা ${localizeDigits(capture(match, 1), language)} হতে হবে — এখন ${localizeDigits(capture(match, 2), language)} (${localizeDigits(capture(match, 3), language)}টি ${direction})।`;
  }

  match = message.match(/^The current standings already meet (\d+) points, so this match would end immediately with (.+) winning\.$/);
  if (match) return `বর্তমান অবস্থানেই ${localizeDigits(capture(match, 1), language)} পয়েন্ট পূরণ হয়েছে, তাই ${capture(match, 2)} জিতে ম্যাচটি এখনই শেষ হবে।`;

  return undefined;
}

export function translate(
  message: string,
  language: Language,
  values: TranslationValues = {},
): string {
  if (language === 'en') {
    return message.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(values[key] ?? `{{${key}}}`));
  }

  const translated = BENGALI_TRANSLATIONS[message] ?? translateDynamic(message, language) ?? message;
  return translated.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = values[key];
    return value === undefined
      ? `{{${key}}}`
      : localizeDigits(value, language);
  });
}

export function formatNumber(value: number, language: Language): string {
  return new Intl.NumberFormat(language === 'bn' ? 'bn-BD' : 'en-US').format(value);
}

export function formatScoreValue(value: number, language: Language): string {
  const formatted = new Intl.NumberFormat(language === 'bn' ? 'bn-BD' : 'en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(Math.abs(value) / 10);
  return value < 0 ? `-${formatted}` : formatted;
}

export function formatSignedScoreValue(value: number, language: Language): string {
  const score = formatScoreValue(value, language);
  if (value > 0) return `+${score}`;
  return score;
}
