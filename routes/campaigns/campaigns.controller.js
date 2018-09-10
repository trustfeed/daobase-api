import Campaign from '../../models/campaign';
import * as te from '../../typedError';
import views from '../../views/adminCampaign';
import Vote from '../../models/vote';
import mongoose from 'mongoose';

export const getAll = async (req, res) => {
  try {
    let data = await Campaign.allPublic(req.query.offset);
    // await Promise.all(data.campaigns.map(x => x.addWeiRaised()));
    res.status(200).send({ campaigns: data.campaigns.map(views.publicBrief), next: data.next });
  } catch (err) {
    te.handleError(err, res);
  }
};

export const get = async (req, res) => {
  if (!req.params.id) {
    res.status(400).send({ message: 'missing campaign id' });
    return;
  }

  try {
    let campaign = await Campaign.publicById(mongoose.Types.ObjectId(req.params.id));
    if (!campaign) {
      throw new te.TypedError(404, 'campaign not found');
    } else {
      // await campaign.addWeiRaised();
      res.status(200).send(views.publicFull(campaign));
      return;
    }
  } catch (err) {
    te.handleError(err, res);
  }
};

export const voteGet = (req, res) => {
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

export const vote = (req, res) => {
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

export const retractVote = (req, res) => {
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

export const votes = (req, res) => {
  if (!req.params.id) {
    res.status(400).send({ message: 'missing campaign id' });
  }

  Vote.count(te.convertStringToId(req.params.id))
    .then(out => res.status(200).send(out))
    .catch(err => te.handleError(err, res));
};
