# ⚡ StellarGrants — Decentralized Creator Grants & Milestone Escrow Protocol

[![Stellar Testnet](https://img.shields.io/badge/Network-Stellar_Testnet-00e5ff?style=for-the-badge&logo=stellar)](https://stellar.expert/explorer/testnet)
[![Soroban v22](https://img.shields.io/badge/Smart_Contracts-Soroban_v22-7c4dff?style=for-the-badge)](https://soroban.stellar.org)
[![Live Demo Video](https://img.shields.io/badge/YouTube-Live_Demo_Video-ff0000?style=for-the-badge&logo=youtube)](https://www.youtube.com/watch?v=64qJXUGWB9c)
[![CI/CD Pipeline](https://img.shields.io/badge/CI%2FCD-GitHub_Actions-00e676?style=for-the-badge&logo=githubactions)](.github/workflows/ci.yml)
[![Level 1-2-3 Qualified](https://img.shields.io/badge/Challenge-Levels_1_2_3_Complete-ffd600?style=for-the-badge)](https://developers.stellar.org)

> **StellarGrants** is a decentralized crowdfunding, ecosystem grant, and milestone-gated escrow protocol deployed on **Stellar Testnet** using **Soroban WASM v22**. Built for the **Stellar Developer Challenge (Levels 1, 2 & 3)**, it features trustless escrow vaults, multi-stage milestone releases, backer refund guarantees, multi-wallet authentication, and real-time on-chain event streaming wrapped in a cosmic glassmorphism user interface.

---

## 🎥 Video Demonstration
* **YouTube Walkthrough & Live Demo:** [https://www.youtube.com/watch?v=64qJXUGWB9c](https://www.youtube.com/watch?v=64qJXUGWB9c)

---

## 📋 Evaluator & Mentor Quick Reference

| Parameter | On-Chain Value / Link |
| :--- | :--- |
| **Network** | **Stellar Testnet (Protocol 22 / Soroban v22)** |
| **Contract Name** | `GrantEscrowContract` |
| **Primary Deployed Contract ID** | [`CBHPULMSCLA3F3LEPKAAWVGEQNYUMLX3KFNPUFGU2SBOBFIMGFC5KIAS`](https://stellar.expert/explorer/testnet/contract/CBHPULMSCLA3F3LEPKAAWVGEQNYUMLX3KFNPUFGU2SBOBFIMGFC5KIAS) |
| **CLI Deployed Contract ID** | [`CDIIVD2KFT7XJ7IAJK4YIOS3HZQSC6HX4YZNWYMZ6XDRVN6C7CXWSJR6`](https://stellar.expert/explorer/testnet/contract/CDIIVD2KFT7XJ7IAJK4YIOS3HZQSC6HX4YZNWYMZ6XDRVN6C7CXWSJR6) |
| **WASM Bytecode Hash** | `2948a804acdf0a02cf74fe24b58b06dc115e24bd9bf6b5ded6356b95e7596866` |
| **WASM Size** | `11,286 bytes` |
| **Contract Deployment Tx** | [`83658edfd29d524679318623fbc7c8663e333a73d100ea5a5003fb99f0601811`](https://stellar.expert/explorer/testnet/tx/83658edfd29d524679318623fbc7c8663e333a73d100ea5a5003fb99f0601811) |
| **Verified On-Chain Campaign #1 Tx** | [`39d1d25bbf7c94bf9b607ce8479f37b22c97c704b8717e35009536aa9348ffda`](https://stellar.expert/explorer/testnet/tx/39d1d25bbf7c94bf9b607ce8479f37b22c97c704b8717e35009536aa9348ffda) |
| **Deployer Public Key** | `GATMHHGUGSMSEYFXTDVZPJEYG546VYPRIQXOICE3BNL6OHU53FLNXLCI` |
| **CLI Deployer Identity** | `GAW727V4MUPNUGW4RILTR3B5TX7T3LGYLFXMZXA53A26JOD4WCVJ3L7C` |
| **Horizon RPC Endpoint** | `https://horizon-testnet.stellar.org` |
| **Soroban RPC Endpoint** | `https://soroban-testnet.stellar.org` |
| **Unit Test Coverage** | **4 / 4 Passing Unit Tests (`cargo test`)** |

---

## 🏛️ Architecture Overview

```mermaid
graph TD
    User([Creator / Backer / Contributor]) -->|Freighter / Instant Keypair| Wallet[Connected Wallet]
    User -->|Cosmic Glassmorphism UI| Frontend[React + Vite Frontend]
    
    Frontend -->|Horizon REST API| Horizon[Stellar Horizon Testnet]
    Frontend -->|Soroban RPC JSON-RPC| SorobanRPC[Stellar Soroban RPC]
    Frontend -->|1-Click Faucet| Friendbot[Stellar Friendbot (+10,000 XLM)]
    
    Wallet -->|Sign Payment XDR| Horizon
    Wallet -->|Sign Contract Invocations| SorobanRPC
    
    SorobanRPC -->|Execute WASM| Contract[GrantEscrowContract Vault]
    Contract -->|Emit On-Chain Events| EventStream[Real-Time Event Streamer]
    EventStream -->|Live UI Synchronization| Frontend
```

---

## 🎯 Challenge Requirements Matrix

| Level | Focus Area | Requirement | StellarGrants Implementation | Status |
| :--- | :--- | :--- | :--- | :---: |
| **Level 1** | **White Belt** | Wallet Connect & Disconnect | Freighter integration with `@stellar/freighter-api` v3 + instant testnet key fallback | ✅ Complete |
| **Level 1** | **White Belt** | Display Balance & Funding | Real-time XLM balance + 1-Click Friendbot Faucet (+10,000 XLM) | ✅ Complete |
| **Level 1** | **White Belt** | XLM Payments on Testnet | Direct payment module with address validation, amount formatting, memo, and explorer link | ✅ Complete |
| **Level 1** | **White Belt** | Transaction Feedback | Instant confirmation banner with ledger number, tx hash, and Stellar.Expert link | ✅ Complete |
| **Level 2** | **Green Belt** | Multi-Wallet Support | Freighter and Instant Demo Testnet keypair in custom modal | ✅ Complete |
| **Level 2** | **Green Belt** | 3+ Error Handling Types | User rejected, Insufficient balance, Invalid address, Simulation revert | ✅ Complete |
| **Level 2** | **Green Belt** | Smart Contract on Testnet | Soroban Rust contract with persistent state storage, milestone calculations, and refund logic | ✅ Complete |
| **Level 2** | **Green Belt** | Frontend Contract Calls | Frontend invokes `create_campaign`, `pledge_funds`, `release_milestone`, `refund_backer`, `get_campaign` | ✅ Complete |
| **Level 2** | **Green Belt** | Real-Time Events | Subscribes to Soroban RPC `getEvents` for live contract activity feed | ✅ Complete |
| **Level 3** | **Black Belt** | Advanced Smart Contracts | Structs, Enums, Maps, TTL management, Event emissions, and milestone release mechanics | ✅ Complete |
| **Level 3** | **Black Belt** | Comprehensive Unit Tests | 4 passing unit tests in Rust (`cargo test`) verifying all contract methods | ✅ Complete |
| **Level 3** | **Black Belt** | CI/CD Pipeline | Automated GitHub Actions workflow testing contracts and building frontend | ✅ Complete |
| **Level 3** | **Black Belt** | Mobile Responsive UI | Cosmic glassmorphism design system with responsive layouts for mobile & desktop | ✅ Complete |

---

## 📦 Project Structure

```
StelelrGrants/
├── .github/
│   └── workflows/
│       └── ci.yml               # Automated CI/CD testing & build workflow
├── contracts/
│   └── grant_escrow/
│       ├── Cargo.toml           # Soroban Rust SDK v22 dependencies
│       └── src/
│           ├── lib.rs           # GrantEscrowContract implementation
│           └── test.rs          # 4 comprehensive Rust unit tests
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx       # Navigation, network badge & wallet modal
│   │   │   ├── WalletSection.jsx# Hero balance, QR code & protocol metrics
│   │   │   ├── TransferSection.jsx # Level 1 XLM payments on testnet
│   │   │   ├── CampaignDAOSection.jsx # Level 2/3 Soroban contract interaction
│   │   │   ├── LiveEventsSection.jsx  # Real-time contract event stream
│   │   │   └── TxModal.jsx      # Multi-wallet connection dialog
│   │   ├── context/
│   │   │   └── WalletContext.jsx# Global wallet state & signature delegate
│   │   ├── services/
│   │   │   └── stellar.js       # Horizon, Soroban RPC & contract utilities
│   │   ├── App.jsx              # Main router & layout
│   │   ├── index.css            # Cosmic glassmorphism design system
│   │   └── main.jsx             # React entry point
│   ├── index.html               # Typography & metadata
│   ├── package.json             # Frontend dependencies & scripts
│   └── vite.config.js           # Vite configuration with Node polyfills
├── scripts/
│   ├── deploy_live_testnet.js   # Automated SDK deployment script
│   └── interact_live_testnet.js # On-chain read/write verification script
└── README.md                    # Project documentation
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites
* **Node.js** (v18 or higher)
* **Rust** (with `wasm32-unknown-unknown` target)
* **Freighter Wallet Extension** ([freighter.app](https://www.freighter.app/))

---

### 2. Run Frontend Locally

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install --legacy-peer-deps

# Start local development server
npm run dev
```

Open [http://localhost:5174](http://localhost:5174) in your browser.

---

### 3. Run Smart Contract Unit Tests

```bash
cd contracts/grant_escrow
cargo test
```

**Expected Test Output:**
```
running 4 tests
test test::test_nonexistent_campaign_panic - should panic ... ok
test test::test_create_and_fetch_campaign ... ok
test test::test_refund_and_stats ... ok
test test::test_pledge_and_milestone_release ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.05s
```

---

### 4. Build Contract WASM

```bash
cd contracts/grant_escrow
cargo build --target wasm32-unknown-unknown --release
```

---

## 🌐 How to Deploy Frontend to Vercel

1. Push this repository to GitHub (`https://github.com/RiyaGithub123/StelelrGrants.git`).
2. Log into [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import your **`StelelrGrants`** repository.
4. Under **Project Settings**:
   * **Root Directory**: Click *Edit* and select **`frontend`**.
   * **Framework Preset**: Select **Vite**.
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
5. Click **"Deploy"** — your live dApp will be deployed to a `*.vercel.app` URL in under 60 seconds!

---

## 🧪 Testing Scenarios & Checklist

### Level 1 (White Belt) Verification
1. **Wallet Connect**: Click "Connect Wallet" -> select Freighter or Instant Testnet Key.
2. **Faucet Funding**: Click "+ Faucet (+10k XLM)" -> account balance increments.
3. **Send Payment**: Navigate to "Send XLM", fill destination address, amount, and click "Send Payment on Testnet".
4. **Tx Feedback**: View transaction hash and click "View on Stellar.Expert" to see on-chain confirmation.

### Level 2 (Green Belt) Verification
1. **Create Grant Campaign**: Go to "Grant Vaults", click "Create Grant Campaign", fill details and milestone count (1-5), and sign transaction.
2. **Pledge XLM**: Click "Pledge XLM" on any campaign card, select amount (+10, +50, +100 XLM), and confirm pledge.
3. **Query by ID**: Search any campaign ID in the query bar to call `get_campaign` on-chain.

### Level 3 (Black Belt) Verification
1. **Milestone Unlocking**: As campaign creator, click "Unlock Milestone" -> contract releases milestone tranche and advances state.
2. **Event Streaming**: Navigate to "Live Stream" tab and observe real-time event logs polled from Soroban RPC.
3. **Automated CI/CD**: Verify `.github/workflows/ci.yml` passes tests and frontend builds on every commit.

---

## 📄 License
MIT License. Built for the Stellar Community & Developer Challenge.
