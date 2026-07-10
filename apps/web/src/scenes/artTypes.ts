import type { FlagValue } from "../lib/sessionApi";

export interface ArtProps {
  flags: Record<string, FlagValue>;
  inventory: string[];
}
