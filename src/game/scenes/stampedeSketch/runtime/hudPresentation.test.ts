import { describe, expect, it } from 'vitest';
import { createStampedeHudSnapshot } from './hudPresentation';
import {
  STAMPEDE_CONTACT_LIMIT,
  createStampedeSession,
  resolveStampedeContact
} from './session';

describe('stampede hud presentation', () => {
  it('exposes readable HP from remaining contacts', () => {
    const contacted = resolveStampedeContact(createStampedeSession(), 1_000);

    expect(createStampedeHudSnapshot(contacted)).toMatchObject({
      contacts: 1,
      contactLimit: STAMPEDE_CONTACT_LIMIT,
      healthRemaining: STAMPEDE_CONTACT_LIMIT - 1
    });
  });
});
