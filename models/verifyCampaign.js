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
  const campaignStatus = campaign.hostedCampaign.campaignStatus;
  if (campaignStatus !== 'REVIEWED' && campaignStatus !== 'PENDING_DEPLOYMENT') {
    throw new Error('campaign status is not REVIEWED');
  }

  const user = await User.findOneById(campaign.hostedCampaign.owner);
  if (!user) {
    throw new Error('invalid user id');
  }
  const deployment = await campaign.makeDeployment(user.publicAddress);
  const fastNode = await Networks.node(campaign.hostedCampaign.onChainData.network);
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

const scrapeOldEvents = async function () {
  const scrapeNetwork = async (network) => {
    const w3 = await Networks.node(network);

    const fnc = async (log) => {
      const returnValues = w3.eth.abi.decodeParameters(
        ['address', 'string'],
        log.data,
      );
      log.returnValues = { campaignAddress: returnValues[0], campaignId: returnValues[1] };
      return verifyRegistyEvent(log)
        .catch(err => { console.log(err.message); });
    };

    //  console.log(w3.eth);
    //  console.log(w3.eth.getPastLogs);
    console.log('registry:', Networks.registry(network));
    return w3.eth.getPastLogs(
      {
        fromBlock: w3.utils.toHex(1),
        address: Networks.registry(network),
      }, () => {})
      .then(txs => {
        return Promise.all(txs.map(fnc));
      })
      .catch(err => console.log('pastLogs err', err));
  };

  const ns = Networks.supported;
  return Promise.all(ns.map(scrapeNetwork));
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
    const w3 = await Networks.node(network);
    w3.eth.getBlockNumber().then(x => console.log('listening now', x)).catch(console.log);
    const contract = new w3.eth.Contract(abi, Networks.registry(network));
    contract.events.NewCampaign(
      { fromBlock: w3.utils.toHex(1) },
      (err, registryEvent) => {
        if (err) {
          console.log(err);
        } else {
          console.log('checking event');
          verifyRegistyEvent(
            registryEvent
          ).catch(err => {
            console.log('registry event failed to verify:', err.message);
          });
        }
      });
  };

  const ns = Networks.supported;
  return Promise.all(ns.map(listenToContract));
};

const VerifyCampaign = { listen, verifyRegistyEvent, scrapeOldEvents };
export default VerifyCampaign;
