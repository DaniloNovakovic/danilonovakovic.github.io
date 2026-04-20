import React from 'react';
import { PORTFOLIO_DATA } from '../config/portfolio';
import { TEXTS } from '../config/content';

const ExperienceOverlay: React.FC = () => {
  const { experiences } = PORTFOLIO_DATA;
  
  return (
    <div className="text-[#1a1a1a]">
      <div className="space-y-8">
        {experiences.map((exp, index) => (
          <div key={index} className="bg-white p-6 rounded-lg border-4 border-[#1a1a1a] shadow-[8px_8px_0px_0px_rgba(26,26,26,1)]">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 border-b-2 border-gray-100 pb-2">
              <h3 className="text-xl font-bold">{exp.title}</h3>
              <span className="text-sm font-mono bg-gray-100 px-3 py-1 rounded-full">{exp.period}</span>
            </div>
            <p className="mb-2 text-lg font-semibold">
              {exp.companyUrl ? (
                <a
                  href={exp.companyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cursor-pointer rounded-sm text-[#1a1a1a] underline decoration-dashed underline-offset-2 transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1a1a]"
                  aria-label={`${exp.company} (opens in new tab)`}
                >
                  {exp.company}
                </a>
              ) : (
                <span className="text-[#1a1a1a]">{exp.company}</span>
              )}
            </p>
            <p className="text-base leading-relaxed text-gray-700">
              {exp.description}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-8 text-center text-sm text-gray-500 font-mono">{TEXTS.common.scrollToSeeMore}</p>
    </div>
  );
};

export default ExperienceOverlay;

