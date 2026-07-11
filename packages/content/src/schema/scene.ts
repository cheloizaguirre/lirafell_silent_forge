import { z } from "zod";
import { HotspotSchema } from "./hotspot";
import { ActionSchema } from "./action";

export const SceneIdSchema = z.enum([
  "entrance",
  "workshop",
  "archive",
  "gallery",
  "vault",
  "spire",
  "prison",
  "prison-corridor",
]);

export type SceneId = z.infer<typeof SceneIdSchema>;

export const SceneSchema = z.object({
  id: SceneIdSchema,
  name: z.string(),
  // background art is a hand-authored React/SVG component, referenced by name;
  // only the interactive/conditional layer (hotspots) is data-driven.
  art: z.object({ component: z.string() }),
  hotspots: z.array(HotspotSchema),
  onEnter: z.array(ActionSchema).optional(),
});

export type Scene = z.infer<typeof SceneSchema>;
