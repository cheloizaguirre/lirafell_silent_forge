import { SceneSchema } from "./schema/scene";
import { PuzzleContentSchema } from "./schema/puzzle";
import { scenes } from "./data/scenes";
import { puzzles } from "./data/puzzles";

let hasError = false;

const sceneIds = new Set<string>();
for (const scene of scenes) {
  const result = SceneSchema.safeParse(scene);
  if (!result.success) {
    hasError = true;
    console.error(`✗ scene "${scene.id}" failed validation:`);
    console.error(result.error.format());
    continue;
  }
  if (sceneIds.has(scene.id)) {
    hasError = true;
    console.error(`✗ duplicate scene id "${scene.id}"`);
  }
  sceneIds.add(scene.id);
}

const puzzleIds = new Set<string>();
for (const puzzle of puzzles) {
  const result = PuzzleContentSchema.safeParse(puzzle);
  if (!result.success) {
    hasError = true;
    console.error(`✗ puzzle "${puzzle.id}" failed validation:`);
    console.error(result.error.format());
    continue;
  }
  if (puzzleIds.has(puzzle.id)) {
    hasError = true;
    console.error(`✗ duplicate puzzle id "${puzzle.id}"`);
  }
  if (!sceneIds.has(puzzle.sceneId)) {
    hasError = true;
    console.error(`✗ puzzle "${puzzle.id}" references unknown scene "${puzzle.sceneId}"`);
  }
  puzzleIds.add(puzzle.id);
}

// cross-check: every openPuzzle action references a puzzle that actually exists
for (const scene of scenes) {
  for (const hotspot of scene.hotspots) {
    for (const action of hotspot.actions) {
      if (action.type === "openPuzzle" && !puzzleIds.has(action.puzzleId)) {
        hasError = true;
        console.error(
          `✗ scene "${scene.id}" hotspot "${hotspot.id}" references unknown puzzle "${action.puzzleId}"`,
        );
      }
    }
  }
}

if (hasError) {
  console.error(`\ncontent validation FAILED`);
  process.exit(1);
} else {
  console.log(`✓ content valid: ${scenes.length} scenes, ${puzzles.length} puzzles`);
}
