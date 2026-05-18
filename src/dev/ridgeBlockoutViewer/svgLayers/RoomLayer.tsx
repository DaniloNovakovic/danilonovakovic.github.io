import type { RidgeViewerRoom } from '../model';
import type { Selection } from '../types';

export function RoomLayer({
  onFocusRoom,
  rooms,
  onSelect
}: {
  onFocusRoom: (roomId: string) => void;
  rooms: readonly RidgeViewerRoom[];
  onSelect: (selection: Selection) => void;
}) {
  return (
    <g data-testid="ridge-layer-rooms">
      {rooms.map((room) => (
        <g
          aria-label={`Room ${room.title}`}
          key={room.id}
          onClick={(event) => {
            event.stopPropagation();
            onSelect({ type: 'room', id: room.id });
          }}
          onDoubleClick={(event) => {
            event.stopPropagation();
            onFocusRoom(room.id);
          }}
          role="button"
          tabIndex={0}
        >
          <rect
            x={room.x}
            y={room.y}
            width={room.width}
            height={room.height}
            fill="transparent"
            stroke="#1a1a1a"
            strokeDasharray="18 10"
            strokeWidth="8"
          />
          <text
            x={room.x + 18}
            y={room.y + 42}
            fill="#1a1a1a"
            fontSize="34"
            fontWeight="900"
            paintOrder="stroke"
            stroke="#fbfbf9"
            strokeWidth="10"
          >
            {room.title}
          </text>
        </g>
      ))}
    </g>
  );
}
