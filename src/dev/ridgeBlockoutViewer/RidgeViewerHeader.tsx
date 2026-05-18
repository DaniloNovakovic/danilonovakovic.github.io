import { Eye, Map } from 'lucide-react';
import { ViewTab } from './components/ViewTab';
import type { RidgeBlockoutViewerModel } from './model';
import type { ViewerView } from './types';

export function RidgeViewerHeader({
  activeView,
  model,
  onSwitchView
}: {
  activeView: ViewerView;
  model: RidgeBlockoutViewerModel;
  onSwitchView: (view: ViewerView) => void;
}) {
  return (
    <header className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-[3px] border-[#1a1a1a] bg-[#fbfbf9] px-3 py-2 shadow-[4px_4px_0_rgba(26,26,26,1)]">
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
        <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[#5a554f]">
          Dev QA
        </p>
        <h1 className="text-sm font-black uppercase tracking-wider sm:text-base">
          Ridge Blockout Viewer
        </h1>
        <span className="min-w-0 truncate font-mono text-[10px] font-bold uppercase tracking-widest text-[#5a554f]">
          {model.title}
        </span>
        <span
          aria-label={
            model.validationErrors.length === 0
              ? 'Generated Ridge blockout validation status: map valid'
              : 'Generated Ridge blockout validation status: map errors'
          }
          className={[
            'border-2 border-[#1a1a1a] px-2 py-0.5 font-mono text-[10px] font-black uppercase tracking-widest',
            model.validationErrors.length === 0 ? 'bg-[#d7f2d1]' : 'bg-[#ffd6d1]'
          ].join(' ')}
          data-testid="ridge-viewer-header-validation-status"
          title={
            model.validationErrors.length === 0
              ? 'Generated Ridge blockout validation passed'
              : `${model.validationErrors.length} generated Ridge blockout validation errors`
          }
        >
          {model.validationErrors.length === 0 ? 'Map valid' : 'Map errors'}
        </span>
      </div>
      <div className="flex border-2 border-[#1a1a1a] bg-[#e7dfcf] p-1" aria-label="Ridge viewer view">
        <ViewTab
          active={activeView === 'preview'}
          icon={<Eye className="h-4 w-4" aria-hidden />}
          label="Preview"
          onClick={() => onSwitchView('preview')}
        />
        <ViewTab
          active={activeView === 'model'}
          icon={<Map className="h-4 w-4" aria-hidden />}
          label="Model"
          onClick={() => onSwitchView('model')}
        />
      </div>
    </header>
  );
}
