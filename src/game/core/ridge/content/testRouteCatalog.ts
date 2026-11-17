import type { RidgeRouteDialogueCatalog } from './routeStages';
import { TEST_BRIDGE_DIALOGUE_CATALOG } from './testBridgeCatalog';

/** Shared dialogue stub for full-route Ridge console unit tests. */
export const TEST_ROUTE_DIALOGUE_CATALOG: RidgeRouteDialogueCatalog = {
  bridge: TEST_BRIDGE_DIALOGUE_CATALOG,
  concert: {
    speakers: {
      prompt: 'Prompt',
      cicka: 'Cicka',
      injuredGuitarist: 'Steve',
      crowd: 'Crowd',
      crowdUncle: 'Uncle',
      crowdGrandma: 'Grandma',
      kid: 'Kid'
    },
    // Unlisted keys fall back to the key itself, which keeps assertions readable.
    lines: {
      'concert.guitarist.injury.prompt': 'Talk to the guitarist',
      'concert.guitarist.choice.learn': 'Teach me the phrase.'
    }
  },
  dance: {
    speakers: {
      prompt: 'Prompt',
      cicka: 'Cicka',
      counterpartCat: 'Quiet cat',
      traveler: 'Traveler',
      shuttleRadio: 'Radio · Shuttle',
      opsRadio: 'Radio · Ops',
      hillShuttleDriver: 'Hill-Shuttle Driver',
      operationsHelper: 'Last-Stop Operations Helper',
      danceTeacher: 'Dance Teacher',
      festivalSteward: 'Festival Steward'
    },
    // Unlisted keys fall back to the key itself, which keeps assertions readable.
    lines: {}
  },
  relay: {
    speakers: {
      prompt: 'Prompt',
      cicka: 'Cicka',
      dedication: 'Dedication'
    },
    lines: {
      'relay.overlook.inspect.prompt': 'Inspect Overlook',
      'relay.overlook.inspect.01': 'Look out over the finished route',
      'relay.overlook.inspect.02': 'The pages below still hold their changes.',
      'relay.sit_and_play.prompt.prompt': 'Sit & Play Guitar',
      'relay.sit_and_play.prompt.01': 'Sit and play beside Cicka',
      'relay.sit_and_play.prompt.02': 'You settle. The guitar finds the concert phrase.',
      'relay.sit_and_play.prompt.03': 'The overlook softens.',
      'relay.montage.bridge.01': '(memory) The finished bridge holds.',
      'relay.montage.concert.01': '(memory) The crossing clears; the guitar changes hands.',
      'relay.montage.dance.01': '(memory) Night lanterns wake after you leave.',
      'relay.guitar.sunset.01': 'Sunset lowers while the phrase keeps breathing.',
      'relay.guitar.let_song_end.01': 'Let the song end',
      'relay.guitar.let_song_end.02': 'The phrase resolves into quiet.',
      'relay.cicka.threshold_meow.01': 'mrrp.',
      'relay.cicka.threshold_meow.02': 'Cicka turns back once, then slips into warm paper light.',
      'relay.cicka.threshold_meow.03': 'The overlook holds empty for a breath.',
      'relay.dedication.card.01': 'For Cicka.',
      'relay.dedication.card.02': 'Thank you for playing.'
    }
  }
};
