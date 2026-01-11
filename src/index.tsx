alert("DEBUG: Script index.tsx em execução");
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';

console.log('Mounting App...');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("Root element not found");
  alert("Erro Fatal: Elemento #root não encontrado no HTML.");
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <HashRouter>
        <App />
      </HashRouter>
    </React.StrictMode>
  );
  console.log('App mounted successfully.');
} catch (error) {
  console.error("Mount error:", error);
  alert("Erro ao iniciar aplicação: " + (error instanceof Error ? error.message : String(error)));
}