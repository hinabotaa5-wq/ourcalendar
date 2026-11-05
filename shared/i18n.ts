import type { Lang } from "./types.js";

export interface LocaleInfo {
  intl: string;
  weekStart: 0 | 1;
  name: string;
}

export const LOCALES: Record<Lang, LocaleInfo> = {
  en: { intl: "en-GB", weekStart: 0, name: "English" },
  ja: { intl: "ja-JP", weekStart: 0, name: "日本語" },
  pl: { intl: "pl-PL", weekStart: 1, name: "polski" },
};

export interface Strings {
  navMonth: string;
  navWeek: string;
  navWeight: string;
  navSettings: string;
  prevWeek: string;
  nextWeek: string;
  weekOf: string;
  newEvent: string;
  fieldTitle: string;
  fieldCategory: string;
  fieldWhen: string;
  fieldDuration: string;
  fieldNotes: string;
  fieldVideo: string;
  addEvent: string;
  noEventsWeek: string;
  noEventsDay: string;
  backToMonth: string;
  today: string;
  allDay: string;
  minUnit: string;
  referenceVideo: string;
  done: string;
  restToday: string;
  move: string;
  delete: string;
  moveTo: string;
  confirmMove: string;
  statusScheduled: string;
  statusDone: string;
  statusRested: string;
  statusMoved: string;
  weightTitle: string;
  weightOnlySimone: string;
  saturdayCheckin: string;
  saturdayPrompt: string;
  fieldWeightKg: string;
  save: string;
  historySimone: string;
  loading: string;
  notifications: string;
  enablePush: string;
  sendTest: string;
  sessions: string;
  sessionsHint: string;
  revoke: string;
  sessionRevoked: string;
  pushEnabled: string;
  pushDenied: string;
  pushFailed: string;
  testSent: string;
  language: string;
  notSignedIn: string;
  inviteHint: string;
  joining: string;
  inviteFailed: string;
  passwordLabel: string;
  loginButton: string;
  wrongPassword: string;
  inviteLocked: string;
  passwordNotSet: string;
  redeeming: string;
  levelName: string;
  xpToNext: string;
  levelUpTitle: string;
  questTitle: string;
  noQuest: string;
  questComplete: string;
  questBonus: string;
  qClearAll: string;
  qJogOnce: string;
  qDoneCount: string;
  qWeekdayOnce: string;
  timeLabelSimone: string;
  timeLabelHinata: string;
  loggedInAs: string;
  birthdayHinata: string;
  birthdaySimone: string;
  legendPlanned: string;
  legendJogging: string;
  legendAllDone: string;
  legendRest: string;
}

const EN: Strings = {
  navMonth: "Month",
  navWeek: "Week",
  navWeight: "Weight",
  navSettings: "Settings",
  prevWeek: "← Prev week",
  nextWeek: "Next week →",
  weekOf: "Week of {date}",
  newEvent: "New event",
  fieldTitle: "Title",
  fieldCategory: "Category",
  fieldWhen: "Date & time (your device time)",
  fieldDuration: "Duration (min)",
  fieldNotes: "How-to notes",
  fieldVideo: "Reference video URL",
  addEvent: "Add event",
  noEventsWeek: "No events this week yet.",
  noEventsDay: "No events this day.",
  backToMonth: "← Month",
  today: "Today",
  allDay: "All day",
  minUnit: "min",
  referenceVideo: "Reference video",
  done: "Done",
  restToday: "Rest today",
  move: "Move",
  delete: "Delete",
  moveTo: "Move to",
  confirmMove: "Confirm move",
  statusScheduled: "scheduled",
  statusDone: "done",
  statusRested: "rested",
  statusMoved: "moved",
  weightTitle: "Weight",
  weightOnlySimone: "Only Simone can view weight entries. Ask Simone to open this page on her device.",
  saturdayCheckin: "Saturday check-in",
  saturdayPrompt: "Simone enters her weight every Saturday at 19:00 (her time).",
  fieldWeightKg: "Weight (kg)",
  save: "Save",
  historySimone: "History (Simone only)",
  loading: "Loading…",
  notifications: "Notifications",
  enablePush: "Enable push",
  sendTest: "Send test",
  sessions: "Sessions",
  sessionsHint: "Revoke any session (including the other device) here.",
  revoke: "Revoke",
  sessionRevoked: "Session revoked.",
  pushEnabled: "Push enabled on this device.",
  pushDenied: "Notification permission denied.",
  pushFailed: "Push setup failed:",
  testSent: "Test sent to {sent}/{targets} subscription(s).",
  language: "Language",
  notSignedIn: "You're not signed in",
  inviteHint: "Open your personal invite link on this device to join. Each link works once.",
  joining: "Joining…",
  inviteFailed: "Invite failed:",
  passwordLabel: "Password",
  loginButton: "Log in",
  wrongPassword: "Wrong password. Try again.",
  inviteLocked: "Too many wrong attempts. Wait a while and try again.",
  passwordNotSet: "No password is set for this link yet. Contact Hinata.",
  redeeming: "Redeeming your invite link…",
  levelName: "Level",
  xpToNext: "{n} XP to go",
  levelUpTitle: "Level up!",
  questTitle: "Quest",
  noQuest: "No quest this week",
  questComplete: "Complete!",
  questBonus: "+50 XP bonus!",
  qClearAll: "Clear this week's workouts",
  qJogOnce: "Do one Jogging this week",
  qDoneCount: "Done {n} times this week",
  qWeekdayOnce: "Done on a weekday",
  timeLabelSimone: "Simone's time",
  timeLabelHinata: "Hinata's time",
  loggedInAs: "Logged in as {name}",
  birthdayHinata: "Hinata's birthday",
  birthdaySimone: "Simone's birthday",
  legendPlanned: "Planned",
  legendJogging: "Jogging",
  legendAllDone: "All done",
  legendRest: "Rest",
};

