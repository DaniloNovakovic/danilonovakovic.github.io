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
      className="max-h-[min(78dvh,calc(100dvh-8rem))] w-full overflow-y-auto p-3 text-center sm:p-5"
    >
      <h2 id={titleId} className="font-mono text-xl font-bold uppercase leading-tight tracking-wider text-[#1a1a1a] sm:text-3xl">
        {messages.potassiumSlip.chooseUpgrade}
      </h2>
      <div className="mt-4 grid gap-3 sm:mt-5 sm:grid-cols-2 sm:gap-4">
        {view.choices.map((choice, index) => (
          <Button
            key={`${choice.title}-${index}`}
            variant="secondary"
            size="lg"
            className="min-h-28 w-full flex-col gap-3 px-3 py-4 font-mono text-left normal-case tracking-normal sm:min-h-36 sm:px-5"
            onClick={() => dispatchAction('potassiumDraftChoice', { option: choice.option })}
          >
            <span
              className="block text-center text-lg font-bold leading-tight sm:text-2xl"
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

function readParams(params: unknown): PotassiumUpgradeChoicesPanelParams | null {
  if (!params || typeof params !== 'object') return null;
  const choices = (params as Partial<PotassiumUpgradeChoicesPanelParams>).choices;
  if (!Array.isArray(choices)) return null;
  return { choices };
}
