import AWS from 'aws-sdk';

const s3 = new AWS.S3();

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
