export type { Point3, View } from './aim';
export { aimedFixture, stepPry, type Fixture, type Pry } from './interactions';
export * from './labRoom';
export {
  crawlAmount,
  ductCells,
  eyeHeightFor,
  farGrateCentre,
  grateCentre,
  isOpenDuct,
  mouthOf,
  type DuctCell
} from './vent';
export { stepWalker, type Walker, type WalkInput } from './walker';
export {
  aimedThrowable,
  LAB_THROWABLES,
  stepThrowable,
  throwableRadius,
  throwThrowable,
  type Throwable,
  type ThrowableKind
} from './throwables';
