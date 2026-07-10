import { z } from "zod";
import { ConditionSchema } from "./condition";
import { ActionSchema } from "./action";

export const HotspotSchema = z.object({
  id: z.string(),
  label: z.string(),
  // percentages, matching the PoC's addHotspot(xPct, yPct, wPct, hPct, ...) geometry
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  w: z.number().min(0).max(100),
  h: z.number().min(0).max(100),
  visibleWhen: ConditionSchema.optional(),
  // Renders as an always-visible labeled chip instead of an invisible hover
  // region. For hotspots with no art underneath them (the corner "Back to
  // ..." exits) -- an invisible box is undiscoverable on touch/projector.
  chip: z.boolean().optional(),
  // a list, not a single action, because most PoC click handlers do more than
  // one thing (e.g. log flavor text, then navigate) — executed in order.
  actions: z.array(ActionSchema).min(1),
});

export type Hotspot = z.infer<typeof HotspotSchema>;
