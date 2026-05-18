import type { RidgeBlockoutViewerModel } from '../model';

export function AssistZoneLayer({ model }: { model: RidgeBlockoutViewerModel }) {
  return (
    <g data-testid="ridge-layer-assist-zones">
      {model.assistZones.map((zone) => (
        <rect
          fill="#a4d46c"
          fillOpacity="0.23"
          height={zone.height}
          key={zone.id}
          stroke="#4a7f28"
          strokeDasharray="12 10"
          strokeWidth="5"
          width={zone.width}
          x={zone.x - zone.width / 2}
          y={zone.y - zone.height / 2}
        />
      ))}
    </g>
  );
}
