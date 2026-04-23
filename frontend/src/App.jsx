import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';

import { Dashboard } from './pages/Dashboard';
import { Catalog } from './pages/Catalog';
import { ActiveResources } from './pages/ActiveResources';
import { Provision } from './pages/Provision';

const Billing = () => (
  <div className="flex h-full items-center justify-center animate-in fade-in">
    <div className="text-center space-y-4">
        <span className="material-symbols-outlined text-outline text-6xl">payments</span>
        <h2 className="text-2xl font-bold text-on-surface">Billing Dashboard</h2>
        <p className="text-outline">Coming soon in Phase 2</p>
    </div>
  </div>
);

const Settings = () => (
  <div className="flex h-full items-center justify-center animate-in fade-in">
    <div className="text-center space-y-4">
        <span className="material-symbols-outlined text-outline text-6xl">settings</span>
        <h2 className="text-2xl font-bold text-on-surface">Settings Configuration</h2>
        <p className="text-outline">Coming soon in Phase 2</p>
    </div>
  </div>
);

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="catalog" element={<Catalog />} />
        <Route path="resources" element={<ActiveResources />} />
        <Route path="provision" element={<Provision />} />
        <Route path="billing" element={<Billing />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default App;
