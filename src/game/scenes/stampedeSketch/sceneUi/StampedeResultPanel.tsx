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
      className="w-[min(31rem,calc(100vw-2rem))] text-center"
    >
      <p className="font-mono text-xs font-bold uppercase tracking-widest text-[#4b4337]">
        {view.eyebrow}
      </p>
      <h2 id={titleId} className="mt-2 font-mono text-3xl font-bold leading-tight text-[#1a1a1a] md:text-4xl">
        {view.title}
      </h2>
      <p id={descriptionId} className="mx-auto mt-3 max-w-sm font-mono text-sm font-bold leading-snug text-[#4b4337]">
        {view.body}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {view.stats.map((stat) => (
          <div
            key={stat.id}
            className="rounded border-2 border-[#1a1a1a]/80 bg-white px-3 py-2 text-left"
          >
            <p className="font-mono text-xs font-bold uppercase tracking-widest text-[#4b4337]">
              {stat.label}
            </p>
            <p className="mt-1 text-right font-mono text-2xl font-bold leading-none text-[#1a1a1a]">
              {stat.value}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-4 font-mono text-xs font-bold uppercase tracking-wider text-[#4b4337]">
        {view.rewardNote}
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
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
      className="min-h-14 w-full font-mono uppercase tracking-widest"
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
