const viewDeployedContract = (c) => {
  if (!c) {
    return undefined;
  } else {
    return { address: c.address, abi: JSON.parse(c.abi) };
  }
};

const viewOnChainData = (d) => {
  if (!d) {
    return undefined;
  } else {
    let startingTime;
    if (d.startingTime) {
      startingTime = Math.round(d.startingTime.getTime() / 1000);
    }
    return {
      network: d.network,
      softCap: d.softCap,
      hardCap: d.hardCap,
      tokenName: d.tokenName,
      tokenSymbol: d.tokenSymbol,
      numberOfDecimals: d.numberOfDecimals,
      startingTime: startingTime,
      duration: d.duration,
      rate: d.rate,
    };
  }
};

const viewOffChainData = (d) => {
  if (!d) {
    return undefined;
  } else {
    return {
      coverImageURL: d.coverImageURL,
      whitePaperURL: d.whitePaperURL,
      description: d.description,
      keywords: d.keywords,
    };
  }
};

const viewHosted = (c) => {
  if (!c) {
    return undefined;
  } else {
    return {
      campaignStatus: c.campaignStatus,
      tokenContract: viewDeployedContract(c.tokenContract),
      crowdsaleContract: viewDeployedContract(c.crowdsaleContract),
      onChainData: viewOnChainData(c.onChainData),
      offChainData: viewOffChainData(c.offChainData),
    };
  }
};

export default (c) => {
  let out = {
    id: c._id,
    type: 'hostedCampaign',
    createdAt: Math.round(c.createdAt.getTime() / 1000),
    updatedAt: Math.round(c.updatedAt.getTime() / 1000),
  };
  const h = viewHosted(c.hostedCampaign);
  for (let k in h) {
    out[k] = h[k];
  }
  return out;
};
