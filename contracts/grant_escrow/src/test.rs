#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::Address as _,
    Address, Env, String, Symbol,
};

#[test]
fn test_create_and_fetch_campaign() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(GrantEscrowContract, ());
    let client = GrantEscrowContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let title = String::from_str(&env, "Stellar AI Agent Tooling");
    let description = String::from_str(&env, "Building next-gen autonomous agent tooling on Stellar");
    let category = Symbol::new(&env, "tech");

    let campaign_id = client.create_campaign(
        &creator,
        &title,
        &description,
        &5000_0000000i128, // 5,000 XLM in stroops
        &category,
        &3u32,              // 3 milestones
    );

    assert_eq!(campaign_id, 1);

    let campaign = client.get_campaign(&1);
    assert_eq!(campaign.id, 1);
    assert_eq!(campaign.creator, creator);
    assert_eq!(campaign.target_amount, 5000_0000000i128);
    assert_eq!(campaign.raised_amount, 0);
    assert_eq!(campaign.milestone_count, 3);
    assert_eq!(campaign.milestones_released, 0);
    assert_eq!(campaign.status, CampaignStatus::Active);

    let stats = client.get_vault_stats();
    assert_eq!(stats.total_campaigns, 1);
    assert_eq!(stats.total_funds_raised, 0);
    assert_eq!(stats.total_funds_released, 0);
}

#[test]
fn test_pledge_and_milestone_release() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(GrantEscrowContract, ());
    let client = GrantEscrowContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let backer1 = Address::generate(&env);
    let backer2 = Address::generate(&env);

    let campaign_id = client.create_campaign(
        &creator,
        &String::from_str(&env, "DeFi Micro-Lending"),
        &String::from_str(&env, "Decentralized micro-lending protocol on Soroban"),
        &1000_0000000i128,
        &Symbol::new(&env, "defi"),
        &2u32, // 2 milestones
    );

    // Backer 1 pledges 600 XLM
    let raised1 = client.pledge_funds(&backer1, &campaign_id, &600_0000000i128);
    assert_eq!(raised1, 600_0000000i128);

    // Backer 2 pledges 400 XLM (Total = 1000 XLM -> FullyFunded)
    let raised2 = client.pledge_funds(&backer2, &campaign_id, &400_0000000i128);
    assert_eq!(raised2, 1000_0000000i128);

    let camp = client.get_campaign(&campaign_id);
    assert_eq!(camp.status, CampaignStatus::FullyFunded);

    // Creator releases Milestone 1 (50% = 500 XLM)
    let released1 = client.release_milestone(&creator, &campaign_id);
    assert_eq!(released1, 500_0000000i128);

    let camp_after_m1 = client.get_campaign(&campaign_id);
    assert_eq!(camp_after_m1.milestones_released, 1);
    assert_eq!(camp_after_m1.released_amount, 500_0000000i128);

    // Creator releases Milestone 2 (100% = 1000 XLM total released)
    let released2 = client.release_milestone(&creator, &campaign_id);
    assert_eq!(released2, 1000_0000000i128);

    let camp_after_m2 = client.get_campaign(&campaign_id);
    assert_eq!(camp_after_m2.milestones_released, 2);
    assert_eq!(camp_after_m2.status, CampaignStatus::MilestoneCompleted);

    let stats = client.get_vault_stats();
    assert_eq!(stats.total_funds_raised, 1000_0000000i128);
    assert_eq!(stats.total_funds_released, 1000_0000000i128);
}

#[test]
fn test_refund_and_stats() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(GrantEscrowContract, ());
    let client = GrantEscrowContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let backer = Address::generate(&env);

    let campaign_id = client.create_campaign(
        &creator,
        &String::from_str(&env, "VR World Builder"),
        &String::from_str(&env, "Immersive VR tools"),
        &2000_0000000i128,
        &Symbol::new(&env, "gaming"),
        &4u32,
    );

    client.pledge_funds(&backer, &campaign_id, &500_0000000i128);
    let camp_before = client.get_campaign(&campaign_id);
    assert_eq!(camp_before.raised_amount, 500_0000000i128);

    // Backer claims refund
    let refunded = client.refund_backer(&backer, &campaign_id);
    assert_eq!(refunded, 500_0000000i128);

    let camp_after = client.get_campaign(&campaign_id);
    assert_eq!(camp_after.raised_amount, 0);

    let recent = client.get_recent_campaigns(&10);
    assert_eq!(recent.len(), 1);
}

#[test]
#[should_panic(expected = "Campaign not found")]
fn test_nonexistent_campaign_panic() {
    let env = Env::default();
    let contract_id = env.register(GrantEscrowContract, ());
    let client = GrantEscrowContractClient::new(&env, &contract_id);

    client.get_campaign(&999);
}
