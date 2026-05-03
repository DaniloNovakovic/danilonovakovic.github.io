import type { HTMLAttributes } from 'react';
import { sketchBorders, sketchFocusVisible, sketchShadows } from './tokens';
import { cn } from './utils';

type CardPadding = 'none' | 'sm' | 'md' | 'lg';
type CardShadow = 'none' | 'sm' | 'md' | 'lg' | 'xl';
type CardTone = 'paper' | 'white' | 'muted' | 'transparent';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  as?: 'div' | 'article';
  padding?: CardPadding;
  shadow?: CardShadow;
  tone?: CardTone;
  border?: 'thin' | 'medium' | 'thick';
}

const paddingClasses: Record<CardPadding, string> = {
  none: '',
  sm: 'p-2',
  md: 'p-5',
  lg: 'p-6'
};

const shadowClasses: Record<CardShadow, string> = {
  none: '',
  sm: sketchShadows.sm,
  md: sketchShadows.md,
  lg: sketchShadows.lg,
  xl: sketchShadows.xl
};

const toneClasses: Record<CardTone, string> = {
  paper: 'bg-[#fbfbf9]',
  white: 'bg-white',
  muted: 'bg-[#f4f1ea]',
  transparent: 'bg-transparent'
};

const borderClasses = {
  thin: sketchBorders.thin,
  medium: sketchBorders.medium,
  thick: sketchBorders.thick
} as const;

export function Card({
  as = 'div',
  padding = 'lg',
  shadow = 'lg',
  tone = 'white',
  border = 'thick',
  className,
  ...props
}: CardProps) {
  const Component = as;
  return (
    <Component
      className={cn(
        'rounded-lg text-[#1a1a1a]',
        borderClasses[border],
        toneClasses[tone],
        paddingClasses[padding],
        shadowClasses[shadow],
        sketchFocusVisible,
        className
      )}
      {...props}
    />
  );
}

export function Panel(props: CardProps) {
  return <Card tone="paper" border="medium" shadow="md" padding="md" {...props} />;
}
