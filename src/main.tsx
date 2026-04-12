import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { ScannerProvider } from './context/ScannerContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ScannerProvider>
      <App />
    </ScannerProvider>
  </StrictMode>,
);
