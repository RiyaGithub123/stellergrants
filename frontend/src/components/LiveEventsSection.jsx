import React, { useState, useEffect } from 'react';
import { rpcServer, DEFAULT_CONTRACT_ID } from '../services/stellar';
import { Radio, RefreshCw, ExternalLink, Activity, Sparkles, Filter } from 'lucide-react';
import { scValToNative } from '@stellar/stellar-sdk';

export default function LiveEventsSection() {
  const [contractId, setContractId] = useState(DEFAULT_CONTRACT_ID);
  const [events, setEvents] = useState([]);
  const [isPolling, setIsPolling] = useState(true);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('all');

  const fetchEvents = async () => {
    setLoading(true);
    try {
      // Query latest ledger and fetch events
      const latestLedgerRes = await rpcServer.getLatestLedger();
      const startLedger = Math.max(1, latestLedgerRes.sequence - 1000);

      const eventRes = await rpcServer.getEvents({
        startLedger,
        filters: [
          {
            type: 'contract',
            contractIds: [contractId],
          },
        ],
        limit: 25,
      });

      if (eventRes && eventRes.events) {
        const parsed = eventRes.events.map((ev, idx) => {
          let topics = [];
          let value = null;
          try {
            topics = ev.topic ? ev.topic.map((t) => scValToNative(t)) : [];
          } catch (e) {}
          try {
            value = ev.value ? scValToNative(ev.value) : null;
          } catch (e) {}

          return {
            id: ev.id || `${ev.ledger}-${idx}`,
            ledger: ev.ledger,
            ledgerClosedAt: ev.ledgerClosedAt,
            contractId: ev.contractId,
            topic: topics,
            value,
            txHash: ev.txHash,
          };
        });

        setEvents(parsed.reverse());
      }
    } catch (err) {
      console.warn('Event fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    if (!isPolling) return;
    const interval = setInterval(fetchEvents, 5000);
    return () => clearInterval(interval);
  }, [contractId, isPolling]);

  const formatTopic = (topics) => {
    if (!topics || topics.length === 0) return 'ContractEvent';
    return topics.map((t) => (typeof t === 'object' ? JSON.stringify(t) : String(t))).join(' : ');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header Bar */}
      <div className="glass-panel" style={{ padding: '1.5rem 1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span className="badge badge-cyan">
                Level 2 & 3 — Real-Time Soroban RPC
              </span>
              {isPolling && (
                <span className="badge badge-emerald">
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                  Live Syncing
                </span>
              )}
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '800', margin: '0.3rem 0 0.1rem 0' }}>
              On-Chain <span className="gradient-text">Event Stream</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
              Live contract events polled in real-time from Stellar Testnet Soroban RPC (`getEvents`).
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              className="btn-secondary"
              onClick={() => setIsPolling(!isPolling)}
              style={{ fontSize: '0.85rem' }}
            >
              <Radio size={14} color={isPolling ? '#10b981' : '#64748b'} />
              {isPolling ? 'Pause Polling' : 'Resume Polling'}
            </button>

            <button
              className="btn-secondary"
              onClick={fetchEvents}
              disabled={loading}
              style={{ fontSize: '0.85rem' }}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

        </div>
      </div>

      {/* Events List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {events.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
            <Activity size={36} color="var(--accent-cyan)" style={{ margin: '0 auto 0.75rem auto' }} />
            <h4 style={{ fontSize: '1.15rem', fontWeight: '700', margin: '0 0 0.4rem 0' }}>
              Awaiting On-Chain Events...
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '440px', margin: '0 auto' }}>
              Contract events emitted from `create_campaign`, `pledge_funds`, and `release_milestone` will stream here live.
            </p>
          </div>
        ) : (
          events.map((ev) => (
            <div
              key={ev.id}
              className="glass-card"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                borderLeft: '4px solid #00e5ff',
                padding: '1.2rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: 'rgba(0, 229, 255, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Sparkles size={18} color="#00e5ff" />
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                    <span className="badge badge-purple" style={{ fontSize: '0.75rem' }}>
                      Ledger #{ev.ledger}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {ev.ledgerClosedAt ? new Date(ev.ledgerClosedAt).toLocaleTimeString() : 'Just now'}
                    </span>
                  </div>

                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: '#fff', fontWeight: '600' }}>
                    {formatTopic(ev.topic)}
                  </div>

                  {ev.value !== null && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', marginTop: '0.3rem', fontFamily: 'var(--font-mono)' }}>
                      Payload: {typeof ev.value === 'object' ? JSON.stringify(ev.value) : String(ev.value)}
                    </div>
                  )}
                </div>
              </div>

              {ev.txHash && (
                <a
                  href={`https://stellar.expert/explorer/testnet/tx/${ev.txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '0.45rem 0.8rem' }}
                >
                  <ExternalLink size={14} />
                  View Tx
                </a>
              )}
            </div>
          ))
        )}
      </div>

    </div>
  );
}
