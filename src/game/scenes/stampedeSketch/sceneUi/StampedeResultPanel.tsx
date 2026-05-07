import { useId } from 'react';
import type { SceneUiSurfaceProps } from '@/game/sceneUi/registry';
import type {
  StampedeResultActionViewModel,
  StampedeResultViewModel
} from '../runtime/resultPresentation';
import { Button, Card } from '@/shared/ui';

export function StampedeResultPanel({ params, dispatchAction }: SceneUiSurfaceProps) {
  const view = readResultParams(params);
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
      className="max-h-[calc(100dvh-1rem)] w-[min(31rem,calc(100vw-1rem))] overflow-y-auto p-3 text-center sm:max-h-full sm:w-[min(31rem,calc(100vw-2rem))] sm:p-5"
    >
      <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#4b4337] sm:text-xs">
        {view.eyebrow}
      </p>
      <h2 id={titleId} className="mt-1 font-mono text-2xl font-bold leading-tight text-[#1a1a1a] sm:mt-2 sm:text-3xl md:text-4xl">
        {view.title}
      </h2>
      <p id={descriptionId} className="mx-auto mt-1.5 max-w-sm font-mono text-xs font-bold leading-snug text-[#4b4337] sm:mt-3 sm:text-sm">
        {view.body}
      </p>
      <div className="mt-2.5 grid grid-cols-2 gap-2 sm:mt-4 sm:gap-3">
        {view.stats.map((stat) => (
          <div
            key={stat.id}
            className="rounded border-2 border-[#1a1a1a]/80 bg-white px-2 py-2 text-left sm:px-3"
          >
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#4b4337] sm:text-xs">
              {stat.label}
            </p>
            <p className="mt-1 text-right font-mono text-xl font-bold leading-none text-[#1a1a1a] sm:text-2xl">
              {stat.value}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-2.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#4b4337] sm:mt-4 sm:text-xs">
        {view.rewardNote}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-5 sm:gap-3">
        {view.actions.map((action) => (
          <ResultActionButton
            key={action.id}
            action={action}
            onClick={() => dispatchAction(action.id === 'retry' ? 'retry' : 'backToRidge')}
          />
        ))}
      </div>
    </Card>
  );
}

function ResultActionButton({
  action,
  onClick
}: {
  action: StampedeResultActionViewModel;
  onClick: () => void;
}) {
  const primary = action.priority === 'primary';

  return (
    <Button
      variant={primary ? 'primary' : 'secondary'}
      size="lg"
      className="min-h-10 w-full px-2 font-mono text-[11px] uppercase tracking-wider sm:min-h-14 sm:px-5 sm:text-base sm:tracking-widest"
      onClick={onClick}
      autoFocus={primary}
    >
      {action.label}
    </Button>
  );
}

function readResultParams(params: unknown): StampedeResultViewModel | null {
  if (!params || typeof params !== 'object') return null;
  return params as StampedeResultViewModel;
}
