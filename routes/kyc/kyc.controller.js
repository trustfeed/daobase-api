import utils from '../../utils';
import * as s3 from '../../models/s3';
import KYCApplication from '../../models/kycApplication.js';

exports.passportImage = async (req, res, next) => {
  try {
    if (!req.decoded.id) {
      throw new utils.TypedError(400, 'missing user id');
    }

    const extension = req.body.extension || 'png';
    const contentType = req.body.contentType || 'image/png';

    const url = await s3.signUpload(
      req.decoded.id,
      'kyc/passport-images',
      extension,
      contentType,
    );
    const uploadURL = url;
    const viewURL = uploadURL.split(/[?#]/)[0];
    res.status(201).send({ uploadURL, viewURL });
  } catch (err) {
    next(err);
  }
};

exports.facialImage = async (req, res, next) => {
  try {
    if (!req.decoded.id) {
      throw new utils.TypedError(400, 'missing user id');
    }

    const extension = req.body.extension || 'png';
    const contentType = req.body.contentType || 'image/png';

    const url = await s3.signUpload(
      req.decoded.id,
      'kyc/facial-images',
      extension,
      contentType,
    );
    const uploadURL = url;
    const viewURL = uploadURL.split(/[?#]/)[0];
    res.status(201).send({ uploadURL, viewURL });
  } catch (err) {
    next(err);
  }
};

exports.post = async (req, res, next) => {
  try {
    if (!req.decoded.id) {
      throw new utils.TypedError(400, 'missing user id');
    }

    if (!req.body.passportImageURL || !req.body.facialImageURL) {
      throw new utils.TypedError(400, 'missing image URL');
    }

    let app = await KYCApplication.create(req.decoded.id, req.body.passportImageURL, req.body.facialImageURL);
    res.status(201).send({ message: 'received' });

    setTimeout(() => {
      app.verify().catch(console.log);
    }, 10 * 1000);
  } catch (err) {
    next(err);
  }
};
