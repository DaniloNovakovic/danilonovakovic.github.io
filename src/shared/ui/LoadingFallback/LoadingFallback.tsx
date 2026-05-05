import { TEXTS } from '@/shared/content/content';
import { Card } from '../Card';

export function LoadingFallback() {
  return (
    <div className="flex min-h-[100dvh] min-h-dvh w-full items-center justify-center bg-[#f4f1ea]">
      <Card tone="paper" className="px-6 py-4">
        <p className="text-sm font-bold uppercase tracking-widest text-[#1a1a1a]">
          {TEXTS.common.loading}
        </p>
      </Card>
    </div>
  );
}
