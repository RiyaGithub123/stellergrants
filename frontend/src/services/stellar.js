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
  xdr,
  StrKey,
  Asset,
  Memo,
  Account,
} from '@stellar/stellar-sdk';

export const HORIZON_URL = 'https://horizon-testnet.stellar.org';
export const SOROBAN_RPC_URL = 'https://soroban-testnet.stellar.org';
export const NETWORK_PASSPHRASE = Networks.TESTNET;

export const horizonServer = new Horizon.Server(HORIZON_URL);
export const rpcServer = new SorobanRpc.Server(SOROBAN_RPC_URL);

// Real Live Deployed StellarRiya Testnet Contract ID
export const DEFAULT_CONTRACT_ID = 'CBHPULMSCLA3F3LEPKAAWVGEQNYUMLX3KFNPUFGU2SBOBFIMGFC5KIAS';

/**
 * Fetch native XLM balance and token balances for an account
 */
export async function getAccountBalances(publicKey) {
  try {
    if (!publicKey || !StrKey.isValidEd25519PublicKey(publicKey)) {
      return { xlm: '0.00', balances: [], exists: false };
    }
    const account = await horizonServer.loadAccount(publicKey);
    const xlmBalanceObj = account.balances.find((b) => b.asset_type === 'native');
    const xlm = xlmBalanceObj ? parseFloat(xlmBalanceObj.balance).toFixed(4) : '0.0000';
    return {
      xlm,
      balances: account.balances,
      exists: true,
      sequence: account.sequence,
    };
  } catch (error) {
    return { xlm: '0.00', balances: [], exists: false, error: error.message };
  }
}

/**
 * Fund account via Friendbot faucet (+10,000 Testnet XLM)
 */
