import * as te from '../../typedError';
import * as s3 from '../../models/s3';
import KYCApplication from '../../models/kycApplication.js';

exports.passportImage = async (req, res) => {
  try {
    if (!req.decoded.id) {
      throw new te.TypedError(400, 'missing user id');
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
    te.handleError(err, res);
  }
};

exports.facialImage = async (req, res) => {
  try {
    if (!req.decoded.id) {
      throw new te.TypedError(400, 'missing user id');
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
    te.handleError(err, res);
  }
};

exports.post = async (req, res) => {
  try {
    if (!req.decoded.id) {
      throw new te.TypedError(400, 'missing user id');
    }

    if (!req.body.passportImageURL || !req.body.facialImageURL) {
      throw new te.TypedError(400, 'missing image URL');
    }

    let app = await KYCApplication.create(req.decoded.id, req.body.passportImageURL, req.body.facialImageURL);
    res.status(201).send({ message: 'received' });

    setTimeout(() => {
      app.verify().catch(console.log);
    }, 10 * 1000);
  } catch (err) {
    te.handleError(err, res);
  }
};
