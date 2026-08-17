import React, { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import {
  Wallet,
  Copy,
  Check,
  QrCode,
  ArrowUpRight,
  Shield,
  Zap,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { getVaultStats, DEFAULT_CONTRACT_ID } from '../services/stellar';

export default function WalletSection({ setActiveTab }) {
  const { publicKey, balance, walletType, accountExists, requestFaucet, isFunding, setModalOpen } = useWallet();
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState({ total_campaigns: 0, total_funds_raised: 0, total_funds_released: 0 });

  useEffect(() => {
    getVaultStats(DEFAULT_CONTRACT_ID).then((s) => {
      if (s) setStats(s);
    });
  }, []);

  const copyAddress = () => {
    if (!publicKey) return;
    navigator.clipboard.writeText(publicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const stroopsToXlm = (stroops) => {
    if (!stroops) return '0.00';
    return (Number(stroops) / 10_000_000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const qrUrl = publicKey
    ? `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(publicKey)}&bgcolor=070913&color=00e5ff&margin=6`
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      
      {/* Top Banner Hero */}
      <div
        className="glass-panel"
        style={{
          padding: '2.5rem 2rem',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(13, 17, 36, 0.9) 0%, rgba(20, 28, 58, 0.8) 100%)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
          
          {/* Balance & Address */}
          <div style={{ flex: '1 1 400px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <span className="badge badge-purple">
                <Sparkles size={13} />
                Decentralized Escrow Protocol
              </span>
              {walletType && (
                <span className="badge badge-emerald">
                  {walletType.toUpperCase()} WALLET
                </span>
              )}
            </div>

            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Available Stellar Balance
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', margin: '0.5rem 0 1.25rem 0' }}>
              <h1 style={{ fontSize: '3.2rem', fontWeight: '800', letterSpacing: '-0.03em', margin: 0 }} className="gradient-text">
                {publicKey ? balance : '0.0000'}
              </h1>
              <span style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-secondary)' }}>
                XLM
              </span>
            </div>

            {publicKey ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                {/* Copyable Address */}
                <div
                  onClick={copyAddress}
                  style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid var(--card-border)',
                    padding: '0.6rem 1rem',
                    borderRadius: '12px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.85rem',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                  }}
                  title="Click to copy address"
                >
                  <span>{publicKey.slice(0, 8)}...{publicKey.slice(-8)}</span>
                  {copied ? <Check size={15} color="#10b981" /> : <Copy size={15} color="var(--text-muted)" />}
                </div>

                <a
                  href={`https://stellar.expert/explorer/testnet/account/${publicKey}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary"
                  style={{ padding: '0.55rem 0.9rem', fontSize: '0.85rem' }}
                >
                  <ExternalLink size={14} />
                  Stellar.Expert
                </a>

                <button
                  className="btn-faucet"
                  onClick={requestFaucet}
                  disabled={isFunding}
                >
                  <Zap size={14} />
                  {isFunding ? 'Funding...' : 'Faucet (+10k XLM)'}
                </button>
              </div>
            ) : (
              <div>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem', maxWidth: '420px', fontSize: '0.95rem' }}>
                  Connect your Freighter wallet or use the instant Testnet Keypair to launch milestone-based campaigns or back projects on Stellar.
                </p>
                <button className="btn-primary" onClick={() => setModalOpen(true)}>
                  <Wallet size={18} />
                  Connect Wallet to Begin
                </button>
              </div>
            )}
          </div>

          {/* QR Code / Quick Card */}
          {publicKey && qrUrl && (
            <div
              style={{
                background: 'rgba(7, 9, 19, 0.8)',
                border: '1px solid rgba(0, 229, 255, 0.3)',
                padding: '1rem',
                borderRadius: '16px',
                textAlign: 'center',
                boxShadow: '0 0 30px rgba(0, 229, 255, 0.15)',
              }}
            >
              <img
                src={qrUrl}
                alt="Account QR"
                style={{ width: '130px', height: '130px', borderRadius: '8px', display: 'block', margin: '0 auto' }}
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', marginTop: '0.5rem', fontWeight: '600' }}>
                Scan to Pay XLM
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Protocol Metrics & Quick Access */}
      <div className="grid-cols-3">
        
        {/* Metric 1 */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
              Active Campaigns
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(0, 229, 255, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={18} color="#00e5ff" />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-primary)' }}>
            {Number(stats.total_campaigns) || '0'}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', marginTop: '0.4rem' }}>
            Milestone Escrows on Testnet
          </div>
        </div>

        {/* Metric 2 */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
              Total Funds Raised
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={18} color="#a855f7" />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--accent-purple)' }}>
            {stroopsToXlm(stats.total_funds_raised)} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>XLM</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
            Pledged by Backers
          </div>
        </div>

        {/* Metric 3 */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
              Milestones Unlocked
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={18} color="#10b981" />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--accent-emerald)' }}>
            {stroopsToXlm(stats.total_funds_released)} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>XLM</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--accent-emerald)', marginTop: '0.4rem' }}>
            Released to Creators
          </div>
        </div>

      </div>

      {/* Quick Launch Action Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '1.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          borderLeft: '4px solid #00e5ff',
        }}
      >
        <div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.35rem' }}>
            Ready to launch your decentralized project grant?
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Create a campaign with milestone stages. Backers fund your escrow and unlock funds upon proof of delivery.
          </p>
        </div>

        <button className="btn-primary" onClick={() => setActiveTab('dao')}>
          Explore Grant Vaults
          <ArrowUpRight size={18} />
        </button>
      </div>

    </div>
  );
}
