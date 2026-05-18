import { useEffect } from 'react';
import Game from '@/game/shell/Game';
import { bridgeActions, useBridgeState } from '@/game/bridge/store';
import { RIDGE_SCENE_ID } from '@/game/scenes/sceneIds';
import type { RidgeDevControls } from '@/game/scenes/ridge/runtime/ridgeDevControls';

export function RidgeRuntimePreview({
  previewZoom,
  ridgeDevControls
}: {
  previewZoom: number;
  ridgeDevControls: RidgeDevControls;
}) {
  const bridge = useBridgeState();

  useEffect(function bootRidgePreviewScene() {
    bridgeActions.closeOverlay();
    bridgeActions.clearSceneUi();
    bridgeActions.setSceneLoading(null);
    bridgeActions.resetTouch();
    bridgeActions.enterScene(RIDGE_SCENE_ID);

    return () => {
      bridgeActions.resetTouch();
      bridgeActions.closeOverlay();
      bridgeActions.clearSceneUi();
      bridgeActions.returnToOverworld();
    };
  }, []);

  return (
    <section
      className="relative min-h-0 min-w-0 overflow-hidden border-4 border-[#1a1a1a] bg-[#fbfbf9] shadow-[7px_7px_0_rgba(26,26,26,1)]"
      data-testid="ridge-runtime-preview"
    >
      <div className="absolute left-3 top-3 z-20 border-2 border-[#1a1a1a] bg-[#fbfbf9]/92 px-3 py-2 shadow-[4px_4px_0_rgba(26,26,26,1)]">
        <p className="font-mono text-[10px] font-black uppercase tracking-widest text-[#5a554f]">
          Phaser Preview
        </p>
        <p className="text-xs font-black uppercase tracking-wider text-[#1a1a1a]">
          Actual Ridge runtime - {Math.round(previewZoom * 100)}%
        </p>
      </div>
      <Game
        activeSceneId={bridge.activeSceneId}
        chrome="bare"
        isPaused={bridge.isPaused || bridge.loadingSceneId !== null}
        onEnterScene={bridgeActions.enterScene}
        onOpenOverlay={bridgeActions.openOverlay}
        onReturnToOverworld={bridgeActions.returnToOverworld}
        presentationMode="portrait-cover"
        ridgeDevControls={ridgeDevControls}
      />
      {bridge.loadingSceneId ? (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#1a1a1a]/35">
          <p className="border-2 border-[#1a1a1a] bg-[#fbfbf9] px-4 py-2 text-xs font-black uppercase tracking-widest shadow-[4px_4px_0_rgba(26,26,26,1)]">
            Loading Ridge
          </p>
        </div>
      ) : null}
    </section>
  );
}
