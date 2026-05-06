import { bridgeActions } from '@/game/bridge/store';
import type { SceneId } from '@/game/scenes/sceneIds';
import { getDevSwitcherScenes } from '@/game/scenes/sceneRegistry';
import { OverlayDialogFrame } from '@/game/overlays/OverlayDialogFrame';
import type { OverlayControllerProps } from '@/game/overlays/types';
import { getDevSwitcherOverlayTargets } from './devSwitcherTargets';
import { getMessages } from '@/shared/i18n';

export default function DevSwitcherOverlay({ close, titleId, descriptionId }: OverlayControllerProps) {
  const messages = getMessages();

  const jumpToScene = (sceneId: SceneId) => {
    bridgeActions.closeOverlay();
    bridgeActions.enterScene(sceneId);
  };

  const jumpToOverlay = (target: ReturnType<typeof getDevSwitcherOverlayTargets>[number]) => {
    bridgeActions.enterScene(target.returnToSceneId);
    bridgeActions.openOverlay(target.id, { returnToSceneId: target.returnToSceneId });
  };

  return (
    <OverlayDialogFrame
      title={messages.gameShell.devSwitcher}
      close={close}
      titleId={titleId}
      descriptionId={descriptionId}
    >
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
        {getDevSwitcherOverlayTargets().map((target) => (
          <button
            key={target.id}
            type="button"
            onClick={() => jumpToOverlay(target)}
            className="rounded border border-[#1a1a1a]/40 bg-white/60 px-2 py-1.5 text-left text-[11px] font-bold uppercase tracking-wide text-[#1a1a1a] hover:bg-white"
          >
            {target.label}
          </button>
        ))}
      </div>
    </OverlayDialogFrame>
  );
}
