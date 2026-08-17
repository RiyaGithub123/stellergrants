import React from 'react';
import { useWallet } from '../context/WalletContext';
import {
  Sparkles,
  Wallet,
  Send,
  Radio,
  Layers,
  Droplets,
  LogOut,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';

export default function Header({ activeTab, setActiveTab }) {
  const {
    publicKey,
    walletType,
    balance,
    isFunding,
    setModalOpen,
    disconnectWallet,
    requestFaucet,
  } = useWallet();

  const truncateKey = (key) => {
    if (!key) return '';
    return `${key.slice(0, 4)}...${key.slice(-4)}`;
  };

  return (
    <header className="glass-panel" style={{ padding: '1rem 1.75rem', marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        
        {/* Brand & Network Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }} onClick={() => setActiveTab('dashboard')}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #00e5ff 0%, #a855f7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px rgba(0, 229, 255, 0.4)',
              }}
            >
              <Sparkles size={20} color="#070913" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.35rem', fontWeight: '800', letterSpacing: '-0.02em', margin: 0 }}>
                Stellar<span className="gradient-text">Grants</span>
              </h1>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '500' }}>
                Milestone Escrow & Grant Protocol
              </div>
            </div>
          </div>

          <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00e5ff', display: 'inline-block' }} />
            Testnet v22
          </span>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(10, 15, 30, 0.6)', padding: '0.35rem', borderRadius: '14px', border: '1px solid var(--card-border)' }}>
          <button
            className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <Wallet size={16} />
            Dashboard
          </button>

          <button
            className={`nav-tab ${activeTab === 'transfer' ? 'active' : ''}`}
            onClick={() => setActiveTab('transfer')}
          >
            <Send size={16} />
            Send XLM
          </button>

          <button
            className={`nav-tab ${activeTab === 'dao' ? 'active' : ''}`}
            onClick={() => setActiveTab('dao')}
          >
            <Layers size={16} />
            Grant Vaults
          </button>

          <button
            className={`nav-tab ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => setActiveTab('events')}
          >
            <Radio size={16} />
            Live Stream
          </button>
        </nav>

        {/* Wallet Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {publicKey ? (
            <>
              {/* 1-Click Faucet */}
              <button
                className="btn-faucet"
                onClick={requestFaucet}
                disabled={isFunding}
                title="Request 10,000 Testnet XLM"
              >
                <Droplets size={15} />
                {isFunding ? 'Funding...' : '+ Faucet'}
              </button>

              {/* Balance Pill */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--card-border)',
                  padding: '0.5rem 0.9rem',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <span style={{ fontWeight: '700', color: 'var(--accent-cyan)', fontSize: '0.9rem' }}>
                  {balance}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                  XLM
                </span>
              </div>

              {/* Connected Address Pill */}
              <div
                style={{
                  background: 'rgba(168, 85, 247, 0.12)',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  padding: '0.5rem 0.9rem',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.85rem',
                  color: '#e9d5ff',
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#a855f7' }} />
                <span>{truncateKey(publicKey)}</span>
              </div>

              {/* Direct Disconnect Button */}
              <button
                className="btn-disconnect"
                onClick={disconnectWallet}
                title="Disconnect Wallet"
              >
                <LogOut size={14} />
                <span>Disconnect</span>
              </button>
            </>
          ) : (
            <button className="btn-primary" onClick={() => setModalOpen(true)}>
              <Wallet size={18} />
              Connect Wallet
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
