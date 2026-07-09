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
  successText?: string;
  missingText?: string;
  allPlacedText?: string;
}
export interface ActivateConvergenceAction {
  type: "activateConvergence";
}
export interface RepeatClickAction {
  type: "repeatClick";
  counterId: string;
  timesRequired: number;
  textsByStep: string[];
  onComplete: Action[];
}
export interface EscapePrisonAction {
  type: "escapePrison";
}

export type Action =
  | NavigateAction
  | ShowTextAction
  | OpenPuzzleAction
  | PlaceItemAction
  | ActivateConvergenceAction
  | RepeatClickAction
  | EscapePrisonAction;

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
    z.object({
      type: z.literal("placeItem"),
      itemId: z.string(),
      successText: z.string().optional(),
      missingText: z.string().optional(),
      allPlacedText: z.string().optional(),
    }),
    z.object({ type: z.literal("activateConvergence") }),
    z.object({
      type: z.literal("repeatClick"),
      counterId: z.string(),
      timesRequired: z.number().int().positive(),
      textsByStep: z.array(z.string()),
      onComplete: z.array(ActionSchema),
    }),
    z.object({ type: z.literal("escapePrison") }),
  ]),
);
