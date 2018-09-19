import * as te from '../../../typedError';
import User from '../../../models/user';
import Campaign from '../../../models/campaign';
import views from '../../../views/adminCampaign';
import * as s3 from '../../../models/s3';

// Create an empty post for the logged in user
exports.post = async (req, res) => {
  try {
    if (!req.decoded || !req.decoded.publicAddress) {
      res.status(400).send({ message: 'missing public address' });
      return;
    }

    let campaign = await User.addHostedCampaign(
      req.decoded.publicAddress,
      req.body,
    );
    res.status(201).send({ 'campaign_id': campaign.id });
  } catch (err) {
    te.handleError(err, res);
  };
};

// Get a campaign
exports.get = async (req, res) => {
  if (!req.decoded.id) {
    res.status(400).send({ message: 'missing user id' });
    return;
  }

  if (!req.params.id) {
    res.status(400).send({ message: 'missing campaign id' });
    return;
  }

  try {
    const campaignId = te.stringToId(req.params.id);
    let campaign = await Campaign.fetchHostedCampaign(
      req.decoded.id,
      campaignId,
    );
    res.status(200).send(views.adminFull(campaign));
  } catch (err) {
    te.handleError(err, res);
  }
};

// A list of campaigns
exports.getAll = async (req, res) => {
  if (!req.decoded.id) {
    res.status(400).send({ message: 'missing user id' });
    return;
  }

  try {
    let data = await Campaign.findHostedByOwner(req.decoded.id, req.query.offset);
    // await Promise.all(data.campaigns.map(x => x.addWeiRaised()));
    data.campaigns = data.campaigns.map(views.adminBrief);
    res.status(200).send(data);
  } catch (err) {
    te.handleError(err, res);
  }
};

exports.putOnChainData = async (req, res) => {
  try {
    if (!req.decoded.id) {
      throw new te.TypedError(400, 'missing user id');
    }

    if (!req.params.id) {
      throw new te.TypedError(400, 'missing campaign id');
    }

    const campaignId = te.stringToId(req.params.id);
    await Campaign.putOnChainData(
      req.decoded.id,
      campaignId,
      req.body,
    );
    res.status(201).send({ message: 'updated' });
  } catch (err) {
    te.handleError(err, res);
  }
};

exports.putOffChainData = async (req, res) => {
  try {
    if (!req.decoded.id) {
      throw new te.TypedError(400, 'missing user id');
    }

    if (!req.params.id) {
      throw new te.TypedError(400, 'missing campaign id');
    }

    const campaignId = te.stringToId(req.params.id);
    await Campaign.putOffChainData(
      req.decoded.id,
      campaignId,
      req.body,
    );
    res.status(201).send({ message: 'updated' });
  } catch (err) {
    te.handleError(err, res);
  }
};

// This returns a presigned URL to upload an image
exports.coverImageURL = async (req, res) => {
  try {
    if (!req.decoded.id) {
      throw new te.TypedError(400, 'missing user id');
    }

    if (!req.params.id) {
      throw new te.TypedError(400, 'missing campaign id');
    }

    const extension = req.body.extension || 'jpg';
    const contentType = req.body.contentType || 'image/jpeg';

    const campaignId = te.stringToId(req.params.id);
    await Campaign
      .fetchHostedCampaign(
        req.decoded.id,
        campaignId,
      );
    const url = await s3.signUpload(
      campaignId,
      'images',
      extension,
      contentType,
    );
    const uploadURL = url;
    const viewURL = uploadURL.split(/[?#]/)[0];
    res.status(201).send({ uploadURL, viewURL });
  } catch (err) {
    te.handleError(err, res);
  }
};

// This returns a presigned URL to upload a white paper pdf
exports.pdfURL = async (req, res) => {
  try {
    if (!req.decoded.id) {
      throw new te.TypedError(400, 'missing user id');
    }

    if (!req.params.id) {
      throw new te.TypedError(400, 'missing campaign id');
    }

    const extension = req.body.extension || 'pdf';
    const contentType = req.body.contentType || 'application/pdf';

    const campaignId = te.stringToId(req.params.id);
    await Campaign.fetchHostedCampaign(
      req.decoded.id,
      campaignId,
    );
    const url = await s3.signUpload(req.params.id, 'white-papers', extension, contentType);
    const uploadURL = url;
    const viewURL = uploadURL.split(/[?#]/)[0];
    res.status(201).send({ uploadURL, viewURL });
  } catch (err) {
    te.handleError(err, res);
  }
};

exports.submitForReview = async (req, res) => {
  try {
    if (!req.decoded.id) {
      throw new te.TypedError(400, 'missing user id');
    }

    if (!req.params.id) {
      throw new te.TypedError(400, 'missing campaign id');
    }

    const userId = req.decoded.id;
    const campaignId = te.stringToId(req.params.id);

    await Campaign
      .submitForReview(userId, campaignId);
    res.status(201).send({ message: 'submitted' });
    setTimeout(() => {
      Campaign.acceptReview(userId, campaignId);
    }, 60 * 1000);
  } catch (err) {
    te.handleError(err, res);
  }
};

exports.cancelReview = async (req, res) => {
  try {
    if (!req.decoded.id) {
      throw new te.TypedError(400, 'missing user id');
    }

    if (!req.params.id) {
      throw new te.TypedError(400, 'missing campaign id');
    }

    const userId = req.decoded.id;
    const campaignId = te.stringToId(req.params.id);

    await Campaign.cancelReview(userId, campaignId);
    res.status(201).send({ message: 'cancelled' });
  } catch (err) {
    te.handleError(err, res);
  };
};

exports.acceptReview = async (req, res) => {
  try {
    if (!req.decoded.id) {
      throw new te.TypedError(400, 'missing user id');
    }

    if (!req.params.id) {
      throw new te.TypedError(400, 'missing campaign id');
    }

    const userId = req.decoded.id;
    const campaignId = te.stringToId(req.params.id);

    await Campaign
      .acceptReview(userId, campaignId);
    res.status(201).send({ message: 'accepted' });
  } catch (err) {
    te.handleError(err, res);
  }
};

exports.deploymentTransaction = async (req, res) => {
  try {
    if (!req.decoded.id) {
      throw new te.TypedError(400, 'missing user id');
    }

    if (!req.params.id) {
      throw new te.TypedError(400, 'missing campaign id');
    }

    const userId = req.decoded.id;
    const userAddress = req.decoded.publicAddress;
    const campaignId = te.stringToId(req.params.id);

    const out = await Campaign.deploymentTransaction(
      userId,
      userAddress,
      campaignId,
    );
    res.status(201).send(out);
  } catch (err) {
    te.handleError(err, res);
  }
};
