import { getPortfolioData } from '@/shared/portfolio';
import { useMessages } from '@/shared/i18n';
import { LinkButton } from '@/shared/ui';
import { CONTACT_ICON_SRC } from './contactIcons';

export function HeroContactLinks() {
  const messages = useMessages();
  const { contact } = getPortfolioData(messages);

  return (
    <ul className="flex flex-wrap items-center justify-center gap-2">
      {contact.map((item) => (
        <li key={item.name}>
          <LinkButton
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            icon={<img src={CONTACT_ICON_SRC[item.icon]} alt="" className="h-5 w-5 object-contain" width={20} height={20} />}
          >
            {item.name}
          </LinkButton>
        </li>
      ))}
    </ul>
  );
}
