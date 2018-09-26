import * as utils from '../../../utils';
import User from '../../../models/user';
import Campaign from '../../../models/campaign';
import views from '../../../views/adminCampaign';
import * as s3 from '../../../models/s3';

// Create an empty post for the logged in user
export const post = async (req, res, next) => {
  try {
    if (!req.decoded || !req.decoded.publicAddress) {
      throw new utils.TypedError(400, 'missing public address');
    }

    let campaign = await User.addHostedCampaign(req.decoded.publicAddress, req.body);
    res.status(201).send({
      campaign_id: campaign.id
    });
  } catch (err) {
    next(err);
  }
};

// Get a campaign
export const get = async (req, res, next) => {
  try {
    if (!req.decoded.id) {
      throw new utils.TypedError(400, 'missing user id');
    }

    if (!req.params.id) {
      throw new utils.TypedError(400, 'missing campaign id');
    }

    const campaignId = utils.stringToId(req.params.id);
    let campaign = await Campaign.fetchHostedCampaign(req.decoded.id, campaignId);
    res.status(200).send(views.adminFull(campaign));
  } catch (err) {
    next(err);
  }
};

// A list of campaigns
export const getAll = async (req, res, next) => {
  try {
    if (!req.decoded.id) {
      throw new utils.TypedError(400, 'missing user id');
    }

    let data = await Campaign.findHostedByOwner(req.decoded.id, req.query.offset);
    // await Promise.all(data.campaigns.map(x => x.addWeiRaised()));
    data.campaigns = data.campaigns.map(views.adminBrief);
    res.status(200).send(data);
  } catch (err) {
    next(err);
  }
};

export const putOnChainData = async (req, res, next) => {
  try {
    if (!req.decoded.id) {
      throw new utils.TypedError(400, 'missing user id');
    }

    if (!req.params.id) {
      throw new utils.TypedError(400, 'missing campaign id');
    }

    const campaignId = utils.stringToId(req.params.id);
    await Campaign.putOnChainData(req.decoded.id, campaignId, req.body);
    res.status(201).send({
      message: 'updated'
    });
  } catch (err) {
    next(err);
  }
};

export const putOffChainData = async (req, res, next) => {
  try {
    if (!req.decoded.id) {
      throw new utils.TypedError(400, 'missing user id');
    }

    if (!req.params.id) {
      throw new utils.TypedError(400, 'missing campaign id');
    }

    const campaignId = utils.stringToId(req.params.id);
    await Campaign.putOffChainData(req.decoded.id, campaignId, req.body);
    res.status(201).send({
      message: 'updated'
    });
  } catch (err) {
    next(err);
  }
};

// This returns a presigned URL to upload an image
export const coverImageURL = async (req, res, next) => {
  try {
    if (!req.decoded.id) {
      throw new utils.TypedError(400, 'missing user id');
    }

    if (!req.params.id) {
      throw new utils.TypedError(400, 'missing campaign id');
    }

    const extension = req.body.extension || 'jpg';
    const contentType = req.body.contentType || 'image/jpeg';

    const campaignId = utils.stringToId(req.params.id);
    await Campaign.fetchHostedCampaign(req.decoded.id, campaignId);
    const url = await s3.signUpload(campaignId, 'images', extension, contentType);
    const uploadURL: any = url;
    const viewURL = uploadURL.split(/[?#]/)[0];
    res.status(201).send({
      uploadURL,
      viewURL
    });
  } catch (err) {
    next(err);
  }
};

// This returns a presigned URL to upload a white paper pdf
export const pdfURL = async (req, res, next) => {
  try {
    if (!req.decoded.id) {
      throw new utils.TypedError(400, 'missing user id');
    }

    if (!req.params.id) {
      throw new utils.TypedError(400, 'missing campaign id');
    }

    const extension = req.body.extension || 'pdf';
    const contentType = req.body.contentType || 'application/pdf';

    const campaignId = utils.stringToId(req.params.id);
    await Campaign.fetchHostedCampaign(req.decoded.id, campaignId);
    const url = await s3.signUpload(req.params.id, 'white-papers', extension, contentType);
    const uploadURL: any = url;
    const viewURL = uploadURL.split(/[?#]/)[0];
    res.status(201).send({
      uploadURL,
      viewURL
    });
  } catch (err) {
    next(err);
  }
};

export const submitForReview = async (req, res, next) => {
  try {
    if (!req.decoded.id) {
      throw new utils.TypedError(400, 'missing user id');
    }

    if (!req.params.id) {
      throw new utils.TypedError(400, 'missing campaign id');
    }

    const userId = req.decoded.id;
    const campaignId = utils.stringToId(req.params.id);

    await Campaign.submitForReview(userId, campaignId);
    res.status(201).send({
      message: 'submitted'
    });
    setTimeout(() => {
      Campaign.acceptReview(userId, campaignId);
    }, 60 * 1000);
  } catch (err) {
    next(err);
  }
};

export const cancelReview = async (req, res, next) => {
  try {
    if (!req.decoded.id) {
      throw new utils.TypedError(400, 'missing user id');
    }

    if (!req.params.id) {
      throw new utils.TypedError(400, 'missing campaign id');
    }

    const userId = req.decoded.id;
    const campaignId = utils.stringToId(req.params.id);

    await Campaign.cancelReview(userId, campaignId);
    res.status(201).send({
      message: 'cancelled'
    });
  } catch (err) {
    next(err);
  }
};

export const acceptReview = async (req, res, next) => {
  try {
    if (!req.decoded.id) {
      throw new utils.TypedError(400, 'missing user id');
    }

    if (!req.params.id) {
      throw new utils.TypedError(400, 'missing campaign id');
    }

    const userId = req.decoded.id;
    const campaignId = utils.stringToId(req.params.id);

    await Campaign.acceptReview(userId, campaignId);
    res.status(201).send({
      message: 'accepted'
    });
  } catch (err) {
    next(err);
  }
};

export const deploymentTransaction = async (req, res, next) => {
  try {
    if (!req.decoded.id) {
      throw new utils.TypedError(400, 'missing user id');
    }

    if (!req.params.id) {
      throw new utils.TypedError(400, 'missing campaign id');
    }

    const userId = req.decoded.id;
    const userAddress = req.decoded.publicAddress;
    const campaignId = utils.stringToId(req.params.id);

    const out = await Campaign.deploymentTransaction(userId, userAddress, campaignId);
    res.status(201).send(out);
  } catch (err) {
    next(err);
  }
};
