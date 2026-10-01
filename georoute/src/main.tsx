import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nProvider } from './i18n/I18nContext';
import './index.css';
import App from './App.tsx';

// Filter internal TomTom/Mapbox vector tile parser warnings regarding optional numeric tile properties
const suppressPattern = 'Expected value to be of type number, but found null instead';

const _origWarn = console.warn;
console.warn = (...args: unknown[]) => {
  if (typeof args[0] === 'string' && args[0].includes(suppressPattern)) {
    return;
  }
  _origWarn.apply(console, args);
};

const _origError = console.error;
console.error = (...args: unknown[]) => {
  if (typeof args[0] === 'string' && args[0].includes(suppressPattern)) {
    return;
  }
  _origError.apply(console, args);
};

// Also intercept Web Workers created by TomTom / Mapbox so self.console inside workers suppresses this warning
if (typeof window !== 'undefined' && window.Worker) {
  const OriginalWorker = window.Worker;

  const workerPatchCode = `
    (function() {
      var pattern = 'Expected value to be of type number, but found null instead';
      var origW = self.console.warn;
      self.console.warn = function() {
        if (arguments[0] && typeof arguments[0] === 'string' && arguments[0].indexOf(pattern) !== -1) return;
        return origW.apply(self.console, arguments);
      };
      var origE = self.console.error;
      self.console.error = function() {
        if (arguments[0] && typeof arguments[0] === 'string' && arguments[0].indexOf(pattern) !== -1) return;
        return origE.apply(self.console, arguments);
      };
    })();
  `;

  // @ts-expect-error Custom wrapper to intercept worker script and patch console
  window.Worker = function (scriptURL: string | URL, options?: WorkerOptions) {
    try {
      const urlStr = scriptURL.toString();
      if (urlStr.startsWith('blob:')) {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', urlStr, false);
        xhr.send();
        if (xhr.status === 200 || xhr.responseText) {
          const patchedBlob = new Blob([workerPatchCode + '\n' + xhr.responseText], {
            type: 'application/javascript',
          });
          const patchedUrl = URL.createObjectURL(patchedBlob);
          return new OriginalWorker(patchedUrl, options);
        }
      }
    } catch {
      // Fallback to unpatched worker
    }
    return new OriginalWorker(scriptURL, options);
  };

  window.Worker.prototype = OriginalWorker.prototype;
}

import { ErrorBoundary } from './components/ErrorBoundary';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <I18nProvider>
        <App />
      </I18nProvider>
    </ErrorBoundary>
  </StrictMode>
);
