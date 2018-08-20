# crowdsale-api

## Sign In/Sign Up

Try to sign in;
```bash
curl -XGET ${HOST}/nonce?publicAddress=${addr}
```
This returns 200 with the data `{ "nonce": "4213" }`. If the public address is not registered it returns a 404.

If the address is not found create the account;
```bash
curl -XPOST ${HOST}/users -h 'content-type: application/json' --data '{"publicAddress" : ${addr}}'
```
This returns 201 with the data `{ "nonce" : "4323523" }`.

Sign the nonce with metamask and post to auth;
```bash
curl -XPOST ${HOST}/auth -h 'content-type: application/json' --data '{ "publicAddress" : ${addr}, "signature" : ${sig} }'
```

This should return an access token.

## User Details

When logged in you can get the current user data from here
```bash
curl -H 'x-access-token: fdsa' -XGET ${HOST}/users
```

You can then update the name and email address with this;
```bash
curl -XPUT ${HOST}/users/${ID} -H 'x-access-token: fdsa' -H 'content-type: application/json' --data '{"name": "James", "email": "wetter.j@gmail.com" }'
```
The verification email will only be sent if the email address is different from the current account. Resend of verification will be forced via a different endpoint.

## Verify Email Address

After changing the email address associated with a public address a confirmation email can be sent to the new address. The email should contain a link to a landing page on the frontend which posts to the backend and displays the result of verification. The backend endpoint is

```bash
curl -XPOST ${HOST}/verify/email -H 'content-type: application/json' --data '{ "token" : "fdsafds" }'
```

The token will be provided as part of the emailed link. The token is valid for 24 hours.

## Admin Campaigns

These APIs are to create, modify and deploy campaigns on the platform. The user must be logged in. Include the JWT in the header as 'x-access-token'.

### Create a new campaign

```bash
curl -H 'x-access-token: fdsfdsad' -XPOST ${HOST}/admin/campaigns
```

On success it should return 201 and `{"campaign_id": "fdsaf"}`.

### View All Owned Campaigns
```bash
curl -H 'x-access-token: fdsafds' -XGET ${HOST}/admin/campaigns
```

On success it should return 200 and `{"campaigns": [CAMPAIGN_OBJECTS]}`.

### View One Campaign
```bash
curl -H 'x-access-token: fdsafds' -XGET ${HOST}/admin/campaigns/${ID}
```

### Update a Campaing
```bash
curl -H 'x-access-token: fdsaf' -XPUT ${HOST}/admin/campaigns/${ID} -H 'content-type: application/json' --data '{ "tokenSymbol" : "TFT" }'
```

Success should return 201. The fields that can be edited are

| Field | Type | Description |
| --- | --- | --- |
| tokenSymbol | String | The symbol to display on exchanges. Must be latin characters [A-Z] (?). |
| tokenName | String | The long name of the token. Must be latin characters and spaces (?). |
| numberOfDecimals | Number | Must be an integer between 0 and 18. |
| startingTime | Number | Unix timestamp to start the campaign. Must be at least 24 hours in the future. |
| duration | Number | The number of days the campaign will run. Must be greater than 1. |
| softCap | Number | The minimum to be raised. Must be greater than 0. |
| hardCap | Number | The maximum that can be raised. Must be greater than the softCap. |

### Upload an image for a Campaign
```bash
curl -H 'x-access-token: fdsaf' -XPOST ${HOST}/admin/campaigns/${ID}/image
```

On success you should get 201 and `{"url" : "https://tokenadmin.work.s3/fdsafd" }`

### Upload a whitepaper for a Campaign
```bash
curl -H 'x-access-token: fdsaf' -XPOST ${HOST}/admin/campaigns/${ID}/whitepaper
```

On success you should get 201 and `{"url" : "https://tokenadmin.work.s3/fdsafd" }`

### Submit for Review
Once the campaign data has been prepared it may be submitted for review by a system admin.

```bash
curl -H 'x-access-token: fds' -XPOST ${HOST}/admin/campaigns/${CAMPAIGN_ID}/submit-for-review
```

For now the user can force the review to be finalised.
```bash
curl -H 'x-access-token: fds' -XPOST ${HOST}/admin/campaigns/${CAMPAIGN_ID}/review-passed
```

### Deploying a Campaign

Once the review stage is passed the server can prepare a transaction that deploys both token and crowdsale.

```bash
curl -H 'x-access-token: fdsaf' -XGET ${HOST}/admin/campaigns/${ID}/deploy
```

