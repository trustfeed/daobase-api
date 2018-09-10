import * as te from '../../../typedError';
import User from '../../../models/user';
import Campaign from '../../../models/campaign';
import views from '../../../views/adminCampaign';
import * as s3 from '../../../models/s3';
import mongoose from 'mongoose';

// Create an empty post for the logged in user
export const post = (req, res) => {
  if (!req.decoded || !req.decoded.publicAddress) {
    res.status(400).send({ message: 'missing public address' });
    return;
  }

  User.addHostedCampaign(req.decoded.publicAddress)
    .then(campaign => {
      return Campaign.putOnChainData(req.decoded.id, campaign._id, req.body);
    })
    .then(campaign => {
      res.status(201).send({ 'campaign_id': campaign.id });
    })
    .catch(err => {
      te.handleError(err, res);
    });
};

// Get a campaign
export const get = async (req, res) => {
  if (!req.decoded.id) {
    res.status(400).send({ message: 'missing user id' });
    return;
  }

  if (!req.params.id) {
    res.status(400).send({ message: 'missing campaign id' });
    return;
  }

  try {
    let campaign = await Campaign.fetchHostedCampaign(
      req.decoded.id,
      mongoose.Types.ObjectId(req.params.id));
    res.status(200).send(views.adminFull(campaign));
  } catch (err) {
    te.handleError(err, res);
  }
};

// A list of campaigns
export const getAll = async (req, res) => {
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

export const putOnChainData = (req, res) => {
  if (!req.decoded.id) {
    res.status(400).send({ message: 'missing user id' });
    return;
  }

  if (!req.params.id) {
    res.status(400).send({ message: 'missing campaign id' });
    return;
  }

  // if (req.body &&
  // req.body.startingTime &&
  // typeof req.body.startingTime == 'number') {
  //  req.body.startingTime = new Date(req.body.startingTime * 1000);
  // }

  Campaign.putOnChainData(
    req.decoded.id,
    mongoose.Types.ObjectId(req.params.id),
    req.body,
  ).then(() => {
    res.status(201).send({ message: 'updated' });
  }).catch(err =>
    te.handleError(err, res)
  );
};

export const putOffChainData = (req, res) => {
  if (!req.decoded.id) {
    res.status(400).send({ message: 'missing user id' });
    return;
  }

  if (!req.params.id) {
    res.status(400).send({ message: 'missing campaign id' });
    return;
  }

  Campaign.putOffChainData(
    req.decoded.id,
    mongoose.Types.ObjectId(req.params.id),
    req.body,
  ).then(() => {
    res.status(201).send({ message: 'updated' });
  }).catch(err =>
    te.handleError(err, res)
  );
};

// This returns a presigned URL to upload an image
export const coverImageURL = (req, res) => {
  if (!req.decoded.id) {
    res.status(400).send({ message: 'missing user id' });
    return;
  }
  if (!req.params.id) {
    res.status(400).send({ message: 'missing campaign id' });
    return;
  }

  const extension = req.body.extension || 'jpg';
  const contentType = req.body.contentType || 'image/jpeg';

  Campaign
    .fetchHostedCampaign(
      req.decoded.id,
      mongoose.Types.ObjectId(req.params.id))
    .then(camp => {
      return s3.signUpload(req.params.id, 'images', extension, contentType);
    })
    .then(url => {
      const uploadURL = url;
      const viewURL = uploadURL.split(/[?#]/)[0];
      res.status(201).send({ uploadURL, viewURL });
    })
    .catch(err =>
      te.handleError(err, res));
};

// This returns a presigned URL to upload a white paper pdf
export const pdfURL = (req, res) => {
  if (!req.decoded.id) {
    res.status(400).send({ message: 'missing user id' });
    return;
  }
  if (!req.params.id) {
    res.status(400).send({ message: 'missing campaign id' });
    return;
  }

  const extension = req.body.extension || 'pdf';
  const contentType = req.body.contentType || 'application/pdf';

  Campaign.findById(req.params.id)
    .then(camp => {
      return s3.signUpload(req.params.id, 'white-papers', extension, contentType);
    })
    .then(url => {
      const uploadURL = url;
      const viewURL = uploadURL.split(/[?#]/)[0];
      res.status(201).send({ uploadURL, viewURL });
    })
    .catch(err =>
      te.handleError(err, res));
};

export const submitForReview = (req, res) => {
  if (!req.decoded.id) {
    res.status(400).send({ message: 'missing user id' });
    return;
  }
  if (!req.params.id) {
    res.status(400).send({ message: 'missing campaign id' });
    return;
  }

  const userId = req.decoded.id;
  const campaignId = mongoose.Types.ObjectId(req.params.id);

  Campaign
    .submitForReview(userId, campaignId)
    .then(() => res.status(201).send({ message: 'submitted' }))
    .then(() =>
      setTimeout(() => {
        Campaign.acceptReview(userId, campaignId);
      }, 10 * 1000))
    .catch(err => te.handleError(err, res));
};

export const cancelReview = (req, res) => {
  if (!req.decoded.id) {
    res.status(400).send({ message: 'missing user id' });
    return;
  }
  if (!req.params.id) {
    res.status(400).send({ message: 'missing campaign id' });
    return;
  }

  const userId = req.decoded.id;
  const campaignId = mongoose.Types.ObjectId(req.params.id);

  Campaign
    .cancelReview(userId, campaignId)
    .then(() => res.status(201).send({ message: 'cancelled' }))
    .catch(err => te.handleError(err, res));
};

export const acceptReview = (req, res) => {
  if (!req.decoded.id) {
    res.status(400).send({ message: 'missing user id' });
    return;
  }
  if (!req.params.id) {
    res.status(400).send({ message: 'missing campaign id' });
    return;
  }

  Campaign
    .acceptReview(req.decoded.id, mongoose.Types.ObjectId(req.params.id))
    .then(() =>
      res.status(201).send({ message: 'accepted' }))
    .catch(err => te.handleError(err, res));
};

export const deploymentTransaction = (req, res) => {
  if (!req.decoded.id) {
    res.status(400).send({ message: 'missing user id' });
    return;
  }
  if (!req.params.id) {
    res.status(400).send({ message: 'missing campaign id' });
    return;
  }

  Campaign.deploymentTransaction(
    req.decoded.id,
    req.decoded.publicAddress,
    mongoose.Types.ObjectId(req.params.id),
  )
    .then(o => res.status(201).send(o))
    .catch(e => te.handleError(e, res));
};
