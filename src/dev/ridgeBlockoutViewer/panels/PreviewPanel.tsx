import { LocateFixed, Minus, Plus, RotateCcw } from 'lucide-react';
import type {
  RidgeDevDebugSettings,
  RidgeDevPlayerSnapshot
} from '@/game/scenes/ridge/runtime/ridgeDevControls';
import { PREVIEW_ZOOM_OPTIONS } from '../constants';
import type { RidgeViewerAnchor } from '../model';
import { IconButton } from '../components/IconButton';
import { Detail } from '../components/Detail';
import type { TeleportGroup } from '../teleportTargets';
import { getTeleportAnchorLabel } from '../teleportTargets';

export function PreviewPanel({
  debugSettings,
  lastTeleportLabel,
  onPreviewZoomChange,
  onPreviewZoomIn,
  onPreviewZoomOut,
  onResetPlayer,
  onToggleDebugSetting,
  onTeleport,
  playerSnapshot,
  previewZoom,
  teleportGroups
}: {
  debugSettings: RidgeDevDebugSettings;
  lastTeleportLabel: string | null;
  onPreviewZoomChange: (zoom: number) => void;
  onPreviewZoomIn: () => void;
  onPreviewZoomOut: () => void;
  onResetPlayer: () => void;
  onToggleDebugSetting: (setting: keyof RidgeDevDebugSettings) => void;
  onTeleport: (anchor: RidgeViewerAnchor) => void;
  playerSnapshot: RidgeDevPlayerSnapshot | null;
  previewZoom: number;
  teleportGroups: readonly TeleportGroup[];
}) {
  return (
    <>
      <section className="border-b-2 border-[#1a1a1a] py-4">
        <h2 className="text-lg font-black">Preview</h2>
        <p className="mt-2 text-sm font-bold text-[#5a554f]">
          Real Phaser Ridge scene. Use Model for source-backed overlays.
        </p>
        <div className="mt-3 grid gap-2">
          <div className="flex items-center gap-2">
            <IconButton ariaLabel="Zoom preview out" onClick={onPreviewZoomOut}>
              <Minus className="h-4 w-4" aria-hidden />
            </IconButton>
            <label className="min-w-0 flex-1">
              <span className="sr-only">Preview zoom</span>
              <select
                aria-label="Preview zoom"
                className="h-8 w-full border-2 border-[#1a1a1a] bg-[#fbfbf9] px-2 font-mono text-xs font-black"
                onChange={(event) => onPreviewZoomChange(Number(event.target.value))}
                value={previewZoom}
              >
                {PREVIEW_ZOOM_OPTIONS.map((zoom) => (
                  <option key={zoom} value={zoom}>
                    {Math.round(zoom * 100)}%
                  </option>
                ))}
              </select>
            </label>
            <IconButton ariaLabel="Zoom preview in" onClick={onPreviewZoomIn}>
              <Plus className="h-4 w-4" aria-hidden />
            </IconButton>
          </div>
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-2 text-xs">
            <Detail
              label="Player"
              value={playerSnapshot
                ? `${Math.round(playerSnapshot.x)}, ${Math.round(playerSnapshot.y)}`
                : 'waiting'}
            />
            <Detail
              label="Rail"
              value={playerSnapshot?.railProgress !== undefined
                ? `${playerSnapshot.railProgress.toFixed(3)} @ ${playerSnapshot.nearestStageSpotId ?? 'spot?'}`
                : 'waiting'}
            />
            <Detail
              label="Cue"
              value={playerSnapshot?.railScale !== undefined && playerSnapshot.railDepth !== undefined
                ? `scale ${playerSnapshot.railScale.toFixed(2)} / depth ${playerSnapshot.railDepth}`
                : 'waiting'}
            />
          </dl>
          {playerSnapshot?.sourceSnippet ? (
            <input
              aria-label="Copyable Ridge Stage Source snippet"
              className="h-8 w-full border-2 border-[#1a1a1a] bg-[#fbfbf9] px-2 font-mono text-[10px] font-black"
              onFocus={(event) => event.currentTarget.select()}
              readOnly
              value={playerSnapshot.sourceSnippet}
            />
          ) : null}
          <button
            className="flex min-h-9 items-center justify-center gap-2 border-2 border-[#1a1a1a] bg-[#fbfbf9] px-2 py-1 text-xs font-black uppercase tracking-wider transition-colors hover:bg-[#1a1a1a] hover:text-[#fbfbf9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1a1a]"
            onClick={onResetPlayer}
            type="button"
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
            Reset player
          </button>
        </div>
      </section>
      <section className="border-b-2 border-[#1a1a1a] py-4">
        <h2 className="text-lg font-black">Debug</h2>
        <div className="mt-3 grid gap-2">
          <DebugToggle
            checked={debugSettings.graybox}
            label="Graybox geometry"
            onChange={() => onToggleDebugSetting('graybox')}
          />
          <DebugToggle
            checked={debugSettings.showColliders}
            label="Colliders"
            onChange={() => onToggleDebugSetting('showColliders')}
          />
          <DebugToggle
            checked={debugSettings.showPlayerBody}
            label="Player body"
            onChange={() => onToggleDebugSetting('showPlayerBody')}
          />
          <DebugToggle
            checked={debugSettings.showInteractZones}
            label="Interact zones"
            onChange={() => onToggleDebugSetting('showInteractZones')}
          />
          <DebugToggle
            checked={debugSettings.showTraversalAssists}
            label="Traversal assists"
            onChange={() => onToggleDebugSetting('showTraversalAssists')}
          />
        </div>
      </section>
      <section className="py-4">
        <h2 className="text-lg font-black">Teleport</h2>
        {lastTeleportLabel ? (
          <p className="mt-2 border-2 border-[#1a1a1a] bg-[#f3df8b] px-2 py-1 text-xs font-black uppercase tracking-widest">
            Sent: {lastTeleportLabel}
          </p>
        ) : null}
        <div className="mt-3 space-y-3">
          {teleportGroups.map((group) => (
            <div key={group.room.id}>
              <p className="mb-1 font-mono text-[10px] font-black uppercase tracking-widest text-[#5a554f]">
                {group.room.title}
              </p>
              <div className="grid gap-1.5">
                {group.anchors.map((anchor) => (
                  <button
                    aria-label={`Teleport to ${anchor.roomTitle} ${getTeleportAnchorLabel(anchor)}`}
                    className="flex min-h-8 items-center justify-between gap-2 border-2 border-[#1a1a1a] bg-[#fbfbf9] px-2 py-1 text-left text-xs font-black transition-colors hover:bg-[#1a1a1a] hover:text-[#fbfbf9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1a1a]"
                    key={anchor.id}
                    onClick={() => onTeleport(anchor)}
                    type="button"
                  >
                    <span className="min-w-0 truncate">
                      {anchor.symbol} {getTeleportAnchorLabel(anchor)}
                    </span>
                    <LocateFixed className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function DebugToggle({
  checked,
  label,
  onChange
}: {
  checked: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <label className="flex min-h-9 items-center gap-2 border-2 border-[#1a1a1a] bg-[#fbfbf9] px-2 py-1 text-xs font-black uppercase tracking-wider">
      <input
        checked={checked}
        className="h-4 w-4 accent-[#1a1a1a]"
        onChange={onChange}
        type="checkbox"
      />
      <span className="min-w-0">{label}</span>
    </label>
  );
}
