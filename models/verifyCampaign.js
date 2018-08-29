import mongoose from 'mongoose';
import User from './user';
import Campaign from './campaign';
import Networks from './networks';
import Contract from './contract';

const verifyRegistyEvent = async function (registryEvent) {
  // (campaignId, campaignAddress, blockNumber, transactionIndex) {
  // Grab the campaign
  const campaignId = mongoose.Types.ObjectId(registryEvent.returnValues.campaignId);
  const campaign = await Campaign.findOne({ _id: campaignId });
  if (!campaign) {
    throw new Error('invalid campaign id');
  }
  if (!campaign.hostedCampaign) {
    throw new Error('not a hosted campaign');
  }
  // if (campaign.hostedCampaign.campaignStatus !== 'REVIEWED') {
  //  throw new Error('campaign status is not REVIEWED');
  // }

  const user = await User.findOneById(campaign.hostedCampaign.owner);
  if (!user) {
    throw new Error('invalid user id');
  }
  const deployment = await campaign.makeDeployment(user.publicAddress);
  const fastNode = await Networks.fastestNode(campaign.hostedCampaign.onChainData.network);
  const transaction = fastNode.eth.getTransactionFromBlock(
    registryEvent.blockNumber,
    registryEvent.transactionIndex,
  );
  if (transaction.input !== deployment.deployment) {
    throw new Error('transaction data doesn\'t match');
  }
  // Grab the reciept
  const campaignAddress = registryEvent.returnValues.campaignAddress;
  await campaign.fetchContracts(campaignAddress);
  campaign.hostedCampaign.campaignStatus = 'DEPLOYED';
  return campaign.save();
};

const listen = async function () {
  const abi = await Contract
    .findOne({ name: 'TrustFeedCampaignRegistry' })
    .exec()
    .then(c => {
      if (!c) {
        throw new Error('cannot find registry');
      } else {
        return JSON.parse(c.abi);
      }
    });

  const listenToContract = async (network) => {
    const w3 = await Networks.lightNode(network);
    const contract = new w3.eth.Contract(abi, Networks.registry(network));
    contract.events.NewCampaign(
      { fromBlock: 2896000 },
      (err, registryEvent) => {
        if (err) {
          console.log(err);
        } else {
          verifyRegistyEvent(
            registryEvent
          ).catch(err => {
            console.log('registry event failed to verify', err.message);
          });
        }
      });
  };

  const ns = Networks.supported;
  return Promise.all(ns.map(listenToContract));
};

const VerifyCampaign = { listen, verifyRegistyEvent };
export default VerifyCampaign;
