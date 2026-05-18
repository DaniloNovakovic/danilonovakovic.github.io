import type { RidgeBlockoutViewerModel } from '../model';
import { Detail } from '../components/Detail';

export function SummaryPanel({ model }: { model: RidgeBlockoutViewerModel }) {
  return (
    <section className="border-b-2 border-[#1a1a1a] pb-4">
      <h2 className="text-lg font-black">World</h2>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
        <Detail label="World" value={model.worldId} />
        <Detail label="Cell" value={`${model.cell}px`} />
        <Detail label="Rooms" value={String(model.rooms.length)} />
        <Detail label="Tiles" value={String(model.tileRegistry.length)} />
        <Detail label="Source" value={model.sourceWorldId} />
        <Detail label="Generated" value={model.generatedWorldId} />
      </dl>
      <p
        className="mt-3 border-2 border-[#1a1a1a] bg-[#d7f2d1] px-3 py-2 text-xs font-black uppercase tracking-widest"
        data-testid="ridge-viewer-validation-status"
      >
        {model.validationErrors.length === 0
          ? 'Map valid'
          : `${model.validationErrors.length} validation errors`}
      </p>
    </section>
  );
}
