import * as te from '../../../typedError';
import User from '../../../models/user';
import Campaign from '../../../models/campaign';
import view from '../../../views/adminCampaign';

// Create an empty post for the logged in user
export const post = (req, res) => {
  console.log(req.decoded);
  if (!req.decoded || !req.decoded.publicAddress) {
    res.status(400).send({ message: 'missing public address' });
    return;
  }

  User.addCampaign(req.decoded.publicAddress)
    .then(campaign => {
      res.status(201).send({ 'campaign_id': campaign.id });
    })
    .catch(err => {
      te.handleError(err, res);
    });
};

// Get a campaign
export const get = (req, res) => {
  if (!req.decoded.id) {
    res.status(400).send({ message: 'missing user id' });
  }

  if (!req.params.id) {
    res.status(400).send({ message: 'missing campaign id' });
  }

  Campaign.findById(req.params.id)
    .then(campaign => {
      if (!campaign) {
        throw new te.TypedError(404, 'campaign not found');
      } else if (!campaign.owner.equals(req.decoded.id)) {
        throw new te.TypedError(401, 'unauthorised');
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
  }

  const newCamp = req.body;
  if (!req.params.id) {
    res.status(400).send({ message: 'missing campaign id' });
  }

  // Get the existing campaign
  Campaign.findById(req.params.id)
    .then(campaign => {
      if (!campaign) {
        throw new te.TypedError(404, 'no such campaign');
      } else if (!campaign.owner.equals(req.decoded.id)) {
        throw new te.TypedError(401, 'unauthorised');
      } else {
        newCamp.updatedAt = Date.now();
        campaign.set(newCamp);
        return campaign.save();
      }
    })
    .then(() => {
      res.status(201).send({ message: 'updated' });
    })
    .catch(err =>
      te.handleError(err, res)
    );
};
