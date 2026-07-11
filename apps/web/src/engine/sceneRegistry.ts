import type { ComponentType } from "react";
import { EntranceArtPixel } from "../scenes/pixel/EntranceArtPixel";
import { WorkshopArtPixel } from "../scenes/pixel/WorkshopArtPixel";
import { GalleryArtPixel } from "../scenes/pixel/GalleryArtPixel";
import { ArchiveArtPixel } from "../scenes/pixel/ArchiveArtPixel";
import { VaultArtPixel } from "../scenes/pixel/VaultArtPixel";
import { SpireArtPixel } from "../scenes/pixel/SpireArtPixel";
import { PrisonArtPixel, PrisonCorridorArtPixel } from "../scenes/pixel/PrisonArtPixel";
import type { ArtProps } from "../scenes/artTypes";

// Maps a scene's content-authored `art.component` string to the actual
// hand-authored art component. Add an entry here whenever a new scene's
// art component is built.
export const sceneRegistry: Record<string, ComponentType<ArtProps>> = {
  // proto-vault-8bit: pixel prototypes stand in for the SVG originals, one
  // entry at a time -- swap back to ../scenes/<Name>Art to compare.
  EntranceArt: EntranceArtPixel,
  WorkshopArt: WorkshopArtPixel,
  GalleryArt: GalleryArtPixel,
  ArchiveArt: ArchiveArtPixel,
  VaultArt: VaultArtPixel,
  SpireArt: SpireArtPixel,
  PrisonArt: PrisonArtPixel,
  PrisonCorridorArt: PrisonCorridorArtPixel,
};
