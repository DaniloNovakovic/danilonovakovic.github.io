import { bridgeActions } from '@/game/bridge/store';
import {
  BASEMENT_SCENE_ID,
  HOBBIES_SCENE_ID,
  OVERWORLD_SCENE_ID,
  type SceneId
} from '@/game/scenes/sceneIds';
import { getDevSwitcherScenes } from '@/game/scenes/sceneRegistry';
import {
  type OverlayId,
  BASEMENT_OVERLAY_IDS,
  HOBBIES_OVERLAY_IDS,
  PORTFOLIO_OVERLAY_IDS
} from '@/game/overlays/overlayIds';
import { PORTFOLIO_OVERLAY_DEFINITIONS } from '@/game/overlays/portfolio/overlayDefinitions';
import { BASEMENT_OVERLAY_DEFINITIONS } from '@/game/scenes/basement/overlayDefinitions';
import { HOBBIES_OVERLAY_DEFINITIONS } from '@/game/scenes/hobbies/overlayDefinitions';

const DEV_SWITCHER_OVERLAYS = [
  ...PORTFOLIO_OVERLAY_DEFINITIONS,
  ...HOBBIES_OVERLAY_DEFINITIONS,
  ...BASEMENT_OVERLAY_DEFINITIONS
].filter((overlay) => overlay.includeInDevSwitcher);

function getDevOverlayReturnSceneId(overlayId: OverlayId): SceneId {
  if ((HOBBIES_OVERLAY_IDS as readonly string[]).includes(overlayId)) return HOBBIES_SCENE_ID;
  if ((BASEMENT_OVERLAY_IDS as readonly string[]).includes(overlayId)) return BASEMENT_SCENE_ID;
  if ((PORTFOLIO_OVERLAY_IDS as readonly string[]).includes(overlayId)) return OVERWORLD_SCENE_ID;
  return OVERWORLD_SCENE_ID;
}

export default function DevSwitcherOverlay() {
  const jumpToScene = (sceneId: SceneId) => {
    bridgeActions.closeOverlay();
    bridgeActions.enterScene(sceneId);
  };

  const jumpToOverlay = (overlayId: OverlayId) => {
    const sceneId = getDevOverlayReturnSceneId(overlayId);
    bridgeActions.enterScene(sceneId);
    bridgeActions.openOverlay(overlayId, { returnToSceneId: sceneId });
  };

  return (
    <div className="grid grid-cols-2 gap-1.5">
      {getDevSwitcherScenes().map((scene) => (
        <button
          key={scene.id}
          type="button"
          onClick={() => jumpToScene(scene.id)}
          className="rounded border border-[#1a1a1a]/40 bg-white/60 px-2 py-1.5 text-left text-[11px] font-bold uppercase tracking-wide text-[#1a1a1a] hover:bg-white"
        >
          {scene.title}
        </button>
      ))}
      {DEV_SWITCHER_OVERLAYS.map((overlay) => (
        <button
          key={overlay.id}
          type="button"
          onClick={() => jumpToOverlay(overlay.id)}
          className="rounded border border-[#1a1a1a]/40 bg-white/60 px-2 py-1.5 text-left text-[11px] font-bold uppercase tracking-wide text-[#1a1a1a] hover:bg-white"
        >
          {overlay.title}
        </button>
      ))}
    </div>
  );
}
