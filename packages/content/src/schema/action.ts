import { z } from "zod";

export interface NavigateAction {
  type: "navigate";
  sceneId: string;
}
export interface ShowTextAction {
  type: "showText";
  text: string;
  tone: "flavor" | "system" | "warn";
  onlyIfFlagUnset?: string;
  onlyIfFlagSet?: string;
  setFlagAfter?: string;
}
export interface OpenPuzzleAction {
  type: "openPuzzle";
  puzzleId: string;
}
export interface PlaceItemAction {
  type: "placeItem";
  itemId: string;
}
export interface ActivateConvergenceAction {
  type: "activateConvergence";
}
export interface RepeatClickAction {
  type: "repeatClick";
  timesRequired: number;
  textsByStep: string[];
  onComplete: Action[];
}

export type Action =
  | NavigateAction
  | ShowTextAction
  | OpenPuzzleAction
  | PlaceItemAction
  | ActivateConvergenceAction
  | RepeatClickAction;

export const ActionSchema: z.ZodType<Action> = z.lazy(() =>
  z.discriminatedUnion("type", [
    z.object({ type: z.literal("navigate"), sceneId: z.string() }),
    z.object({
      type: z.literal("showText"),
      text: z.string(),
      tone: z.enum(["flavor", "system", "warn"]),
      onlyIfFlagUnset: z.string().optional(),
      onlyIfFlagSet: z.string().optional(),
      setFlagAfter: z.string().optional(),
    }),
    z.object({ type: z.literal("openPuzzle"), puzzleId: z.string() }),
    z.object({ type: z.literal("placeItem"), itemId: z.string() }),
    z.object({ type: z.literal("activateConvergence") }),
    z.object({
      type: z.literal("repeatClick"),
      timesRequired: z.number().int().positive(),
      textsByStep: z.array(z.string()),
      onComplete: z.array(ActionSchema),
    }),
  ]),
);
