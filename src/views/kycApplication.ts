
export const kycApplication = (kyc) => {
  return { id: kyc._id.toString(),
	 userId: kyc.userId.toString(),
	 passportImageURL: kyc.passportImageURL,
	 facialImageURL: kyc.facialImageURL,
	 status: kyc.status };
};
