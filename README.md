# ⚡ StellarGrants — Decentralized Creator Grants & Milestone Escrow Protocol

[![Live dApp](https://img.shields.io/badge/Live_dApp-tubular--starship--2502ee.netlify.app-00e5ff?style=for-the-badge&logo=netlify)](https://tubular-starship-2502ee.netlify.app/)
[![Stellar Testnet](https://img.shields.io/badge/Network-Stellar_Testnet-7c4dff?style=for-the-badge&logo=stellar)](https://stellar.expert/explorer/testnet)
[![Soroban v22](https://img.shields.io/badge/Smart_Contracts-Soroban_v22-10b981?style=for-the-badge)](https://soroban.stellar.org)
[![Live Demo Video](https://img.shields.io/badge/YouTube-Live_Demo_Video-ff0000?style=for-the-badge&logo=youtube)](https://www.youtube.com/watch?v=64qJXUGWB9c)
[![License: MIT](https://img.shields.io/badge/License-MIT-ffd600?style=for-the-badge)](LICENSE)

> **StellarGrants** is a milestone-gated crowdfunding and ecosystem grant protocol deployed on **Stellar Testnet** using **Soroban WASM smart contracts**. It protects backers with trustless on-chain escrow vaults, empowers creators through incremental milestone funding, and provides real-time event streaming in a cosmic glassmorphism interface.

---

## 🔗 Live Application & Video Demonstration
* 🌐 **Live Deployed dApp:** [https://tubular-starship-2502ee.netlify.app/](https://tubular-starship-2502ee.netlify.app/)
* 🎥 **YouTube Walkthrough & Live Demo:** [https://www.youtube.com/watch?v=64qJXUGWB9c](https://www.youtube.com/watch?v=64qJXUGWB9c)

---

## 📋 Smart Contract & Deployment Reference

| Parameter | On-Chain Value / Link |
| :--- | :--- |
| **Live Deployed dApp URL** | [https://tubular-starship-2502ee.netlify.app/](https://tubular-starship-2502ee.netlify.app/) |
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

## 💡 Why StellarGrants? (The Problem & Solution)

### The Problem in Web3 Crowdfunding
Traditional crowdfunding platforms (Kickstarter, GoFundMe, and standard crypto token raises) disburse 100% of collected funds to creators upfront. If a creator abandons the project or fails to deliver, backers have zero recourse and lose their entire contribution.

### The StellarGrants Solution
StellarGrants replaces blind trust with **cryptographic escrow guarantees**:
* **Milestone Tranche Unlocks:** Funds are locked in the Soroban smart contract and released only in proportional stages ($1/N$) as creators prove milestone delivery.
* **Automated Backer Refunds:** If a campaign stalls or is cancelled, backers can trigger an automated on-chain refund to recover their unreleased funds.
* **Near-Zero Fees & Instant Settlement:** Leveraging Stellar’s 3–5 second finality and sub-cent fees (100 stroops = 0.00001 XLM), micro-grants and community backing are accessible to anyone globally.

---

## 🏛️ System Architecture

```text
[ Creator / Backer ] ──> [ Freighter / Testnet Wallet ]
         │
         ▼
[ React + Vite Cosmic UI ] 
         │
         ├───> [ Stellar Horizon Testnet ]  (Native XLM Payments & Account Balances)
         ├───> [ Stellar Friendbot Faucet ] (1-Click Instant +10,000 XLM Funding)
         └───> [ Soroban RPC Node ]         (Smart Contract WASM Execution & Events)
                     │
                     ▼
       [ GrantEscrowContract Vault ]
         ├── create_campaign   (Persistent Storage + Milestone Setup)
         ├── pledge_funds      (Backer Contribution Registry)
         ├── release_milestone (Milestone-gated Escrow Release)
         └── refund_backer     (Automated Trustless Backer Refunds)
```

---

## ✨ Key Features

1. **Milestone-Gated Escrow Smart Contracts (`GrantEscrowContract`)**
   * Trustless Rust smart contract managing the entire campaign lifecycle (Active ➔ FullyFunded ➔ MilestoneCompleted ➔ Cancelled).
   * Backer registry tracking individual contributions for verifiable refund rights.
   * Automated TTL extension (30-day state persistence) ensuring persistent ledger safety.

2. **Native XLM Fast Payments**
   * Direct testnet transfer module supporting destination address validation, base fee calculation, custom memo attachments, and instant Stellar.Expert explorer links.

3. **Multi-Wallet Support**
   * Deep integration with **Freighter Wallet** (the official SDF browser extension) using `@stellar/freighter-api` v3.
   * Instant Testnet Keypair mode with 1-click Friendbot faucet auto-funding (+10,000 XLM) for instant zero-install sandbox testing.

4. **Real-Time On-Chain Event Streaming**
   * Real-time polling via Soroban RPC `getEvents` capturing contract events (`camp_new`, `camp_pled`, `mile_rel`, `camp_ref`) with live ledger numbers and timestamps.

5. **Cosmic Glassmorphism UI**
   * Modern dark theme with radiant neon cyan, purple, and emerald accents, interactive milestone steppers, progress bars, QR code generator, and confetti celebratory animations.

---

## 🛠️ How It Was Built (Tech Stack)

* **Smart Contract:** Rust, `soroban-sdk = "22.0.11"`, `wasm32-unknown-unknown`
* **Frontend:** React 18, Vite 6, Vanilla CSS (Cosmic Glassmorphism Design System)
* **SDK & Protocol:** `@stellar/stellar-sdk = "16.2.0"`, `@stellar/freighter-api = "3.1.0"`
* **Testing:** Rust unit test suite (`soroban-sdk::testutils`), 4 passing tests
* **CI/CD:** Automated GitHub Actions pipeline (`.github/workflows/ci.yml`)

---

## 🚀 Getting Started

### 1. Prerequisites
* **Node.js** (v18 or higher)
* **Rust** (with `wasm32-unknown-unknown` target)
* **Freighter Wallet Extension** ([freighter.app](https://www.freighter.app/))

---

### 2. Run Locally

```bash
# Clone repository
git clone https://github.com/RiyaGithub123/stellergrants.git
cd stellergrants

# Navigate to frontend and install dependencies
cd frontend
npm install --legacy-peer-deps

# Start development server
npm run dev
```

Open [http://localhost:5174](http://localhost:5174) in your browser.

---

### 3. Run Smart Contract Tests

```bash
cd contracts/grant_escrow
cargo test
```

**Test Output:**
```
running 4 tests
test test::test_nonexistent_campaign_panic - should panic ... ok
test test::test_create_and_fetch_campaign ... ok
test test::test_refund_and_stats ... ok
test test::test_pledge_and_milestone_release ... ok

test result: ok. 4 passed; 0 failed; finished in 0.05s
```

---

### 4. Build Contract WASM

```bash
cd contracts/grant_escrow
cargo build --target wasm32-unknown-unknown --release
```

---

## 🌐 Deploy Frontend to Vercel

1. Push your repository to GitHub (`https://github.com/RiyaGithub123/stellergrants.git`).
2. Log in to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import your **`stellergrants`** repository.
4. Set **Root Directory** to **`frontend`**.
5. Framework Preset: **Vite**.
6. Click **"Deploy"**.

---

## 📖 How to Use the DApp

1. **Connect:** Click **"Connect Wallet"** and select **Freighter Wallet** or **Instant Testnet Keypair**.
2. **Fund:** Click **"+ Faucet (+10k XLM)"** to receive free Testnet XLM.
3. **Send XLM:** Use the **Send XLM** tab to transfer funds with an on-chain memo.
4. **Create a Grant:** Open **Grant Vaults** ➔ Click **"+ Create Grant Campaign"** ➔ Set funding goal and number of milestones (1–5).
5. **Back a Project:** Click **"Pledge XLM"** on any active campaign card.
6. **Unlock Milestones:** As creator, click **"Unlock Milestone"** to withdraw completed stage funds.
7. **Watch Events:** Switch to the **Live Stream** tab to observe contract events broadcast in real-time.

---

## 📄 License
MIT License. Built for the Stellar Community.
