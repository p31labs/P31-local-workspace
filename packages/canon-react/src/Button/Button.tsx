/**
 * Button — implemented against @p31/canon's buttonContract.
 *
 * Contract obligations:
 *   variant: 'primary' | 'secondary' | 'ghost'
 *   size:    'sm' | 'md' | 'lg'
 *   disabled: renders aria-disabled, blocks interaction
 *   loading:  renders aria-busy, blocks interaction; the spinner is
 *             default-rendering only — with asChild the consumer owns the
 *             interrupted-state visual on their element
 *   children: required
 *
 * Every style value is a token reference. No state, no context, no
 * effects — RSC-safe.
 */
import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, MouseEvent, ReactNode } from 'react';
import { Slot } from '../Slot';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  asChild?: boolean;
  children: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
  const {
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    asChild = false,
    children,
    className,
    onClick,
    type,
    ...rest
  } = props;

  const classes = [
    'p31-button',
    `p31-button--${variant}`,
    `p31-button--${size}`,
    disabled && 'p31-button--disabled',
    loading && 'p31-button--loading',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onClick?.(e);
  };

  const Comp = asChild ? Slot : 'button';

  const ariaProps = {
    'aria-disabled': disabled || undefined,
    'aria-busy': loading || undefined,
  } as const;

  const buttonTypeProps = asChild ? {} : { type: type ?? 'button' };

  return (
    <Comp
      ref={ref}
      className={classes}
      onClick={handleClick}
      data-variant={variant}
      data-size={size}
      {...ariaProps}
      {...buttonTypeProps}
      {...rest}
    >
      {asChild ? (
        children
      ) : (
        <>
          {loading && (
            <span className="p31-button__spinner" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="40 20"
                />
              </svg>
            </span>
          )}
          <span className="p31-button__label">{children}</span>
        </>
      )}
    </Comp>
  );
});

Button.displayName = 'Button';