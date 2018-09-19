import Campaign from '../../models/campaign';
import * as te from '../../typedError';
import views from '../../views/adminCampaign';
import Vote from '../../models/vote';
import coinpayments from '../../models/coinpayment';
import Web3 from 'web3';

exports.getAll = async (req, res) => {
  try {
    let data = await Campaign.allPublic(req.query.offset);
    // await Promise.all(data.campaigns.map(x => x.addWeiRaised()));
    res.status(200).send({ campaigns: data.campaigns.map(views.publicBrief), next: data.next });
  } catch (err) {
    te.handleError(err, res);
  }
};

exports.get = async (req, res) => {
  if (!req.params.id) {
    res.status(400).send({ message: 'missing campaign id' });
    return;
  }

  try {
    const campaignId = te.stringToId(req.params.id);
    let campaign = await Campaign.publicById(campaignId);
    if (!campaign) {
      throw new te.TypedError(404, 'campaign not found');
    } else {
      res.status(200).send(views.publicFull(campaign));
      return;
    }
  } catch (err) {
    te.handleError(err, res);
  }
};

exports.voteGet = (req, res) => {
  if (!req.params.id) {
    res.status(400).send({ message: 'missing campaign id' });
    return;
  }

  if (!req.decoded.id) {
    res.status(400).send({ message: 'missing user id' });
  }

  Vote.findNewestForPair(
    te.convertStringToId(req.decoded.id),
    te.convertStringToId(req.params.id),
  )
    .then(cs => {
      if (cs && cs.length > 0) {
        res.status(200).send({ up: cs[0].up });
      } else {
        throw new te.TypedError(404, 'no vote');
      }
    })
    .catch(err => te.handleError(err, res));
};

exports.vote = (req, res) => {
  if (!req.params.id) {
    res.status(400).send({ message: 'missing campaign id' });
    return;
  }

  if (!req.decoded.id) {
    res.status(400).send({ message: 'missing user id' });
    return;
  }

  const up = req.body.up || true;

  Vote.create(
    te.convertStringToId(req.decoded.id),
    te.convertStringToId(req.params.id),
    up,
  )
    .then(() => res.status(201).send({ message: 'vote received' }))
    .catch(err => te.handleError(err, res));
};

exports.retractVote = (req, res) => {
  if (!req.params.id) {
    res.status(400).send({ message: 'missing campaign id' });
    return;
  }

  if (!req.decoded.id) {
    res.status(400).send({ message: 'missing user id' });
    return;
  }

  Vote.retract(
    te.convertStringToId(req.decoded.id),
    te.convertStringToId(req.params.id),
  )
    .then(() => res.status(201).send({ message: 'vote retracted' }))
    .catch(err => te.handleError(err, res));
};

exports.votes = (req, res) => {
  if (!req.params.id) {
    res.status(400).send({ message: 'missing campaign id' });
  }

  Vote.count(te.convertStringToId(req.params.id))
    .then(out => res.status(200).send(out))
    .catch(err => te.handleError(err, res));
};

exports.alternativePayment = async (req, res) => {
  try {
    if (!req.params.id) {
      throw new te.TypedError(400, 'missing campaign id');
    }

    const currency = req.body.currency;
    if (!coinpayments.supportedCurrency(currency)) {
      throw new te.TypedError(400, 'unsupported currency');
    }

    let tokens = req.body.tokensToPurchase;
    if (!tokens) {
      throw new te.TypedError(400, 'missing tokens to purchase');
    }
    try {
      tokens = Web3.utils.toBN(tokens);
    } catch (err) {
      throw new te.TypedError(400, 'cannot convert tokensToPurchase to an integer');
    }

    const campaignId = te.stringToId(req.params.id);
    const campaign = await Campaign.publicById(campaignId);
    if (!campaign) {
      throw new te.TypedError(404, 'unknown campaign');
    } else if (!campaign.hostedCampaign) {
      throw new te.TypedError(400, 'not a hosted campaign');
    }

    // TODO: Check the purchase can be made (campaign is open, not passed hardcap, amount is not too small)
    const rate = Web3.utils.toBN(campaign.hostedCampaign.onChainData.rate);
    const tokenCost = tokens.div(rate);
    // TODO: compute this
    const transactionFee = Web3.utils.toBN('91733');
    const etherAmount = Web3.utils.fromWei(tokenCost.add(transactionFee), 'ether');
    const tx = await coinpayments.prepareTransaction(
      etherAmount,
      currency,
      req.decoded.id.toString(),
      campaignId.toString(),
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
      tokenTransferFee: transactionFee,
    });
  } catch (err) {
    te.handleError(err, res);
  }
};
