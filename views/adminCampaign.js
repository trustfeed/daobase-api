export default (c) => {
  let out = {};
  out.id = c._id;
  out.createdAt = Math.round(c.createdAt.getTime() / 1000);
  out.updatedAt = Math.round(c.updatedAt.getTime() / 1000);
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
    'totalSupply',
    'imageURL',
    'whitepaperURL',
    'version',
    'status',
  ];

  toOutput.map(field => {
    out[field] = c[field];
  });

  if (c.tokenContract) {
    out.tokenContract = { address: c.tokenContract.address, abi: JSON.parse(c.tokenContract.abi) };
  }
  if (c.crowdsaleContract) {
    out.crowdsaleContract = { address: c.crowdsaleContract.address, abi: JSON.parse(c.crowdsaleContract.abi) };
  }
  return out;
};
