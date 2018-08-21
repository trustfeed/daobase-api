import AWS from 'aws-sdk';
import config from '../config';

export const signUpload = (campaignId, prefix, extension, type) => {
  AWS.config.update({
    accessKeyId: config.accessKeyId.trim(),
    secretAccessKey: config.secretAccessKey.trim(),
    region: config.region.trim(),
  });
  const s3 = new AWS.S3();
  let rand = (+new Date()).toString(36);
  const params = {
    Bucket: 'tokenadmin.work',
    Key: prefix + '/' + campaignId + '-' + rand + '.' + 'pdf',
    Expires: 60,
    ContentType: 'application/pdf',
  };
  return new Promise((resolve, reject) => {
    s3.getSignedUrl('postObject', params, (err, url) => {
      if (!err) {
        resolve(url);
      } else {
        reject(err);
      }
    });
  });
};
