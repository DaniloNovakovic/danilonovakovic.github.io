import { PencilLine, RotateCcw, Trash2 } from 'lucide-react';
import type {
  StageAuthoringField,
  StageAuthoringTargetOption
} from '../hooks/useStageAuthoring';
import type { StageAuthoringSelection } from '@/game/scenes/ridge/bridge/stageAuthoring';
import { ScalarFieldControl } from './ScalarFieldControl';

export function AuthoringPanel({
  active,
  fields,
  isDirty,
  onDiscardDraft,
  onResetSelection,
  onSelectTarget,
  onToggleActive,
  onUpdateField,
  selection,
  selectionLabel,
  snippet,
  targetOptions
}: {
  active: boolean;
  fields: readonly StageAuthoringField[];
  isDirty: boolean;
  onDiscardDraft: () => void;
  onResetSelection: () => void;
  onSelectTarget: (selection: StageAuthoringSelection) => void;
  onToggleActive: (active: boolean) => void;
  onUpdateField: (field: string, value: number) => void;
  selection: StageAuthoringSelection | null;
  selectionLabel: string;
  snippet: string;
  targetOptions: readonly StageAuthoringTargetOption[];
}) {
  return (
    <section className="border-b-2 border-[#1a1a1a] pb-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider">
          <PencilLine className="h-4 w-4" aria-hidden />
          <span>Authoring</span>
        </h2>
        <label className="flex min-h-9 items-center gap-2 border-2 border-[#1a1a1a] bg-[#fbfbf9] px-2 py-1 text-xs font-black uppercase tracking-wider">
          <input
            aria-label="Stage Authoring Mode"
            checked={active}
            className="h-4 w-4 accent-[#1a1a1a]"
            onChange={(event) => onToggleActive(event.target.checked)}
            type="checkbox"
          />
          <span>Mode</span>
        </label>
      </div>

      <p className="mt-3 text-xs font-black uppercase tracking-wider text-[#5a554f]">
        {active
          ? 'Drag empty space to pan. Drag markers to move. Shift+drag a spot for offset-only nudges.'
          : 'Turn on Authoring Mode to select and nudge source-backed markers.'}
      </p>

      {active ? (
        <div className="mt-3 grid gap-3">
          <label className="grid gap-1.5">
            <span className="font-mono text-[10px] font-black uppercase tracking-widest text-[#5a554f]">
              Target
            </span>
            <select
              aria-label="Authoring target"
              className="h-9 w-full border-2 border-[#1a1a1a] bg-[#fbfbf9] px-2 font-mono text-xs font-black"
              onChange={(event) => {
                const option = targetOptions.find((candidate) => candidate.key === event.target.value);
                if (option) onSelectTarget(option.selection);
              }}
              value={targetOptions.find((option) => isSameSelection(option.selection, selection))?.key ?? ''}
            >
              <option disabled value="">
                Choose target...
              </option>
              {targetOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <p className="border-2 border-[#1a1a1a] bg-[#f3df8b] px-2 py-1 text-xs font-black uppercase tracking-widest">
            {selectionLabel}
          </p>

          {fields.length > 0 ? (
            <div className="grid gap-3">
              {fields.map((field) => (
                <ScalarFieldControl
                  key={field.field}
                  inputMax={field.inputMax}
                  inputMin={field.inputMin}
                  label={field.label}
                  max={field.max}
                  min={field.min}
                  onChange={(value) => onUpdateField(field.field, value)}
                  step={field.step}
                  value={field.value}
                />
              ))}
            </div>
          ) : null}

          {snippet ? (
            <textarea
              aria-label="Copyable Ridge Stage Source replacement snippet"
              className="min-h-28 w-full border-2 border-[#1a1a1a] bg-[#fbfbf9] px-2 py-1 font-mono text-[10px] font-black"
              onFocus={(event) => event.currentTarget.select()}
              readOnly
              value={snippet}
            />
          ) : null}

          <div className="grid gap-1.5">
            <button
              className="flex min-h-9 items-center justify-center gap-2 border-2 border-[#1a1a1a] bg-[#fbfbf9] px-2 py-1 text-xs font-black uppercase tracking-wider transition-colors hover:bg-[#1a1a1a] hover:text-[#fbfbf9] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!snippet}
              onClick={onResetSelection}
              type="button"
            >
              <RotateCcw className="h-4 w-4" aria-hidden />
              Reset Selection
            </button>
            <button
              className="flex min-h-9 items-center justify-center gap-2 border-2 border-[#1a1a1a] bg-[#fbfbf9] px-2 py-1 text-xs font-black uppercase tracking-wider transition-colors hover:bg-[#1a1a1a] hover:text-[#fbfbf9] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!isDirty}
              onClick={onDiscardDraft}
              type="button"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              Discard Draft
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function isSameSelection(
  left: StageAuthoringSelection,
  right: StageAuthoringSelection | null
): boolean {
  if (!right || left.kind !== right.kind) return false;
  if (left.kind === 'rail-point' && right.kind === 'rail-point') return left.index === right.index;
  if (left.kind === 'spot' && right.kind === 'spot') return left.id === right.id;
  if (left.kind === 'object' && right.kind === 'object') return left.id === right.id;
  return false;
}
