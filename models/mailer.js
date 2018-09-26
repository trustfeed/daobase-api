// Load the AWS SDK for Node.js
import AWS from 'aws-sdk';
import config from '../config';
import nodemailer from 'nodemailer';
import Email from 'email-templates';

const transporter = () => {
  AWS.config.update({
    accessKeyId: config.accessKeyId.trim(),
    secretAccessKey: config.secretAccessKey.trim(),
    region: 'us-east-1',
  });
  return nodemailer.createTransport({
    SES: new AWS.SES({ apiVersion: '2010-12-01' }),
  });
};

exports.sendEmailVerification = (destinationAddress, userName, link) => {
  const email = new Email({
    message: {
      to: destinationAddress,
      from: 'noreply@trustfeed.io',
    },
    transport: transporter(),
  });

  return email.send({
    template: 'emailVerification',
    locals: {
      name: userName,
      link: link,
    },
  });
};

exports.sendKYCSuccess = (destinationAddress, userName) => {
  const email = new Email({
    message: {
      to: destinationAddress,
      from: 'noreply@trustfeed.io',
    },
    transport: transporter(),
  });

  return email.send({
    template: 'kycSuccess',
    locals: {
      name: userName,
    },
  });
};

exports.sendKYCFailure = (destinationAddress, userName, note) => {
  const email = new Email({
    message: {
      to: destinationAddress,
      from: 'noreply@trustfeed.io',
    },
    transport: transporter(),
  });

  return email.send({
    template: 'kycFailure',
    locals: {
      name: userName,
      note,
    },
  });
};

exports.sendCampaignReviewSuccess = (destinationAddress, userName) => {
  const email = new Email({
    message: {
      to: destinationAddress,
      from: 'noreply@trustfeed.io',
    },
    transport: transporter(),
  });

  return email.send({
    template: 'campaignReviewSuccess',
    locals: {
      name: userName,
    },
  });
};

exports.sendCampaignReviewFailure = (destinationAddress, userName, note) => {
  const email = new Email({
    message: {
      to: destinationAddress,
      from: 'noreply@trustfeed.io',
    },
    transport: transporter(),
  });

  return email.send({
    template: 'campaignReviewFailure',
    locals: {
      name: userName,
      note,
    },
  });
};

