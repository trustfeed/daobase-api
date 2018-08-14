import Campaign from '../../models/campaign';
import * as te from '../../typedError';
import view from '../../views/adminCampaign';

// TODO: Paginate + only active campaigns
export const getAll = (req, res) => {
  Campaign.allPublic(req.params.offset)
    .then(data => {
      res.status(200).send({ campaigns: data.campaigns.map(view), offset: data.offset });
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
