
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Create the app without Clerk for now
createRoot(document.getElementById("root")!).render(
  <App />
);
