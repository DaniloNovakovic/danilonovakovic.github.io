import { useMessages } from '@/shared/i18n';
import { getPortfolioData } from '@/shared/portfolio';
import { Card, LinkButton, SketchSection } from '@/shared/ui';
import { CONTACT_ICON_SRC } from '../contactIcons';

export function ContactSection() {
  const messages = useMessages();
  const { contact } = getPortfolioData(messages);

  return (
    <SketchSection id="contact" title={messages.portfolio.contact.title}>
      <div className="grid grid-cols-1 gap-4">
        {contact.map((item) => (
          <LinkButton
            key={item.name}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex justify-start p-4 normal-case tracking-normal shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]"
          >
            <div className="mr-4 flex h-10 w-10 shrink-0 items-center justify-center rounded border border-[#1a1a1a] bg-gray-100 transition-colors group-hover:bg-[#1a1a1a]">
              <img src={CONTACT_ICON_SRC[item.icon]} alt="" className="h-7 w-7 object-contain" width={28} height={28} />
            </div>
            <div>
              <h3 className="text-lg font-bold">{item.name}</h3>
              <p className="font-mono text-xs text-gray-500">{item.link.replace('mailto:', '')}</p>
            </div>
          </LinkButton>
        ))}
      </div>

      <Card border="medium" shadow="none" className="mt-8 border-dashed bg-yellow-50 p-4 text-center">
        <p className="text-lg font-bold">{messages.portfolio.contact.quote}</p>
        <p className="mt-1 text-sm text-gray-600">{messages.portfolio.contact.quoteAuthor}</p>
      </Card>
    </SketchSection>
  );
}
