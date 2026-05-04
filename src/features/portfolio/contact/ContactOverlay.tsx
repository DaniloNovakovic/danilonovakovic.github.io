import React from 'react';
import { PORTFOLIO_DATA, type ContactIconId } from '../../../config/portfolio';
import { TEXTS } from '../../../config/content';
import { Card, LinkButton } from '@shared/ui';

const CONTACT_ICON_SRC: Record<ContactIconId, string> = {
  linkedin: '/icons/contact/linkedin.png',
  github: '/icons/contact/github.png',
  email: '/icons/contact/email.png',
};

function ContactLinkIcon({ icon }: { icon: ContactIconId }) {
  return (
    <img
      src={CONTACT_ICON_SRC[icon]}
      alt=""
      className="h-7 w-7 shrink-0 object-contain transition-transform group-hover:scale-105"
      width={28}
      height={28}
    />
  );
}

const ContactOverlay: React.FC = () => {
  const { contact } = PORTFOLIO_DATA;

  return (
    <div className="text-[#1a1a1a]">
      <div className="grid grid-cols-1 gap-4">
        {contact.map((item, index) => (
          <LinkButton
            key={index}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex justify-start p-4 normal-case tracking-normal shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]"
          >
            <div className="w-10 h-10 shrink-0 bg-gray-100 rounded border border-[#1a1a1a] flex items-center justify-center mr-4 group-hover:bg-[#1a1a1a] transition-colors">
              <ContactLinkIcon icon={item.icon} />
            </div>
            <div>
              <h3 className="text-lg font-bold">{item.name}</h3>
              <p className="text-gray-500 font-mono text-xs">{item.link.replace('mailto:', '')}</p>
            </div>
          </LinkButton>
        ))}
      </div>

      <Card border="medium" shadow="none" className="mt-8 border-dashed bg-yellow-50 p-4 text-center">
        <p className="text-lg font-bold">{TEXTS.contact.quote}</p>
        <p className="mt-1 text-gray-600 text-sm">{TEXTS.contact.quoteAuthor}</p>
      </Card>
    </div>
  );
};

export default ContactOverlay;
