import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import freighterApi, {
  isConnected as isFreighterConnected,
  requestAccess as requestFreighterAccess,
  getAddress as getFreighterAddress,
  signTransaction as signFreighterTransaction,
} from '@stellar/freighter-api';
import { Keypair } from '@stellar/stellar-sdk';
import { getAccountBalances, fundWithFriendbot, NETWORK_PASSPHRASE } from '../services/stellar';

const WalletContext = createContext();

export function WalletProvider({ children }) {
  const [walletType, setWalletType] = useState(null); // 'freighter' | 'demo'
  const [publicKey, setPublicKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [balance, setBalance] = useState('0.0000');
  const [accountExists, setAccountExists] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isFunding, setIsFunding] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [errorNotice, setErrorNotice] = useState(null);

  // Refresh balance
  const refreshBalance = useCallback(async () => {
    if (!publicKey) return;
    try {
      const data = await getAccountBalances(publicKey);
      setBalance(data.xlm || '0.0000');
      setAccountExists(data.exists);
    } catch (err) {
      console.warn('Balance fetch error:', err);
    }
  }, [publicKey]);

  // Periodic balance poll
  useEffect(() => {
    if (publicKey) {
      refreshBalance();
      const interval = setInterval(refreshBalance, 6000);
      return () => clearInterval(interval);
    }
  }, [publicKey, refreshBalance]);

  // Connect Freighter Wallet
  const connectFreighter = async () => {
    setIsConnecting(true);
    setErrorNotice(null);
    try {
      // 1. Check extension presence
      let connected = false;
      if (typeof isFreighterConnected === 'function') {
        const connRes = await isFreighterConnected();
        connected = typeof connRes === 'object' && connRes !== null ? !!connRes.isConnected : !!connRes;
      } else if (typeof window !== 'undefined' && (window.freighter || window.freighterApi)) {
        connected = true;
      }

      if (!connected) {
        throw new Error('Freighter extension not detected. Please install Freighter from freighter.app.');
      }

      // 2. Request address / access
      let pubKey = null;

      if (typeof requestFreighterAccess === 'function') {
        try {
          const accRes = await requestFreighterAccess();
          if (accRes && accRes.address) pubKey = accRes.address;
          else if (typeof accRes === 'string' && accRes.startsWith('G')) pubKey = accRes;
          else if (accRes && accRes.error) throw new Error(accRes.error);
        } catch (e) {
          console.warn('requestAccess failed, falling back to getAddress:', e);
        }
      }

      if (!pubKey && typeof getFreighterAddress === 'function') {
        const addrRes = await getFreighterAddress();
        if (addrRes && addrRes.address) pubKey = addrRes.address;
        else if (typeof addrRes === 'string' && addrRes.startsWith('G')) pubKey = addrRes;
        else if (addrRes && addrRes.error) throw new Error(addrRes.error);
      }

      if (!pubKey && typeof window !== 'undefined' && window.freighter) {
        if (typeof window.freighter.requestAccess === 'function') {
          const res = await window.freighter.requestAccess();
          if (res && res.address) pubKey = res.address;
          else if (typeof res === 'string') pubKey = res;
        } else if (typeof window.freighter.getPublicKey === 'function') {
          pubKey = await window.freighter.getPublicKey();
        }
      }

      if (!pubKey) {
        throw new Error('No account selected or permission was denied in Freighter.');
      }

      setPublicKey(pubKey);
      setWalletType('freighter');
      setModalOpen(false);
      await refreshBalance();
    } catch (err) {
      console.error('Freighter connect error:', err);
      setErrorNotice(err.message || 'Failed to connect Freighter');
    } finally {
      setIsConnecting(false);
    }
  };

  // Connect Instant Demo Testnet Keypair
  const connectDemoWallet = async () => {
    setIsConnecting(true);
    setErrorNotice(null);
    try {
      const savedSecret = localStorage.getItem('stellar_grants_demo_secret');
      let keypair;
      if (savedSecret) {
        keypair = Keypair.fromSecret(savedSecret);
      } else {
        keypair = Keypair.random();
        localStorage.setItem('stellar_grants_demo_secret', keypair.secret());
      }
      setPublicKey(keypair.publicKey());
      setSecretKey(keypair.secret());
      setWalletType('demo');
      setModalOpen(false);

      // Check if funded, else auto-fund with Friendbot
      const accData = await getAccountBalances(keypair.publicKey());
      if (!accData.exists) {
        setIsFunding(true);
        await fundWithFriendbot(keypair.publicKey());
        await refreshBalance();
        setIsFunding(false);
      } else {
        setBalance(accData.xlm);
        setAccountExists(true);
      }
    } catch (err) {
      setErrorNotice(`Demo wallet error: ${err.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect
  const disconnectWallet = () => {
    setPublicKey('');
    setSecretKey('');
    setBalance('0.0000');
    setWalletType(null);
    setAccountExists(false);
  };

  // 1-Click Friendbot Faucet funding
  const requestFaucet = async () => {
    if (!publicKey) return;
    setIsFunding(true);
    setErrorNotice(null);
    try {
      await fundWithFriendbot(publicKey);
      await new Promise((r) => setTimeout(r, 1200));
      await refreshBalance();
    } catch (err) {
      setErrorNotice(`Friendbot error: ${err.message}`);
    } finally {
      setIsFunding(false);
    }
  };

  // Transaction Signing Delegate
  const signTransaction = async (xdrString) => {
    if (walletType === 'freighter') {
      let signedXdr = null;

      if (typeof signFreighterTransaction === 'function') {
        const signRes = await signFreighterTransaction(xdrString, {
          networkPassphrase: NETWORK_PASSPHRASE,
        });
        if (signRes && signRes.signedTxXdr) signedXdr = signRes.signedTxXdr;
        else if (typeof signRes === 'string') signedXdr = signRes;
        else if (signRes && signRes.error) throw new Error(signRes.error);
      }

      if (!signedXdr && typeof window !== 'undefined' && window.freighter && typeof window.freighter.signTransaction === 'function') {
        const signRes = await window.freighter.signTransaction(xdrString, {
          networkPassphrase: NETWORK_PASSPHRASE,
        });
        if (signRes && signRes.signedTxXdr) signedXdr = signRes.signedTxXdr;
        else if (typeof signRes === 'string') signedXdr = signRes;
      }

      if (!signedXdr) throw new Error('Transaction signing was rejected by user in Freighter');
      return signedXdr;
    } else if (walletType === 'demo' && secretKey) {
      const keypair = Keypair.fromSecret(secretKey);
      const { TransactionBuilder } = await import('@stellar/stellar-sdk');
      const tx = TransactionBuilder.fromXDR(xdrString, NETWORK_PASSPHRASE);
      tx.sign(keypair);
      return tx.toXDR();
    } else {
      throw new Error('No active wallet available to sign transaction');
    }
  };

  return (
    <WalletContext.Provider
      value={{
        walletType,
        publicKey,
        secretKey,
        balance,
        accountExists,
        isConnecting,
        isFunding,
        modalOpen,
        setModalOpen,
        errorNotice,
        connectFreighter,
        connectDemoWallet,
        disconnectWallet,
        requestFaucet,
        refreshBalance,
        signTransaction,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
