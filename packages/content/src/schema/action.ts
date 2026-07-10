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
export interface ArmSpireAction {
  type: "armSpire";
  successText: string;
  alreadyArmedText: string;
}
export interface VentOverflowAction {
  type: "ventOverflow";
  successText: string;
  alreadyVentedText: string;
}
export interface ActivateConvergenceAction {
  type: "activateConvergence";
  successText: string;
  // On refusal the dispatcher composes: resistPrefix + joined missingTexts.
  // Which parts are missing comes from the server's re-check, never from
  // client-side flag evaluation alone.
  resistPrefix: string;
  missingTexts: { armed: string; vented: string; aligned: string };
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
  | ArmSpireAction
  | VentOverflowAction
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
    z.object({
      type: z.literal("armSpire"),
      successText: z.string(),
      alreadyArmedText: z.string(),
    }),
    z.object({
      type: z.literal("ventOverflow"),
      successText: z.string(),
      alreadyVentedText: z.string(),
    }),
    z.object({
      type: z.literal("activateConvergence"),
      successText: z.string(),
      resistPrefix: z.string(),
      missingTexts: z.object({
        armed: z.string(),
        vented: z.string(),
        aligned: z.string(),
      }),
    }),
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
