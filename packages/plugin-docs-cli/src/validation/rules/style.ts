import { readFile, readdir } from 'node:fs/promises';
import type { Dirent } from 'node:fs';
import { join, relative } from 'node:path';
import type { Diagnostic, Severity, StyleRuleId, ValidationInput } from '../types.js';
import { getCodeBlockLines, getNonProseLines, isMetaFile, matchOutsideCode } from './utils.js';

/**
 * Applies a curated subset of the Grafana Writers' Toolkit's writing-style rules.
 *
 * The rule data below is copied by hand from `grafana/writers-toolkit` (Apache-2.0), which
 * publishes Grafana's documentation style guide as Vale style files. We do not run Vale itself,
 * or vendor its rule files: each rule we use is transcribed once into the `VALE_RULES` array
 * below, so plugin authors get the same feedback without installing a separate binary. See
 * `AGENTS.md` for how to add or update a rule.
 *
 * These are advice, never a gate. `plugin-validator` maps a CLI `error` onto a publishing block,
 * and Grafana's in-house style is not grounds for refusing a third-party plugin release, so
 * nothing here ever reaches `error`.
 */

/**
 * How loud a rule is. Writing style is advice, so `warn` is always `warning` and `info` is always
 * `info`, in both `serve` and `validate`. Neither ever reaches `error`, because `plugin-validator`
 * maps CLI `error` onto a publishing block and Grafana's house style is not grounds for refusing a
 * third-party plugin release.
 */
export type StyleTier = 'warn' | 'info';

export interface StyleOverride {
  /** Defaults to `warn`. */
  tier?: StyleTier;
  /** Findings of this rule reported per file. Defaults to `MAX_FINDINGS_PER_RULE_PER_FILE`. */
  limit?: number;
  /** Matched text to ignore, compared case-sensitively against the whole match. */
  exceptions?: readonly string[];
  /** Lines matching this are skipped entirely, for contexts where the rule is legitimately wrong. */
  skipLines?: RegExp;
  /** Replaces the upstream token list. Only for rules whose upstream tokens are too broad for us. */
  tokens?: readonly string[];
  /** Appended to the diagnostic detail, to explain a non-obvious fix or a known false positive. */
  note?: string;
}

/** No single rule may account for more than this many findings in one file. */
export const MAX_FINDINGS_PER_RULE_PER_FILE = 5;

/** A Vale rule definition, narrowed to the fields the Grafana style files actually use. */
export interface ValeRule {
  /** Upstream rule name, so `ReferTo` here is `Grafana.ReferTo` in the toolkit. */
  name: string;
  extends: 'existence' | 'substitution' | 'repetition';
  level: 'error' | 'warning' | 'suggestion';
  message: string;
  link?: string;
  /** `existence`: regex sources, any of which is a violation. */
  tokens?: string[];
  /** `substitution`: regex source mapped to the preferred wording. */
  swap?: Record<string, string>;
  ignorecase?: boolean;
  /** When set, tokens are not wrapped in word boundaries. */
  nonword?: boolean;
  exceptions?: string[];
  scope?: string;
}

/**
 * Rule definitions transcribed from `grafana/writers-toolkit@457b7ca750945374d8df36328d10d0e997c82cd1`
 * (Apache-2.0). Only rules listed in `ALLOWED_RULES` below belong here - see `AGENTS.md` for how to
 * add or update one.
 */
