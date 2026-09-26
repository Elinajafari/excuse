/**
 * Types and pure rules shared by the Excuse contract (packages/contracts/excuse.py)
 * and any client that reads it: a script, a bot, another app.
 *
 * Two kinds of thing live here:
 *
 *   1. The SHAPE of what the contract's views return, with parsers that
 *      refuse anything else. genlayer-js 1.1.8 returns plain objects with
 *      number fields (measured on studionet); older builds returned Map, so
 *      the parsers accept both.
 *
 *   2. A PORT of the contract's deterministic rules: how caller text is
 *      cleaned, how the pipe-joined excuses and days are read, how a model's
 *      answer is read, and how the two presentation orders fold into one
 *      ruling. A port that disagrees with the contract is worse than none, so
 *      it is tested against excuse-vectors.json, which is generated FROM the
 *      contract's own functions and read by its Python tests too.
 */

// ---------------------------------------------------------------- tokens

export const NONE = "none" as const;
export const STATUSES = ["open", "kept", "breached"] as const;
export type Status = (typeof STATUSES)[number];
/** The frozen index of the excuse a claim was ruled to describe, "none", or "" before the ruling. */
export type Ruling = string;

export const MAX_EXCUSES = 6;
export const MIN_EXCUSE = 8;
export const MAX_EXCUSE = 160;
export const MIN_DAYS = 1;
export const MAX_DAYS = 90;
export const MIN_TITLE = 2;
export const MAX_TITLE = 120;
export const MIN_DUTY = 8;
export const MAX_DUTY = 300;
export const MIN_ACCOUNT = 40;
export const MAX_ACCOUNT = 1500;
export const MAX_CLAIMS = 2;
export const MIN_WINDOW = 60;
export const MAX_WINDOW = 365 * 86400;
export const DAY = 86400;

// ---------------------------------------------------------------- shapes

export interface Obligation {
  title: string;
  duty: string;
  obligee: string;
  obligor: string;
  status: Status;
  opened_at: string;
  due_at: string;
  days_extended: number;
  claims: number;
  pending: boolean;
  grace_ends: string;
  closed_at: string;
}

export interface Excuse {
  index: number;
  obligation: number;
  text: string;
  days: number;
  /** 1-based claim that used it; 0 = unused */
  used_by: number;
}

export interface Claim {
  id: number;
  obligation: number;
  seq: number;
  by: string;
  account: string;
  at: string;
  ruled: boolean;
  ruling: Ruling;
  days_granted: number;
  /** leader-supplied and NOT part of consensus */
  why: string;
  reason_is_leader_supplied: boolean;
}

type Raw = Record<string, unknown>;

function record(v: unknown): Raw | null {
  if (v instanceof Map) return Object.fromEntries(v.entries()) as Raw;
  if (v && typeof v === "object" && !Array.isArray(v)) return v as Raw;
  return null;
}

function num(v: unknown): number {
  const n = Number(v);
  if (!Number.isFinite(n)) throw new Error(`expected a number, got ${String(v)}`);
  return n;
}

function str(v: unknown): string {
  if (typeof v !== "string") throw new Error(`expected a string, got ${typeof v}`);
  return v;
}

function bool(v: unknown): boolean {
  if (typeof v !== "boolean") throw new Error(`expected a boolean, got ${typeof v}`);
  return v;
}

function oneOf<T extends string>(v: unknown, allowed: readonly T[], what: string): T {
  const s = str(v);
  if (!(allowed as readonly string[]).includes(s)) throw new Error(`unexpected ${what}: ${s}`);
  return s as T;
}

function rulingOf(v: unknown): Ruling {
  const s = str(v);
  if (s === "" || s === NONE || /^\d{1,2}$/.test(s)) return s;
  throw new Error(`unexpected ruling: ${s}`);
}

export function parseObligation(v: unknown): Obligation {
  const r = record(v);
  if (!r) throw new Error("obligation is not an object");
  return {
    title: str(r.title),
    duty: str(r.duty),
    obligee: str(r.obligee),
    obligor: str(r.obligor),
    status: oneOf(r.status, STATUSES, "status"),
    opened_at: str(r.opened_at),
    due_at: str(r.due_at),
    days_extended: num(r.days_extended),
    claims: num(r.claims),
    pending: bool(r.pending),
    grace_ends: str(r.grace_ends),
    closed_at: str(r.closed_at),
  };
}

export function parseExcuses(v: unknown): Excuse[] {
  const r = record(v);
  const rows = r ? r.excuses : null;
  if (!Array.isArray(rows)) throw new Error("excuses_of did not return a list");
  return rows.map((row) => {
    const e = record(row);
    if (!e) throw new Error("excuse is not an object");
    return { index: num(e.index), obligation: num(e.obligation), text: str(e.text), days: num(e.days), used_by: num(e.used_by) };
  });
}

export function parseClaims(v: unknown): Claim[] {
  const r = record(v);
  const rows = r ? r.claims : null;
  if (!Array.isArray(rows)) throw new Error("claims_of did not return a list");
  return rows.map((row) => {
    const c = record(row);
    if (!c) throw new Error("claim is not an object");
    return {
      id: num(c.id),
      obligation: num(c.obligation),
      seq: num(c.seq),
      by: str(c.by),
      account: str(c.account),
      at: str(c.at),
      ruled: bool(c.ruled),
      ruling: rulingOf(c.ruling),
      days_granted: num(c.days_granted),
      why: str(c.why),
      reason_is_leader_supplied: Boolean(c.reason_is_leader_supplied),
    };
  });
}

