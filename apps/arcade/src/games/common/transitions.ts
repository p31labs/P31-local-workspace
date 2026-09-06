export function fadeOut(el: HTMLElement, duration = 300): Promise<void> {
  return new Promise(resolve => {
    el.style.transition = `opacity ${duration}ms ease`;
    el.style.opacity = '0';
    setTimeout(() => { el.style.display = 'none'; resolve(); }, duration);
  });
}

export function fadeIn(el: HTMLElement, duration = 300): Promise<void> {
  el.style.display = 'block'; el.style.opacity = '0';
  requestAnimationFrame(() => {
    el.style.transition = `opacity ${duration}ms ease`;
    el.style.opacity = '1';
  });
  return new Promise(resolve => setTimeout(resolve, duration));
}

export function animateValue(el: HTMLElement, from: number, to: number, duration = 400) {
  const start = performance.now();
  const tick = (now: number) => {
    const p = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = String(Math.round(from + (to - from) * eased));
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
