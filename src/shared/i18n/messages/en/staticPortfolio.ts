export const staticPortfolioMessages = {
  switchToInteractive: 'Switch to interactive portfolio',
  tryInteractive: 'Try interactive',
  interactive: 'Interactive',
  eyebrow: 'Portfolio - Static edition',
  role: 'Frontend Engineer · Design Systems · Accessibility',
  basedIn: (location: string) => `Based in ${location}`,
  viewProject: 'View project',
  footerPrompt: 'Prefer the playful version?',
  footerCta: 'Try interactive mode ->',
  copyright: (year: number, name: string) => `© ${year} ${name}`
} as const;
