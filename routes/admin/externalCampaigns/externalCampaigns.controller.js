import * as te from '../../../typedError';
import User from '../../../models/user';
import Campaign from '../../../models/campaign';
import view from '../../../views/adminCampaign';

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

export const post = (req, res) => {
  if (!req.decoded || !req.decoded.publicAddress) {
    res.status(400).send({ message: 'missing public address' });
    return;
  }

  convertTimes(req);
  User.addExternalCampaign(req.decoded.publicAddress, req.body)
    .then(campaign => {
      res.status(201).send({ 'campaign_id': campaign.id });
    })
    .catch(err => {
      te.handleError(err, res);
    });
};

export const put = (req, res) => {
  if (!req.decoded || !req.decoded.publicAddress) {
    res.status(400).send({ message: 'missing public address' });
    return;
  }

  if (!req.params.id) {
    res.status(400).send({ message: 'missing campaign id' });
    return;
  }

  convertTimes(req);
  Campaign.putExternal(req.decoded.publicAddress, req.params.id, req.body)
    .then(campaign => {
      res.status(201).send({ 'campaign_id': campaign.id });
    })
    .catch(err => {
      te.handleError(err, res);
    });
};

export const getAll = (req, res) => {
  Campaign.findAllExternal(req.query.offset)
    .then(cs => {
      cs.campaigns = cs.campaigns.map(view);
      res.status(200).send(cs);
    })
    .catch(err =>
      te.handleError(err, res)
    );
};

export const get = (req, res) => {
  if (!req.params.id) {
    res.status(400).send({ message: 'missing campaign id' });
    return;
  }

  Campaign
    .findOne({ _id: req.query.offset })
    .exec()
    .then(campaign => {
      if (!campaign) {
        throw new te.TypedError(404, 'unknown campaign id');
      } else if (!campaign.externalCampaign) {
        throw new te.TypedError(404, 'unknown campaign id');
      } else {
        res.status(200).send(view(campaign));
      }
    })
    .catch(err =>
      te.handleError(err, res)
    );
};
