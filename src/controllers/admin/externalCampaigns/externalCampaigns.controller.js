import utils from '../../../utils';
import User from '../../../models/user';
import Campaign from '../../../models/campaign';
import views from '../../../views/adminCampaign';

const convertTimes = (req) => {
  const convertTimeIfExists = (o, k) => {
    if (o[k] && typeof o[k] == 'number') {
      o[k] = new Date(o[k] * 1000);
    }
  };

  if (req.body) {
    if (req.body.preICO) {
      convertTimeIfExists(req.body.preICO, 'openingTime');
      convertTimeIfExists(req.body.preICO, 'closingTime');
    }
    if (req.body.ico) {
      convertTimeIfExists(req.body.ico, 'openingTime');
      convertTimeIfExists(req.body.ico, 'closingTime');
    }
  }
};

export const post = async (req, res, next) => {
  try {
    if (!req.decoded || !req.decoded.publicAddress) {
      throw new utils.TypedError(400, 'missing publicAddress');
    }

    convertTimes(req);
    const campaign = await User.addExternalCampaign(req.decoded.publicAddress, req.body);
    res.status(201).send({ 'campaign_id': campaign.id });
  } catch (err) {
    next(err);
  }
};

export const put = async (req, res, next) => {
  try {
    if (!req.decoded || !req.decoded.publicAddress) {
      throw new utils.TypedErro(400, 'missing publicAddress');
    }

    if (!req.params.id) {
      throw new utils.TypedErro(400, 'missing campaign id');
    }

    convertTimes(req);
    const campaign = await Campaign.putExternal(req.decoded.publicAddress, req.params.id, req.body);
    res.status(201).send({ 'campaign_id': campaign.id });
  } catch (err) {
    next(err);
  }
};

export const getAll = async (req, res, next) => {
  try {
    let cs = await Campaign.findAllExternal(req.query.offset);
    cs.campaigns = cs.campaigns.map(views.adminBrief);
    res.status(200).send(cs);
  } catch (err) {
    next(err);
  }
};

export const get = async (req, res, next) => {
  try {
    if (!req.params.id) {
      throw new utils.TypedError(400, 'missing campaign id');
    }

    const campaign = await Campaign
      .findOne({ _id: req.query.offset })
      .exec();

    if (!campaign) {
      throw new utils.TypedError(404, 'unknown campaign id');
    } else if (!campaign.externalCampaign) {
      throw new utils.TypedError(404, 'unknown campaign id');
    } else {
      res.status(200).send(views.adminFull(campaign));
    }
  } catch (err) {
    next(err);
  }
};
