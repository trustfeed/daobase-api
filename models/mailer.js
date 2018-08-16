// Load the AWS SDK for Node.js
import AWS from 'aws-sdk';
import config from '../config';

const sendMail = (email, subject, text, html, callback) => {
  AWS.config.update({
    accessKeyId: config.accessKeyId.trim(),
    secretAccessKey: config.secretAccessKey.trim(),
    region: 'us-east-1',
  });

  // Create sendEmail params
  var params = {
    Destination: {
      CcAddresses: [
      ],
      ToAddresses: [
        email,
      ],
    },
    Message: {
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: html,
        },
        Text: {
          Charset: 'UTF-8',
          Data: text,
        },
      },
      Subject: {
        Charset: 'UTF-8',
        Data: subject,
      },
    },
    Source: 'TrustFeed <noreply@trustfeed.io>',
    ReplyToAddresses: [
      'TrustFeed <noreply@trustfeed.io>',
    ],
  };

  return new AWS.SES().sendEmail(params, callback);
};

export default sendMail;
