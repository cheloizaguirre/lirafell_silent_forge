import type { Action } from "@silent-forge/content";
import {
  activateConvergence,
  armSpire,
  escapePrison,
  placeItem,
  setCurrentScene,
  setPartyFlag,
  ventOverflow,
} from "../lib/sessionApi";
import type { FlagValue } from "../lib/sessionApi";
import { useSessionStore } from "../state/useSessionStore";
import { evaluateCondition } from "./conditions";

export interface DispatchContext {
  sessionId: string;
  // Party-shared state (session_state row) at dispatch time; showText `when`
  // conditions evaluate against THIS, never against localFlags.
  flags: Record<string, FlagValue>;
  inventory: string[];
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
      if (
        action.when &&
        !evaluateCondition(action.when, { flags: ctx.flags, inventory: ctx.inventory })
      ) {
        return;
      }
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

    case "setPartyFlag":
      // Allowlisted server-side; the reveal itself arrives via realtime.
      await setPartyFlag(ctx.sessionId, action.flag);
      return;

    case "pulse":
      useSessionStore.getState().triggerPulse(action.id);
      return;

    case "armSpire": {
      const result = await armSpire(ctx.sessionId);
      if (result.already_armed) {
        // Race: someone else threw the lever between our render and our click.
        ctx.log(action.alreadyArmedText, "flavor");
      } else {
        ctx.log(action.successText, "warn");
      }
      return;
    }

    case "ventOverflow": {
      const result = await ventOverflow(ctx.sessionId);
      if (result.already_vented) {
        ctx.log(action.alreadyVentedText, "flavor");
      } else {
        ctx.log(action.successText, "system");
      }
      return;
    }

    case "activateConvergence": {
      // The server re-checks armed/vented/aligned; its verdict (not local
      // flag state, which may lag realtime) decides which text we narrate.
      const result = await activateConvergence(ctx.sessionId);
      if (result.ok) {
        ctx.log(action.successText, "system");
      } else {
        const parts = (result.missing ?? []).map((m) => action.missingTexts[m]);
        ctx.log(`${action.resistPrefix}${parts.join("; ")}.`, "warn");
      }
      return;
    }
  }
}
