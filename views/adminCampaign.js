export default (c) => {
  let out = {};
  out.id = c._id;
  out.createdAt = c.createdAt.getTime();
  out.updatedAt = c.updatedAt.getTime();
  if (c.startingTime) {
    out.startingTime = c.startingTime.getTime();
  }

  const toOutput = [
    'network',
    'campaignStatus',
    'softCap',
    'hardCap',
    'tokenName',
    'tokenSymbol',
    'numberOfDecimals',
    'duration',
    'imageURL',
    'whitepaperURL',
  ];

  toOutput.map(field => {
    out[field] = c[field];
  });
  return out;
};
