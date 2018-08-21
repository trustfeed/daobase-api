import AWS from 'aws-sdk';
import config from '../config';

export const signUpload = (campaignId, prefix, extension, contentType) => {
  AWS.config.update({
    accessKeyId: config.accessKeyId.trim(),
    secretAccessKey: config.secretAccessKey.trim(),
    region: config.region.trim(),
  });
  const s3 = new AWS.S3();
  let rand = (+new Date()).toString(36);
  const params = {
    Bucket: 'tokenadmin.work',
    Key: prefix + '/' + campaignId + '-' + rand + '.' + extension,
    Expires: 60 * 5,
    ContentType: contentType,
  };
  return new Promise((resolve, reject) => {
    s3.getSignedUrl('putObject', params, (err, url) => {
      if (!err) {
        resolve(url);
      } else {
        reject(err);
      }
    });
  });
};
