// Using CSS-vars for semantic theming, no component tokens needed
export const TYPE = {
  Primary: 'bg-accent-primary-default text-text-inverse icon-icon-inverse hover:bg-accent-primary-strong',
  Secondary: 'bg-accent-neutral-weakest text-text-default icon-icon-default hover:bg-accent-neutral-weaker',
};

export const STATE = {
  Default: '',
  Disabled: 'opacity-50 cursor-not-allowed',
  Active: 'scale-95',
};

export const SIZE = {
  Small: 'px-2 py-1 text-[var(--font-size-small)]',
  Default: 'px-4 py-2 text-[var(--font-size-base)]',
  Large: 'px-6 py-3 text-[var(--font-size-large)]',
};
