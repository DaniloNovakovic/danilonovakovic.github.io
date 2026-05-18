import type { RidgeViewerRouteLink } from '../model';
import type { Selection } from '../types';

export function RouteLayer({
  routes,
  future = false,
  onSelect
}: {
  routes: readonly { id: string; links: readonly RidgeViewerRouteLink[] }[];
  future?: boolean;
  onSelect: (selection: Selection) => void;
}) {
  return (
    <g data-testid={future ? 'ridge-layer-future-routes' : 'ridge-layer-routes'}>
      {routes.flatMap((route) =>
        route.links.map((link) => (
          <g
            aria-label={`${future ? 'Future route' : 'Route'} ${route.id} ${link.fromRoomId} to ${link.toRoomId}`}
            key={link.id}
            onClick={(event) => {
              event.stopPropagation();
              onSelect({ type: future ? 'futureRoute' : 'route', id: link.id });
            }}
            role="button"
            tabIndex={0}
          >
            <line
              x1={link.from.x}
              y1={link.from.y}
              x2={link.to.x}
              y2={link.to.y}
              stroke={future ? '#7d55c7' : '#157f76'}
              strokeDasharray={future ? '18 14' : undefined}
              strokeLinecap="round"
              strokeWidth="16"
            />
            <circle cx={link.to.x} cy={link.to.y} r="14" fill={future ? '#7d55c7' : '#157f76'} />
          </g>
        ))
      )}
    </g>
  );
}
