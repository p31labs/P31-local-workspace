/**
 * P31CA Kinematics Engine
 * Mobile bottom-sheet swipe gestures, spring physics, and Z-Index mitigation.
 */

export interface BottomSheetConfig {
  panelId: string;
  handleId: string;
  ribbonId?: string;
  dismissThreshold?: number;
}

export class BottomSheetController {
  private panel: HTMLElement | null = null;
  private handle: HTMLElement | null = null;
  private ribbon: HTMLElement | null = null;
  private config: BottomSheetConfig;

  private startY = 0;
  private currentY = 0;
  private isDragging = false;
  private dismissThreshold: number;

  constructor(config: BottomSheetConfig) {
    this.config = config;
    this.panel = document.getElementById(config.panelId);
    this.handle = document.getElementById(config.handleId);
    this.ribbon = document.getElementById(config.ribbonId ?? 'p31-bottom-ribbon');
    this.dismissThreshold = config.dismissThreshold ?? 120;
    if (this.handle && this.panel) this.initEvents();
  }

  private initEvents() {
    this.handle!.addEventListener('pointerdown', this.onPointerDown);
    this.handle!.addEventListener('pointermove', this.onPointerMove);
    this.handle!.addEventListener('pointerup', this.onPointerUp);
    this.handle!.addEventListener('pointercancel', this.onPointerUp);
  }

  private onPointerDown = (e: PointerEvent) => {
    if (window.innerWidth >= 768) return;
    this.isDragging = true;
    this.startY = e.clientY;
    this.panel!.style.transition = 'none';
    this.handle!.setPointerCapture(e.pointerId);
  };

  private onPointerMove = (e: PointerEvent) => {
    if (!this.isDragging) return;
    const deltaY = e.clientY - this.startY;
    this.currentY = Math.max(0, deltaY);
    this.panel!.style.transform = `translate3d(0, ${this.currentY}px, 0)`;
  };

  private onPointerUp = (e: PointerEvent) => {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.handle!.releasePointerCapture(e.pointerId);
    this.panel!.style.transition =
      'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease-out';

    if (this.currentY > this.dismissThreshold) {
      this.panel!.style.transform = 'translate3d(0, 120%, 0)';
      this.panel!.style.opacity = '0';
      this.panel!.dispatchEvent(new CustomEvent('p31:sheet-dismissed'));
      this.restoreRibbon();
    } else {
      this.panel!.style.transform = 'translate3d(0, 0, 0)';
    }
    this.currentY = 0;
  };

  /** Call when the panel opens — ghosts AppShell ribbon on mobile to prevent touch collisions. */
  public mitigateRibbon() {
    if (window.innerWidth < 768 && this.ribbon) {
      this.ribbon.classList.add('opacity-30', 'pointer-events-none');
    }
    if (this.panel) {
      this.panel.style.transform = '';
      this.panel.style.opacity = '1';
      this.panel.style.transition = '';
    }
  }

  /** Call when the panel closes. */
  public restoreRibbon() {
    this.ribbon?.classList.remove('opacity-30', 'pointer-events-none');
  }

  public dispose() {
    this.handle?.removeEventListener('pointerdown', this.onPointerDown);
    this.handle?.removeEventListener('pointermove', this.onPointerMove);
    this.handle?.removeEventListener('pointerup', this.onPointerUp);
    this.handle?.removeEventListener('pointercancel', this.onPointerUp);
  }
}
