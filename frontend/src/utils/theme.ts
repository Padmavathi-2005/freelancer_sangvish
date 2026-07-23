export function applyTheme(theme: string, primaryColor: string, secondaryColor: string = "#06b6d4") {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  
  const formatColor = (c: string) => {
    if (!c) return c;
    const trimmed = c.trim();
    if (trimmed.startsWith('#')) return trimmed;
    if (/^[0-9A-Fa-f]{3,8}$/.test(trimmed)) {
      return `#${trimmed}`;
    }
    return trimmed;
  };

  const pColor = formatColor(primaryColor);
  const sColor = formatColor(secondaryColor);
  
  if (theme === 'light') {
    root.style.setProperty('--background', '#f8fafc', 'important');
    root.style.setProperty('--foreground', '#0f172a', 'important');
    root.style.setProperty('--card-bg', '#ffffff', 'important');
    root.style.setProperty('--card-border', 'rgba(15, 23, 42, 0.06)', 'important');
    root.style.setProperty('--card-border-glow', 'rgba(15, 23, 42, 0.03)', 'important');
    root.style.setProperty('--color-dark-bg', '#f8fafc', 'important');
    root.style.setProperty('--color-panel-bg', 'rgba(255, 255, 255, 0.9)', 'important');
    root.style.setProperty('--color-panel-border', 'rgba(15, 23, 42, 0.06)', 'important');
    
    root.classList.remove('dark');
    root.classList.add('light');
    document.body.classList.remove('dark');
    document.body.classList.add('light');
  } else {
    root.style.setProperty('--background', '#09090b', 'important');
    root.style.setProperty('--foreground', '#fafafa', 'important');
    root.style.setProperty('--card-bg', 'rgba(20, 20, 25, 0.7)', 'important');
    root.style.setProperty('--card-border', 'rgba(255, 255, 255, 0.08)', 'important');
    root.style.setProperty('--card-border-glow', 'rgba(255, 255, 255, 0.03)', 'important');
    root.style.setProperty('--color-dark-bg', '#09090b', 'important');
    root.style.setProperty('--color-panel-bg', 'rgba(20, 20, 25, 0.7)', 'important');
    root.style.setProperty('--color-panel-border', 'rgba(255, 255, 255, 0.08)', 'important');
    
    root.classList.remove('light');
    root.classList.add('dark');
    document.body.classList.remove('light');
    document.body.classList.add('dark');
  }

  // Helper to override Tailwind v4 utility class color scales with priority
  const overrideColorScale = (prefix: string, baseColor: string) => {
    root.style.setProperty(`--color-${prefix}-50`, baseColor + '0a', 'important');
    root.style.setProperty(`--color-${prefix}-100`, baseColor + '1a', 'important');
    root.style.setProperty(`--color-${prefix}-150`, baseColor + '26', 'important');
    root.style.setProperty(`--color-${prefix}-200`, baseColor + '33', 'important');
    root.style.setProperty(`--color-${prefix}-250`, baseColor + '40', 'important');
    root.style.setProperty(`--color-${prefix}-300`, baseColor + '4d', 'important');
    root.style.setProperty(`--color-${prefix}-400`, baseColor + '66', 'important');
    root.style.setProperty(`--color-${prefix}-500`, baseColor, 'important');
    root.style.setProperty(`--color-${prefix}-600`, baseColor + 'd9', 'important');
    root.style.setProperty(`--color-${prefix}-700`, baseColor, 'important');
    root.style.setProperty(`--color-${prefix}-750`, baseColor + 'e6', 'important');
    root.style.setProperty(`--color-${prefix}-800`, baseColor + 'f2', 'important');
    root.style.setProperty(`--color-${prefix}-900`, baseColor, 'important');
    root.style.setProperty(`--color-${prefix}-950`, baseColor, 'important');
  };

  // Set brand colors dynamically
  root.style.setProperty('--color-primary', pColor, 'important');
  root.style.setProperty('--color-primary-hover', pColor + 'cc', 'important');
  root.style.setProperty('--color-primary-light', pColor + '1a', 'important');
  root.style.setProperty('--color-primary-dark', pColor, 'important');
  root.style.setProperty('--color-secondary', sColor, 'important');
  root.style.setProperty('--color-secondary-hover', sColor + 'cc', 'important');
  root.style.setProperty('--color-secondary-light', sColor + '1a', 'important');

  // Override teal, emerald & green scales to point to the primary color
  overrideColorScale('teal', pColor);
  overrideColorScale('emerald', pColor);
  overrideColorScale('green', pColor);

  // Override cyan scale to point to the secondary color
  overrideColorScale('cyan', sColor);
}
export default applyTheme;
