import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.scss';
import 'remixicon/fonts/remixicon.css';
import ContextProvider from './Context/Context.jsx';
import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ContextProvider>
      <App />
    </ContextProvider>
  </React.StrictMode>,
)