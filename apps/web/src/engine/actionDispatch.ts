import type { Action } from "@silent-forge/content";
import { escapePrison, placeItem, setCurrentScene } from "../lib/sessionApi";
import { useSessionStore } from "../state/useSessionStore";

export interface DispatchContext {
  sessionId: string;
  log: (text: string, tone: "flavor" | "system" | "warn") => void;
  openPuzzle: (puzzleId: string) => void;
}

// Routes hotspot actions to either a local effect (UI-only: opening a puzzle
// panel, appending to the flavor-text log) or a server RPC. `navigate` is a
// server round-trip, not a local store write, even though it feels purely
// client-side -- current_scene_id lives in `players` so the DM view and
// other party members' clients see it, and a refresh resumes correctly.
export async function dispatchActions(actions: Action[], ctx: DispatchContext): Promise<void> {
  for (const action of actions) {
    await dispatchOne(action, ctx);
  }
}

async function dispatchOne(action: Action, ctx: DispatchContext): Promise<void> {
  const { localFlags, markLocalFlag } = useSessionStore.getState();

  switch (action.type) {
    case "navigate":
      await setCurrentScene(ctx.sessionId, action.sceneId);
      return;

    case "showText": {
      if (action.onlyIfFlagUnset && localFlags.has(action.onlyIfFlagUnset)) return;
      if (action.onlyIfFlagSet && !localFlags.has(action.onlyIfFlagSet)) return;
      ctx.log(action.text, action.tone);
      if (action.setFlagAfter) markLocalFlag(action.setFlagAfter);
      return;
    }

    case "openPuzzle":
      ctx.openPuzzle(action.puzzleId);
      return;

    case "placeItem": {
      const result = await placeItem(ctx.sessionId, action.itemId);
      if (!result.ok) {
        ctx.log(action.missingText ?? "You don't have that yet.", "flavor");
      } else if (result.all_placed && action.allPlacedText) {
        ctx.log(action.allPlacedText, "system");
      } else if (action.successText) {
        ctx.log(action.successText, "flavor");
      }
      return;
    }

    case "repeatClick": {
      const { bumpLocalCounter, resetLocalCounter } = useSessionStore.getState();
      const count = bumpLocalCounter(action.counterId);
      const stepText = action.textsByStep[Math.min(count, action.textsByStep.length) - 1];
      if (stepText) ctx.log(stepText, count >= action.timesRequired ? "system" : "flavor");
      if (count >= action.timesRequired) {
        resetLocalCounter(action.counterId);
        await dispatchActions(action.onComplete, ctx);
      }
      return;
    }

    case "escapePrison":
      // Scene change + party noise reset arrive via realtime; nothing local.
      await escapePrison(ctx.sessionId);
      return;

    case "activateConvergence":
      // Spire/convergence -- Phase 3, not built yet.
      ctx.log("Nothing happens yet -- this part of the quest isn't built.", "flavor");
      return;
  }
}
