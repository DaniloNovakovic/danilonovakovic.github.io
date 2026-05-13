import { useId } from 'react';
import type { SceneUiSurfaceProps } from '@/game/sceneUi/registry';
import { Button, Card } from '@/shared/ui';
import type { StampedeUpgradeChoiceView } from '../runtime/upgrades';

export interface StampedeUpgradeDraftPanelParams {
  choices: readonly StampedeUpgradeChoiceView[];
  scrapsCollected: number;
  scrapGoal: number;
}

export function StampedeUpgradeDraftPanel({ params, dispatchAction }: SceneUiSurfaceProps) {
  const view = readParams(params);
  const titleId = useId();
  const descriptionId = useId();

  if (!view) return null;

  return (
    <Card
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      tone="paper"
      border="thick"
      shadow="lg"
      padding="md"
      className="max-h-[min(78dvh,calc(100dvh-8rem))] w-full overflow-y-auto p-3 text-center sm:p-5"
    >
      <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#4b4337] sm:text-xs">
        Scraps {view.scrapsCollected}/{view.scrapGoal}
      </p>
      <h2 id={titleId} className="mt-1 font-mono text-xl font-bold uppercase leading-tight tracking-wider text-[#1a1a1a] sm:text-3xl">
        Pick a page trick
      </h2>
      <p id={descriptionId} className="mx-auto mt-2 max-w-sm font-mono text-xs font-bold leading-snug text-[#4b4337] sm:text-sm">
        The page coughs up one useful idea. Tape it down and keep moving.
      </p>
      <div className="mt-4 grid gap-3 sm:mt-5 sm:grid-cols-3 sm:gap-4">
        {view.choices.map((choice) => (
          <Button
            key={choice.id}
            variant="secondary"
            size="lg"
            className="min-h-28 w-full flex-col gap-3 px-3 py-4 font-mono text-left normal-case tracking-normal sm:min-h-36 sm:px-4"
            onClick={() => dispatchAction('stampedeUpgradeChoice', { upgradeId: choice.id })}
          >
            <span
              className="block text-center text-lg font-bold leading-tight sm:text-xl"
              style={{ color: choice.color }}
            >
              {choice.title}
            </span>
            <span className="block text-center text-xs font-bold leading-snug text-[#1a1a1a] sm:text-sm">
              {choice.description}
            </span>
          </Button>
        ))}
      </div>
    </Card>
  );
}

function readParams(params: unknown): StampedeUpgradeDraftPanelParams | null {
  if (!params || typeof params !== 'object') return null;
  const partial = params as Partial<StampedeUpgradeDraftPanelParams>;
  if (!Array.isArray(partial.choices)) return null;

  return {
    choices: partial.choices,
    scrapsCollected: partial.scrapsCollected ?? 0,
    scrapGoal: partial.scrapGoal ?? 0
  };
}