export async function fundWithFriendbot(publicKey) {
  const url = `https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`;
  const response = await fetch(url);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Friendbot failed: ${text}`);
  }
  return await response.json();
}

/**
 * Build, simulate, and submit a native XLM payment on Testnet
 */
export async function sendNativePayment({
  sourcePublicKey,
  destinationPublicKey,
  amount,
  memoText = '',
  signTransactionDelegate,
}) {
  if (!StrKey.isValidEd25519PublicKey(destinationPublicKey)) {
    throw new Error('Invalid destination Stellar address (must start with G...)');
  }

  const account = await horizonServer.loadAccount(sourcePublicKey);
  const baseFee = await horizonServer.fetchBaseFee();

  let builder = new TransactionBuilder(account, {
    fee: baseFee.toString(),
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.payment({
        destination: destinationPublicKey,
        asset: Asset.native(),
        amount: amount.toString(),
      })
    )
    .setTimeout(TimeoutInfinite);

  if (memoText && memoText.trim().length > 0) {
    builder = builder.addMemo(Memo.text(memoText.trim().slice(0, 28)));
  }

  const transaction = builder.build();

  // Sign transaction via connected wallet delegate
  const signedXdr = await signTransactionDelegate(transaction.toXDR());
  const signedTx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);

  const txResult = await horizonServer.submitTransaction(signedTx);
  return {
    hash: txResult.hash,
    ledger: txResult.ledger,
    successful: txResult.successful,
  };
}

/**
 * Invoke a Soroban Smart Contract function
 */
export async function invokeContract({
  contractId = DEFAULT_CONTRACT_ID,
  functionName,
  args = [],
  sourcePublicKey,
  signTransactionDelegate,
}) {
  const account = await horizonServer.loadAccount(sourcePublicKey);

  let tx = new TransactionBuilder(account, {
    fee: '100000',
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.invokeContractFunction({
        contract: contractId,
        function: functionName,
        args: args,
      })
    )
    .setTimeout(TimeoutInfinite)
    .build();

  // Simulate transaction
  const sim = await rpcServer.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(sim)) {
    throw new Error(`Simulation error: ${sim.error}`);
  }

  // If read-only call and no signing delegate provided, return simulated value
  if (!signTransactionDelegate && sim.result && sim.result.retval) {
    return {
      isSimulation: true,
      result: scValToNative(sim.result.retval),
    };
  }

  // Assemble full transaction with simulated auth & footprint
  tx = SorobanRpc.assembleTransaction(tx, sim).build();

  // Sign with wallet
  const signedXdr = await signTransactionDelegate(tx.toXDR());
  const signedTx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);

  // Submit to Soroban RPC
  const sendRes = await rpcServer.sendTransaction(signedTx);
  if (sendRes.status === 'ERROR') {
    throw new Error(`Transaction submission error: ${JSON.stringify(sendRes)}`);
  }

  // Poll for completion
  let getTxRes = await rpcServer.getTransaction(sendRes.hash);
  let attempts = 0;
  while (
    getTxRes.status === SorobanRpc.Api.GetTransactionStatus.NOT_FOUND &&
    attempts < 25
  ) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    getTxRes = await rpcServer.getTransaction(sendRes.hash);
    attempts++;
  }

  if (getTxRes.status !== SorobanRpc.Api.GetTransactionStatus.SUCCESS) {
    throw new Error(`Transaction execution failed: ${getTxRes.status}`);
  }

  let returnValue = null;
  if (getTxRes.returnValue) {
    returnValue = scValToNative(getTxRes.returnValue);
  }

  return {
    hash: sendRes.hash,
    status: getTxRes.status,
    returnValue,
    ledger: getTxRes.ledger,
  };
}

/**
 * Fetch campaign details from Soroban contract
 */
export async function getCampaignDetails(contractId, campaignId) {
  try {
    const dummyKeypair = Keypair.random();
    const account = new Account(dummyKeypair.publicKey(), '0');

    const tx = new TransactionBuilder(account, {
      fee: '10000',
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        Operation.invokeContractFunction({
          contract: contractId,
          function: 'get_campaign',
          args: [nativeToScVal(Number(campaignId), { type: 'u64' })],
        })
      )
      .setTimeout(TimeoutInfinite)
      .build();

    const sim = await rpcServer.simulateTransaction(tx);
    if (SorobanRpc.Api.isSimulationError(sim) || !sim.result) {
      return null;
    }
    return scValToNative(sim.result.retval);
  } catch (err) {
    return null;
  }
}

/**
 * Fetch global vault stats
 */
export async function getVaultStats(contractId) {
  try {
    const dummyKeypair = Keypair.random();
    const account = new Account(dummyKeypair.publicKey(), '0');

    const tx = new TransactionBuilder(account, {
      fee: '10000',
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        Operation.invokeContractFunction({
          contract: contractId,
          function: 'get_vault_stats',
          args: [],
        })
      )
      .setTimeout(TimeoutInfinite)
      .build();

    const sim = await rpcServer.simulateTransaction(tx);
    if (SorobanRpc.Api.isSimulationError(sim) || !sim.result) {
      return { total_campaigns: 0, total_funds_raised: 0, total_funds_released: 0 };
    }
    return scValToNative(sim.result.retval);
  } catch (err) {
    return { total_campaigns: 0, total_funds_raised: 0, total_funds_released: 0 };
  }
}

/**
 * Batch fetch recent campaigns
 */
export async function getRecentCampaigns(contractId, limit = 20) {
  try {
    const dummyKeypair = Keypair.random();
    const account = new Account(dummyKeypair.publicKey(), '0');

    const tx = new TransactionBuilder(account, {
      fee: '10000',
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        Operation.invokeContractFunction({
          contract: contractId,
          function: 'get_recent_campaigns',
          args: [nativeToScVal(limit, { type: 'u32' })],
        })
      )
      .setTimeout(TimeoutInfinite)
      .build();

    const sim = await rpcServer.simulateTransaction(tx);
    if (SorobanRpc.Api.isSimulationError(sim) || !sim.result) {
      return [];
    }
    return scValToNative(sim.result.retval);
  } catch (err) {
    return [];
  }
}
