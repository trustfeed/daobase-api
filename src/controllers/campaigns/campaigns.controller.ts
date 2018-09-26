import Campaign from '../../models/campaign';
import * as utils from '../../utils';
import views from '../../views/adminCampaign';
import coinpayments from '../../models/coinpayment';
const Web3 = require('web3');

export const getAll = async (req, res) => {
  let data = await Campaign.allPublic(req.query.offset);
  res.status(200).send({
    campaigns: data.campaigns.map(views.publicBrief),
    next: data.next
  });
};

export const get = async (req, res, next) => {
  try {
    if (!req.params.id) {
      throw new utils.TypedError(400, 'missing campaign id');
    }

    const campaignId = utils.stringToId(req.params.id);
    let campaign = await Campaign.publicById(campaignId);
    if (!campaign) {
      throw new utils.TypedError(404, 'campaign not found');
    } else {
      res.status(200).send(views.publicFull(campaign));
    }
  } catch (err) {
    next(err);
  }
};

export const alternativePayment = async (req, res, next) => {
  try {
    if (!req.params.id) {
      throw new utils.TypedError(400, 'missing campaign id');
    }

    const currency = req.body.currency;
    if (!coinpayments.supportedCurrency(currency)) {
      throw new utils.TypedError(400, 'unsupported currency');
    }

    let tokens = req.body.tokensToPurchase;
    if (!tokens) {
      throw new utils.TypedError(400, 'missing tokens to purchase');
    }
    try {
      tokens = Web3.utils.toBN(tokens);
    } catch (err) {
      throw new utils.TypedError(400, 'cannot convert tokensToPurchase to an integer');
    }

    const campaignId = utils.stringToId(req.params.id);
    const campaign = await Campaign.publicById(campaignId);
    if (!campaign) {
      throw new utils.TypedError(404, 'unknown campaign');
    } else if (!campaign.hostedCampaign) {
      throw new utils.TypedError(400, 'not a hosted campaign');
    }

    // TODO: Check the purchase can be made (campaign is open, not passed hardcap, amount is not too small)
    const rate = Web3.utils.toBN(campaign.hostedCampaign.onChainData.rate);
    const tokenCost = tokens.div(rate);
    // TODO: compute this
    const transactionFee = Web3.utils.toBN('91733');
    const etherAmount = Web3.utils.fromWei(tokenCost.add(transactionFee), 'ether');
    const tx: any = await coinpayments.prepareTransaction(
      etherAmount,
      currency,
      req.decoded.id.toString(),
      campaignId.toString()
    );
    res.status(200).send({
      currency: currency,
      amount: tx.amount,
      transactionID: tx.txn_id,
      address: tx.address,
      confirmsNeeded: tx.confirms_needed,
      timeout: tx.timeout,
      statusURL: tx.status_url,
      qrCodeURL: tx.qrcode_url,
      tokenTransferFee: transactionFee
    });
  } catch (err) {
    next(err);
  }
};
