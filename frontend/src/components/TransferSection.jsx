import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { sendNativePayment } from '../services/stellar';
import {
  Send,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Info,
} from 'lucide-react';
import confetti from 'canvas-confetti';

const QUICK_TEST_ACCOUNTS = [
  { label: 'Friendbot Treasury', address: 'GAIH3ULLFQ4DGSECF2AR555KZ4KNDGEKN4AFI4SU2M7B43MGK3QJZNSR' },
  { label: 'Stellar Foundation Testnet', address: 'GCKFQG2H5Z24D2R52TKF556K5YF2Q6X27T2Y5M3Z67T2J2Q7X2K4N2P3' },
  { label: 'StellarRiya Deployer Vault', address: 'GDMPL5UVXMAKEVJ4SQDKUGVLCEPSHAN4FWQEC54UZBCRDLN7M6BXGNV2' },
];

export default function TransferSection() {
  const { publicKey, balance, signTransaction, refreshBalance } = useWallet();

  const [destination, setDestination] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [txResult, setTxResult] = useState(null);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!publicKey) {
      setError('Please connect your wallet first.');
      return;
    }
    if (!destination || destination.trim().length < 56) {
      setError('Please provide a valid 56-character Stellar public key (starting with G).');
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount of XLM greater than 0.');
      return;
    }
    if (numAmount > parseFloat(balance)) {
      setError(`Insufficient balance. You only have ${balance} XLM available.`);
      return;
    }

    setLoading(true);
    setError(null);
    setTxResult(null);

    try {
      const res = await sendNativePayment({
        sourcePublicKey: publicKey,
        destinationPublicKey: destination.trim(),
        amount: numAmount.toFixed(7),
        memoText: memo.trim(),
        signTransactionDelegate: signTransaction,
      });

      setTxResult(res);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00e5ff', '#a855f7', '#10b981'],
      });
      await refreshBalance();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  const handleMaxAmount = () => {
    const val = parseFloat(balance);
    if (val > 1.5) {
      setAmount((val - 1.0).toFixed(4)); // Reserve 1 XLM for minimum base reserve & fees
    } else {
      setAmount(val.toFixed(4));
    }
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      
      {/* Header Info */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <span className="badge badge-cyan" style={{ marginBottom: '0.75rem' }}>
          Level 1 — Native Payment Rail
        </span>
        <h2 style={{ fontSize: '2rem', fontWeight: '800', margin: '0.4rem 0' }}>
          Transfer <span className="gradient-text">Native Lumens (XLM)</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Execute atomic, fee-sponsored peer-to-peer payments on the Stellar Testnet ledger.
        </p>
      </div>

      <div className="glass-panel" style={{ padding: '2rem' }}>
        <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
          
          {/* Destination Address */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Destination Stellar Address (Public Key)
            </label>
            <input
              type="text"
              className="input-glass"
              placeholder="G..."
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              style={{ fontFamily: 'var(--font-mono)' }}
              required
            />
            
            {/* Quick Test Accounts */}
            <div style={{ marginTop: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Quick Fill:</span>
              {QUICK_TEST_ACCOUNTS.map((acc, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setDestination(acc.address)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--card-border)',
                    borderRadius: '8px',
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.75rem',
                    color: 'var(--accent-cyan)',
                    cursor: 'pointer',
                  }}
                >
                  {acc.label}
                </button>
              ))}
            </div>
          </div>

          {/* Amount & Max Button */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                Amount (XLM)
              </label>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Available: <strong style={{ color: 'var(--accent-cyan)' }}>{balance} XLM</strong>
              </span>
            </div>

            <div style={{ position: 'relative' }}>
              <input
                type="number"
                step="any"
                min="0.0000001"
                className="input-glass"
                placeholder="e.g. 50.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{ paddingRight: '4.5rem' }}
                required
              />
              <button
                type="button"
                onClick={handleMaxAmount}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(0, 229, 255, 0.15)',
                  border: '1px solid rgba(0, 229, 255, 0.3)',
                  borderRadius: '8px',
                  padding: '0.3rem 0.6rem',
                  color: 'var(--accent-cyan)',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                MAX
              </button>
            </div>
          </div>

          {/* Optional Memo */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Transaction Memo (Optional, max 28 chars)
            </label>
            <input
              type="text"
              maxLength={28}
              className="input-glass"
              placeholder="e.g. Grant pledge / payment"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
          </div>

          {/* Fee & Network Estimate */}
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              padding: '0.85rem 1rem',
              borderRadius: '12px',
              border: '1px solid var(--card-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.8rem',
            }}
          >
            <span style={{ color: 'var(--text-muted)' }}>Estimated Network Fee</span>
            <span style={{ color: 'var(--accent-emerald)', fontWeight: '600' }}>0.00001 XLM (100 stroops)</span>
          </div>

          {/* Error Notice */}
          {error && (
            <div
              style={{
                background: 'rgba(244, 63, 94, 0.12)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                padding: '0.85rem 1rem',
                borderRadius: '12px',
                color: '#fda4af',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <AlertCircle size={16} color="#f43f5e" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', padding: '0.9rem', fontSize: '1rem' }}
            disabled={loading || !publicKey}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Signing & Broadcasting...
              </>
            ) : (
              <>
                <Send size={18} />
                Send Payment on Testnet
              </>
            )}
          </button>

        </form>

        {/* Success Confirmation Card */}
        {txResult && (
          <div
            style={{
              marginTop: '1.5rem',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              borderRadius: '16px',
              padding: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
              <CheckCircle2 size={20} color="#10b981" />
              <h4 style={{ margin: 0, color: '#34d399', fontWeight: '700' }}>Payment Confirmed on Stellar!</h4>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.3rem 0 0.8rem 0' }}>
              Ledger #{txResult.ledger} — Your native XLM transfer was permanently finalized.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${txResult.hash}`}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary"
                style={{ fontSize: '0.8rem', padding: '0.45rem 0.8rem' }}
              >
                <ExternalLink size={14} />
                View Tx on Stellar.Expert
              </a>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
