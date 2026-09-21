import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen, fireEvent } from '@testing-library/react';
import { ZonePanel } from './ZonePanel';
import type { MusicZone } from '../scene/musicZone';

afterEach(cleanup);

/**
 * The hybrid 2D/3D panel — pins that the committed rename surface works:
 * selecting a zone shows its timbre + name, and renaming calls the same
 * onRename that commits instrument.zone.name to the log.
 */

const ZONE: MusicZone = { id: 'zone:a', position: [1, 0, 0], timbre: 'hydrogen', name: 'the sun' };

describe('ZonePanel', () => {
  it('renders nothing when no zone is selected', () => {
    const { container } = render(<ZonePanel zone={null} onRename={vi.fn()} announce={vi.fn()} />);
    expect(container.querySelector('.mm-zone-panel')).toBeNull();
  });

  it('shows the selected zone timbre + name', () => {
    render(<ZonePanel zone={ZONE} onRename={vi.fn()} announce={vi.fn()} />);
    expect(screen.getByText('the sun')).toBeTruthy();
    expect(screen.getByText('hydrogen')).toBeTruthy();
  });

  it('renames through the committed onRename callback', () => {
    const onRename = vi.fn();
    const announce = vi.fn();
    render(<ZonePanel zone={ZONE} onRename={onRename} announce={announce} />);
    const input = document.getElementById('mm-zone-name') as HTMLInputElement;
    act(() => {
      fireEvent.change(input, { target: { value: 'the moon' } });
    });
    act(() => {
      fireEvent.submit(input.closest('form')!);
    });
    expect(onRename).toHaveBeenCalledWith('zone:a', 'the moon');
    expect(announce).toHaveBeenCalledWith('this zone is now called the moon');
  });

  it('does not rename when the name is unchanged', () => {
    const onRename = vi.fn();
    render(<ZonePanel zone={ZONE} onRename={onRename} announce={vi.fn()} />);
    const input = document.getElementById('mm-zone-name') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'the sun' } }); // same as existing
    fireEvent.submit(input.closest('form')!);
    expect(onRename).not.toHaveBeenCalled();
  });
});