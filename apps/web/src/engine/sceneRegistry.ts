import type { ComponentType } from "react";
import { EntranceArtPixel } from "../scenes/pixel/EntranceArtPixel";
import { WorkshopArtPixel } from "../scenes/pixel/WorkshopArtPixel";
import { GalleryArt } from "../scenes/GalleryArt";
import { ArchiveArtPixel } from "../scenes/pixel/ArchiveArtPixel";
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
  WorkshopArt: WorkshopArtPixel,
  GalleryArt,
  ArchiveArt: ArchiveArtPixel,
  VaultArt: VaultArtPixel,
  SpireArt,
  PrisonArt,
};