This will return a transaction that needs to be sent to the Ethereum network via metamask. The user has to make sure the network is set to the same network as TrustFeed server.

The returned data will be like this;
```javascript
{
  transaction: "0x54AE23...",
  estimatedGas: 20000
}
```

It can be sent to the Ethereum network with something like this;
```javascript
web3.eth.sendTransaction(
  {
    from: '0XTHE_PUBLIC_ADDRESS_OF_USER',
    data: '0XTHE_TRANSACTION_FROM_ABOVE'
  }
).then(r => {
  if (r.status) {
    postTransactionAddress(r.blockNumber, r.transactionIndex);
  } else {
    // error!
  }
}).catch(//error!);
```

The address of the transaction should then be posted back to the server;
```bash
curl -H 'x-access-token: fdsaf' -XPOST ${HOST}/admin/campaigns/${ID}/deploy -XPOST -H 'content-type: application/json' --data '{"blockNumber": 500, "transactionIndex": 4}'
```

## Public Campaign
Soon this will only contain active campaigns, not drafts or complete campaigns. For now it shows everything.

View all public campaigns with;
```bash
curl -H 'x-access-token: fdsa' ${HOST}/campaigns
```

It should return up to 20 campaigns and an offset to use to get the next page if more results are available.
```bash
curl -H 'x-access-token: fdsa' ${HOST}/campaigns?offset=fdsadfa
```

View one campaign with
```bash
curl -H 'x-access-token: fdsa' ${HOST}/campaigns/${CAMPAIGN_ID}
```

## Voting

A user can upvote or downvote ongoing campaigns. In order to vote the following conditions must be met;

1. The user is logged in.
2. The user has a verified email address.
3. The email address has not been used to vote for the campaign before.
4. The campaign is not owned by an account with the same email address.

```bash
CURL -XPOST -H 'x-access-token: fdsa' -H 'content-type: application/json' --data '{"up": false}' ${HOST}/campaign/${CAMPAIGN_ID}/vote
```

A vote can also be retracted.
```bash
CURL -XPOST -H 'x-access-token: fdsa' ${HOST}/campaign/${CAMPAIGN_ID}/retract-vote
```

The status of a users vote for a campaign can be checked.
```bash
CURL -H 'x-access-token: fdsa' ${HOST}/campaign/${CAMPAIGN_ID}/vote
```

To get the vote counts for a campaign
```bash
CURL -XGET -H 'x-access-token: fdsa' ${HOST}/campaign/${CAMPAIGN_ID}/votes
```

# Split the campaign APIs

The smart contract and off-chain data will be seperated. As this data needs to be able to refer to the same object it will be implemented as inner objects in mongoose.

## Creating a new campaign

Post to `admin/campaigns/` to create an empty campaign.

## Smart Contract Data

Just the stuff that will go onto the blockchain. This can be edited during the 'draft' stage, but cannot be changed once the contract is deployed. For example;

```json
{
  "network": "rinkeby",
  "tokenName": "Some amazing token",
  "tokenSymbol": "AZT",
  "numberOfDecimals": 18,
  "startingTime": 1232142,
  "duration": 20,
  "rate": 1,
  "softCap": 10,
  "hardCap": 100
}
```

## Off-chain Data

The off-chain data is stored in a different object. This can be edited after the draft stage, but the changes must be reviewed by an admin. Example of data;

```json
{
  "imageUrl": "fdsfad.s3",
  "whitePaperUrl": "fdsfad.s3",
  "description": "This crowdsale is amazing",
  "keywords": ["amazing", "crowdsale"]
}
```

## Putting it all Together

The complete object will be something like this;

```json
{
  "status": "DRAFT",
  "createdAt": 1232141,
  "updatedAt": 1332141,
  "onChainData": {},
  "offChainData": {},
  "tokenContract": {
    "address": "0xFD43..."
    "abi": {}
  }
  "crowdsaleContract": {
    "address": "0xFD43..."
    "abi": {}
  }
}
```

## APIs

### Create a new one

```bash
curl -XPOST -H 'x-access-token: fdsa' ${HOST}/admin/campaigns
```

### Update the On-Chain Data

```bash
curl -XPOST -H 'x-access-token: fdsa' ${HOST}/admin/campaigns/${ID}/on-chain -XPUT -H 'content-type: application/json' --data {}
```

### Update the Off-Chain Data

```bash
curl -XPOST -H 'x-access-token: fdsa' ${HOST}/admin/campaigns/${ID}/off-chain -XPUT -H 'content-type: application/json' --data {}
```

