import { Crosshair } from 'lucide-react';
import type { RidgeViewerShortcut } from '../model';
import type { Selection } from '../types';

export function ShortcutLayer({
  shortcuts,
  onSelect
}: {
  shortcuts: readonly RidgeViewerShortcut[];
  onSelect: (selection: Selection) => void;
}) {
  return (
    <g data-testid="ridge-layer-shortcuts">
      {shortcuts.map((shortcut) => {
        const connection = shortcut.unlockedConnection ?? shortcut.lockedConnection;
        if (!connection) return null;
        return (
          <g
            aria-label={`Shortcut ${shortcut.id}`}
            key={shortcut.id}
            onClick={(event) => {
              event.stopPropagation();
              onSelect({ type: 'shortcut', id: shortcut.id });
            }}
            role="button"
            tabIndex={0}
          >
            <line
              x1={connection.from.x}
              y1={connection.from.y}
              x2={connection.to.x}
              y2={connection.to.y}
              stroke={shortcut.unlockedAvailable ? '#d15c2f' : '#5a554f'}
              strokeDasharray="10 16"
              strokeLinecap="round"
              strokeWidth="18"
            />
            <Crosshair
              aria-hidden
              color={shortcut.unlockedAvailable ? '#d15c2f' : '#5a554f'}
              height={42}
              strokeWidth={3}
              width={42}
              x={connection.to.x - 21}
              y={connection.to.y - 21}
            />
          </g>
        );
      })}
    </g>
  );
}
