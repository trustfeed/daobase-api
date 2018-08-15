import Campaign from '../../models/campaign';
import * as te from '../../typedError';
import view from '../../views/adminCampaign';
import Vote from '../../models/vote';
import mongoose from 'mongoose';

// TODO: Paginate + only active campaigns
export const getAll = (req, res) => {
  Campaign.allPublic(req.query.offset)
    .then(data => {
      res.status(200).send({ campaigns: data.campaigns.map(view), next: data.next });
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

  Campaign.findById(req.params.id)
    .then(campaign => {
      if (!campaign) {
        throw new te.TypedError(404, 'campaign not found');
      } else {
        res.status(200).send(view(campaign));
      }
    })
    .catch(err =>
      te.handleError(err, res)
    );
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
