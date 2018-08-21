import * as te from '../../../typedError';
import User from '../../../models/user';
import Campaign from '../../../models/campaign';
import view from '../../../views/adminCampaign';
import * as s3 from '../../../models/s3';
import url from 'url';
import mongoose from 'mongoose';

const updateCampaign = (oldCampaign, newCampaign) => {
  oldCampaign.updatedAt = Date.now();

  const toCheck = [
    'network',
    'softCap',
    'hardCap',
    'tokenName',
    'tokenSymbol',
    'numberOfDecimals',
    'duration',
    'totalSupply',
    'version',
    'rate',
  ];

  toCheck.map(field => {
    if (newCampaign[field]) {
      oldCampaign[field] = newCampaign[field];
    }
  });
  if (newCampaign.startingTime) {
    oldCampaign.startingTime = new Date(newCampaign.startingTime);
  }
  return oldCampaign;
};

// Create an empty post for the logged in user
export const post = (req, res) => {
  if (!req.decoded || !req.decoded.publicAddress) {
    res.status(400).send({ message: 'missing public address' });
    return;
  }

  User.addCampaign(req.decoded.publicAddress)
    .then(campaign => updateCampaign(campaign, req.body).save())
    .then(campaign =>
      res.status(201).send({ 'campaign_id': campaign.id })
    )
    .catch(err => {
      te.handleError(err, res);
    });
};

// Get a campaign
export const get = (req, res) => {
  if (!req.decoded.id) {
    res.status(400).send({ message: 'missing user id' });
    return;
  }

  if (!req.params.id) {
    res.status(400).send({ message: 'missing campaign id' });
    return;
  }

  Campaign.findById(req.params.id)
    .then(campaign => {
      if (!campaign) {
        throw new te.TypedError(404, 'campaign not found');
      } else if (!campaign.owner.equals(req.decoded.id)) {
        throw new te.TypedError(403, 'unauthorised');
      } else {
        res.status(200).send(view(campaign));
      }
    })
    .catch(err =>
      te.handleError(err, res)
    );
};

// A list of campaigns
export const getAll = (req, res) => {
  if (!req.decoded.id) {
    res.status(400).send({ message: 'missing user id' });
    return;
  }

  Campaign.findByOwner(req.decoded.id)
    .then(cs => {
      res.status(200).send({ campaigns: cs.map(view) });
    })
    .catch(err =>
      te.handleError(err, res)
    );
};

export const put = (req, res) => {
  if (!req.decoded.id) {
    res.status(400).send({ message: 'missing user id' });
    return;
  }

  if (!req.params.id) {
    res.status(400).send({ message: 'missing campaign id' });
    return;
  }

  // Get the existing campaign
  Campaign.findById(req.params.id)
    .then(campaign => {
      if (!campaign) {
        throw new te.TypedError(404, 'no such campaign');
      } else if (!campaign.owner.equals(req.decoded.id)) {
        throw new te.TypedError(403, 'unauthorised');
      } else if (campaign.campaignStatus !== 'DRAFT') {
        throw new te.TypedError(400, 'campaign is not a draft');
      } else {
        return updateCampaign(campaign, req.body).save();
      }
    })
    .then(() => {
      res.status(201).send({ message: 'updated' });
    })
    .catch(err =>
      te.handleError(err, res)
    );
};

const removeQuery = (u) => {
  const x = url.parse(u);
  return x.protocol + '//' + x.host + x.pathname;
};

// This returns a presigned URL to upload an image
export const imageURL = (req, res) => {
  if (!req.decoded.id) {
    res.status(400).send({ message: 'missing user id' });
    return;
  }
  if (!req.params.id) {
    res.status(400).send({ message: 'missing campaign id' });
    return;
  }

  let campaign, imageURL;
  Campaign.findById(req.params.id)
    .then(camp => {
      if (!camp) {
        throw new te.TypedError(404, 'campaign not found');
      } else if (!camp.owner.equals(req.decoded.id)) {
        throw new te.TypedError(403, 'unauthorised');
      } else {
        campaign = camp;
        return s3.signUpload(req.params.id, 'images', 'jpg', 'image/jpeg');
      }
    })
    .then(u => {
      imageURL = u;
      if (campaign.imageURL) {
	if (campaign.oldWhitepaper === undefined) {
		campaign.oldWhitepaper = [];
	}
        campaign.oldImages.push(campaign.imageURL);
      }
      campaign.set({ imageURL: removeQuery(u) });
      return campaign.save();
    }).then(() =>
      res.status(201).send({ url: imageURL }))
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

  let campaign, paperURL;
  Campaign.findById(req.params.id)
    .then(camp => {
      if (!camp) {
        throw new te.TypedError(404, 'campaign not found');
      } else if (!camp.owner.equals(req.decoded.id)) {
        throw new te.TypedError(403, 'unauthorised');
      } else {
        campaign = camp;
        return s3.signUpload(req.params.id, 'whitepapers', 'pdf', 'application/pdf');
      }
    })
    .then(u => {
      paperURL = u;
      if (campaign.whitepaperURL) {
	if (campaign.oldWhitepaper === undefined) {
		campaign.oldWhitepaper = [];
	}
        campaign.oldWhitepaper.push(campaign.whitepaperURL);
      }
      campaign.set({ whitepaperURL: removeQuery(u) });
      return campaign.save();
    }).then(() =>
      res.status(201).send({ url: paperURL }))
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

  Campaign
    .submitForReview(req.decoded.id, mongoose.Types.ObjectId(req.params.id))
    .then(() => res.status(201).send({ message: 'submitted' }))
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

export const deploy = (req, res) => {
  if (!req.decoded.id) {
    res.status(400).send({ message: 'missing user id' });
    return;
  }
  if (!req.params.id) {
    res.status(400).send({ message: 'missing campaign id' });
    return;
  }

  Campaign.deploy(req.decoded.id, mongoose.Types.ObjectId(req.params.id))
    .then(o => res.status(200).send(o))
    .catch(e => te.handleError(e, res));
};

export const finaliseDeployment = (req, res) => {
  if (!req.decoded.id) {
    res.status(400).send({ message: 'missing user id' });
    return;
  }
  if (!req.params.id) {
    res.status(400).send({ message: 'missing campaign id' });
    return;
  }

  const { blockNumber, transactionIndex } = req.body;
  if (blockNumber === undefined || transactionIndex === undefined) {
    res.status(400).send({ message: 'blockNumber and transactionIndex are required' });
    return;
  }

  Campaign.finaliseDeployment(
    req.decoded.id,
    mongoose.Types.ObjectId(req.params.id),
    blockNumber,
    transactionIndex)
    .then(o => res.status(200).send({message: 'finalised'}))
    .catch(e => te.handleError(e, res));
};