export function parseStatus(v: unknown): Status {
  return oneOf(v, STATUSES, "status");
}

// ---------------------------------------------------------------- the port

/** Python's str.split() whitespace, as far as cleaned text can contain it:
 * JavaScript's \s plus NEL (U+0085), which Python splits on and \s does not. */
const PY_WS = /[\s\u0085]+/;

/** The contract's clean_text: control characters become spaces, whitespace
 * collapses, nothing is truncated. */
export function cleanText(raw: string): string {
  let out = "";
  for (const ch of raw) {
    const o = ch.codePointAt(0) ?? 0;
    out += o < 32 || o === 127 ? " " : ch;
  }
  return out.split(PY_WS).filter(Boolean).join(" ");
}

/** Pipe-joined items, cleaned. Empty items are KEPT, so a missing excuse
 * cannot shift every excuse after it onto the wrong number of days. */
export function splitList(text: string): string[] {
  return text.split("|").map(cleanText);
}

/** Pipe-joined whole days, or null if any is not a plain whole number of at
 * most three digits. */
export function parseDays(text: string): number[] | null {
  const out: number[] = [];
  for (const part of splitList(text)) {
    if (part === "" || part.length > 3 || !/^[0-9]+$/.test(part)) return null;
    out.push(Number(part));
  }
  return out;
}

/** Python's str.strip(chars): remove any of `chars` from both ends. */
function stripChars(s: string, chars: string): string {
  let a = 0;
  let b = s.length;
  while (a < b && chars.includes(s[a])) a++;
  while (b > a && chars.includes(s[b - 1])) b--;
  return s.slice(a, b);
}

/** A model's answer as a row number 0..n-1, "none", or "" if it is neither.
 * Brackets and a leading # are tolerated; words are not. */
export function normaliseChoice(raw: string, n: number): string {
  const s = stripChars(raw.trim().toLowerCase(), "[]()#").trim();
  if (s === NONE) return NONE;
  if (s === "" || s.length > 2 || !/^[0-9]+$/.test(s)) return "";
  const k = Number(s);
  if (k < 0 || k >= n) return "";
  return String(k);
}

/** A row number from the reversed list, back into the forward list. */
export function unreverse(choice: string, n: number): string {
  if (choice === NONE || choice === "") return choice;
  return String(n - 1 - Number(choice));
}

/** Both orders into one ruling. The same excuse stands; anything else is none. */
export function fold(forward: string, reverseUnreversed: string): string {
  if (forward === "" || reverseUnreversed === "") return "";
  return forward === reverseUnreversed ? forward : NONE;
}

/** The validator's free check: none, or the index of an excuse that was asked about. */
export function rulingSound(ruling: string, asked: number[]): boolean {
  if (ruling === NONE) return true;
  if (ruling === "" || !/^[0-9]+$/.test(ruling)) return false;
  return asked.includes(Number(ruling));
}

/** Length as Python's len() counts it: code points, not UTF-16 units. */
export function pyLen(s: string): number {
  return [...s].length;
}

function looksLikeAddress(raw: string): boolean {
  return /^0[xX][0-9a-fA-F]{40}$/.test(raw.trim());
}

/** Why open() would refuse these values before touching storage, or "".
 * (It also refuses an obligor equal to the caller, which only the chain knows.) */
export function openRefusal(title: string, duty: string, obligor: string, dueIn: number,
                            excuses: string[], days: number[]): string {
  const t = cleanText(title);
  const d = cleanText(duty);
  if (pyLen(t) < MIN_TITLE || pyLen(t) > MAX_TITLE) return `a title is ${MIN_TITLE} to ${MAX_TITLE} characters`;
  if (pyLen(d) < MIN_DUTY || pyLen(d) > MAX_DUTY) return `a duty is ${MIN_DUTY} to ${MAX_DUTY} characters`;
  const names = splitList(excuses.join("|"));
  const counts = parseDays(days.map(String).join("|"));
  if (names.length > MAX_EXCUSES) return `an obligation lists at most ${MAX_EXCUSES} excuses`;
  for (const name of names) {
    if (pyLen(name) < MIN_EXCUSE || pyLen(name) > MAX_EXCUSE) return `an excuse is ${MIN_EXCUSE} to ${MAX_EXCUSE} characters`;
  }
  if (new Set(names.map((n) => n.toLowerCase())).size !== names.length) return "two excuses with the same wording cannot be told apart";
  if (counts === null || counts.length !== names.length) return "give one whole number of days per excuse, pipe joined";
  for (const c of counts) {
    if (c < MIN_DAYS || c > MAX_DAYS) return `an excuse is worth ${MIN_DAYS} to ${MAX_DAYS} days`;
  }
  if (!looksLikeAddress(obligor)) return "the obligor is not a 20 byte hex address";
  if (dueIn < MIN_WINDOW || dueIn > MAX_WINDOW) return `the deadline is ${MIN_WINDOW} to ${MAX_WINDOW} seconds away`;
  return "";
}

/** Why claim() would refuse this account's length, or "". */
export function accountRefusal(account: string): string {
  const body = cleanText(account);
  if (pyLen(body) < MIN_ACCOUNT || pyLen(body) > MAX_ACCOUNT) return `an account is ${MIN_ACCOUNT} to ${MAX_ACCOUNT} characters`;
  return "";
}
