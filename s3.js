import AWS from 'aws-sdk';
import config from './config';

const s3 = new AWS.S3({
  accessKeyId: config.awsAccessKeyId,
  secretAccessKey: config.awsSecretAccessKey,
  region: config.awsRegion,
});

export const signUpload = (campaignId, prefix) => {
  let rand = (+new Date()).toString(36);
  const params = {
    Bucket: 'tokenadmin.work',
    Key: prefix + '/' + campaignId + '-' + rand,
    Expires: 60,
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
