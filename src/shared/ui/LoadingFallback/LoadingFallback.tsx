import { useMessages } from '@/shared/i18n';
import { Card } from '../Card';

/**
 * Full-screen app loading state using the shared sketchbook paper treatment.
 * Use as a suspense or route fallback while app-level data or bundles load.
 */
export function LoadingFallback() {
  const messages = useMessages();

  return (
    <div className="flex min-h-[100dvh] min-h-dvh w-full items-center justify-center bg-[#f4f1ea]">
      <Card tone="paper" className="px-6 py-4">
        <p className="text-sm font-bold uppercase tracking-widest text-[#1a1a1a]">
          {messages.common.loading}
        </p>
      </Card>
    </div>
  );
}
