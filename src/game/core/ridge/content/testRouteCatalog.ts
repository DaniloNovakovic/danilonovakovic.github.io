import type { RidgeRouteDialogueCatalog } from './routeStages';
import { TEST_BRIDGE_DIALOGUE_CATALOG } from './testBridgeCatalog';

/** Shared dialogue stub for full-route Ridge console unit tests. */
export const TEST_ROUTE_DIALOGUE_CATALOG: RidgeRouteDialogueCatalog = {
  bridge: TEST_BRIDGE_DIALOGUE_CATALOG,
  concert: {
    speakers: {
      prompt: 'Prompt',
      cicka: 'Cicka',
      injuredGuitarist: 'Injured Guitarist',
      crowd: 'Crowd'
    },
    lines: {
      'concert.crowd.delay_barks.01': 'Concert is late again.',
      'concert.crowd.delay_barks.02': 'Someone said the guitarist wiped out.',
      'concert.crowd.delay_barks.03': 'Maybe check behind the stage props.',
      'concert.guitarist.injury.01': 'I tried a one-leg skateboard solo.',
      'concert.guitarist.injury.02': 'Wrist says no. Pride says louder no.',
      'concert.guitarist.injury.03': 'Learn the phrase with me',
      'concert.guitarist.practice_riff.01': 'Practice the forgiving riff',
      'concert.guitarist.practice_riff.02': 'You find the phrase without failing.',
      'concert.guitarist.practice_riff.03': 'That is enough courage for a street.',
      'concert.performance.auto_success.01': 'Start the concert',
      'concert.performance.auto_success.02': 'The phrase lands. Soft. True.',
      'concert.performance.auto_success.03': 'Alright, move—show happened.',
      'concert.performance.auto_success.04': 'Take the guitar. Carry the comfort.',
      'concert.guitarist.guitar_handoff.01': 'Keep it for the road ahead.',
      'concert.guitarist.guitar_handoff.02': 'Play it when quiet needs company.',
      'concert.guitarist.guitar_handoff.03': 'The guitar rests against your side.',
      'concert.cicka.band_resting_spot.01': 'Sit near hidden Cicka',
      'concert.cicka.band_resting_spot.02': 'mrrp.',
      'concert.cicka.band_resting_spot.03': 'Cicka loafs with the band',
      'concert.cicka.band_resting_spot.04': 'purr.',
      'concert.exit.dance_transition.01': 'Follow the opened crossing',
      'concert.exit.dance_transition.02': 'Festival setup waits downhill.',
      'concert.exit.dance_transition.03': 'The page warms toward afternoon.'
    }
  },
  dance: {
    speakers: {
      prompt: 'Prompt',
      cicka: 'Cicka',
      traveler: 'Traveler',
      hillShuttleDriver: 'Hill-Shuttle Driver',
      operationsHelper: 'Last-Stop Operations Helper',
      danceTeacher: 'Dance Teacher',
      festivalSteward: 'Festival Steward'
    },
    lines: {
      'dance.traveler.relay_wayfinding.01': 'Relay is up the hill shuttle.',
      'dance.traveler.relay_wayfinding.02': 'Last daylight ride, after setup clears.',
      'dance.traveler.relay_wayfinding.03': 'Help Operations, then the Dance Teacher.',
      'dance.driver.shuttle_delay.01': 'Cannot leave until the steward opens the gate.',
      'dance.driver.shuttle_delay.02': 'Clipboard says ready. Feet say otherwise.',
      'dance.driver.shuttle_delay.03': 'He keeps rereading the same line.',
      'dance.driver.shuttle_delay.choice.help': 'One step. Privately. Maybe the Dance Teacher…',
      'dance.driver.shuttle_delay.choice.help_hint': 'Find the Dance Teacher (skirt pose).',
      'dance.driver.shuttle_delay.choice.wait': 'You give him space and ask around.',
      'dance.operations_helper.handoff_check.01': 'Help check the operations handoff',
      'dance.operations_helper.handoff_check.02': 'If the lantern line fails, I fail.',
      'dance.operations_helper.handoff_check.03': 'You check the crates with her.',
      'dance.operations_helper.handoff_check.done.01': 'Handoff done — find the Dance Teacher next',
      'dance.operations_helper.handoff_check.done.02': 'She can almost leave the plaza alone.',
      'dance.locals.triangulated_read.01': 'Road opens after setup clears at the gate.',
      'dance.locals.triangulated_read.02': 'She waits on one perfect lantern. He waits on anything except asking.',
      'dance.locals.triangulated_read.03': 'Help Operations, then ask me for one private step.',
      'dance.driver.one_step_practice.01': 'Practice one private dance step',
      'dance.driver.one_step_practice.02': 'He learns exactly one shared rhythm.',
      'dance.driver.one_step_practice.03': 'Okay. I can offer that much later.',
      'dance.driver.one_step_practice.done.01': 'Step learned — clear the service gate next',
      'dance.driver.one_step_practice.done.02': 'Dignity intact. Clear the gate next.',
      'dance.driver.folded_song_request.01': 'Help fold a tiny song request',
      'dance.driver.folded_song_request.02': 'No confession. Just one dance later.',
      'dance.driver.folded_song_request.03': 'She reads it. Soft nod. No spotlight.',
      'dance.driver.folded_song_request.04': 'Now clear the service gate on the right.',
      'dance.setup_clearance.01': 'Clear the service gate for the shuttle',
      'dance.setup_clearance.02': 'Secure the lantern line.',
      'dance.setup_clearance.03': 'Tape the service-lane clear.',
      'dance.setup_clearance.04': 'Gate open. Last daylight window.',
      'dance.setup_clearance.05': 'Shuttle sign flips. Board the van to the right.',
      'dance.shuttle.last_daylight_ride.01': 'All aboard the last ride.',
      'dance.shuttle.last_daylight_ride.02': 'The hill lifts into sunset paper.',
      'dance.shuttle.last_daylight_ride.03': 'Relay waits quiet above.',
      'dance.cicka.resting_spot.01': 'Cicka loafs on the operations table',
      'dance.cicka.resting_spot.02': 'Cicka settles by the cleared gate',
      'dance.cicka.resting_spot.03': 'mrrp.'
    }
  },
  relay: {
    speakers: {
      prompt: 'Prompt',
      cicka: 'Cicka',
      dedication: 'Dedication'
    },
    lines: {
      'relay.overlook.inspect.01': 'Look out over the finished route',
      'relay.overlook.inspect.02': 'The pages below still hold their changes.',
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
