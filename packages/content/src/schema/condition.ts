import { z } from "zod";

export interface FlagCondition {
  flag: string;
  equals: boolean | number | string;
}
export interface HasItemCondition {
  hasItem: string;
}
export interface AllOfCondition {
  allOf: Condition[];
}
export interface AnyOfCondition {
  anyOf: Condition[];
}
export interface NotCondition {
  not: Condition;
}

export type Condition =
  | FlagCondition
  | HasItemCondition
  | AllOfCondition
  | AnyOfCondition
  | NotCondition;

export const ConditionSchema: z.ZodType<Condition> = z.lazy(() =>
  z.union([
    z.object({ flag: z.string(), equals: z.union([z.boolean(), z.number(), z.string()]) }),
    z.object({ hasItem: z.string() }),
    z.object({ allOf: z.array(ConditionSchema) }),
    z.object({ anyOf: z.array(ConditionSchema) }),
    z.object({ not: ConditionSchema }),
  ]),
);