export const VALE_RULES: readonly ValeRule[] = [
  { name: "AllowsTo", extends: "substitution", level: "warning", message: "Did you mean '%s' instead of '%s'?\n\nAllows to is a common wording error.", swap: {"allows to":"allows you to|makes it possible to"} },
  { name: "AndOr", extends: "existence", level: "warning", message: "Avoid writing and/or except when space is limited, such as in tables.\n\nOften, 'and' implies 'or', so you don't need to write both words.\n\nIf you need to specify both in your content, write something like \"You can export raw events, processed events, or both.\"", link: "https://developers.google.com/style/slashes#and-or", tokens: ["and/or"] },
  { name: "Archives", extends: "substitution", level: "suggestion", message: "Use '%s' instead of '%s'.", link: "https://developers.google.com/style/word-list#extract", swap: {"[Uu]n(?:archive|compress|tar|zip)":"extract","unzip":"extract","[Zz][Ii][Pp](?: file)?":"archive|compressed file"} },
  { name: "DialogBox", extends: "substitution", level: "warning", message: "Use '%s' rather than '%s'.", link: "https://grafana.com/docs/writers-toolkit/write/style-guide/word-list/#dialog-box", swap: {"dialog box appears":"dialog box opens","modal":"dialog box","dialog(?! box)":"dialog box"} },
  { name: "DropDown", extends: "substitution", level: "suggestion", message: "Use '%s' instead of '%s'.\n\nUse drop-down as a modifier rather than as a standalone noun. For example: _drop-down menu_.", link: "https://grafana.com/docs/writers-toolkit/write/style-guide/word-list/#drop-down", swap: {"drop ?down":"drop-down"} },
  { name: "EndToEnd", extends: "substitution", level: "warning", message: "Use '%s' instead of '%s'.", link: "https://grafana.com/docs/writers-toolkit/write/style-guide/word-list/#end-to-end", swap: {"[eE]2[eE]":"end-to-end"} },
  { name: "Exclamation", extends: "existence", level: "warning", message: "Remove the exclamation point.\n\nExclamation points make technical documentation feel informal and hyperbolic.", link: "https://developers.google.com/style/tone#some-things-to-avoid-where-possible", tokens: ["\\w+!(?:\\s|$)"], nonword: true },
  { name: "GoogleAMPM", extends: "existence", level: "error", message: "Use 'AM' or 'PM' (preceded by a space).", link: "https://developers.google.com/style/word-list", tokens: ["\\d{1,2}[AP]M\\b","\\d{1,2} ?[ap]m\\b","\\d{1,2} ?[aApP]\\.[mM]\\."], nonword: true },
  { name: "GoogleDateFormat", extends: "existence", level: "error", message: "Use 'July 31, 2016' format, not '%s'.", link: "https://developers.google.com/style/dates-times", tokens: ["\\d{1,2}(?:\\.|/)\\d{1,2}(?:\\.|/)\\d{4}","\\d{1,2} (?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)|May|Jun(?:e)|Jul(?:y)|Aug(?:ust)|Sep(?:tember)?|Oct(?:ober)|Nov(?:ember)?|Dec(?:ember)?) \\d{4}"], ignorecase: true, nonword: true },
  { name: "GoogleEllipses", extends: "existence", level: "warning", message: "In general, don't use an ellipsis.", link: "https://developers.google.com/style/ellipses", tokens: ["\\.\\.\\."], nonword: true },
  { name: "GoogleEmDash", extends: "existence", level: "error", message: "Don't put a space before or after a dash.", link: "https://developers.google.com/style/dashes", tokens: ["\\s[—–]\\s"], nonword: true },
  { name: "GoogleEnDash", extends: "existence", level: "error", message: "Use an em dash ('—') instead of '–'.", link: "https://developers.google.com/style/dashes", tokens: ["–"], nonword: true },
  { name: "GoogleGender", extends: "existence", level: "error", message: "Don't use '%s' as a gender-neutral pronoun.", link: "https://developers.google.com/style/pronouns#gender-neutral-pronouns", tokens: ["he/she","s/he","\\(s\\)he"], ignorecase: true },
  { name: "GoogleGenderBias", extends: "substitution", level: "error", message: "Consider using '%s' instead of '%s'.", link: "https://developers.google.com/style/inclusive-documentation", swap: {"(?:alumnae|alumni)":"graduates","(?:alumna|alumnus)":"graduate","air(?:m[ae]n|wom[ae]n)":"pilot(s)","anchor(?:m[ae]n|wom[ae]n)":"anchor(s)","authoress":"author","camera(?:m[ae]n|wom[ae]n)":"camera operator(s)","door(?:m[ae]|wom[ae]n)":"concierge(s)","draft(?:m[ae]n|wom[ae]n)":"drafter(s)","fire(?:m[ae]n|wom[ae]n)":"firefighter(s)","fisher(?:m[ae]n|wom[ae]n)":"fisher(s)","fresh(?:m[ae]n|wom[ae]n)":"first-year student(s)","garbage(?:m[ae]n|wom[ae]n)":"waste collector(s)","lady lawyer":"lawyer","ladylike":"courteous","mail(?:m[ae]n|wom[ae]n)":"mail carriers","man and wife":"husband and wife","man enough":"strong enough","mankind":"human kind|humanity","manmade":"manufactured","manpower":"personnel","middle(?:m[ae]n|wom[ae]n)":"intermediary","news(?:m[ae]n|wom[ae]n)":"journalist(s)","ombuds(?:man|woman)":"ombuds","oneupmanship":"upstaging","poetess":"poet","police(?:m[ae]n|wom[ae]n)":"police officer(s)","repair(?:m[ae]n|wom[ae]n)":"technician(s)","sales(?:m[ae]n|wom[ae]n)":"salesperson or sales people","service(?:m[ae]n|wom[ae]n)":"soldier(s)","steward(?:ess)?":"flight attendant","tribes(?:m[ae]n|wom[ae]n)":"tribe member(s)","waitress":"waiter","woman doctor":"doctor","woman scientist[s]?":"scientist(s)","work(?:m[ae]n|wom[ae]n)":"worker(s)"}, ignorecase: true },
  { name: "GoogleHeadingPunctuation", extends: "existence", level: "warning", message: "Don't put a period at the end of a heading.", link: "https://developers.google.com/style/capitalization#capitalization-in-titles-and-headings", tokens: ["[a-z0-9][.]\\s*$"], nonword: true, scope: "heading" },
  { name: "GoogleLyHyphens", extends: "existence", level: "error", message: "'%s' doesn't need a hyphen.", link: "https://developers.google.com/style/hyphens", tokens: ["\\b[^\\s-]+ly-\\w+\\b"], nonword: true },
  { name: "GoogleOptionalPlurals", extends: "existence", level: "error", message: "Don't use plurals in parentheses such as in '%s'.", link: "https://developers.google.com/style/plurals-parentheses", tokens: ["\\b\\w+\\(s\\)"], nonword: true },
  { name: "GooglePeriods", extends: "existence", level: "error", message: "Don't use periods with acronyms or initialisms such as '%s'.", link: "https://developers.google.com/style/abbreviations", tokens: ["\\b(?:[A-Z]\\.){3,}"], nonword: true },
  { name: "GoogleRanges", extends: "existence", level: "warning", message: "Don't add words such as 'from' or 'between' to describe a range of numbers.", link: "https://developers.google.com/style/hyphens", tokens: ["(?:from|between)\\s\\d+\\s?-\\s?\\d+"], nonword: true },
  { name: "GoogleSlang", extends: "existence", level: "error", message: "Don't use internet slang abbreviations such as '%s'.", link: "https://developers.google.com/style/abbreviations", tokens: ["tl;dr","ymmv","rtfm","imo","fwiw"], ignorecase: true },
  { name: "GoogleWill", extends: "existence", level: "warning", message: "Avoid using '%s'.\n\nUse present tense for statements that describe general behavior that's not associated with a particular time.", link: "https://developers.google.com/style/tense", tokens: ["will"], ignorecase: true },
  { name: "Kubernetes", extends: "substitution", level: "warning", message: "Use '%s' instead of '%s'.", link: "https://grafana.com/docs/writers-toolkit/write/style-guide/capitalization-punctuation/#kubernetes-objects", swap: {"cron job":"CronJob","[Kk]ubernetes deployment":"Kubernetes Deployment","d[ae][ae]mon[Ss]et":"DaemonSet","replica[Ss]et":"ReplicaSet","stateful[Ss]et":"StatefulSet","pod":"Pod","[Kk]ubelet":"`kubelet`","[Kk]ubectl":"`kubectl`"} },
  { name: "Latin", extends: "substitution", level: "error", message: "Use '%s' instead of '%s'.\n\nLatin abbreviations such as 'e.g.' and 'i.e.' are easily confused with each other and with other abbreviations.\nSpelling them out improves clarity, especially for readers who aren't native English speakers.", link: "https://developers.google.com/style/abbreviations#dont-use", swap: {"e\\.?g[,.]?":"for example","i\\.?e[,.]?":"that is"}, ignorecase: true },
  { name: "OK", extends: "existence", level: "warning", message: "Don't use any variation of okay in prose.\nThe exceptions are when you’re referencing or quoting:\n\n- A user interface\n- HTTP status codes or other code", link: "https://grafana.com/docs/writers-toolkit/write/style-guide/word-list/#ok-okay", tokens: ["O.K.","OK","ok","Ok","Okay","okay","A-OK","hokay","k","keh","kk","M'kay","oka","okeh","Okie dokie","Okily Dokily"] },
  { name: "Ordinal", extends: "existence", level: "error", message: "Replace this numeral ordinal with a word.\n\nWrite out ordinals from first through ninth as words, and use numerals from 10th onward.\nFor example, use 'first', 'second', and 'third', not '1st', '2nd', and '3rd'.", link: "https://grafana.com/docs/writers-toolkit/write/style-guide/style-conventions/#numbers", tokens: ["1st","2nd","3rd","4th","5th","6th","7th","8th","9th"] },
  { name: "Please", extends: "existence", level: "error", message: "Remove 'please' from instructions.\n\nDirect imperative sentences are clearer and more appropriate in technical documentation.\nExcessive politeness reads as filler and adds length without improving comprehension.", link: "https://developers.google.com/style/tone#politeness", tokens: ["please"], ignorecase: true },
  { name: "Quickstart", extends: "substitution", level: "warning", message: "Use the compound adjective '%s' without a hyphen instead of '%s' whether the noun is implied or explicit. For example, you can use _quickstart guide_ or just _quickstart_.", link: "https://grafana.com/docs/writers-toolkit/write/style-guide/word-list/#quickstart", swap: {"quick start":"quickstart"} },
  { name: "React", extends: "substitution", level: "warning", message: "Use '%s' instead of '%s'.", link: "https://grafana.com/docs/writers-toolkit/write/style-guide/word-list/#react", swap: {"[Rr]eact[. ]?[Jj][Ss]":"React"}, nonword: true },
  { name: "ReferTo", extends: "substitution", level: "error", message: "When linking in Markdown, use '%s' instead of '%s'.", link: "https://grafana.com/docs/writers-toolkit/write/style-guide/style-conventions/#links-and-references", swap: {"Check out \\[":"Refer to [","See \\[":"Refer to [","check out \\[":"refer to [","see \\[":"refer to ["}, scope: "raw" },
  { name: "RepeatedWords", extends: "repetition", level: "error", message: "'%s' is repeated.\n\nRemove the duplicate word.", tokens: ["[^\\s]+"] },
  { name: "SQL", extends: "substitution", level: "warning", message: "Use '%s' instead of '%s'.\n\nThe article—a or an—that you use before the acronym SQL depends on how the word is pronounced.\n\nWhen referring to the product Microsoft SQL Server, SQL should be pronounced \"sequel\".\nIn this case, use the article 'a', as in \"a SQL Server analysis\".\n\nWhen referring to the term in any other context, such as SQL databases, errors, or servers, SQL should be pronounced \"ess-cue-el\".\nIn this case, use the article 'an', as in \"an SQL error\".", link: "https://grafana.com/docs/writers-toolkit/write/style-guide/word-list/#sql-structured-query-language", swap: {"[Aa] SQL server":"an SQL server|a SQL Server","[Aa] SQL(?! [Ss]erver)":"an SQL","[Aa]n SQL Server":"a SQL Server"} },
  { name: "Simple", extends: "existence", level: "warning", message: "Avoid the word easy or simple -- what might be simple for you might not be simple for others.\n\nTry eliminating this word from the sentence because usually you can convey the same meaning without it.", link: "https://grafana.com/docs/writers-toolkit/write/style-guide/word-list/#simple", tokens: ["easy(?![ -]to[ -]understand)","easily","simple","simply"], exceptions: ["easy to understand","easy-to-understand"] },
  { name: "Timeless", extends: "existence", level: "suggestion", message: "Avoid using '%s' to keep the documentation timeless.\n\nIn general, document the current version of a product or feature.\n\nIt reduces the maintenance required to keep documentation up to date.\nIt avoids assuming the reader is familiar with earlier versions of the product.\n\nIf you're writing procedural or time-stamped content such as press releases, blog posts, or release notes, such time-based words and phrases are OK.", link: "https://developers.google.com/style/timeless-documentation", tokens: ["as of this writing","currently","does not yet","eventually","existing","future","in the future","latest","new","newer","now","old","older","presently","at present","soon"] },
  { name: "Wish", extends: "substitution", level: "warning", message: "Use '%s' instead of '%s'.\n\n'Wish' is informal and vague in technical writing.\nUse 'need' when the reader requires something to proceed, or 'want' when describing an optional goal.", link: "https://developers.google.com/style/word-list#wish", swap: {"wish":"need|want"} },
  { name: "WordList", extends: "substitution", level: "warning", message: "Use '%s' instead of '%s'.", link: "https://grafana.com/docs/writers-toolkit/write/style-guide/word-list/", swap: {"(?:(?<!Data )Firehose|Kinesis Data Firehose|Kinesis Firehose)":"Data Firehose","(?:SHA-1|HAS-SHA1)":"SHA-1","(?:WiFi|wifi)":"Wi-Fi","(?:[Oo]penshift|openShift)":"OpenShift","(?:[eE]-mail)":"email","(?:[jJ][mM][eE][sS]p|jmesP)ath":"JMESPath","(?:[oO]pentelemetry|openTelemetry)":"OpenTelemetry","(?:alert[Mm]anager|[Aa]lert [Mm]anager|AlertManager)":"Alertmanager","(?:cell ?phone|smart ?phone)":"phone|mobile phone","(?:content|media)-?type":"media type","(?:file ?path|path ?name)":"path","(?:file ?path|path ?name)s":"paths","(?:github|gitHub|Github)":"GitHub","(?:gitlab|gitLab|Gitlab)":"GitLab","(?:gitleaks|gitLeaks|GitLeaks)":"Gitleaks","(?:hamburger menu|kebab menu)":"menu icon","(?:java[Ss]cript|Javascript)":"JavaScript","(?:kill|terminate|abort)":"stop|exit|cancel|end","(?<!kube-)prometheus":"Prometheus","(?<!lambda-)promtail":"Promtail","GME":"GEM","Grafana AI observability":"Grafana AI Observability","HTTPs":"HTTPS","Influx[Dd]b":"InfluxDB","Influxd[Bb]":"InfluxDB","Once":"After","Pagerduty":"PagerDuty","RCA Workbench":"RCA workbench","Rudderstack":"RudderStack","VMWare":"VMware","Vmware":"VMware","[Ww]orld [Ww]ide [Ww]eb":"web","[cC]entos":"CentOS","\\b(?:[aA]daptive metrics|adaptive Metrics)\\b":"Adaptive Metrics","ad[- ]?hoc":"free-form|user-written","back[ -]end":"backend","blacklist":"blocklist","blacklisted":"blocklisted","blacklisting":"blocklisting","blacklists":"blocklists","cadvisor":"cAdvisor","check[- ]box":"checkbox","content type":"media type","data-?source":"data source","data-?sources":"data sources","data[- ]?set":"dataset","data[- ]?sets":"datasets","datacenter":"data center","datacenters":"data centers","de-duplicate":"deduplicate","de-duplicated":"deduplicated","de-duplicates":"deduplicates","de-duplication":"deduplication","fewer data":"less data","figma":"Figma","file name":"filename","file names":"filenames","firewalls":"firewall rules","front[ -]end":"frontend","front[ -]ends":"frontends","git":"Git","grafana":"Grafana","grayed-out":"unavailable","gunicorn":"Gunicorn","in order to":"to","influx[Dd][Bb]":"InfluxDB","jsonnet":"Jsonnet","kotlin":"Kotlin","langchain":"LangChain","left[- ]hand[- ]side":"left-side","log(?:ql|QL)":"LogQL","loki":"Loki","lucene":"Lucene","markdown":"Markdown","memcached":"Memcached","meta[- ]data":"metadata","mix[- ]in":"mixin","multitenancy":"multi-tenancy","mysql":"MySQL","network IP address":"internal IP address","open-source":"open source","otel":"OTel","otlp":"OTLP","pager[dD]uty":"PagerDuty","phlare":"Phlare","postgres":"Postgres","postgresql":"PostgreSQL","prom(?:ql|QL)":"PromQL","redis":"Redis","regex[ep]?s":"regular expression","regexp?":"regular expression","repo":"repository","repos":"repositories","right[- ]hand[- ]side":"right-side","rudderstack":"RudderStack","sensu":"Sensu","sign into":"sign in to","sqlite":"SQLite","style sheet":"stylesheet","style sheets":"stylesheet","synch":"sync","synched":"synced","synching":"syncing","tempo":"Tempo","the Grafana Agent":"Grafana Agent","the RCA [Ww]orkbench":"RCA workbench","threema":"Threema","timeseries":"time series|time-series","trace(?:ql|QL)":"TraceQL","un(?:check|select)":"clear","url":"URL","urls":"URLs","vmware":"VMware","vs\\.":"versus","webex":"Webex","whitelist":"allowlist","whitelisted":"allowlisted","whitelisting":"allowlisting","whitelists":"allowlists","yugabyte":"YugabyteDB"} },
];

