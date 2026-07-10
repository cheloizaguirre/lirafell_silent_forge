import { useEffect } from "react";
import { scenes } from "@silent-forge/content";
import type { Hotspot } from "@silent-forge/content";
import { sceneRegistry } from "./sceneRegistry";
import { HotspotLayer } from "./HotspotLayer";
import { evaluateCondition } from "./conditions";
import { dispatchActions } from "./actionDispatch";
import type { FlagValue } from "../lib/sessionApi";

export function SceneRenderer({
  sceneId,
  sessionId,
  flags,
  inventory,
  log,
  openPuzzle,
}: {
  sceneId: string;
  sessionId: string;
  flags: Record<string, FlagValue>;
  inventory: string[];
  log: (text: string, tone: "flavor" | "system" | "warn") => void;
  openPuzzle: (puzzleId: string) => void;
}) {
  const scene = scenes.find((s) => s.id === sceneId);

  useEffect(() => {
    if (scene?.onEnter?.length) {
      void dispatchActions(scene.onEnter, { sessionId, log, openPuzzle });
    }
    // only re-fire when the scene actually changes, not on every log/openPuzzle identity change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneId]);

  if (!scene) {
    return <div className="scene-container">Unknown scene: {sceneId}</div>;
  }

  const ArtComponent = sceneRegistry[scene.art.component];
  const ctx = { flags, inventory };
  const visibleHotspots = scene.hotspots.filter(
    (h) => !h.visibleWhen || evaluateCondition(h.visibleWhen, ctx),
  );

  const handleActivate = (hotspot: Hotspot) => {
    void dispatchActions(hotspot.actions, { sessionId, log, openPuzzle });
  };

  return (
    <div className="scene-container">
      {ArtComponent && <ArtComponent flags={flags} inventory={inventory} />}
      <HotspotLayer hotspots={visibleHotspots} onActivate={handleActivate} />
    </div>
  );
}
