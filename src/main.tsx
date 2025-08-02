import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { RouteProvider } from './router';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouteProvider />
  </StrictMode>,
);
