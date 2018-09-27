import { User } from '../models/user';

export const self = (user: User) => {
  let out = {
    nonce: user.nonce,
    kycStatus: undefined,
    publicAddress: undefined,
    name: undefined,
    id: undefined,
    email: undefined
  };
  out.kycStatus = user.kycStatus;
  out.id = user._id.toString();
  out.publicAddress = user.publicAddress;
  out.name = user.name;
  if (user.currentEmail != null) {
    out.email = {
      address: user.currentEmail.address,
      isVerified: user.currentEmail.verifiedAt != null
    };
  }
  return out;
};
