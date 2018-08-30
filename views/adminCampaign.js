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
      tokenContract: viewDeployedContract(d.tokenContract),
      crowdsaleContract: viewDeployedContract(d.crowdsaleContract),
      walletContract: viewDeployedContract(d.walletContract),
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
      summary: d.summary,
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
      onChainData: viewOnChainData(c.onChainData),
      offChainData: viewOffChainData(c.offChainData),
    };
  }
};

const viewPeriod = (p) => {
  if (!p) {
    return undefined;
  } else {
    return {
      openingTime: p.openingTime,
      closingTime: p.closingTime,
    };
  }
};

const viewLink = (l) => {
  if (!l) {
    return undefined;
  } else {
    return {
      type: l.type,
      url: l.url,
    };
  }
};

const viewTeam = (t) => {
  if (!t) {
    return undefined;
  } else {
    return {
      name: t.name,
      role: t.role,
      description: t.description,
      links: (t.links || []).map(viewLink),
    };
  }
};

const viewExternal = (c) => {
  if (!c) {
    return undefined;
  } else {
    return {
      name: c.name,
      symbol: c.symbol,
      summary: c.summary,
      description: c.description,
      companyURL: c.companyURL,
      whitePaperURL: c.whitePaperURL,
      coverImageURL: c.coverImageURL,
      preICO: viewPeriod(c.preICO),
      ico: viewPeriod(c.ico),
      links: (c.links || []).map(viewLink),
      location: c.link,
      team: (c.team || []).map(viewTeam),
    };
  }
};

export default (c) => {
  let out = {
    id: c._id,
    createdAt: Math.round(c.createdAt.getTime() / 1000),
    updatedAt: Math.round(c.updatedAt.getTime() / 1000),
  };

  if (c.hostedCampaign) {
    out.type = 'hostedCampaign';
    const h = viewHosted(c.hostedCampaign);
    for (let k in h) {
      out[k] = h[k];
    }
  } else if (c.externalCampaign) {
    out.type = 'externalCampaign';
    const h = viewExternal(c.externalCampaign);
    for (let k in h) {
      out[k] = h[k];
    }
  }
  return out;
};
