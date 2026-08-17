#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, Env, String, Symbol, Vec,
};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum CampaignStatus {
    Active,
    MilestoneCompleted,
    FullyFunded,
    Cancelled,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Campaign {
    pub id: u64,
    pub creator: Address,
    pub title: String,
    pub description: String,
    pub target_amount: i128,
    pub raised_amount: i128,
    pub released_amount: i128,
    pub category: Symbol,
    pub status: CampaignStatus,
    pub created_at: u64,
    pub milestone_count: u32,
    pub milestones_released: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VaultStats {
    pub total_campaigns: u64,
    pub total_funds_raised: i128,
    pub total_funds_released: i128,
}

#[contracttype]
pub enum DataKey {
    CampaignCount,
    Campaign(u64),
    VaultStatsKey,
    BackerPledge(u64, Address),
}

const LEDGER_TTL_EXTEND: u32 = 518400; // ~30 days

#[contract]
pub struct GrantEscrowContract;

#[contractimpl]
impl GrantEscrowContract {
    /// Launches a new crowdfunding campaign with milestone-gated escrow
    pub fn create_campaign(
        env: Env,
        creator: Address,
        title: String,
        description: String,
        target_amount: i128,
        category: Symbol,
        milestone_count: u32,
    ) -> u64 {
        creator.require_auth();

        if target_amount <= 0 {
            panic!("Target amount must be positive");
        }

        let m_count = if milestone_count == 0 { 1 } else { milestone_count };

        let mut count: u64 = env
            .storage()
            .persistent()
            .get(&DataKey::CampaignCount)
            .unwrap_or(0);
        count += 1;

        let timestamp = env.ledger().timestamp();

        let new_campaign = Campaign {
            id: count,
            creator: creator.clone(),
            title,
            description,
            target_amount,
            raised_amount: 0,
            released_amount: 0,
            category,
            status: CampaignStatus::Active,
            created_at: timestamp,
            milestone_count: m_count,
            milestones_released: 0,
        };

        // Persist campaign state
        env.storage()
            .persistent()
            .set(&DataKey::Campaign(count), &new_campaign);
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::Campaign(count), LEDGER_TTL_EXTEND, LEDGER_TTL_EXTEND);

        // Update campaign count
        env.storage()
            .persistent()
            .set(&DataKey::CampaignCount, &count);
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::CampaignCount, LEDGER_TTL_EXTEND, LEDGER_TTL_EXTEND);

        // Update vault stats
        let mut stats: VaultStats = env
            .storage()
            .persistent()
            .get(&DataKey::VaultStatsKey)
            .unwrap_or(VaultStats {
                total_campaigns: 0,
                total_funds_raised: 0,
                total_funds_released: 0,
            });
        stats.total_campaigns = count;
        env.storage()
            .persistent()
            .set(&DataKey::VaultStatsKey, &stats);
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::VaultStatsKey, LEDGER_TTL_EXTEND, LEDGER_TTL_EXTEND);

        // Emit on-chain event
        env.events().publish(
            (symbol_short!("camp_new"), count, creator),
            (target_amount, timestamp),
        );

        count
    }

    /// Backers pledge funds into campaign escrow
    pub fn pledge_funds(env: Env, backer: Address, campaign_id: u64, amount: i128) -> i128 {
        backer.require_auth();

        if amount <= 0 {
            panic!("Pledge amount must be positive");
        }

        let mut campaign: Campaign = env
            .storage()
            .persistent()
            .get(&DataKey::Campaign(campaign_id))
            .expect("Campaign not found");

        if campaign.status == CampaignStatus::Cancelled {
            panic!("Campaign is cancelled");
        }

        // Record backer pledge
        let pledge_key = DataKey::BackerPledge(campaign_id, backer.clone());
        let current_pledge: i128 = env
            .storage()
            .persistent()
            .get(&pledge_key)
            .unwrap_or(0);
        let new_pledge = current_pledge + amount;
        env.storage().persistent().set(&pledge_key, &new_pledge);
        env.storage().persistent().extend_ttl(&pledge_key, LEDGER_TTL_EXTEND, LEDGER_TTL_EXTEND);

        // Update campaign raised total
        campaign.raised_amount += amount;
        if campaign.raised_amount >= campaign.target_amount && campaign.status == CampaignStatus::Active {
            campaign.status = CampaignStatus::FullyFunded;
        }

        env.storage()
            .persistent()
            .set(&DataKey::Campaign(campaign_id), &campaign);
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::Campaign(campaign_id), LEDGER_TTL_EXTEND, LEDGER_TTL_EXTEND);

        // Update total vault stats
        let mut stats: VaultStats = env
            .storage()
            .persistent()
            .get(&DataKey::VaultStatsKey)
            .unwrap_or(VaultStats {
                total_campaigns: 0,
                total_funds_raised: 0,
                total_funds_released: 0,
            });
        stats.total_funds_raised += amount;
        env.storage()
            .persistent()
            .set(&DataKey::VaultStatsKey, &stats);
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::VaultStatsKey, LEDGER_TTL_EXTEND, LEDGER_TTL_EXTEND);

        // Emit on-chain event
        env.events().publish(
            (symbol_short!("camp_pled"), campaign_id, backer),
            (amount, campaign.raised_amount),
        );

        campaign.raised_amount
    }

    /// Unlocks and releases a milestone fraction of the funds to creator
    pub fn release_milestone(env: Env, creator: Address, campaign_id: u64) -> i128 {
        creator.require_auth();

        let mut campaign: Campaign = env
            .storage()
            .persistent()
            .get(&DataKey::Campaign(campaign_id))
            .expect("Campaign not found");

        if campaign.creator != creator {
            panic!("Only campaign creator can release milestones");
        }

        if campaign.milestones_released >= campaign.milestone_count {
            panic!("All milestones already released");
        }

        let milestone_fraction = campaign.raised_amount / (campaign.milestone_count as i128);
        campaign.released_amount += milestone_fraction;
        campaign.milestones_released += 1;

        if campaign.milestones_released == campaign.milestone_count {
            campaign.status = CampaignStatus::MilestoneCompleted;
        }

        env.storage()
            .persistent()
            .set(&DataKey::Campaign(campaign_id), &campaign);

        // Update stats
        let mut stats: VaultStats = env
            .storage()
            .persistent()
            .get(&DataKey::VaultStatsKey)
            .unwrap_or(VaultStats {
                total_campaigns: 0,
                total_funds_raised: 0,
                total_funds_released: 0,
            });
        stats.total_funds_released += milestone_fraction;
        env.storage()
            .persistent()
            .set(&DataKey::VaultStatsKey, &stats);

        // Emit event
        env.events().publish(
            (symbol_short!("mile_rel"), campaign_id, creator),
            (milestone_fraction, campaign.milestones_released),
        );

        campaign.released_amount
    }

    /// Allows backer to claim refund if campaign is cancelled or inactive
    pub fn refund_backer(env: Env, backer: Address, campaign_id: u64) -> i128 {
        backer.require_auth();

        let pledge_key = DataKey::BackerPledge(campaign_id, backer.clone());
        let pledge_amount: i128 = env
            .storage()
            .persistent()
            .get(&pledge_key)
            .unwrap_or(0);

        if pledge_amount <= 0 {
            panic!("No pledge found to refund");
        }

        // Reset pledge
        env.storage().persistent().set(&pledge_key, &0i128);

        // Deduct from campaign raised
        let mut campaign: Campaign = env
            .storage()
            .persistent()
            .get(&DataKey::Campaign(campaign_id))
            .expect("Campaign not found");
        campaign.raised_amount -= pledge_amount;
        env.storage()
            .persistent()
            .set(&DataKey::Campaign(campaign_id), &campaign);

        // Emit refund event
        env.events().publish(
            (symbol_short!("camp_ref"), campaign_id, backer),
            pledge_amount,
        );

        pledge_amount
    }

    /// Retrieve full details for a campaign
    pub fn get_campaign(env: Env, campaign_id: u64) -> Campaign {
        env.storage()
            .persistent()
            .get(&DataKey::Campaign(campaign_id))
            .expect("Campaign not found")
    }

    /// Retrieve global vault statistics
    pub fn get_vault_stats(env: Env) -> VaultStats {
        env.storage()
            .persistent()
            .get(&DataKey::VaultStatsKey)
            .unwrap_or(VaultStats {
                total_campaigns: 0,
                total_funds_raised: 0,
                total_funds_released: 0,
            })
    }

    /// Batch retrieves the most recent campaigns
    pub fn get_recent_campaigns(env: Env, limit: u32) -> Vec<Campaign> {
        let total: u64 = env
            .storage()
            .persistent()
            .get(&DataKey::CampaignCount)
            .unwrap_or(0);

        let mut list: Vec<Campaign> = Vec::new(&env);
        if total == 0 {
            return list;
        }

        let max_items = if limit == 0 || limit > 50 { 50 } else { limit };
        let mut count: u32 = 0;
        let mut current_id = total;

        while current_id > 0 && count < max_items {
            if let Some(c) = env
                .storage()
                .persistent()
                .get::<DataKey, Campaign>(&DataKey::Campaign(current_id))
            {
                list.push_back(c);
                count += 1;
            }
            current_id -= 1;
        }

        list
    }
}

#[cfg(test)]
mod test;
