import { useId } from 'react';
import type { SceneUiSurfaceProps } from '@/game/sceneUi/registry';
import { Button, Card } from '@/shared/ui';

export function StampedeStartPromptPanel({ dispatchAction }: SceneUiSurfaceProps) {
  const titleId = useId();
  const descriptionId = useId();

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
      className="w-[min(20rem,calc(100vw-2rem))] text-center"
    >
      <h2 id={titleId} className="font-mono text-3xl font-bold leading-tight text-[#1a1a1a]">
        Ready?
      </h2>
      <p
        id={descriptionId}
        className="mt-2 font-mono text-xs font-bold uppercase tracking-widest text-[#4b4337]"
      >
        Then drag or WASD.
      </p>
      <Button
        variant="primary"
        size="lg"
        className="mt-5 w-full font-mono uppercase tracking-widest"
        onClick={() => dispatchAction('start')}
        autoFocus
      >
        Start
      </Button>
      <p className="mt-3 font-mono text-[10px] font-bold uppercase tracking-wider text-[#4b4337]/80">
        Enter / Space also works.
      </p>
    </Card>
  );
}
