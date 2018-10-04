 const viewDeployedContract = c => {
  if (c === null || c === undefined) {
    return undefined;
  } else {
    return { address: c.address, abi: c.abi };
  }
};

const onChainData = d => {
  if (d === null || d === undefined) {
    return undefined;
  } else {
    let startingTime;
    if (d.startingTime !== null && d.startingTime !== undefined) {
      startingTime = Math.round(d.startingTime.getTime() / 1000);
    }
    return {
      softCap: d.softCap,
      hardCap: d.hardCap,
      tokenName: d.tokenName,
      tokenSymbol: d.tokenSymbol,
      numberOfDecimals: d.numberOfDecimals,
      startingTime: startingTime,
      duration: d.duration,
      rate: d.rate,
      isMinted: d.isMinted || false,
      tokenContract: viewDeployedContract(d.tokenContract),
      crowdsaleContract: viewDeployedContract(d.crowdsaleContract),
      walletContract: viewDeployedContract(d.walletContract),
      weiRaised: d.weiRaised
    };
  }
};

const onChainDataBrief = d => {
  if (d === null || d === undefined) {
    return undefined;
  } else {
    let startingTime;
    if (d.startingTime !== null && d.startingTime !== undefined) {
      startingTime = Math.round(d.startingTime.getTime() / 1000);
    }
    return {
      softCap: d.softCap,
      hardCap: d.hardCap,
      tokenName: d.tokenName,
      tokenSymbol: d.tokenSymbol,
      numberOfDecimals: d.numberOfDecimals,
      startingTime: startingTime,
      duration: d.duration,
      rate: d.rate,
      isMinted: d.isMinted || false,
      weiRaised: d.weiRaised
    };
  }
};

const offChainData = d => {
  if (d === null || d === undefined) {
    return undefined;
  } else {
    return {
      coverImageURL: d.coverImageURL,
      whitePaperURL: d.whitePaperURL,
      summary: d.summary,
      description: d.description,
      keywords: d.keywords
    };
  }
};

// const viewOffChainDataBrief = d => {
//  if (d === null || d === undefined) {
//    return undefined;
//  } else {
//    return {
//      coverImageURL: d.coverImageURL,
//      whitePaperURL: d.whitePaperURL,
//      summary: d.summary,
//      keywords: d.keywords
//    };
//  }
// };
//
// export const viewHostedAdminFull = c => {
//  if (c === null || c === undefined) {
//    return undefined;
//  } else {
//    let offChainData;
//    if (c.PENDING_OFF_CHAIN_REVIEW) {
//      offChainData = viewOffChainData(c.offChainDataDraft);
//    } else {
//      offChainData = viewOffChainData(c.offChainData);
//    }
//
//    return {
//      campaignStatus: c.campaignStatus,
//      onChainData: viewOnChainData(c.onChainData),
//      offChainData
//    };
//  }
// };
//
// export const viewHostedAdminBrief = c => {
//  if (c === null || c === undefined) {
//    return undefined;
//  } else {
//    let offChainData;
//    if (c.PENDING_OFF_CHAIN_REVIEW) {
//      offChainData = viewOffChainDataBrief(c.offChainDataDraft);
//    } else {
//      offChainData = viewOffChainDataBrief(c.offChainData);
//    }
//
//    return {
//      campaignStatus: c.campaignStatus,
//      onChainData: viewOnChainDataBrief(c.onChainData),
//      offChainData
//    };
//  }
// };
//
// const viewHostedPublicFull = c => {
//  if (c === null || c === undefined) {
//    return undefined;
//  } else {
//    return {
//      campaignStatus: c.campaignStatus,
//      onChainData: viewOnChainData(c.onChainData),
//      offChainData: viewOffChainData(c.offChainData)
//    };
//  }
// };
//
// const viewHostedPublicBrief = c => {
//  if (c === null || c === undefined) {
//    return undefined;
//  } else {
//    return {
//      campaignStatus: c.campaignStatus,
//      onChainData: viewOnChainDataBrief(c.onChainData),
//      offChainData: viewOffChainDataBrief(c.offChainData)
//    };
//  }
// };
//
// const viewPeriod = p => {
//  if (p === null || p === undefined) {
//    return undefined;
//  } else {
//    return {
//      openingTime: p.openingTime,
//      closingTime: p.closingTime
//    };
//  }
// };
//
// const viewLink = l => {
//  if (l === null || l === undefined) {
//    return undefined;
//  } else {
//    return {
//      type: l.type,
//      url: l.url
//    };
//  }
// };
//
// const viewTeam = t => {
//  if (!t) {
//    return undefined;
//  } else {
//    return {
//      name: t.name,
//      role: t.role,
//      description: t.description,
//      links: (t.links || []).map(viewLink)
//    };
//  }
// };
//
// const viewExternalFull = c => {
//  if (!c) {
//    return undefined;
//  } else {
//    return {
//      name: c.name,
//      symbol: c.symbol,
//      summary: c.summary,
//      description: c.description,
//      companyURL: c.companyURL,
//      whitePaperURL: c.whitePaperURL,
//      coverImageURL: c.coverImageURL,
//      preICO: viewPeriod(c.preICO),
//      ico: viewPeriod(c.ico),
//      links: (c.links || []).map(viewLink),
//      location: c.link,
//      team: (c.team || []).map(viewTeam)
//    };
//  }
// };

export const hostedPublicBrief = c => {
  return {
    id: c._id.toString(),
    createdAt: c.createdAt.getTime() / 1000,
    updatedAt: c.updatedAt.getTime() / 1000,
    campaignStatus: c.campaignStatus,
    onChainData: onChainDataBrief(c.onChainData),
    offChainData: offChainData(c.offChainData),
    type: 'hostedCampaign'
  };
};

export const hostedPublicFull = c => {
  return {
    id: c._id.toString(),
    createdAt: c.createdAt.getTime() / 1000,
    updatedAt: c.updatedAt.getTime() / 1000,
    campaignStatus: c.campaignStatus,
    onChainData: onChainData(c.onChainData),
    offChainData: offChainData(c.offChainData),
    type: 'hostedCampaign'
  };
};

export const hostedAdminBrief = c => {
  return {
    id: c._id.toString(),
    createdAt: c.createdAt.getTime() / 1000,
    updatedAt: c.updatedAt.getTime() / 1000,
    campaignStatus: c.campaignStatus,
    onChainData: onChainDataBrief(c.onChainData),
    type: 'hostedCampaign'
  };
};

export const hostedAdminFull = c => {
  let offChain: any;
  if (c.PENDING_OFF_CHAIN_REVIEW) {
    offChain = offChainData(c.offChainDataDraft);
  } else {
    offChain = offChainData(c.offChainData);
  }
  return {
    id: c._id.toString(),
    createdAt: c.createdAt.getTime() / 1000,
    updatedAt: c.updatedAt.getTime() / 1000,
    campaignStatus: c.campaignStatus,
    onChainData: onChainData(c.onChainData),
    offChainData: offChain,
    type: 'hostedCampaign'
  };
};

// export const hostedBrief = c => viewHostedCampaign(c, viewHostedAdminBrief);
//  adminBrief: c => viewCampaign(c, viewHostedAdminBrief, viewExternalFull),
//  publicFull: c => viewCampaign(c, viewHostedPublicFull, viewExternalFull),
//  publicBrief: c => viewCampaign(c, viewHostedPublicBrief, viewExternalFull)
