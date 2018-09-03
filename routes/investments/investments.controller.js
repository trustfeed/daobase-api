import * as te from '../../typedError';
import Investment from '../../models/investments';
import view from '../../views/investments';

export const get = async (req, res) => {
  try {
    if (!req.decoded.id) {
      throw new te.TypedError(400, 'missing user id');
    }

    const investments = await Investment.findOne({ user: req.decoded.id }).exec();
    if (!investments) {
      res.status(200).send({ investments: [] });
    } else {
      res.status(200).send({ investments: investments.tokens.map(view) });
    }
  } catch (err) {
    te.handleError(err, res);
  };
};
