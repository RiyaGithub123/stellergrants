import React from 'react';
import { useWallet } from '../context/WalletContext';
import {
  Wallet,
  X,
  Sparkles,
  Zap,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Loader2,
} from 'lucide-react';

export default function TxModal() {
  const {
    modalOpen,
    setModalOpen,
    connectFreighter,
    connectDemoWallet,
    isConnecting,
    errorNotice,
  } = useWallet();

  if (!modalOpen) return null;

  return (
    <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #00e5ff 0%, #a855f7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Wallet size={18} color="#070913" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0 }}>
                Connect <span className="gradient-text">Stellar Wallet</span>
              </h3>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Select your preferred connection method
              </div>
            </div>
          </div>

          <button
            onClick={() => setModalOpen(false)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Error Notice */}
        {errorNotice && (
          <div
            style={{
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.4)',
              borderRadius: '12px',
              padding: '0.85rem 1rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
              fontSize: '0.85rem',
              color: '#fda4af',
            }}
          >
            <AlertCircle size={16} color="#f43f5e" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div>{errorNotice}</div>
              {errorNotice.includes('freighter.app') && (
                <a
                  href="https://www.freighter.app"
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#00e5ff', textDecoration: 'underline', marginTop: '4px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                >
                  Download Freighter Extension <ExternalLink size={12} />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          
          {/* Option 1: Freighter */}
          <div
            onClick={!isConnecting ? connectFreighter : undefined}
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--card-border)',
              borderRadius: '14px',
              padding: '1.1rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: isConnecting ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
            }}
            className="wallet-option"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'rgba(0, 229, 255, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                }}
              >
                🛸
              </div>
              <div>
                <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#fff' }}>
                  Freighter Wallet
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Recommended Chrome extension for Stellar
                </div>
              </div>
            </div>

            <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
              Primary
            </span>
          </div>

          {/* Option 2: Instant Testnet Keypair */}
          <div
            onClick={!isConnecting ? connectDemoWallet : undefined}
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--card-border)',
              borderRadius: '14px',
              padding: '1.1rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: isConnecting ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
            }}
            className="wallet-option"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                }}
              >
                ⚡
              </div>
              <div>
                <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#fff' }}>
                  Instant Testnet Keypair
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Auto-funded (+10k XLM) • Instant test sandbox
                </div>
              </div>
            </div>

            <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
              Fastest
            </span>
          </div>

        </div>

        {isConnecting && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem', color: 'var(--accent-cyan)' }}>
            <Loader2 size={16} className="animate-spin" />
            <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Connecting to wallet...</span>
          </div>
        )}

      </div>
    </div>
  );
}