const JA: Strings = {
  navMonth: "月",
  navWeek: "週",
  navWeight: "体重",
  navSettings: "設定",
  prevWeek: "← 前の週",
  nextWeek: "次の週 →",
  weekOf: "{date} の週",
  newEvent: "新しい予定",
  fieldTitle: "タイトル",
  fieldCategory: "カテゴリ",
  fieldWhen: "日時（端末の時間）",
  fieldDuration: "所要時間（分）",
  fieldNotes: "やり方メモ",
  fieldVideo: "参考動画URL",
  addEvent: "予定を追加",
  noEventsWeek: "今週は予定がありません。",
  noEventsDay: "この日の予定はありません。",
  backToMonth: "← 月表示に戻る",
  today: "今日",
  allDay: "終日",
  minUnit: "分",
  referenceVideo: "参考動画",
  done: "完了",
  restToday: "今日は休む",
  move: "移動",
  delete: "削除",
  moveTo: "移動先",
  confirmMove: "移動を決定",
  statusScheduled: "予定あり",
  statusDone: "完了",
  statusRested: "お休み",
  statusMoved: "移動済み",
  weightTitle: "体重",
  weightOnlySimone: "体重を見られるのはSimoneだけです。Simoneの端末でこのページを開いてください。",
  saturdayCheckin: "土曜の記録",
  saturdayPrompt: "Simoneは毎週土曜19:00（彼女の時間）に体重を入力します。",
  fieldWeightKg: "体重（kg）",
  save: "保存",
  historySimone: "履歴（Simoneのみ）",
  loading: "読み込み中…",
  notifications: "通知",
  enablePush: "プッシュ通知を有効にする",
  sendTest: "テスト送信",
  sessions: "セッション",
  sessionsHint: "他方の端末も含め、セッションを無効化できます。",
  revoke: "無効化",
  sessionRevoked: "セッションを無効化しました。",
  pushEnabled: "この端末でプッシュ通知を有効にしました。",
  pushDenied: "通知が許可されませんでした。",
  pushFailed: "プッシュ通知の設定に失敗しました:",
  testSent: "テストを{sent}/{targets}件の登録先に送信しました。",
  language: "言語",
  notSignedIn: "未ログインです",
  inviteHint: "あなたの招待リンクをこの端末で開いてください。リンクは1回だけ使えます。",
  joining: "参加処理中…",
  inviteFailed: "招待に失敗しました:",
  passwordLabel: "パスワード",
  loginButton: "ログイン",
  wrongPassword: "パスワードが違います。もう一度試してください。",
  inviteLocked: "間違いが多すぎます。しばらく待ってから試してください。",
  passwordNotSet: "このリンクにはまだパスワードが設定されていません。Hinataに連絡してください。",
  redeeming: "招待リンクを処理しています…",
  levelName: "レベル",
  xpToNext: "あと{n} XP",
  levelUpTitle: "レベルアップ！",
  questTitle: "クエスト",
  noQuest: "今週のクエストはありません",
  questComplete: "達成！",
  questBonus: "+50 XP ボーナス！",
  qClearAll: "今週の運動を全部片づけよう",
  qJogOnce: "今週ジョギングを1回やろう",
  qDoneCount: "今週{n}回Doneしよう",
  qWeekdayOnce: "平日に1回Doneしよう",
  timeLabelSimone: "Simoneの時間",
  timeLabelHinata: "Hinataの時間",
  loggedInAs: "{name}でログイン中",
  birthdayHinata: "Hinataの誕生日",
  birthdaySimone: "Simoneの誕生日",
  legendPlanned: "予定",
  legendJogging: "ジョギング",
  legendAllDone: "全部できた",
  legendRest: "お休み",
};

