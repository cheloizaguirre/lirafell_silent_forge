import type { ComponentType } from "react";
import { EntranceArtPixel } from "../scenes/pixel/EntranceArtPixel";
import { WorkshopArt } from "../scenes/WorkshopArt";
import { GalleryArt } from "../scenes/GalleryArt";
import { ArchiveArt } from "../scenes/ArchiveArt";
import { VaultArtPixel } from "../scenes/pixel/VaultArtPixel";
import { SpireArt } from "../scenes/SpireArt";
import { PrisonArt } from "../scenes/PrisonArt";
import type { ArtProps } from "../scenes/artTypes";

// Maps a scene's content-authored `art.component` string to the actual
// hand-authored art component. Add an entry here whenever a new scene's
// art component is built.
export const sceneRegistry: Record<string, ComponentType<ArtProps>> = {
  // proto-vault-8bit: pixel prototypes stand in for the SVG originals, one
  // entry at a time -- swap back to ../scenes/<Name>Art to compare.
  EntranceArt: EntranceArtPixel,
  WorkshopArt,
  GalleryArt,
  ArchiveArt,
  VaultArt: VaultArtPixel,
  SpireArt,
  PrisonArt,
};
