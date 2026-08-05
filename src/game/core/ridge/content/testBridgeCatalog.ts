import type { BridgeDialogueCatalog } from './bridgeStage';

/** Shared dialogue stub for Ridge/Game console unit tests. */
export const TEST_BRIDGE_DIALOGUE_CATALOG: BridgeDialogueCatalog = {
  speakers: {
    prompt: 'Prompt',
    cicka: 'Cicka',
    bridgeDraftsperson: 'Bridge Draftsperson'
  },
  lines: {
    'bridge.cicka.first_meet.prompt': 'Pet Cicka',
    'bridge.cicka.first_meet.01': 'You sit near Cicka resting in the cornfield.',
    'bridge.cicka.first_meet.02': 'Small chirp.',
    'bridge.cicka.first_meet.03': 'Cicka bats the tiny car back into place.',
    'bridge.draftsperson.missing_span.prompt': 'Talk to Draftsperson',
    'bridge.draftsperson.missing_span.01': 'Missing span worry.',
    'bridge.draftsperson.missing_span.02': 'Toy car missing.',
    'bridge.draftsperson.missing_span.03': 'Look for the tiny test car',
    'bridge.cicka.parallel_play.prompt': 'Play with Cicka',
    'bridge.cicka.parallel_play.01': 'Sit with Cicka',
    'bridge.cicka.parallel_play.02': 'Roll the car back gently',
    'bridge.cicka.parallel_play.03': 'Quiet purr.',
    'bridge.cicka.parallel_play.04': 'Cicka leaves the tiny car beside you.',
    'bridge.draftsperson.toy_car_test.prompt': 'Test Blueprint',
    'bridge.draftsperson.toy_car_test.01': 'Set the tiny car on the drawing',
    'bridge.draftsperson.toy_car_test.02': 'Courage line.',
    'bridge.draftsperson.toy_car_test.03': 'The toy car rolls across the new span.',
    'bridge.draftsperson.toy_car_test.04': 'That line holds.',
    'bridge.exit.opened_crossing.prompt': 'Cross Bridge',
    'bridge.exit.opened_crossing.01': 'Cross the finished bridge',
    'bridge.exit.opened_crossing.02': 'Thank you.',
    'bridge.exit.opened_crossing.03': 'The page turns toward evening music.'
  }
};