/**
 * Upstream rules we deliberately do not run, with the reason. Kept as a structured record (not
 * just a comment) so it is easy to check whether a rule has already been considered, and to search
 * for a specific name, before adding a new one.
 */
export const REJECTED_RULES: Readonly<Record<string, string>> = {
  // Hugo-specific. plugin docs are plain Markdown, so these range from unreachable to harmful.
  Admonitions: 'Requires the Hugo admonition shortcode, which plugin docs forbid.',
  Relref: 'Checks Hugo relref shortcodes, which cannot appear in plugin docs.',
  Shortcodes: 'Checks Hugo shortcode syntax, which cannot appear in plugin docs.',
  Paragraphs: 'Targets <br> in Hugo tables; no-raw-html already covers the concern.',

  // Grafana-internal conventions with no meaning for a third-party plugin vendor.
  Admin: 'Grafana role naming.',
  Agentless: 'Grafana Alloy migration terminology.',
  AmazonCloudWatch: 'Grafana data source naming convention.',
  CHANGELOG: 'Grafana repository file convention.',
  DatadogProxy: 'Grafana-internal product naming.',
  DocumentationTeam: 'Grafana-internal team naming.',
  MetaMonitoring: 'Grafana-internal product naming.',
  PrometheusExporters: 'Curated vendor list that goes stale and rarely applies to one plugin.',
  ProductPossessives: 'A 300-entry literal product list, almost none of it relevant per plugin.',
  README: 'Grafana repository file convention.',
  SelfManaged: 'Grafana deployment-model terminology.',

  // Need data we do not ship.
  Headings:
    'Sentence case needs the 400-entry proper-noun list; without it we would flag Snowflake, ClickHouse and ServiceNow.',
  GoogleSpelling: 'Needs the Grafana Hunspell dictionary.',
  Acronyms: 'Needs the upstream acronym exception list.',

  // Too many false positives, or no fix the author can act on.
  GooglePassive: 'Config reference prose is legitimately passive ("is required", "is enabled by default").',
  Parentheses: 'Matches every "(for example, ...)" and "(default: 30s)" with no actionable fix.',
  GoogleFirstPerson: 'Matches region strings and sample identifiers.',
  FirstPersonPlural: 'A plugin vendor referring to themselves is legitimate.',
  GoogleOxfordComma: 'Suggestion-level and prone to false positives on list-like prose.',
  GoogleContractions: 'Stylistic preference, suggestion-level upstream.',
  GoogleSemicolons: 'Stylistic preference, suggestion-level upstream.',
  OAuth: 'Demands "OAuth 2.0" for every mention of OAuth, which is too specific for plugin docs.',
  GoogleSpacing: 'Its [a-z][.?!][A-Z] pattern matches every dotted identifier, such as a `log.WithContext` link label.',
  GrafanaCom: 'About which grafana.com URL form Grafana uses internally.',
  // Vale implements these as Tengo scripts rather than patterns, so there is nothing to interpret.
  // AltText, CommandLinePrompts and SmartQuotes are worth reimplementing by hand later - they are
  // high value and near-zero false positive - but they cannot come from the vendored definitions.
  AltText: 'Script-based upstream. Worth reimplementing natively.',
  CommandLinePrompts: 'Script-based upstream. Worth reimplementing natively.',
  SmartQuotes: 'Script-based upstream. Worth reimplementing natively.',
  Gerunds: 'Script-based upstream, and the task-versus-concept call needs judgement.',

  // Curated third-party product name lists: large, quick to go stale and rarely relevant to any
  // single plugin. The handful that matter for plugin docs are in WordList already.
  AmazonProductNames: 'Curated vendor list, rarely relevant per plugin.',
  ApacheProjectNames: 'Curated vendor list, rarely relevant per plugin.',
  GoogleProductNames: 'Curated vendor list, rarely relevant per plugin.',
  PalantirProductNames: 'Curated vendor list, rarely relevant per plugin.',

  // Whole-document grade-level scores. They produce one number with nothing to act on, which is the
  // wrong shape for a write-validate-fix loop.
  ReadabilityAutomatedReadability: 'Document-level readability score with no actionable fix.',
  ReadabilityColemanLiau: 'Document-level readability score with no actionable fix.',
  ReadabilityFleschKincaid: 'Document-level readability score with no actionable fix.',
  ReadabilityFleschReadingEase: 'Document-level readability score with no actionable fix.',
  ReadabilityGunningFog: 'Document-level readability score with no actionable fix.',
  ReadabilityLIX: 'Document-level readability score with no actionable fix.',
  ReadabilitySMOG: 'Document-level readability score with no actionable fix.',

  Spelling: 'Needs the Grafana Hunspell dictionary.',
};

