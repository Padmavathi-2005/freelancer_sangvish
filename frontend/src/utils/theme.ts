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
    // Light (white) Theme settings
    root.style.setProperty('--background', '#f8fafc'); // Slate-50 background
    root.style.setProperty('--foreground', '#0f172a'); // Slate-900 text
    root.style.setProperty('--card-bg', '#ffffff');
    root.style.setProperty('--card-border', 'rgba(15, 23, 42, 0.06)');
    root.style.setProperty('--card-border-glow', 'rgba(15, 23, 42, 0.03)');
    root.style.setProperty('--color-dark-bg', '#f8fafc');
    root.style.setProperty('--color-panel-bg', 'rgba(255, 255, 255, 0.9)');
    root.style.setProperty('--color-panel-border', 'rgba(15, 23, 42, 0.06)');
    
    // Set class list for dark/light selectors on both root (html) and body
    root.classList.remove('dark');
    root.classList.add('light');
    document.body.classList.remove('dark');
    document.body.classList.add('light');
  } else {
    // Dark Theme settings
    root.style.setProperty('--background', '#09090b'); // Dark background
    root.style.setProperty('--foreground', '#fafafa'); // Light text
    root.style.setProperty('--card-bg', 'rgba(20, 20, 25, 0.7)');
    root.style.setProperty('--card-border', 'rgba(255, 255, 255, 0.08)');
    root.style.setProperty('--card-border-glow', 'rgba(255, 255, 255, 0.03)');
    root.style.setProperty('--color-dark-bg', '#09090b');
    root.style.setProperty('--color-panel-bg', 'rgba(20, 20, 25, 0.7)');
    root.style.setProperty('--color-panel-border', 'rgba(255, 255, 255, 0.08)');
    
    root.classList.remove('light');
    root.classList.add('dark');
    document.body.classList.remove('light');
    document.body.classList.add('dark');
  }

  // Helper to override Tailwind v4 utility class color scales
  const overrideColorScale = (prefix: string, baseColor: string) => {
    root.style.setProperty(`--color-${prefix}-50`, baseColor + '0a');  // 4% opacity
    root.style.setProperty(`--color-${prefix}-100`, baseColor + '1a'); // 10% opacity
    root.style.setProperty(`--color-${prefix}-150`, baseColor + '26'); // 15% opacity
    root.style.setProperty(`--color-${prefix}-200`, baseColor + '33'); // 20% opacity
    root.style.setProperty(`--color-${prefix}-250`, baseColor + '40'); // 25% opacity
    root.style.setProperty(`--color-${prefix}-300`, baseColor + '4d'); // 30% opacity
    root.style.setProperty(`--color-${prefix}-400`, baseColor + '66'); // 40% opacity
    root.style.setProperty(`--color-${prefix}-500`, baseColor);        // 100% opacity
    root.style.setProperty(`--color-${prefix}-600`, baseColor + 'd9'); // 85% opacity
    root.style.setProperty(`--color-${prefix}-700`, baseColor);        // 100% opacity
    root.style.setProperty(`--color-${prefix}-750`, baseColor + 'e6'); // 90% opacity
    root.style.setProperty(`--color-${prefix}-800`, baseColor + 'f2'); // 95% opacity
    root.style.setProperty(`--color-${prefix}-900`, baseColor);
    root.style.setProperty(`--color-${prefix}-950`, baseColor);
  };

  // Set brand colors dynamically
  root.style.setProperty('--color-primary', pColor);
  root.style.setProperty('--color-primary-hover', pColor + 'cc'); // cc = 80% opacity hex
  root.style.setProperty('--color-primary-light', pColor + '1a'); // 1a = 10% opacity hex
  root.style.setProperty('--color-primary-dark', pColor);
  root.style.setProperty('--color-secondary', sColor);
  root.style.setProperty('--color-secondary-hover', sColor + 'cc');
  root.style.setProperty('--color-secondary-light', sColor + '1a');

  // Override both teal & emerald scales to point to the primary color
  overrideColorScale('teal', pColor);
  overrideColorScale('emerald', pColor);

  // Override cyan scale to point to the secondary color
  overrideColorScale('cyan', sColor);
}
export default applyTheme;
