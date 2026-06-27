export function applyTheme(theme: string, primaryColor: string, secondaryColor: string = "#06b6d4") {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  
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
  root.style.setProperty('--color-primary', primaryColor);
  root.style.setProperty('--color-primary-hover', primaryColor + 'cc'); // cc = 80% opacity hex
  root.style.setProperty('--color-primary-light', primaryColor + '1a'); // 1a = 10% opacity hex
  root.style.setProperty('--color-primary-dark', primaryColor);

  root.style.setProperty('--color-secondary', secondaryColor);
  root.style.setProperty('--color-secondary-hover', secondaryColor + 'cc');
  root.style.setProperty('--color-secondary-light', secondaryColor + '1a');
}
export default applyTheme;
