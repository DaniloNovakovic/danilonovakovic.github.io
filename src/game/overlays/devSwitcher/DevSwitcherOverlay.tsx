import type { ReactNode } from 'react';
import { bridgeActions } from '@/game/bridge/store';
import type { SceneId } from '@/game/scenes/sceneIds';
import { getDevSwitcherScenes } from '@/game/scenes/sceneRegistry';
import { OverlayDialogFrame } from '@/game/overlays/OverlayDialogFrame';
import type { OverlayControllerProps } from '@/game/overlays/types';
import { getDevSwitcherOverlayTargets } from './devSwitcherTargets';
import { OUT_OF_BOUNDS_CHECKPOINTS, outOfBoundsCheckpointUrl } from './outOfBoundsCheckpoints';
import { getMessages } from '@/shared/i18n';

const JUMP_BUTTON =
  'rounded border border-[#1a1a1a]/40 bg-white/60 px-2 py-1.5 text-left text-[11px] font-bold uppercase tracking-wide text-[#1a1a1a] hover:bg-white';
const COMPACT_BUTTON =
  'rounded border border-[#1a1a1a]/25 bg-white/40 px-1.5 py-1 text-left text-[10px] font-bold uppercase tracking-wide text-[#5a554f] hover:bg-white';

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="mt-3 first:mt-0">
      <h3 className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#5a554f]">{title}</h3>
      {children}
      {hint && <p className="mt-1 text-[10px] text-[#5a554f]">{hint}</p>}
    </section>
  );
}

export default function DevSwitcherOverlay({ close, titleId, descriptionId }: OverlayControllerProps) {
  const messages = getMessages();
  const shellMessages = messages.gameShell;

  const jumpToScene = (sceneId: SceneId) => {
    bridgeActions.closeOverlay();
    bridgeActions.enterScene(sceneId);
  };

  const jumpToOverlay = (target: ReturnType<typeof getDevSwitcherOverlayTargets>[number]) => {
    bridgeActions.enterScene(target.returnToSceneId);
    bridgeActions.openOverlay(target.id, { returnToSceneId: target.returnToSceneId });
  };

  return (
    <OverlayDialogFrame title={shellMessages.devSwitcher} close={close} titleId={titleId} descriptionId={descriptionId}>
      <Section title={shellMessages.devSwitcherScenes}>
        <div className="grid grid-cols-2 gap-1.5">
          {getDevSwitcherScenes().map((scene) => (
            <button key={scene.id} type="button" onClick={() => jumpToScene(scene.id)} className={JUMP_BUTTON}>
              {scene.title}
            </button>
          ))}
        </div>
      </Section>
      <Section title={shellMessages.devSwitcherOutOfBounds} hint={shellMessages.devSwitcherOutOfBoundsHint}>
        <div className="grid grid-cols-2 gap-1.5">
          {OUT_OF_BOUNDS_CHECKPOINTS.map((checkpoint) => (
            <a
              key={checkpoint.id}
              href={outOfBoundsCheckpointUrl(checkpoint.id, window.location.href)}
              className={JUMP_BUTTON}
            >
              {shellMessages.outOfBoundsCheckpoints[checkpoint.id]}
            </a>
          ))}
        </div>
      </Section>
      <Section title={shellMessages.devSwitcherOverlays}>
        <div className="grid grid-cols-3 gap-1">
          {getDevSwitcherOverlayTargets().map((target) => (
            <button key={target.id} type="button" onClick={() => jumpToOverlay(target)} className={COMPACT_BUTTON}>
              {target.label}
            </button>
          ))}
        </div>
      </Section>
      <p className="mt-3 border-t border-[#1a1a1a]/20 pt-3 text-[10px] font-bold leading-relaxed text-[#5a554f]">
        {shellMessages.ridgeConsoleHint}
      </p>
    </OverlayDialogFrame>
  );
}
