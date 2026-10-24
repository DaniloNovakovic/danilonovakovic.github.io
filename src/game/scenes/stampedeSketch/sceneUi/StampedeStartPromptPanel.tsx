import { useId } from 'react';
import type { SceneUiSurfaceProps } from '@/game/sceneUi/registry';
import { useMessages } from '@/shared/i18n';
import { Button, Card } from '@/shared/ui';
import { getStampedeStartingWeaponChoices } from '../runtime/upgrades';

export function StampedeStartPromptPanel({ dispatchAction }: SceneUiSurfaceProps) {
  const titleId = useId();
  const descriptionId = useId();
  const copy = useMessages().scenes.stampedeSketch.start;
  const weapons = getStampedeStartingWeaponChoices();

  return (
    <Card
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      tone="white"
      border="thick"
      shadow="lg"
      padding="md"
      className="w-[min(36rem,calc(100vw-2rem))] text-center"
    >
      <h2 id={titleId} className="font-mono text-3xl font-bold leading-tight text-[#1a1a1a]">
        {copy.title}
      </h2>
      <p id={descriptionId} className="mx-auto mt-2 max-w-sm font-mono text-sm font-bold leading-snug text-[#4b4337]">
        {copy.body}
      </p>
      <p className="mt-3 font-mono text-xs font-bold uppercase tracking-widest text-[#4b4337]">
        {copy.hint}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3">
        {weapons.map((weapon) => (
          <Button
            key={weapon.id}
            variant="secondary"
            size="lg"
            className="min-h-24 w-full flex-col gap-2 px-3 py-3 font-mono text-left normal-case tracking-normal"
            onClick={() => dispatchAction('stampedeUpgradeChoice', { upgradeId: weapon.id })}
          >
            <span
              className="block text-center text-base font-bold leading-tight sm:text-lg"
              style={{ color: weapon.color }}
            >
              {weapon.title}
            </span>
            <span className="block text-center text-[11px] font-bold leading-snug text-[#1a1a1a] sm:text-xs">
              {weapon.description}
            </span>
          </Button>
        ))}
      </div>
    </Card>
  );
}