/**
 * The upstream rules we run, keyed by their Vale name. An empty object means "take the upstream
 * definition as-is at the default `warn` tier".
 */
export const ALLOWED_RULES: Readonly<Record<string, StyleOverride>> = {
  // word choice and terminology
  WordList: {},
  ReferTo: {},
  AllowsTo: {},
  DialogBox: {},
  DropDown: {},
  EndToEnd: {},
  Quickstart: {},
  Archives: { tier: 'info' },
  Latin: {},
  OK: {},
  Wish: {},

  // product names that come up in plugin docs
  React: {},
  SQL: {},
  Kubernetes: {},

  // tone
  Simple: {},
  Please: { limit: 1 },
  Exclamation: {},
  AndOr: {},
  GoogleSlang: {},

  // inclusive language
  GoogleGender: {},
  GoogleGenderBias: {},

  // tense and time
  GoogleWill: {
    // future tense is correct in deprecation and roadmap notices, which is also where `will` shows
    // up most in plugin docs. quiet enough to be worth keeping, not confident enough to warn.
    tier: 'info',
    limit: 3,
    skipLines: /deprecat|\bremov|\bv?\d+\.\d+/i,
    note: 'Future tense is fine for deprecations and roadmap notes.',
  },
  Timeless: {
    // upstream also flags `new`, `newer`, `old`, `older`, `latest`, `existing`, `now` and `future`,
    // which are correct constantly in plugin docs ("the latest version of Grafana", "your existing
    // dashboards"). keep only the phrases that genuinely date a page.
    tier: 'info',
    tokens: ['as of this writing', 'at present', 'presently', 'currently', 'in the future', 'eventually', 'soon'],
  },

  // punctuation and mechanics
  GoogleEmDash: {},
  GoogleEnDash: {},
  GoogleEllipses: {},
  GooglePeriods: {},
  GoogleRanges: {},
  GoogleOptionalPlurals: {},
  GoogleHeadingPunctuation: {},
  GoogleLyHyphens: {
    // upstream's `\b[^\s-]+ly-\w+\b` matches any word ending in "ly" before a hyphen, so compounds
    // like `read-only-mode` trip it even though "only" is not an adverb here.
    exceptions: ['only-', 'early-', 'family-', 'supply-', 'apply-', 'assembly-', 'anomaly-'],
  },
  RepeatedWords: {},
  GoogleAMPM: {},
  GoogleDateFormat: {},
  Ordinal: {},
};

