// Vite-powered auto-import registry for React components
const modules = import.meta.glob('./*.jsx', { eager: true });

export const componentRegistry = Object.fromEntries(
  Object.entries(modules).map(([path, mod]) => {
    // Extract component name from filename (e.g., './MyButton.jsx' -> 'MyButton')
    const name = path.match(/\.\/(.*)\.jsx$/)[1];
    return [name, mod.default];
  })
);
