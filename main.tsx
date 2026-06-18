import React from 'react';
import { createRoot } from 'react-dom/client';
import BeamAnalyzer from './Analisis estructural';
import './styles.css';

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <BeamAnalyzer />
  </React.StrictMode>
);
