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
    
    // Set class list for dark/light selectors
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
    
    document.body.classList.remove('light');
    document.body.classList.add('dark');
  }

  // Set brand colors dynamically
  root.style.setProperty('--color-primary', pColor);
  root.style.setProperty('--color-primary-hover', pColor + 'cc'); // cc = 80% opacity hex
  root.style.setProperty('--color-primary-light', pColor + '1a'); // 1a = 10% opacity hex
  root.style.setProperty('--color-primary-dark', pColor);

  // Dynamic override for default Tailwind v4 teal utility classes (primary brand scale)
  root.style.setProperty('--color-teal-50', pColor + '0a'); // 4% opacity
  root.style.setProperty('--color-teal-100', pColor + '1f'); // 12% opacity
  root.style.setProperty('--color-teal-200', pColor + '3d'); // 24% opacity
  root.style.setProperty('--color-teal-500', pColor);
  root.style.setProperty('--color-teal-600', pColor + 'd9');
  root.style.setProperty('--color-teal-700', pColor);
  root.style.setProperty('--color-teal-750', pColor + 'e6');
  root.style.setProperty('--color-teal-800', pColor + 'f2');
  root.style.setProperty('--color-teal-900', pColor);

  // Dynamic override for default Tailwind v4 cyan/emerald classes (secondary/accent brand scale)
  root.style.setProperty('--color-secondary', sColor);
  root.style.setProperty('--color-secondary-hover', sColor + 'cc');
  root.style.setProperty('--color-secondary-light', sColor + '1a');
  
  root.style.setProperty('--color-cyan-50', sColor + '0a');
  root.style.setProperty('--color-cyan-500', sColor);
  root.style.setProperty('--color-cyan-600', sColor);
  root.style.setProperty('--color-cyan-700', sColor + 'e6');
  root.style.setProperty('--color-cyan-800', sColor + 'f2');
}
export default applyTheme;
