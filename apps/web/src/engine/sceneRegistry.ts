import type { ComponentType } from "react";
import { EntranceArt } from "../scenes/EntranceArt";
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
  EntranceArt,
  WorkshopArt,
  GalleryArt,
  ArchiveArt,
  // proto-vault-8bit: the pixel prototype stands in for the SVG VaultArt.
  // Scene migration happens here, one entry at a time -- swap back to
  // ../scenes/VaultArt to compare.
  VaultArt: VaultArtPixel,
  SpireArt,
  PrisonArt,
};
