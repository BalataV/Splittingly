// Centrální typy doménového modelu + globálního stavu a akcí.
//
// PRAVIDLO O PENĚZÍCH: všude, kde je v názvu `Minor`, jde o CELÉ ČÍSLO
// v nejmenší jednotce měny (cent, haléř, jen). 12,34 € = 1234. ¥1000 = 1000.
// Nikde v appce nesmí být částka jako `number` s desetinnou tečkou.

export type SplitType = 'equal' | 'shares' | 'exact';
export type ThemeName = 'acid' | 'mint' | 'neon' | 'dusk';
export type ModeName = 'light' | 'dark' | 'system';
export type TextSize = 'small' | 'medium' | 'large';
export type PayMethod = 'cash' | 'transfer' | 'other';
export type MascotName = 'closer' | 'analyst';
export type StatsPeriod = 'month' | 'trip' | 'all';

export type ScreenName =
  // vstup a účet (01–07)
  | 'onboarding' | 'signup' | 'login' | 'forgot' | 'new_password' | 'confirm_email'
  // hlavní tok (08–21)
  | 'overview' | 'create_group' | 'join_group' | 'group' | 'add_expense'
  | 'split_method' | 'expense_detail' | 'settle' | 'stats'
  | 'year_in_review' | 'activity' | 'search' | 'share_card'
  // nastavení (22–29)
  | 'profile' | 'language' | 'currency' | 'appearance' | 'notifications'
  | 'remove_ads' | 'privacy' | 'settings'
  // úvodní nastavení po první registraci
  | 'setup';

export type TabName = 'overview' | 'activity' | 'stats' | 'profile';

export interface GroupMember {
  id: string;
  name: string;            // reálné jméno v DB
  color: string | null;
  userId: string | null;   // vazba na účet; null = „ještě si to místo nikdo nezabral"
  leftAt: string | null;   // vyplněno = former member (historie zůstává)
}

export interface Group {
  id: string;
  name: string;
  currency: string;        // výchozí měna skupiny
  coverColor: string;
  shareCode: string;
  members: string[];       // zobrazovaná jména („You" pro mě)
  memberList: GroupMember[];
  archived: boolean;
}

export interface Expense {
  id: string;
  groupId: string;
  desc: string;
  amountMinor: number;
  currency: string;
  payer: string;           // zobrazované jméno
  parts: string[];         // zobrazovaná jména účastníků
  splitType: SplitType;
  shares: number[] | null;      // pro 'shares'
  exactMinor: number[] | null;  // pro 'exact'
  category: string;
  spentAt: string;
  receipts: string[];      // veřejné URL účtenek
  editCount: number;
  createdAt: string;
}

export interface Payment {
  id: string;
  groupId: string;
  from: string;
  to: string;
  amountMinor: number;
  currency: string;
  method: PayMethod;
  note: string | null;
  createdAt: string;
}

export interface Transfer {
  id: string;
  groupId: string;
  currency: string;
  from: string;
  to: string;
  amountMinor: number;
}

export interface AuditEntry {
  id: string;
  expenseId: string;
  actorName: string;
  action: 'created' | 'edited' | 'deleted';
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
}

export interface ActivityItem {
  id: string;
  kind: 'expense' | 'payment' | 'member' | 'edit';
  groupId: string;
  groupName: string;
  actor: string;
  text: string;            // již přeložená věta
  amountMinor: number | null;
  currency: string | null;
  at: string;
}

/** Peníze po měnách: { EUR: 6420, THB: 120000 }. Nikdy se nesčítají napříč měnami. */
export type MoneyMap = Record<string, number>;

export interface JoinPreviewMember { name: string; claimed: boolean; isMe: boolean; }
export interface JoinPreview {
  code: string; groupId: string; groupName: string;
  currency: string; coverColor: string; members: JoinPreviewMember[];
}

export interface NotifPrefs {
  expense: boolean; settled: boolean; edited: boolean; weekly: boolean;
  closer: boolean; analyst: boolean;
  quietFrom: number; quietTo: number;
}

/** Vypočtená paleta pro aktuální téma + režim. Klíče používá celá appka. */
export interface Palette {
  bg: string; surface: string; surfaceSunken: string;
  text: string; textMuted: string; textDisabled: string;
  primary: string; primaryPressed: string; onPrimary: string;
  accent: string; onAccent: string;
  positive: string; positiveSurface: string; onPositive: string;
  negative: string; negativeSurface: string; negativeTextOnSurface: string;
  accentSurface: string;
  border: string; dividerInner: string; borderInactive: string;
  skeleton: string;
  adFrame: string; adText: string;
  shadow: string;          // barva tvrdého stínu (ink / bone)
  scrim: string;
  isDark: boolean;
}

export interface ExpenseDraft {
  id: string | null;          // vyplněno = editace
  groupId: string | null;
  desc: string;
  amountText: string;         // co uživatel píše (může být rozepsané)
  currency: string;
  payer: string;
  parts: string[];
  splitType: SplitType;
  shares: Record<string, number>;     // jméno → počet podílů
  exactText: Record<string, string>;  // jméno → text částky
  category: string;
  spentAt: string;
  receipts: string[];
}

