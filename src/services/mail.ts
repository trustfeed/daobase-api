import { inject, injectable } from 'inversify';
import { MongoDBConnection } from '../utils/mongodb/connection';
import { stringToId } from '../utils/mongodb/stringToId';
import TYPES from '../constant/types';
import config from '../config';
import Coinpayments from 'coinpayments';
import AWS from 'aws-sdk';
import nodemailer from 'nodemailer';
import Email from 'email-templates';

@injectable()
export class MailService {
  private transport;

  constructor() {
    AWS.config.update({
      accessKeyId: config.accessKeyId.trim(),
      secretAccessKey: config.secretAccessKey.trim(),
      region: 'us-east-1'
    });
    this.transport = nodemailer.createTransport({
      SES: new AWS.SES({
        apiVersion: '2010-12-01'
      })
    });
  }

  public sendEmailVerification (destinationAddress, userName, link) {
    const email = new Email({
      message: {
        to: destinationAddress,
        from: 'noreply@trustfeed.io'
      },
      transport: this.transport
    });

    return email.send({
      template: 'emailVerification',
      locals: {
        name: userName,
        link: link
      }
    });
  }

  public sendKYCSuccess (destinationAddress, userName) {
    const email = new Email({
      message: {
        to: destinationAddress,
        from: 'noreply@trustfeed.io'
      },
      transport: this.transport
    });

    return email.send({
      template: 'kycSuccess',
      locals: {
        name: userName
      }
    });
  }

  public sendKYCFailure (destinationAddress, userName, note) {
    const email = new Email({
      message: {
        to: destinationAddress,
        from: 'noreply@trustfeed.io'
      },
      transport: this.transport
    });

    return email.send({
      template: 'kycFailure',
      locals: {
        name: userName,
        note
      }
    });
  }

  public sendCampaignReviewSuccess (destinationAddress, userName) {
    const email = new Email({
      message: {
        to: destinationAddress,
        from: 'noreply@trustfeed.io'
      },
      transport: this.transport
    });

    return email.send({
      template: 'campaignReviewSuccess',
      locals: {
        name: userName
      }
    });
  }

  public sendCampaignReviewFailure (destinationAddress, userName, note) {
    const email = new Email({
      message: {
        to: destinationAddress,
        from: 'noreply@trustfeed.io'
      },
      transport: this.transport
    });

    return email.send({
      template: 'campaignReviewFailure',
      locals: {
        name: userName,
        note
      }
    });
  }
}