const PL: Strings = {
  navMonth: "Miesiąc",
  navWeek: "Tydzień",
  navWeight: "Waga",
  navSettings: "Ustawienia",
  prevWeek: "← Poprzedni tydzień",
  nextWeek: "Następny tydzień →",
  weekOf: "Tydzień {date}",
  newEvent: "Nowe wydarzenie",
  fieldTitle: "Tytuł",
  fieldCategory: "Kategoria",
  fieldWhen: "Data i godzina (czas Twojego urządzenia)",
  fieldDuration: "Czas trwania (min)",
  fieldNotes: "Notatki",
  fieldVideo: "Link do filmiku",
  addEvent: "Dodaj wydarzenie",
  noEventsWeek: "Brak wydarzeń w tym tygodniu.",
  noEventsDay: "Brak wydarzeń tego dnia.",
  backToMonth: "← Miesiąc",
  today: "Dziś",
  allDay: "Cały dzień",
  minUnit: "min",
  referenceVideo: "Filmik",
  done: "Gotowe",
  restToday: "Dziś odpoczynek",
  move: "Przełóż",
  delete: "Usuń",
  moveTo: "Przełóż na",
  confirmMove: "Potwierdź",
  statusScheduled: "zaplanowane",
  statusDone: "gotowe",
  statusRested: "odpoczynek",
  statusMoved: "przełożone",
  weightTitle: "Waga",
  weightOnlySimone: "Tylko Simone widzi wpisy wagi. Poproś Simone, żeby otworzyła tę stronę na swoim telefonie.",
  saturdayCheckin: "Sobotni wpis",
  saturdayPrompt: "Simone wpisuje wagę w każdą sobotę o 19:00 (jej czas).",
  fieldWeightKg: "Waga (kg)",
  save: "Zapisz",
  historySimone: "Historia (tylko Simone)",
  loading: "Ładowanie…",
  notifications: "Powiadomienia",
  enablePush: "Włącz powiadomienia",
  sendTest: "Wyślij test",
  sessions: "Sesje",
  sessionsHint: "Tutaj możesz wycofać dowolną sesję (także na drugim urządzeniu).",
  revoke: "Wycofaj",
  sessionRevoked: "Sesję wycofano.",
  pushEnabled: "Powiadomienia push włączone na tym urządzeniu.",
  pushDenied: "Odmowa powiadomień.",
  pushFailed: "Nie udało się włączyć push:",
  testSent: "Wysłano test do {sent}/{targets} subskrypcji.",
  language: "Język",
  notSignedIn: "Nie jesteś zalogowany(-a)",
  inviteHint: "Otwórz swój osobisty link z zaproszeniem na tym urządzeniu. Każdy link działa raz.",
  joining: "Dołączanie…",
  inviteFailed: "Zaproszenie nie powiodło się:",
  passwordLabel: "Hasło",
  loginButton: "Zaloguj się",
  wrongPassword: "Błędne hasło. Spróbuj ponownie.",
  inviteLocked: "Za dużo błędnych prób. Odczekaj chwilę i spróbuj ponownie.",
  passwordNotSet: "Do tego linku nie ustawiono jeszcze hasła. Skontaktuj się z Hinatą.",
  redeeming: "Realizuję link…",
  levelName: "Poziom",
  xpToNext: "jeszcze {n} XP",
  levelUpTitle: "Nowy poziom!",
  questTitle: "Misja",
  noQuest: "Brak misji w tym tygodniu",
  questComplete: "Ukończona!",
  questBonus: "Bonus +50 XP!",
  qClearAll: "Uporządkuj treningi z tego tygodnia",
  qJogOnce: "Zrób w tym tygodniu jeden jogging",
  qDoneCount: "Ukończ {n} treningi w tym tygodniu",
  qWeekdayOnce: "Poćwicz w dzień powszedni",
  timeLabelSimone: "Czas Simone",
  timeLabelHinata: "Czas Hinaty",
  loggedInAs: "Zalogowano jako {name}",
  birthdayHinata: "Urodziny Hinaty",
  birthdaySimone: "Urodziny Simone",
  legendPlanned: "Zaplanowane",
  legendJogging: "Jogging",
  legendAllDone: "Wszystko zrobione",
  legendRest: "Odpoczynek",
};

export const STRINGS: Record<Lang, Strings> = { en: EN, ja: JA, pl: PL };

export function fmt(template: string, vars: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));
}

export function tr(lang: Lang, key: keyof Strings, vars?: Record<string, string | number>): string {
  return fmt(STRINGS[lang][key], vars);
}

export function allKeys(): (keyof Strings)[] {
  return Object.keys(EN) as (keyof Strings)[];
}

export function langFromStorage(get: (k: string) => string | null): Lang {
  const v = get("oc-lang");
  return v === "ja" || v === "pl" || v === "en" ? v : "en";
}
