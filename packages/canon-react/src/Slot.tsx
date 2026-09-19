/**
 * Slot — the asChild primitive.
 *
 * Merges props from the parent component onto a single consumer-supplied
 * child element. Event handlers compose (both fire); className concatenates;
 * style shallow-merges with the child's own style winning on conflict.
 */
import { Children, cloneElement, forwardRef, isValidElement } from 'react';
import type { HTMLAttributes, ReactElement, ReactNode, Ref } from 'react';

type AnyProps = Record<string, unknown>;

function mergeProps(slotProps: AnyProps, childProps: AnyProps): AnyProps {
  const merged: AnyProps = { ...childProps };

  for (const key of Object.keys(slotProps)) {
    if (key === 'style') {
      merged.style = { ...(slotProps.style as object), ...(childProps.style as object) };
      continue;
    }
    if (key === 'className') {
      merged.className = [slotProps.className, childProps.className].filter(Boolean).join(' ');
      continue;
    }
    const slotValue = slotProps[key];
    const childValue = childProps[key];
    const isHandler = /^on[A-Z]/.test(key);
    if (isHandler && typeof slotValue === 'function' && typeof childValue === 'function') {
      merged[key] = (...args: unknown[]) => {
        (childValue as (...a: unknown[]) => void)(...args);
        (slotValue as (...a: unknown[]) => void)(...args);
      };
      continue;
    }
    merged[key] = slotValue !== undefined ? slotValue : childValue;
  }

  return merged;
}

export interface SlotProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode;
}

export const Slot = forwardRef<HTMLElement, SlotProps>((props, forwardedRef) => {
  const { children, ...slotProps } = props;
  const child = Children.only(children);
  if (!isValidElement(child)) {
    throw new Error('Slot: expected exactly one child element');
  }
  const childProps = (child as ReactElement<AnyProps>).props;
  const merged = mergeProps(slotProps as AnyProps, childProps);
  merged.ref = forwardedRef as Ref<unknown>;
  return cloneElement(child as ReactElement<AnyProps>, merged);
});

Slot.displayName = 'Slot';