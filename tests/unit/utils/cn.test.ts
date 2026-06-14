import { expect, test } from 'vitest';
import { cn } from '../../../software/packages/shared/src/ui/p31-shared/utils';

test('cn merges class names without conflicts', () => {
  expect(cn('foo', 'bar')).toBe('foo bar');
  expect(cn('px-4', 'px-2')).toBe('px-2');
  expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
});

test('cn handles falsy values', () => {
  expect(cn('foo', false, null, undefined, 0, 'bar')).toBe('foo bar');
});

test('cn handles empty input', () => {
  expect(cn()).toBe('');
});