/** One compiled check. A substitution rule produces one of these per swap entry. */
interface Matcher {
  ruleId: StyleRuleId;
  valeName: string;
  tier: StyleTier;
  pattern: RegExp;
  /** Preferred wording, for substitution rules. May offer alternatives separated by `|`. */
  suggestion?: string;
  message: string;
  link?: string;
  note?: string;
  exceptions: readonly string[];
  skipLines?: RegExp;
  limit: number;
  scope?: string;
}

/** `Grafana.ReferTo` is reported as `style-refer-to`. */
export function toStyleRuleId(valeName: string): StyleRuleId {
  const kebab = valeName
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
  return `style-${kebab}`;
}

function wrap(source: string, nonword: boolean | undefined): string {
  return nonword ? source : `\\b(?:${source})\\b`;
}

function compile(rule: ValeRule): Matcher[] {
  const override = ALLOWED_RULES[rule.name] ?? {};
  const flags = rule.ignorecase ? 'gi' : 'g';
  const base = {
    ruleId: toStyleRuleId(rule.name),
    valeName: rule.name,
    tier: override.tier ?? ('warn' as StyleTier),
    message: rule.message,
    link: rule.link,
    note: override.note,
    exceptions: override.exceptions ?? rule.exceptions ?? [],
    skipLines: override.skipLines,
    limit: override.limit ?? MAX_FINDINGS_PER_RULE_PER_FILE,
    scope: rule.scope,
  };

  if (rule.extends === 'substitution') {
    return Object.entries(rule.swap ?? {}).map(([source, suggestion]) => ({
      ...base,
      pattern: new RegExp(wrap(source, rule.nonword), flags),
      suggestion,
    }));
  }

  if (rule.extends === 'repetition') {
    // upstream tokens are a generic word pattern plus `alpha: true`; the check itself is that a
    // token repeats back to back, which Vale implements internally rather than in the pattern.
    return [{ ...base, pattern: new RegExp('\\b([A-Za-z]+)\\s+\\1\\b', 'gi') }];
  }

  const tokens = override.tokens ?? rule.tokens ?? [];
  if (tokens.length === 0) {
    return [];
  }
  return [{ ...base, pattern: new RegExp(wrap(tokens.join('|'), rule.nonword), flags) }];
}

