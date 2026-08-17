import {
  Horizon,
  Networks,
  Keypair,
  TransactionBuilder,
  TimeoutInfinite,
  rpc as SorobanRpc,
  Operation,
  Address,
  nativeToScVal,
  scValToNative,
} from '@stellar/stellar-sdk';

const HORIZON_URL = 'https://horizon-testnet.stellar.org';
const RPC_URL = 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = Networks.TESTNET;
const CONTRACT_ID = 'CBHPULMSCLA3F3LEPKAAWVGEQNYUMLX3KFNPUFGU2SBOBFIMGFC5KIAS';

async function testLiveInteraction() {
  console.log('===========================================================');
  console.log('⚡ TESTING LIVE ON-CHAIN INTERACTION: STELLAR RIYA ESCROW');
  console.log(`📍 Contract Address: ${CONTRACT_ID}`);
  console.log('===========================================================\n');

  const horizon = new Horizon.Server(HORIZON_URL);
  const rpc = new SorobanRpc.Server(RPC_URL);

  // 1. Create and fund creator test wallet
  const creator = Keypair.random();
  console.log(`1️⃣  Creator Wallet: ${creator.publicKey()}`);
  console.log('    Funding creator via Friendbot Faucet on Testnet...');
  const fundRes = await fetch(`https://friendbot.stellar.org?addr=${creator.publicKey()}`);
  if (!fundRes.ok) throw new Error('Friendbot funding failed');
  console.log('    ✅ Creator Wallet Funded with 10,000 XLM!\n');

  // 2. Query initial vault stats
  console.log('2️⃣  Calling get_vault_stats() (Read simulation on chain)...');
  let account = await horizon.loadAccount(creator.publicKey());

  let simTx = new TransactionBuilder(account, {
    fee: '100000',
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.invokeContractFunction({
        contract: CONTRACT_ID,
        function: 'get_vault_stats',
        args: [],
      })
    )
    .setTimeout(TimeoutInfinite)
    .build();

  let simRes = await rpc.simulateTransaction(simTx);
  const initialStats = scValToNative(simRes.result.retval);
  console.log('    ✅ Current On-Chain Stats:', initialStats, '\n');

  // 3. Create Campaign #1 on-chain
  console.log('3️⃣  Calling create_campaign() — Launching Grant Campaign on Testnet...');
  account = await horizon.loadAccount(creator.publicKey());

  let createTx = new TransactionBuilder(account, {
    fee: '100000',
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.invokeContractFunction({
        contract: CONTRACT_ID,
        function: 'create_campaign',
        args: [
          new Address(creator.publicKey()).toScVal(),
          nativeToScVal('StellarRiya Creator Grants Protocol', { type: 'string' }),
          nativeToScVal('Milestone-gated decentralized crowdfunding protocol for Stellar ecosystem builders.', { type: 'string' }),
          nativeToScVal(50000000000n, { type: 'i128' }), // 5,000 XLM
          nativeToScVal('tech', { type: 'symbol' }),
          nativeToScVal(3, { type: 'u32' }), // 3 milestones
        ],
      })
    )
    .setTimeout(TimeoutInfinite)
    .build();

  const createSim = await rpc.simulateTransaction(createTx);
  if (SorobanRpc.Api.isSimulationError(createSim)) {
    throw new Error(`Create campaign simulation failed: ${createSim.error}`);
  }

  createTx = SorobanRpc.assembleTransaction(createTx, createSim).build();
  createTx.sign(creator);

  const createSend = await rpc.sendTransaction(createTx);
  console.log(`    Submitted Tx Hash: ${createSend.hash}`);

  // Wait for confirmation
  let status = await rpc.getTransaction(createSend.hash);
  while (status.status === SorobanRpc.Api.GetTransactionStatus.NOT_FOUND) {
    await new Promise((r) => setTimeout(r, 1500));
    status = await rpc.getTransaction(createSend.hash);
  }

  if (status.status !== SorobanRpc.Api.GetTransactionStatus.SUCCESS) {
    throw new Error(`Transaction failed: ${status.status}`);
  }

  const campaignId = scValToNative(status.returnValue);
  console.log(`    ✅ Campaign #${campaignId} permanently recorded on Stellar Testnet!`);
  console.log(`    🔗 Tx Explorer: https://stellar.expert/explorer/testnet/tx/${createSend.hash}\n`);

  // 4. Query the created campaign back from chain
  console.log(`4️⃣  Calling get_campaign(${campaignId}) to read state from Stellar Ledger...`);
  account = await horizon.loadAccount(creator.publicKey());

  let fetchTx = new TransactionBuilder(account, {
    fee: '100000',
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.invokeContractFunction({
        contract: CONTRACT_ID,
        function: 'get_campaign',
        args: [nativeToScVal(campaignId, { type: 'u64' })],
      })
    )
    .setTimeout(TimeoutInfinite)
    .build();

  const fetchSim = await rpc.simulateTransaction(fetchTx);
  const campData = scValToNative(fetchSim.result.retval);
  console.log('    ✅ Retrieved Campaign Data from Stellar Ledger:');
  console.log('    -------------------------------------------------');
  console.log(`    ID         : ${campData.id}`);
  console.log(`    Creator    : ${campData.creator}`);
  console.log(`    Title      : "${campData.title}"`);
  console.log(`    Target     : ${Number(campData.target_amount) / 10_000_000} XLM`);
  console.log(`    Category   : ${campData.category}`);
  console.log(`    Milestones : ${campData.milestones_released}/${campData.milestone_count}`);
  console.log(`    Status     : ${campData.status}`);
  console.log('    -------------------------------------------------\n');

  console.log('🎉 ===========================================================');
  console.log('✅ 100% VERIFIED: STELLAR RIYA ESCROW IS FULLY LIVE ON TESTNET!');
  console.log(`👉 View Contract: https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}`);
  console.log('===========================================================\n');
}

testLiveInteraction().catch(console.error);
