import utils from '../../utils';
import Investment from '../../models/investment';
import view from '../../views/investment';

exports.get = async (req, res, next) => {
  try {
    if (!req.decoded.id) {
      throw new utils.TypedError(400, 'missing user id');
    }

    const order = req.query.order || 'symbol';
    const investments = await Investment.byUser(req.decoded.id, order, req.query.offset);
    if (!investments) {
      res.status(200).send({ investments: [] });
    } else {
      res.status(200).send({ investments: investments.tokens.map(view) });
    }
  } catch (err) {
    next(err);
  };
};
