import type { ComponentType } from "react";
import { EntranceArt } from "../scenes/EntranceArt";
import { WorkshopArt } from "../scenes/WorkshopArt";
import { GalleryArt } from "../scenes/GalleryArt";
import type { ArtProps } from "../scenes/artTypes";

// Maps a scene's content-authored `art.component` string to the actual
// hand-authored art component. Add an entry here whenever a new scene's
// art component is built (Archive/Vault/Spire/Prison in later phases).
export const sceneRegistry: Record<string, ComponentType<ArtProps>> = {
  EntranceArt,
  WorkshopArt,
  GalleryArt,
};
