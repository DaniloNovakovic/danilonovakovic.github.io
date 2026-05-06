import { describe, expect, it } from 'vitest';
import { getMessages } from '@/shared/i18n';
import { getPortfolioData } from '@/shared/portfolio';

describe('getPortfolioData', () => {
  it('returns display-ready portfolio data from localized messages', () => {
    const messages = getMessages('en');
    const data = getPortfolioData(messages);

    expect(data.profile.name).toBe(messages.portfolio.profile.details.fullName);
    expect(data.experiences[0].title).toBe(messages.portfolio.experiences.hummingbird.title);
    expect(data.experiences[0].companyUrl).toBe('https://hummingbird.rs/');
    expect(data.projects[0].tags).toEqual(['JS', 'Chrome-Extension', 'Webpack', 'Materialize.css']);
    expect(data.contact[0].name).toBe(messages.portfolio.contacts.linkedin);
  });
});
