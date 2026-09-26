import { describe, expect, it } from "vitest";
import vectors from "../excuse-vectors.json";
import {
  accountRefusal,
  cleanText,
  fold,
  normaliseChoice,
  openRefusal,
  parseClaims,
  parseDays,
  parseExcuses,
  parseObligation,
  parseStatus,
  pyLen,
  rulingSound,
  splitList,
  unreverse,
} from "./index";

// excuse-vectors.json is generated from the contract's own functions
// (see packages/contracts/tests/test_vectors.py), so every case below is the
// contract's answer, not a hand-written expectation.

describe("the port agrees with the contract on every vector", () => {
  it.each(vectors.clean_text)("clean_text %#", ({ raw, clean }) => expect(cleanText(raw)).toBe(clean));
  it.each(vectors.split_list)("split_list %#", ({ text, items }) => expect(splitList(text)).toEqual(items));
  it.each(vectors.parse_days)("parse_days %#", ({ text, days }) => expect(parseDays(text)).toEqual(days));
  it.each(vectors.normalise_choice)("normalise_choice %#", ({ raw, n, choice }) => expect(normaliseChoice(raw, n)).toBe(choice));
  it.each(vectors.unreverse)("unreverse %#", ({ choice, n, back }) => expect(unreverse(choice, n)).toBe(back));
  it.each(vectors.fold)("fold %#", ({ forward, reverse, folded }) => expect(fold(forward, reverse)).toBe(folded));
  it.each(vectors.ruling_sound)("ruling_sound %#", ({ ruling, asked, sound }) => expect(rulingSound(ruling, asked)).toBe(sound));
});

describe("lengths are counted as the contract counts them", () => {
  it("a character outside the BMP is one character, as in Python", () => {
    expect(pyLen("🚚")).toBe(1);
    expect("🚚".length).toBe(2);
  });
});

describe("the client-side refusals mirror the contract's", () => {
  const obligor = "0x" + "22".repeat(20);
  const excuses = ["a strike that stops carriers on the route", "a storm that closes the port"];
  it("accepts a well formed obligation", () => {
    expect(openRefusal("Catalogue delivery", "Deliver 400 catalogues to stand B12.", obligor, 3600, excuses, [3, 2])).toBe("");
  });
  it.each([
    ["x", "Deliver 400 catalogues.", obligor, 3600, excuses, [3, 2], "a title is 2 to 120"],
    ["Title", "short", obligor, 3600, excuses, [3, 2], "a duty is 8 to 300"],
    ["Title", "Deliver 400 catalogues.", obligor, 3600, ["too short", "tiny"], [3, 2], "an excuse is 8 to 160"],
    ["Title", "Deliver 400 catalogues.", obligor, 3600, [excuses[0], excuses[0].toUpperCase()], [3, 2], "the same wording"],
    ["Title", "Deliver 400 catalogues.", obligor, 3600, excuses, [3], "one whole number of days per excuse"],
    ["Title", "Deliver 400 catalogues.", obligor, 3600, excuses, [3, 91], "worth 1 to 90 days"],
    ["Title", "Deliver 400 catalogues.", "0x1234", 3600, excuses, [3, 2], "not a 20 byte hex address"],
    ["Title", "Deliver 400 catalogues.", obligor, 59, excuses, [3, 2], "60 to 31536000 seconds"],
    ["Title", "Deliver 400 catalogues.", obligor, 3600, Array.from({ length: 7 }, (_, k) => `excuse number ${k}`), [1, 1, 1, 1, 1, 1, 1], "at most 6 excuses"],
  ])("refuses %s / %s", (t, d, who, due, ex, days, msg) => {
    expect(openRefusal(t as string, d as string, who as string, due as number, ex as string[], days as number[])).toContain(msg);
  });
  it("bounds an account", () => {
    expect(accountRefusal("too short")).toContain("an account is 40 to 1500");
    expect(accountRefusal("A national port strike stopped every carrier on the route for two days.")).toBe("");
  });
});

describe("parsers refuse what the contract never returns", () => {
  const ob = {
    title: "t", duty: "d", obligee: "0x" + "11".repeat(20), obligor: "0x" + "22".repeat(20), status: "open",
    opened_at: "2026-09-24T12:52:19Z", due_at: "2026-09-24T13:52:19Z", days_extended: 0, claims: 0,
    pending: false, grace_ends: "2026-09-24T13:57:19Z", closed_at: "",
  };
  it("parses an obligation, from an object or a Map", () => {
    expect(parseObligation(ob).status).toBe("open");
    expect(parseObligation(new Map(Object.entries(ob))).claims).toBe(0);
  });
  it("refuses an unknown status", () => {
    expect(() => parseObligation({ ...ob, status: "extended" })).toThrow("unexpected status");
    expect(() => parseStatus("late")).toThrow();
  });
  it("parses excuses and claims, and refuses a ruling that is neither an index nor none", () => {
    const e = { index: 0, obligation: 0, text: "a strike", days: 3, used_by: 0 };
    expect(parseExcuses({ excuses: [e] })[0].days).toBe(3);
    const c = { id: 0, obligation: 0, seq: 1, by: "0x" + "22".repeat(20), account: "a", at: "t", ruled: true,
      ruling: "0", days_granted: 3, why: "", reason_is_leader_supplied: true };
    expect(parseClaims({ claims: [c] })[0].ruling).toBe("0");
    expect(parseClaims({ claims: [{ ...c, ruling: "none" }] })[0].ruling).toBe("none");
    expect(() => parseClaims({ claims: [{ ...c, ruling: "strike" }] })).toThrow("unexpected ruling");
    expect(() => parseExcuses({})).toThrow("did not return a list");
  });
});
