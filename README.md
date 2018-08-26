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

The response will include a field type which will be one of; `SUCCESS`, `INVALID_TOKEN`, `EXPIRED_TOKEN` or `VERIFIED_TOKEN`.

## Admin Campaigns

These APIs are to create, modify and deploy campaigns on the platform. The user must be logged in. Include the JWT in the header as 'x-access-token'.

The possible status for a campaign are as follows.

| Status | Description |
| --- | --- |
| DRAFT | Created via post, updated via puts. |
| PENDING_REVIEW | Submitted for review. |
| REVIEWED | Passed review. |
| DEPLOYED | Live on the network. |

The general flow is as follows.

Campaigns are created by the user in status DRAFT, once draft is finalised they are submitted by the user for an admin to review, resulting in status PENDING_REVIEW. The admin can move the campaing to REVIEWED status, or if it fails the review place it back in DRAFT status. The user can deploy a campaign that is in REVIEWED status.

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

### Update a Campaigns On-Chain Data
```bash
curl -H 'x-access-token: fdsaf' -XPUT ${HOST}/admin/campaigns/${ID}/on-chain-data -H 'content-type: application/json' --data '{ "tokenSymbol" : "TFT" }'
```

Success should return 201. The fields that can be edited are

| Field | Type | Description |
| --- | --- | --- |
| tokenSymbol | String | The symbol to display on exchanges. Must be latin characters [A-Z] (?). |
| tokenName | String | The long name of the token. Must be latin characters and spaces (?). |
| numberOfDecimals | Number | Must be an integer between 0 and 18. |
| startingTime | Number | Unix timestamp (seconds) to start the campaign. Must be at least 24 hours in the future. |
| duration | Number | The number of days the campaign will run. Must be greater than 1. |
| softCap | String | The minimum to be raised. Must be greater than 0. The unit is wei, must be an integer. |
| hardCap | String | The maximum that can be raised. Must be greater than the softCap. The unit is wei, must be an integer. |
| rate | String | The price of the token. The tokens recieved from a purchase will be Wei * rate * 10^-decimals. This must be an integer. |
| network | String | The name of the network. Only rinkeby is supported now. |

### Update a Campaigns Off-Chain Data
```bash
curl -H 'x-access-token: fdsaf' -XPUT ${HOST}/admin/campaigns/${ID}/off-chain-data -H 'content-type: application/json' --data '{ "description" : "My amazing crowdsale" }'
```

Success should return 201. The fields that can be edited are

| Field | Type | Description |
| --- | --- | --- |
| coverImageURL | String | The url for the cover image. |
| whitePaperURL | String | The url for the white paper. |
| description | String | A short description of the campaign. |
| keywords | [String] | A list of keywords for the campaign. |

### Upload an Cover Image for a Campaign
```bash
curl -H 'x-access-token: fdsaf' -XPOST ${HOST}/admin/campaigns/${ID}/cover-image -H 'content-type: application/json' --data '{"extension": "png", "contentType": "image/png" }'
```

The extension and contentType is optional. Defaults to jpg and image/jpeg.

On success you should get 201 and `{"uploadURL" : "https://tokenadmin.work.s3/fdsafd", "viewURL": "fdsa" }`

### Upload a White Paper for a Campaign
```bash
curl -H 'x-access-token: fdsaf' -XPOST ${HOST}/admin/campaigns/${ID}/white-paper -H 'content-type: application/json' --data '{"extension": "pdf", "contentType": "application/pdf" }'
```

The extension and contentType is optional. Defaults to pdf and application/pdf.

On success you should get 201 and `{"uploadURL" : "https://tokenadmin.work.s3/fdsafd", "viewURL": "fdsa" }`

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
curl -H 'x-access-token: fdsaf' -XGET ${HOST}/admin/campaigns/${ID}/deployment-transaction
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
curl -H 'x-access-token: fdsaf' -XPOST ${HOST}/admin/campaigns/${ID}/finalise-deployment -XPOST -H 'content-type: application/json' --data '{"blockNumber": 500, "transactionIndex": 4}'
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

