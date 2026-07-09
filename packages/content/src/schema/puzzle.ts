import { z } from "zod";

// NOTE: puzzle *answers* deliberately do not live in this schema or in any
// content authored against it. Answers live only in Supabase RPC migrations
// (see supabase/migrations) so they are never shipped in client-bundled JS/JSON.
// The `id` here is the shared key the client uses to call submit_puzzle_attempt(puzzle_id, value).

const PuzzleBase = z.object({
  id: z.string(),
  sceneId: z.string(),
  title: z.string(),
  prompt: z.string(),
  onFailNoise: z.number().int().min(0).default(0),
  // Logged on a wrong attempt. Elimination puzzles use per-option
  // wrongFlavor instead; dial/sequence puzzles have one shared line.
  wrongText: z.string().optional(),
  // Logged on the correct attempt (the reveal moment).
  solvedText: z.string().optional(),
});

export const EliminationPuzzleSchema = PuzzleBase.extend({
  kind: z.literal("elimination"),
  options: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        wrongFlavor: z.string(),
      }),
    )
    .min(2),
});

export const NumericDialPuzzleSchema = PuzzleBase.extend({
  kind: z.literal("numeric-dial"),
  dials: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        min: z.number().int(),
        max: z.number().int(),
      }),
    )
    .min(1),
  submitLabel: z.string().default("Test"),
});

export const OrderedSequencePuzzleSchema = PuzzleBase.extend({
  kind: z.literal("ordered-sequence"),
  items: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
      }),
    )
    .min(2),
  sequenceLength: z.number().int().positive(),
});

export const PuzzleContentSchema = z.discriminatedUnion("kind", [
  EliminationPuzzleSchema,
  NumericDialPuzzleSchema,
  OrderedSequencePuzzleSchema,
]);

export type PuzzleContent = z.infer<typeof PuzzleContentSchema>;
export type EliminationPuzzleContent = z.infer<typeof EliminationPuzzleSchema>;
export type NumericDialPuzzleContent = z.infer<typeof NumericDialPuzzleSchema>;
export type OrderedSequencePuzzleContent = z.infer<typeof OrderedSequencePuzzleSchema>;
