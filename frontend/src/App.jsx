import React, { useState } from 'react';
import { WalletProvider } from './context/WalletContext';
import Header from './components/Header';
import WalletSection from './components/WalletSection';
import TransferSection from './components/TransferSection';
import CampaignDAOSection from './components/CampaignDAOSection';
import LiveEventsSection from './components/LiveEventsSection';
import TxModal from './components/TxModal';
import { ShieldCheck, Sparkles, Heart, Code2, Globe2 } from 'lucide-react';

function MainApp() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="app-container">
      {/* Header */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content View */}
      <main style={{ minHeight: '60vh' }}>
        {activeTab === 'dashboard' && <WalletSection setActiveTab={setActiveTab} />}
        {activeTab === 'transfer' && <TransferSection />}
        {activeTab === 'dao' && <CampaignDAOSection />}
        {activeTab === 'events' && <LiveEventsSection />}
      </main>

      {/* Wallet Connection Modal */}
      <TxModal />

      {/* Footer */}
      <footer
        style={{
          marginTop: '4rem',
          padding: '2rem 0',
          borderTop: '1px solid var(--card-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          color: 'var(--text-muted)',
          fontSize: '0.85rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={16} color="#00e5ff" />
          <span>
            <strong>StellarGrants</strong> — Milestone Escrow & Creator Grants Protocol
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <ShieldCheck size={14} color="#10b981" /> Soroban v22 On-Chain Verified
          </span>
          <span>Stellar Testnet</span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <WalletProvider>
      <MainApp />
    </WalletProvider>
  );
}
