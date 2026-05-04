import React from 'react';
import { PORTFOLIO_DATA } from '../data';
import { TEXTS } from '@config/content';
import { Badge, Card, LinkButton } from '@shared/ui';

const ExperienceOverlay: React.FC = () => {
  const { experiences } = PORTFOLIO_DATA;
  
  return (
    <div className="text-[#1a1a1a]">
      <div className="space-y-8">
        {experiences.map((exp, index) => (
          <Card key={index}>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 border-b-2 border-gray-100 pb-2">
              <h3 className="text-xl font-bold">{exp.title}</h3>
              <Badge shape="pill" className="font-mono text-sm normal-case tracking-normal">{exp.period}</Badge>
            </div>
            <p className="mb-2 text-lg font-semibold">
              {exp.companyUrl ? (
                <LinkButton
                  href={exp.companyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="quiet"
                  className="inline p-0 text-lg normal-case tracking-normal"
                  aria-label={`${exp.company} (opens in new tab)`}
                >
                  {exp.company}
                </LinkButton>
              ) : (
                <span className="text-[#1a1a1a]">{exp.company}</span>
              )}
            </p>
            <p className="text-base leading-relaxed text-gray-700">
              {exp.description}
            </p>
          </Card>
        ))}
      </div>
      <p className="mt-8 text-center text-sm text-gray-500 font-mono">{TEXTS.common.scrollToSeeMore}</p>
    </div>
  );
};

export default ExperienceOverlay;
