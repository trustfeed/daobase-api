import { injectable } from 'inversify';
import * as onChain from './onChainData';
import * as offChain from './offChainData';
import { TypedError } from '../utils';

@injectable()
export class HostedCampaign {
  public ownerId: string;
  public campaignStatus: string;
  public onChainData: onChain.OnChainData;
  public offChainData: offChain.OffChainData;
  public createdAt: Date;
  public updatedAt: Date;
  public type: string;
  public offChainDataDraft?: any;
  public _id?: string;

  constructor(
    ownerId: string,
    onChainData: any
  ) {
    this.ownerId = ownerId;
    this.campaignStatus = 'DRAFT';
    this.onChainData = onChainData;
    this.offChainData = new offChain.OffChainData();
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.type = 'hostedCampaign';
  }
}

// Throws an error if the hosted campaign contains configuration errors
export const validate = (hostedCampaign: HostedCampaign) => {
  const onChainErrs = onChain.generateReport(hostedCampaign.onChainData);
  const offChainErrs = offChain.generateReport(hostedCampaign.offChainData);
  if (Object.keys(onChainErrs).length > 0 || Object.keys(offChainErrs).length > 0) {
    throw new TypedError(400, 'validation error', 'INVALID_DATA', {
      onChainValidationErrors: onChainErrs,
      offChainValidationErrors: offChainErrs
    });
  }
};
//
//// Get the contract describing the campaign
// HostedCampaign.methods.getCampaignContract = function() {
//  let name = 'TrustFeedCampaign';
//  if (this.onChainData.isMinted) {
//    name = 'TrustFeedMintedCampaign';
//  }
//
//  return Contract.findOne({
//    name,
//    version: this.onChainData.version
//  }).exec();
// };
//
// export default HostedCampaign;
