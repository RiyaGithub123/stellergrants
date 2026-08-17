import React, { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import {
  invokeContract,
  getRecentCampaigns,
  getCampaignDetails,
  DEFAULT_CONTRACT_ID,
} from '../services/stellar';
import {
  Address,
  nativeToScVal,
} from '@stellar/stellar-sdk';
import {
  Plus,
  Layers,
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Shield,
  Zap,
  Target,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import confetti from 'canvas-confetti';

const CATEGORIES = ['all', 'tech', 'defi', 'gaming', 'dao', 'social'];

export default function CampaignDAOSection() {
  const { publicKey, balance, signTransaction, refreshBalance } = useWallet();

  const [contractAddress, setContractAddress] = useState(DEFAULT_CONTRACT_ID);
  const [campaigns, setCampaigns] = useState([]);
  const [isFetchingCampaigns, setIsFetchingCampaigns] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchId, setSearchId] = useState('');
  const [searchedCampaign, setSearchedCampaign] = useState(null);

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPledgeModal, setShowPledgeModal] = useState(null); // Campaign object
  const [pledgeAmount, setPledgeAmount] = useState('');

  // Form States for New Campaign
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [category, setCategory] = useState('tech');
  const [milestones, setMilestones] = useState(3);

  // Status & Loading
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successNotice, setSuccessNotice] = useState(null);

  // Fetch campaigns directly from Soroban smart contract on Testnet
  const loadCampaigns = async () => {
    setIsFetchingCampaigns(true);
    try {
      const data = await getRecentCampaigns(contractAddress, 20);
      if (data) {
        setCampaigns(data);
      }
    } catch (err) {
      console.warn('Failed to load on-chain campaigns:', err);
    } finally {
      setIsFetchingCampaigns(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, [contractAddress]);

  const stroopsToXlm = (stroops) => {
    if (stroops === undefined || stroops === null) return '0';
    return (Number(stroops) / 10_000_000).toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  const calculateProgress = (raised, target) => {
    if (!target || target === 0n) return 0;
    const p = (Number(raised) / Number(target)) * 100;
    return Math.min(100, Math.round(p));
  };

  // Create Campaign
  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    if (!publicKey) {
      setError('Please connect your wallet first');
      return;
    }
    const numTarget = parseFloat(targetAmount);
    if (isNaN(numTarget) || numTarget <= 0) {
      setError('Target amount must be greater than 0');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessNotice(null);

    try {
      const targetStroops = BigInt(Math.floor(numTarget * 10_000_000));
      const res = await invokeContract({
        contractId: contractAddress,
        functionName: 'create_campaign',
        args: [
          new Address(publicKey).toScVal(),
          nativeToScVal(title.trim(), { type: 'string' }),
          nativeToScVal(description.trim(), { type: 'string' }),
          nativeToScVal(targetStroops, { type: 'i128' }),
          nativeToScVal(category, { type: 'symbol' }),
          nativeToScVal(Number(milestones), { type: 'u32' }),
        ],
        sourcePublicKey: publicKey,
        signTransactionDelegate: signTransaction,
      });

      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      setSuccessNotice({
        title: 'Grant Campaign Created on Stellar Testnet!',
        hash: res.hash,
      });

      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      setTargetAmount('');
      await loadCampaigns();
      await refreshBalance();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  // Pledge Funds
  const handlePledge = async (e) => {
    e.preventDefault();
    if (!publicKey) {
      setError('Please connect your wallet first');
      return;
    }
    const numPledge = parseFloat(pledgeAmount);
    if (isNaN(numPledge) || numPledge <= 0) {
      setError('Pledge amount must be positive');
      return;
    }
    if (numPledge > parseFloat(balance)) {
      setError(`Insufficient balance. You only have ${balance} XLM.`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const pledgeStroops = BigInt(Math.floor(numPledge * 10_000_000));
      const res = await invokeContract({
        contractId: contractAddress,
        functionName: 'pledge_funds',
        args: [
          new Address(publicKey).toScVal(),
          nativeToScVal(Number(showPledgeModal.id), { type: 'u64' }),
          nativeToScVal(pledgeStroops, { type: 'i128' }),
        ],
        sourcePublicKey: publicKey,
        signTransactionDelegate: signTransaction,
      });

      confetti({ particleCount: 90, spread: 70, origin: { y: 0.5 } });
      setSuccessNotice({
        title: `Pledged ${numPledge} XLM to Campaign #${showPledgeModal.id}!`,
        hash: res.hash,
      });

      setShowPledgeModal(null);
      setPledgeAmount('');
      await loadCampaigns();
      await refreshBalance();
    } catch (err) {
      setError(err.message || 'Pledge failed');
    } finally {
      setLoading(false);
    }
  };

  // Release Milestone
  const handleReleaseMilestone = async (campaign) => {
    if (!publicKey) return;
    setLoading(true);
    setError(null);
    try {
      const res = await invokeContract({
        contractId: contractAddress,
        functionName: 'release_milestone',
        args: [
          new Address(publicKey).toScVal(),
          nativeToScVal(Number(campaign.id), { type: 'u64' }),
        ],
        sourcePublicKey: publicKey,
        signTransactionDelegate: signTransaction,
      });

      confetti({ particleCount: 100, spread: 70 });
      setSuccessNotice({
        title: `Milestone Unlocked for Campaign #${campaign.id}!`,
        hash: res.hash,
      });
      await loadCampaigns();
    } catch (err) {
      setError(err.message || 'Failed to release milestone');
    } finally {
      setLoading(false);
    }
  };

  // Query Campaign by ID
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchId) return;
    setLoading(true);
    setError(null);
    try {
      const details = await getCampaignDetails(contractAddress, searchId);
      if (details) {
        setSearchedCampaign(details);
      } else {
        setError(`Campaign #${searchId} not found on contract`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredCampaigns = selectedCategory === 'all'
    ? campaigns
    : campaigns.filter((c) => (c.category?.toLowerCase() || '') === selectedCategory);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span className="badge badge-purple" style={{ marginBottom: '0.4rem' }}>
            Level 2 & 3 — Soroban Smart Contract Escrow
          </span>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', margin: '0.3rem 0' }}>
            Creator Grants & <span className="gradient-text">Milestone Escrows</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Trustless milestone-gated funding vaults enforced by Soroban WASM smart contracts.
          </p>
        </div>

        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
          <Plus size={18} />
          Create Grant Campaign
        </button>
      </div>

      {/* Contract Configuration & On-Chain Query Bar */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          
          {/* Target Contract Address Input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: '1 1 350px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700', whiteSpace: 'nowrap' }}>
              CONTRACT ID:
            </span>
            <input
              type="text"
              className="input-glass"
              value={contractAddress}
              onChange={(e) => setContractAddress(e.target.value)}
              style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', padding: '0.5rem 0.8rem' }}
            />
          </div>

          {/* Search by Campaign ID */}
          <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="number"
              min="1"
              className="input-glass"
              placeholder="Query ID..."
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              style={{ width: '120px', padding: '0.5rem 0.8rem', fontSize: '0.85rem' }}
            />
            <button type="submit" className="btn-secondary" style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem' }}>
              <Search size={15} />
              Query
            </button>
          </form>

        </div>
      </div>

      {/* Success / Error Banners */}
      {successNotice && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '14px',
            padding: '1rem 1.25rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <CheckCircle2 size={20} color="#10b981" />
            <span style={{ color: '#34d399', fontWeight: '600', fontSize: '0.95rem' }}>
              {successNotice.title}
            </span>
          </div>
          {successNotice.hash && (
            <a
              href={`https://stellar.expert/explorer/testnet/tx/${successNotice.hash}`}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
            >
              <ExternalLink size={14} />
              View on Stellar.Expert
            </a>
          )}
        </div>
      )}

      {error && (
        <div
          style={{
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            borderRadius: '14px',
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            color: '#fda4af',
            fontSize: '0.9rem',
          }}
        >
          <AlertCircle size={18} color="#f43f5e" />
          <span>{error}</span>
        </div>
      )}

      {/* Category Filter Chips */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: '10px',
              border: selectedCategory === cat ? '1px solid #00e5ff' : '1px solid var(--card-border)',
              background: selectedCategory === cat ? 'rgba(0, 229, 255, 0.15)' : 'rgba(15, 23, 42, 0.6)',
              color: selectedCategory === cat ? '#00e5ff' : 'var(--text-secondary)',
              fontWeight: '600',
              fontSize: '0.85rem',
              cursor: 'pointer',
              textTransform: 'uppercase',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Campaign Cards Grid */}
      {isFetchingCampaigns ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <Loader2 size={32} className="animate-spin" color="#00e5ff" style={{ margin: '0 auto 0.75rem auto' }} />
          <div style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>Reading live campaigns from Stellar Testnet...</div>
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <Layers size={36} color="var(--accent-cyan)" style={{ margin: '0 auto 0.75rem auto' }} />
          <h4 style={{ fontSize: '1.2rem', fontWeight: '700', margin: '0 0 0.5rem 0' }}>No On-Chain Campaigns Found</h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto 1.25rem auto' }}>
            There are currently no campaigns matching this filter on the smart contract. Be the first to deploy one!
          </p>
          <button className="btn-primary" onClick={() => setShowCreateModal(true)} style={{ margin: '0 auto' }}>
            <Plus size={16} /> Launch New Campaign
          </button>
        </div>
      ) : (
        <div className="grid-cols-2">
          {filteredCampaigns.map((camp) => {
            const progress = calculateProgress(camp.raised_amount, camp.target_amount);
            const isCreator = publicKey && camp.creator === publicKey;

            return (
              <div key={camp.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1.25rem' }}>
              
              <div>
                {/* Card Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <span className="badge badge-cyan">
                    #{camp.id} • {camp.category || 'tech'}
                  </span>

                  <span className={`badge ${camp.status === 'MilestoneCompleted' ? 'badge-emerald' : camp.status === 'FullyFunded' ? 'badge-purple' : 'badge-amber'}`}>
                    {camp.status}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>
                  {camp.title}
                </h3>

                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
                  {camp.description}
                </p>

                {/* Creator Address */}
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '0.6rem' }}>
                  Creator: {camp.creator ? `${camp.creator.slice(0, 6)}...${camp.creator.slice(-6)}` : 'N/A'}
                </div>
              </div>

              {/* Progress Bar & Funding Numbers */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.4rem' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--accent-cyan)' }}>
                    {stroopsToXlm(camp.raised_amount)} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>XLM</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Goal: <strong style={{ color: 'var(--text-primary)' }}>{stroopsToXlm(camp.target_amount)} XLM</strong> ({progress}%)
                  </div>
                </div>

                <div className="progress-container">
                  <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                </div>

                {/* Milestone Stepper */}
                <div className="milestone-stepper">
                  {Array.from({ length: camp.milestone_count || 3 }).map((_, mIdx) => {
                    const stepNum = mIdx + 1;
                    const isCompleted = stepNum <= (camp.milestones_released || 0);
                    const isCurrent = stepNum === (camp.milestones_released || 0) + 1;

                    return (
                      <div key={mIdx} className="milestone-step">
                        <div className={`milestone-circle ${isCompleted ? 'completed' : isCurrent ? 'current' : ''}`}>
                          {isCompleted ? '✓' : stepNum}
                        </div>
                        <span style={{ fontSize: '0.7rem', color: isCompleted ? '#10b981' : isCurrent ? '#00e5ff' : 'var(--text-muted)', fontWeight: '600' }}>
                          M{stepNum}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.6rem', borderTop: '1px solid var(--card-border)', paddingTop: '1rem' }}>
                <button
                  className="btn-primary"
                  style={{ flex: 1, padding: '0.6rem', fontSize: '0.85rem' }}
                  onClick={() => setShowPledgeModal(camp)}
                >
                  <Zap size={15} />
                  Pledge XLM
                </button>

                {isCreator && (
                  <button
                    className="btn-secondary"
                    style={{ padding: '0.6rem 0.9rem', fontSize: '0.85rem', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.4)' }}
                    onClick={() => handleReleaseMilestone(camp)}
                    disabled={loading || camp.milestones_released >= camp.milestone_count}
                    title="Unlock next milestone funds to your creator account"
                  >
                    <Shield size={15} />
                    Unlock Milestone
                  </button>
                )}
              </div>

            </div>
          );
        })}
      </div>
      )}

      {/* Modal: Create Campaign */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '1.25rem' }}>
              Launch <span className="gradient-text">Grant Campaign</span>
            </h3>

            <form onSubmit={handleCreateCampaign} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                  Campaign Title
                </label>
                <input
                  type="text"
                  className="input-glass"
                  placeholder="e.g. Soroban DeFi Indexer"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                  Description & Deliverables
                </label>
                <textarea
                  className="input-glass"
                  rows={3}
                  placeholder="Describe your grant objectives and deliverables for backers..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                    Funding Goal (XLM)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    className="input-glass"
                    placeholder="e.g. 500"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                    Category
                  </label>
                  <select
                    className="input-glass"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="tech">Tech & Infra</option>
                    <option value="defi">DeFi & DEX</option>
                    <option value="gaming">Gaming & Metaverse</option>
                    <option value="dao">DAO & Governance</option>
                    <option value="social">Social & Creators</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                  Milestone Tranches ({milestones} Milestones)
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={milestones}
                  onChange={(e) => setMilestones(e.target.value)}
                  style={{ width: '100%', accentColor: '#00e5ff' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  <span>1 (Single Payout)</span>
                  <span>3 (Recommended)</span>
                  <span>5 (Phased)</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 2 }}
                  disabled={loading || !publicKey}
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : 'Deploy to Escrow Contract'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Pledge Funds */}
      {showPledgeModal && (
        <div className="modal-backdrop" onClick={() => setShowPledgeModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.35rem', fontWeight: '800', marginBottom: '0.5rem' }}>
              Back Campaign #{showPledgeModal.id}
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              {showPledgeModal.title}
            </p>

            <form onSubmit={handlePledge} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                  Pledge Amount (XLM)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.1"
                  className="input-glass"
                  placeholder="e.g. 50"
                  value={pledgeAmount}
                  onChange={(e) => setPledgeAmount(e.target.value)}
                  required
                />

                {/* Quick Presets */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem' }}>
                  {[10, 50, 100, 250].map((val) => (
                    <button
                      type="button"
                      key={val}
                      onClick={() => setPledgeAmount(val.toString())}
                      style={{
                        flex: 1,
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--card-border)',
                        borderRadius: '8px',
                        padding: '0.35rem',
                        fontSize: '0.8rem',
                        color: 'var(--accent-cyan)',
                        cursor: 'pointer',
                      }}
                    >
                      +{val} XLM
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setShowPledgeModal(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 2 }}
                  disabled={loading || !publicKey}
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : 'Confirm & Pledge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
