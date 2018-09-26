// Load the AWS SDK for Node.js
import AWS from 'aws-sdk';
import config from '../config';
import nodemailer from 'nodemailer';
import Email from 'email-templates';

const transporter = () => {
  AWS.config.update({
    accessKeyId: config.accessKeyId.trim(),
    secretAccessKey: config.secretAccessKey.trim(),
    region: 'us-east-1'
  });
  return nodemailer.createTransport({
    SES: new AWS.SES({
      apiVersion: '2010-12-01'
    })
  });
};

export const sendEmailVerification = (destinationAddress, userName, link) => {
  const email = new Email({
    message: {
      to: destinationAddress,
      from: 'noreply@trustfeed.io'
    },
    transport: transporter()
  });

  return email.send({
    template: 'emailVerification',
    locals: {
      name: userName,
      link: link
    }
  });
};

export const sendKYCSuccess = (destinationAddress, userName) => {
  const email = new Email({
    message: {
      to: destinationAddress,
      from: 'noreply@trustfeed.io'
    },
    transport: transporter()
  });

  return email.send({
    template: 'kycSuccess',
    locals: {
      name: userName
    }
  });
};

export const sendKYCFailure = (destinationAddress, userName, note) => {
  const email = new Email({
    message: {
      to: destinationAddress,
      from: 'noreply@trustfeed.io'
    },
    transport: transporter()
  });

  return email.send({
    template: 'kycFailure',
    locals: {
      name: userName,
      note
    }
  });
};

export const sendCampaignReviewSuccess = (destinationAddress, userName) => {
  const email = new Email({
    message: {
      to: destinationAddress,
      from: 'noreply@trustfeed.io'
    },
    transport: transporter()
  });

  return email.send({
    template: 'campaignReviewSuccess',
    locals: {
      name: userName
    }
  });
};

export const sendCampaignReviewFailure = (destinationAddress, userName, note) => {
  const email = new Email({
    message: {
      to: destinationAddress,
      from: 'noreply@trustfeed.io'
    },
    transport: transporter()
  });

  return email.send({
    template: 'campaignReviewFailure',
    locals: {
      name: userName,
      note
    }
  });
};
