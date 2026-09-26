import { describe, expect, it } from "vitest";
import demo from "../../contracts/demo/demo.json";
import record from "../../contracts/deployments/studionet.json";
import shape from "../contract-shape.json";
import { DAY, parseClaims, parseExcuses, parseObligation } from "./index";

// The live deployment's own answers, as packages/contracts/scripts/seed.mjs
// read them back from studionet. If the contract ever returned a shape these
// parsers refuse, a client built on this package would break on real data;
// this is where that shows up first.

describe("the parsers accept everything the live deployment returned", () => {
  it("every obligation, with exactly the fields the contract describes", () => {
    for (const o of record.obligations) {
      const parsed = parseObligation(o.obligation);
      expect(Object.keys(parsed).sort()).toEqual(shape.views.obligation.fields);
    }
  });

  it("every excuse and every claim", () => {
    for (const o of record.obligations) {
      expect(parseExcuses({ excuses: o.excuses })).toHaveLength(o.excuses.length);
      expect(parseClaims({ claims: o.claims })).toHaveLength(o.claims.length);
    }
  });

  it("each deadline is the window it opened with, plus exactly the days its rulings granted", () => {
    const windows = [demo.obligation.due_in, demo.short_obligation.due_in];
    record.obligations.forEach((o, k) => {
      const ob = parseObligation(o.obligation);
      const granted = parseClaims({ claims: o.claims }).reduce((sum, c) => sum + c.days_granted, 0);
      expect(ob.days_extended).toBe(granted);
      const due = (Date.parse(ob.due_at) - Date.parse(ob.opened_at)) / 1000;
      expect(due).toBe(windows[k] + granted * DAY);
    });
  });
});
