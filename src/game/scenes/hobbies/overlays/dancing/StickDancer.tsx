import { useId } from 'react';
import type { DanceMove } from './danceRound';
import '../shared/hobbyMotion.css';

export type DancerPose = DanceMove | 'idle' | 'cheer' | 'slump';

type Point = readonly [number, number];

interface PoseShape {
  head: Point;
  spine: readonly [Point, Point];
  armLeft: readonly Point[];
  armRight: readonly Point[];
  legLeft: readonly Point[];
  legRight: readonly Point[];
}

const LEFT_POSE: PoseShape = {
  head: [42, 22],
  spine: [[46, 32], [52, 70]],
  armLeft: [[47, 40], [30, 36], [12, 31]],
  armRight: [[47, 40], [60, 52], [53, 63]],
  legLeft: [[52, 70], [40, 92], [29, 115]],
  legRight: [[52, 70], [60, 94], [63, 118]]
};

function mirrorPoints(points: readonly Point[]): Point[] {
  return points.map(([x, y]) => [100 - x, y] as const);
}

function mirrorPose(pose: PoseShape): PoseShape {
  return {
    head: [100 - pose.head[0], pose.head[1]],
    spine: [[100 - pose.spine[0][0], pose.spine[0][1]], [100 - pose.spine[1][0], pose.spine[1][1]]],
    armLeft: mirrorPoints(pose.armRight),
    armRight: mirrorPoints(pose.armLeft),
    legLeft: mirrorPoints(pose.legRight),
    legRight: mirrorPoints(pose.legLeft)
  };
}

const POSES: Record<DancerPose, PoseShape> = {
  idle: {
    head: [50, 20],
    spine: [[50, 30], [50, 70]],
    armLeft: [[50, 38], [39, 52], [37, 66]],
    armRight: [[50, 38], [61, 52], [63, 66]],
    legLeft: [[50, 70], [43, 94], [41, 118]],
    legRight: [[50, 70], [57, 94], [59, 118]]
  },
  up: {
    head: [50, 17],
    spine: [[50, 27], [50, 67]],
    armLeft: [[50, 35], [37, 21], [31, 5]],
    armRight: [[50, 35], [63, 21], [69, 5]],
    legLeft: [[50, 67], [46, 93], [47, 116]],
    legRight: [[50, 67], [54, 93], [53, 116]]
  },
  down: {
    head: [50, 42],
    spine: [[50, 52], [50, 84]],
    armLeft: [[50, 58], [34, 60], [21, 56]],
    armRight: [[50, 58], [66, 60], [79, 56]],
    legLeft: [[50, 84], [31, 96], [35, 118]],
    legRight: [[50, 84], [69, 96], [65, 118]]
  },
  left: LEFT_POSE,
  right: mirrorPose(LEFT_POSE),
  cheer: {
    head: [50, 15],
    spine: [[50, 25], [50, 63]],
    armLeft: [[50, 33], [34, 25], [33, 7]],
    armRight: [[50, 33], [66, 25], [67, 7]],
    legLeft: [[50, 63], [40, 87], [44, 104]],
    legRight: [[50, 63], [63, 84], [76, 95]]
  },
  slump: {
    head: [53, 31],
    spine: [[50, 39], [50, 74]],
    armLeft: [[50, 45], [46, 62], [46, 80]],
    armRight: [[50, 45], [55, 62], [57, 80]],
    legLeft: [[50, 74], [44, 96], [42, 118]],
    legRight: [[50, 74], [56, 96], [58, 118]]
  }
};

function toPoints(points: readonly Point[]): string {
  return points.map(([x, y]) => `${x},${y}`).join(' ');
}

const LIMB_PROPS = {
  fill: 'none',
  stroke: '#1a1a1a',
  strokeWidth: 4.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round'
} as const;

/** Stick-figure dancer; each pose is a hard swap so motion reads as stepped. */
export function StickDancer({ pose, label }: { pose: DancerPose; label: string }) {
  const hatchId = useId();
  const shape = POSES[pose];
  return (
    <svg viewBox="0 0 100 130" className="h-full w-auto overflow-visible" role="img" aria-label={label}>
      <defs>
        <pattern id={hatchId} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)">
          <line x1="0" y1="0" x2="0" y2="4" stroke="#1a1a1a" strokeWidth="1" opacity="0.5" />
        </pattern>
      </defs>
      <ellipse cx="50" cy="121" rx="30" ry="5" fill={`url(#${hatchId})`} />
      <g className={pose === 'idle' ? 'hobby-bob' : undefined}>
        <polyline points={toPoints(shape.legLeft)} {...LIMB_PROPS} />
        <polyline points={toPoints(shape.legRight)} {...LIMB_PROPS} />
        <polyline points={toPoints(shape.spine)} {...LIMB_PROPS} strokeWidth={5.5} />
        <polyline points={toPoints(shape.armLeft)} {...LIMB_PROPS} />
        <polyline points={toPoints(shape.armRight)} {...LIMB_PROPS} />
        <circle cx={shape.head[0]} cy={shape.head[1]} r="9" fill="#fbfbf9" stroke="#1a1a1a" strokeWidth="4" />
      </g>
    </svg>
  );
}