const MATCHERS: readonly Matcher[] = VALE_RULES.filter((r) => r.name in ALLOWED_RULES).flatMap(compile);

function severityFor(tier: StyleTier): Severity {
  return tier === 'info' ? 'info' : 'warning';
}

/** Fills Vale's `%s` placeholders in order. */
function fill(template: string, args: string[]): string {
  let i = 0;
  return template.replace(/%s/g, () => args[i++] ?? '%s');
}

/**
 * Vale messages are a one-line summary followed by optional explanation. Splits that into the
 * short `title` and longer `detail` the Diagnostic shape expects, keeping the title to a single
 * sentence so it stays readable in the terminal.
 */
function splitMessage(message: string, note?: string): { title: string; detail: string } {
  const [firstBlock, ...restBlocks] = message.trim().split('\n\n');
  const firstLine = firstBlock.split('\n')[0].trim();

  let title = firstLine;
  let spilled = firstBlock.slice(firstLine.length).trim();

  // a long opening line is usually a summary plus a caveat; keep the summary as the title
  if (title.length > 90) {
    const cut = title.search(/(?<=\.)\s/);
    if (cut > 0) {
      spilled = `${title.slice(cut).trim()} ${spilled}`.trim();
      title = title.slice(0, cut).trim();
    }
  }

  const detail = [spilled, ...restBlocks, note].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
  return { title, detail };
}

