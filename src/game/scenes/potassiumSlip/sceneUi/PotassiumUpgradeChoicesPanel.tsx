import { useId } from 'react';
import type { SceneUiSurfaceProps } from '@/game/sceneUi/registry';
import { Button, Card } from '@/shared/ui';
import { useMessages } from '@/shared/i18n';
import type { PotassiumDraftChoiceView } from '../runtime/session';

export interface PotassiumUpgradeChoicesPanelParams {
  choices: readonly PotassiumDraftChoiceView[];
}

export function PotassiumUpgradeChoicesPanel({ params, dispatchAction }: SceneUiSurfaceProps) {
  const view = readParams(params);
  const messages = useMessages();
  const titleId = useId();

  if (!view) return null;

  return (
    <Card
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      tone="paper"
      border="thick"
      shadow="lg"
      padding="md"
      className="w-[min(35rem,calc(100vw-1rem))] p-3 text-center sm:p-5"
    >
      <h2 id={titleId} className="font-mono text-lg font-bold uppercase tracking-wider text-[#1a1a1a] sm:text-2xl">
        {messages.potassiumSlip.chooseUpgrade}
      </h2>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 sm:gap-3">
        {view.choices.map((choice, index) => (
          <Button
            key={`${choice.title}-${index}`}
            variant="secondary"
            size="lg"
            className="min-h-24 w-full flex-col gap-3 px-3 py-3 font-mono text-left normal-case tracking-normal"
            onClick={() => dispatchAction('potassiumDraftChoice', { option: choice.option })}
          >
            <span
              className="block text-center text-base font-bold leading-tight sm:text-lg"
              style={{ color: choice.color }}
            >
              {choice.title}
            </span>
            <span className="block text-center text-[11px] font-bold leading-snug text-[#1a1a1a] sm:text-xs">
              {choice.description}
            </span>
          </Button>
        ))}
      </div>
    </Card>
  );
}

function readParams(params: unknown): PotassiumUpgradeChoicesPanelParams | null {
  if (!params || typeof params !== 'object') return null;
  const choices = (params as Partial<PotassiumUpgradeChoicesPanelParams>).choices;
  if (!Array.isArray(choices)) return null;
  return { choices };
}