export interface SyncState {
  online: boolean;
  lastSyncedAt: string | null;
  queued: number;
}

export interface AppState {
  // navigace
  screen: ScreenName;
  tab: TabName;
  history: ScreenName[];
  selectedGroup: string | null;
  selectedExpense: string | null;
  selectedTransfer: Transfer | null;

  // běhový stav
  booting: boolean;
  busy: boolean;
  loading: boolean;
  toast: string | null;
  errorText: string | null;
  celebrate: boolean;        // právě vyrovnáno → obrazovka 16b
  dialog: null | 'delete_account' | 'delete_expense' | 'leave_group';
  deleteConfirmText: string;

  // účet
  meUid: string | null;
  myName: string;
  myEmail: string;
  avatarColor: string;
  emailVerified: boolean;
  appleAvailable: boolean;
  googleEnabled: boolean;

  // předvolby
  lang: string;
  langChosen: boolean;
  currency: string;          // MOJE zobrazovací měna (nezávislá na jazyku)
  favouriteCurrencies: string[];  // měny nahoře v seznamu, volí si je uživatel
  setupDone: boolean;        // proběhlo úvodní nastavení jazyka a měn?
  theme: ThemeName;
  mode: ModeName;
  systemDark: boolean;
  textSize: TextSize;
  notif: NotifPrefs;
  personalisedAds: boolean;
  isPro: boolean;
  rewardTheme: ThemeName | null;
  rewardUntil: string | null;
  mascotsOn: boolean;

  // formuláře
  authEmail: string;
  authPassword: string;
  authName: string;
  authCode: string;
  authError: string | null;
  authAttemptsLeft: number;
  consentAccepted: boolean;

  newGroupName: string;
  newGroupColor: string;
  newGroupCurrency: string;
  newGroupMembers: string[];
  newMemberInput: string;

  joinCodeInput: string;
  joinPreview: JoinPreview | null;

  draft: ExpenseDraft;

  settleMethod: PayMethod;
  settleNote: string;

  searchQuery: string;
  searchFilters: string[];
  recentSearches: string[];

  statsPeriod: StatsPeriod;

  // data
  groups: Group[];
  expenses: Record<string, Expense[]>;   // groupId → výdaje
  payments: Record<string, Payment[]>;   // groupId → platby
  audit: Record<string, AuditEntry[]>;   // expenseId → historie
  fxRates: Record<string, number> | null;
  sync: SyncState;
}

export type Patch = Partial<AppState> | ((s: AppState) => Partial<AppState>);

export interface Actions {
  patch: (p: Patch) => void;
  showToast: (text: string) => void;
  navigate: (screen: ScreenName) => void;
  goBack: () => boolean;
  setTab: (tab: TabName) => void;

  // účet
  signUp: () => Promise<void>;
  logIn: () => Promise<void>;
  logInGoogle: () => Promise<void>;
  logInApple: () => Promise<void>;
  sendReset: () => Promise<void>;
  saveNewPassword: () => Promise<void>;
  confirmEmailCode: () => Promise<void>;
  resendCode: () => Promise<void>;
  logOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;

  // předvolby
  setLang: (l: string) => void;
  setCurrency: (c: string) => void;
  toggleFavouriteCurrency: (c: string) => void;
  finishSetup: () => void;
  setTheme: (t: ThemeName) => void;
  setMode: (m: ModeName) => void;
  setTextSize: (s: TextSize) => void;
  setNotif: (k: keyof NotifPrefs, v: boolean | number) => void;
  setPersonalisedAds: (v: boolean) => void;
  buyPro: () => Promise<void>;
  restorePro: () => Promise<void>;
  unlockThemeByReward: (t: ThemeName) => Promise<void>;

  // skupiny
  openGroup: (id: string) => void;
  createGroup: () => Promise<void>;
  addDraftMember: () => void;
  removeDraftMember: (name: string) => void;
  joinByCode: (code?: string) => Promise<void>;
  finishJoin: (opts: { claimName?: string; newName?: string }) => Promise<void>;
  leaveGroup: (id: string) => Promise<void>;
  shareInvite: (id: string) => Promise<void>;
  exportGroup: (id: string) => Promise<void>;

  // výdaje
  startAddExpense: () => void;
  startEditExpense: (id: string) => void;
  duplicateExpense: (id: string) => void;
  setDraft: (p: Partial<ExpenseDraft>) => void;
  setPayer: (name: string) => void;
  togglePart: (name: string) => void;
  setSplitType: (t: SplitType) => void;
  setShare: (name: string, delta: number) => void;
  setExact: (name: string, text: string) => void;
  /** Bez parametru se zeptá, odkud fotku vzít. */
  attachReceipt: (from?: 'camera' | 'library') => Promise<void>;
  removeReceipt: (url: string) => void;
  saveExpense: () => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  openExpense: (id: string) => void;

  // vyrovnání
  startSettle: (t: Transfer) => void;
  confirmSettle: () => Promise<void>;

  // data
  refreshAll: (force?: boolean) => Promise<void>;
  refreshGroup: (id: string) => Promise<void>;
  runSearch: (q: string) => void;
}

export interface AppContextValue {
  state: AppState;
  actions: Actions;
}
