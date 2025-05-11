import { tokens } from '../theme/buttonTokens';

export const TYPE = {
  Primary: `bg-${tokens.primaryBg} text-${tokens.primaryText} hover:bg-${tokens.primaryHover}`,
  Secondary: `bg-${tokens.secondaryBg} text-${tokens.secondaryText} border border-${tokens.secondaryBorder} hover:bg-${tokens.secondaryBg}`,
};

export const STATE = {
  Default: '',
  Disabled: 'opacity-50 cursor-not-allowed',
  Active: 'scale-95',
};

export const SIZE = {
  Small: `px-2 py-1 text-${tokens.smallFont}`,
  Default: `px-4 py-2 text-${tokens.baseFont}`,
  Large: `px-6 py-3 text-${tokens.largeFont}`,
};
