import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';

console.log('Mounting App...');

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Elemento #root não encontrado no HTML.');
  }

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
  console.error("ERRO CRITICO NA MONTAGEM:", error);
  document.body.innerHTML = `<div style="padding: 20px; color: red; font-family: sans-serif;">
    <h2>Erro ao Iniciar Sistema</h2>
    <pre>${error instanceof Error ? error.message : String(error)}</pre>
  </div>`;
}