/** 1-based line numbers of ATX headings outside code fences. */
function getHeadingLines(content: string, codeLines: ReadonlySet<number>): Set<number> {
  const headings = new Set<number>();
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (!codeLines.has(i + 1) && /^#{1,6}\s/.test(lines[i])) {
      headings.add(i + 1);
    }
  }
  return headings;
}

export async function checkWritingStyle(input: ValidationInput): Promise<Diagnostic[]> {
  const diagnostics: Diagnostic[] = [];

  let entries: Dirent[] = [];
  try {
    entries = await readdir(input.docsPath, { recursive: true, withFileTypes: true });
  } catch {
    return diagnostics;
  }

  const mdFiles = entries.filter(
    (e) =>
      e.isFile() &&
      e.name.endsWith('.md') &&
      !isMetaFile(e.name) &&
      !e.parentPath.includes('node_modules') &&
      !e.parentPath.includes('dist')
  );

  for (const entry of mdFiles) {
    const absPath = join(entry.parentPath, entry.name);
    const relPath = relative(input.docsPath, absPath);

    let content: string;
    try {
      content = await readFile(absPath, 'utf-8');
    } catch {
      continue;
    }

    const codeLines = getCodeBlockLines(content);
    const skipLines = getNonProseLines(content);
    const headingLines = getHeadingLines(content, codeLines);
    const lines = content.split('\n');
    const counts = new Map<string, number>();

    for (const matcher of MATCHERS) {
      const raw = matcher.scope === 'raw';
      const matches = matchOutsideCode(content, matcher.pattern, codeLines, {
        maskInlineCode: !raw,
        maskLinkTargets: !raw,
        skipLines,
      });

      for (const { match, line } of matches) {
        if (matcher.scope === 'heading' && !headingLines.has(line)) {
          continue;
        }
        if (matcher.skipLines?.test(lines[line - 1] ?? '')) {
          continue;
        }

        const matched = match[0];
        if (matcher.exceptions.some((e) => matched.includes(e))) {
          continue;
        }
        // substitution patterns often also match the already-correct wording, so do not nag when
        // the text is already what we would suggest
        if (matcher.suggestion?.split('|').includes(matched.trim())) {
          continue;
        }

        const seen = counts.get(matcher.ruleId) ?? 0;
        if (seen >= matcher.limit) {
          continue;
        }
        counts.set(matcher.ruleId, seen + 1);

        const args = matcher.suggestion ? [matcher.suggestion, matched.trim()] : [matched.trim()];
        const { title, detail } = splitMessage(fill(matcher.message, args), matcher.note);

        diagnostics.push({
          rule: matcher.ruleId,
          severity: severityFor(matcher.tier),
          file: relPath,
          line,
          title: title.trim(),
          detail: detail || `Grafana.${matcher.valeName}`,
          ...(matcher.link ? { url: matcher.link } : {}),
        });
      }
    }
  }

  return diagnostics;
}
