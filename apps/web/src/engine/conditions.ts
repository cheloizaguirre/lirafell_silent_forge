import type { Condition } from "@silent-forge/content";

export interface EvalContext {
  flags: Record<string, boolean | number | string>;
  inventory: string[];
}

export function evaluateCondition(condition: Condition, ctx: EvalContext): boolean {
  if ("flag" in condition) {
    // an unset flag reads as `false`, matching the PoC's `state.flags.xyz`
    // being `undefined` by default until something sets it.
    const actual = condition.flag in ctx.flags ? ctx.flags[condition.flag] : false;
    return actual === condition.equals;
  }
  if ("hasItem" in condition) {
    return ctx.inventory.includes(condition.hasItem);
  }
  if ("allOf" in condition) {
    return condition.allOf.every((c) => evaluateCondition(c, ctx));
  }
  if ("anyOf" in condition) {
    return condition.anyOf.some((c) => evaluateCondition(c, ctx));
  }
  return !evaluateCondition(condition.not, ctx);
}
