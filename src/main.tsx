
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Ensure DOM is ready before mounting
const mount = () => {
  const rootElement = document.getElementById("root");
  if (rootElement) {
    createRoot(rootElement).render(<App />);
  } else {
    console.error("Root element not found");
  }
};

// Mount application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  mount();
}
