import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { Button } from './Button';

describe('Button — contract invariants', () => {
  it('renders a semantic <button type="button"> by default', () => {
    render(<Button>Save</Button>);
    const btn = screen.getByRole('button', { name: 'Save' });
    expect(btn).toHaveAttribute('type', 'button');
  });

  it('renders each declared variant', () => {
    for (const variant of ['primary', 'secondary', 'ghost'] as const) {
      const { unmount } = render(<Button variant={variant}>{variant}</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('data-variant', variant);
      unmount();
    }
  });

  it('renders each declared size', () => {
    for (const size of ['sm', 'md', 'lg'] as const) {
      const { unmount } = render(<Button size={size}>x</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('data-size', size);
      unmount();
    }
  });

  it('sets aria-disabled when disabled', () => {
    render(<Button disabled>Save</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true');
  });

  it('blocks onClick when disabled', () => {
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>Save</Button>);
    screen.getByRole('button').click();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('sets aria-busy when loading', () => {
    render(<Button loading>Save</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
  });

  it('blocks onClick when loading', () => {
    const onClick = vi.fn();
    render(<Button loading onClick={onClick}>Save</Button>);
    screen.getByRole('button').click();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('fires onClick when enabled', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={onClick}>Save</Button>);
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('renders as child element when asChild is set', () => {
    render(
      <Button asChild>
        <a href="/go">Go</a>
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'Go' });
    expect(link).toHaveAttribute('href', '/go');
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('asChild + loading: reflected aria-busy and click block, no composed spinner', () => {
    const onClick = vi.fn();
    const { container } = render(
      <Button asChild loading onClick={onClick}>
        <a href="/go">Go</a>
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'Go' });
    expect(link).toHaveAttribute('aria-busy', 'true');
    expect(container.querySelector('.p31-button__spinner')).toBeNull();
    link.click();
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('Button — accessibility', () => {
  it('passes axe-core on default render', async () => {
    const { container } = render(<Button>Save</Button>);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('passes axe-core disabled', async () => {
    const { container } = render(<Button disabled>Save</Button>);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('passes axe-core loading', async () => {
    const { container } = render(<Button loading>Save</Button>);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('passes axe-core with asChild', async () => {
    const { container } = render(
      <Button asChild>
        <a href="/go">Go</a>
      </Button>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});