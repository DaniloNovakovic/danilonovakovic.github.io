import { useId } from 'react';
import type { SceneUiSurfaceProps } from '@/game/sceneUi/registry';
import { Button, Card } from '@/shared/ui';
import type { PotassiumTerminalAction } from '../runtime/session';

export interface PotassiumTerminalPanelParams {
  title: string;
  score: number;
  records: string;
  actions: readonly PotassiumTerminalPanelAction[];
}

export interface PotassiumTerminalPanelAction {
  action: PotassiumTerminalAction;
  label: string;
  priority: 'primary' | 'secondary';
}

export function PotassiumTerminalPanel({ params, dispatchAction }: SceneUiSurfaceProps) {
  const view = readParams(params);
  const titleId = useId();
  const descriptionId = useId();

  if (!view) return null;

  return (
    <Card
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      tone="paper"
      border="thick"
      shadow="lg"
      padding="md"
      className="max-h-[min(78dvh,calc(100dvh-8rem))] w-full overflow-y-auto p-3 text-center sm:p-5"
    >
      <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#4b4337] sm:text-xs">
        Run ended
      </p>
      <h2 id={titleId} className="mt-1 font-mono text-2xl font-bold uppercase leading-tight text-[#1a1a1a] sm:text-4xl">
        {view.title}
      </h2>
      <p id={descriptionId} className="mt-3 font-mono text-xs font-bold uppercase tracking-wider text-[#4b4337] sm:text-sm">
        Final Score
      </p>
      <p className="mt-1 font-mono text-3xl font-bold leading-none text-[#1a1a1a] sm:text-4xl">
        {view.score}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3">
        {view.actions.map((action) => (
          <Button
            key={action.action}
            variant={action.priority === 'primary' ? 'primary' : 'secondary'}
            size="lg"
            className="min-h-11 w-full px-2 font-mono text-[11px] uppercase leading-tight tracking-wider sm:min-h-14 sm:px-5 sm:text-sm sm:tracking-widest"
            onClick={() => dispatchAction('potassiumTerminalAction', { action: action.action })}
          >
            {action.label}
          </Button>
        ))}
      </div>
      <pre className="mx-auto mt-4 max-h-24 overflow-y-auto whitespace-pre-wrap font-mono text-[10px] font-bold leading-snug text-[#4b4337] sm:text-xs">
        {view.records}
      </pre>
    </Card>
  );
}

function readParams(params: unknown): PotassiumTerminalPanelParams | null {
  if (!params || typeof params !== 'object') return null;
  const candidate = params as Partial<PotassiumTerminalPanelParams>;
  if (
    typeof candidate.title !== 'string' ||
    typeof candidate.score !== 'number' ||
    typeof candidate.records !== 'string' ||
    !Array.isArray(candidate.actions)
  ) {
    return null;
  }

  return {
    title: candidate.title,
    score: candidate.score,
    records: candidate.records,
    actions: candidate.actions
  };
}
