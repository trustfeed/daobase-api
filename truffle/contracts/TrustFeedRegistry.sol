pragma solidity ^0.4.21;

// Register a new campaign
contract TrustFeedCampaignRegistry {
  event NewCampaign(
    address campaignAddress,
    string campaignId
  );

  function register(address campaignAddress, string campaignId) public {
    emit NewCampaign(campaignAddress, campaignId);
  }
}
