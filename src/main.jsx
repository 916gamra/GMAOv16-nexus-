import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './presentation/components/common/ErrorBoundary';
import { storageService } from './utils/storageService';
import { AuthProvider } from './context/AuthContext';
import { I18nProvider } from './i18n/I18nContext';
import { ServiceProvider } from './core/di/ServiceProvider';
import { Logger } from './core/logger/LoggerService';
import { errorTracker } from './services/ErrorTrackingService';
import { analytics } from './services/AnalyticsService';

// Initialize Enterprise Architecture DI Container and Error / Analytics Tracking
ServiceProvider.register();
errorTracker.init();
analytics.track('app_started', 'system', { timestamp: Date.now() });

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <ErrorBoundary>
        <I18nProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </I18nProvider>
      </ErrorBoundary>
    </StrictMode>
  );
}


// Background initialization for storage migrations
storageService.init().catch((err) => {
  Logger.warn('Initialization notice:', err, 'storageService');
});

// Enregistrement du Service Worker pour le mode 100% Offline et PWA
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        Logger.info(`Service Worker enregistré: ${registration.scope}`, null, 'PWA');
      })
      .catch((error) => {
        Logger.warn('Erreur enregistrement Service Worker:', error, 'PWA');
      });
  });
}

