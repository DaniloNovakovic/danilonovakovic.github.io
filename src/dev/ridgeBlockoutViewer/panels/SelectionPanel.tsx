import { Detail } from '../components/Detail';

export function SelectionPanel({ details }: { details: readonly [string, string][] | null }) {
  return (
    <section className="py-4">
      <h2 className="text-lg font-black">Selected</h2>
      {details ? (
        <dl className="mt-3 grid gap-2 text-sm" data-testid="ridge-viewer-selection">
          {details.map(([label, value]) => (
            <Detail key={label} label={label} value={value} />
          ))}
        </dl>
      ) : (
        <p className="mt-3 text-sm font-bold text-[#5a554f]">None</p>
      )}
    </section>
  );
}
