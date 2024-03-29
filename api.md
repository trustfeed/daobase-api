FORMAT: 1A
HOST: http://api-staging.daobaase.io/v1

# daobase-api

## Nonce [/nonce]

### Get Nonce of ETH Public Address [GET]
response nonce of eth public address. if the public address is not registered, it return a 404

+ Parameters
	+ publicAddress (string) 

+ Response 200 (application/json)
		{
			"nonce" : "4213"
		}

+ Example

```bash
curl -XGET ${HOST}/nonce?publicAddress=${addr}
```

## Users [/users]

### Sign Up [POST]
+ Request (application/json)
	{
		"publicAddress": "${addr}"
	}

	+ SignIn

	{
		"publicAddress": "${addr}",
		"signature": "${sig}"
	}
		
+ Response 201 (application/json)

	{
		"nonce" : "4323523"
	}

+ Example

```bash
curl -XPOST ${HOST}/users -h 'content-type: application/json' --data '{"publicAddress" : ${addr}}'
```

## User Details [/users/:id]

### Get User Details [GET]
When logged in you can get the current user data from here

+ Headers 
	+ x-access-token: ${x-access-token} 

+ Response 200 (application/json)

	{
	}

+ Example

```bash
curl -H 'x-access-token: fdsa' -XGET ${HOST}/users
```

### Update User Details [PATCH]
You can then update the name and email address with this.
The verification email will only be sent if the email address is different from the current account. Resend of verification will be forced via a different endpoint.

+ Headers 
	+ x-access-token: ${x-access-token} 

+ Request (application/json)
	
	{
	
	}

+ Response 200 (application/json)

	{
	}

+ Example

```bash
curl -XPATCH ${HOST}/users/${ID} -H 'x-access-token: fdsa' -H 'content-type: application/json' --data '{"name": "James", "email": "wetter.j@gmail.com" }'
```


## AUTH [/auth]
### Authentication(Sign in)[POST]
Sign the nonce with metamask and post to auth;
+ Request (application/json)

	{
		"publicAddress": "${addr}",
		"signature": "${sig}"
	}


+ Response 200 (application/json)

	{
		"":""
	}

+ Example

```bash
curl -XPOST ${HOST}/auth -h 'content-type: application/json' --data '{ "publicAddress" : ${addr}, "signature" : ${sig} }'
```

## Verify Email Address

After changing the email address associated with a public address a confirmation email can be sent to the new address. The email should contain a link to a landing page on the frontend which posts to the backend and displays the result of verification. The backend endpoint is

```bash
curl -XPOST ${HOST}/verify/email -H 'content-type: application/json' --data '{ "token" : "fdsafds" }'
```

The token will be provided as part of the emailed link. The token is valid for 24 hours.

The response will include a field type which will be one of; `SUCCESS`, `INVALID_TOKEN`, `EXPIRED_TOKEN` or `VERIFIED_TOKEN`.

## Admin Hosted Campaigns

### Create a new campaign

```bash
curl -H 'x-access-token: fdsfdsad' -XPOST ${HOST}/admin/hosted-campaigns
```

On success it should return 201 and `{"campaign_id": "fdsaf"}`.

### View All Owned Campaigns

```bash
curl -H 'x-access-token: fdsafds' -XGET ${HOST}/admin/hosted-campaigns
```

On success it should return 200 and `{"campaigns": [CAMPAIGN_OBJECTS]}`.

### View One Campaign

```bash
curl -H 'x-access-token: fdsafds' -XGET ${HOST}/admin/hosted-campaigns/${ID}
```

### Update a Campaigns On-Chain Data

```bash
curl -H 'x-access-token: fdsaf' -XPUT ${HOST}/admin/hosted-campaigns/${ID}/on-chain-data -H 'content-type: application/json' --data '{ "tokenSymbol" : "TFT" }'
```

Success should return 201. The fields that can be edited are

| Field            | Type   | Description                                                                                                                                             |
| ---------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| tokenSymbol      | String | The symbol to display on exchanges. Must be latin characters [A-Z](?).                                                                                  |
| tokenName        | String | The long name of the token. Must be latin characters and spaces (?).                                                                                    |
| isMinted         | Bool   | If false the hard cap is allocated as intial supply and transfered for purchase. If true the intial supply is 0, the token is minted for each purchase. |
| numberOfDecimals | Number | Must be an integer between 0 and 18.                                                                                                                    |
| startingTime     | Number | Unix timestamp (seconds) to start the campaign. Must be at least 24 hours in the future.                                                                |
| duration         | Number | The number of days the campaign will run. Must be greater than 1.                                                                                       |
| softCap          | String | The minimum to be raised. Must be greater than 0. The unit is wei, must be an integer.                                                                  |
| hardCap          | String | The maximum that can be raised. Must be greater than the softCap. The unit is wei, must be an integer.                                                  |
| rate             | String | The price of the token. The tokens recieved from a purchase will be Wei _ rate _ 10^-decimals. This must be an integer.                                 |
| network          | String | The name of the network. Only rinkeby is supported now.                                                                                                 |

### Update a Campaigns Off-Chain Data

```bash
curl -H 'x-access-token: fdsaf' -XPUT ${HOST}/admin/hosted-campaigns/${ID}/off-chain-data -H 'content-type: application/json' --data '{ "description" : "My amazing crowdsale" }'
```

Success should return 201. The fields that can be edited are

| Field         | Type     | Description                          |
| ------------- | -------- | ------------------------------------ |
| coverImageURL | String   | The url for the cover image.         |
| whitePaperURL | String   | The url for the white paper.         |
| description   | String   | A short description of the campaign. |
| keywords      | [String] | A list of keywords for the campaign. |

### Upload an Cover Image for a Campaign

```bash
curl -H 'x-access-token: fdsaf' -XPOST ${HOST}/admin/hosted-campaigns/${ID}/cover-image -H 'content-type: application/json' --data '{"extension": "png", "contentType": "image/png" }'
```

The extension and contentType is optional. Defaults to jpg and image/jpeg.

On success you should get 201 and `{"uploadURL" : "https://daobase.s3/fdsafd", "viewURL": "fdsa" }`

### Upload a White Paper for a Campaign

```bash
curl -H 'x-access-token: fdsaf' -XPOST ${HOST}/admin/hosted-campaigns/${ID}/white-paper -H 'content-type: application/json' --data '{"extension": "pdf", "contentType": "application/pdf" }'
```

The extension and contentType is optional. Defaults to pdf and application/pdf.

On success you should get 201 and `{"uploadURL" : "https://daobase.s3/fdsafd", "viewURL": "fdsa" }`

### Submit for Review

Once the campaign data has been prepared it may be submitted for review by a system admin.

```bash
curl -H 'x-access-token: fds' -XPOST ${HOST}/admin/hosted-campaigns/${CAMPAIGN_ID}/submit-for-review
```

For now the user can force the review to be finalised.

```bash
curl -H 'x-access-token: fds' -XPOST ${HOST}/admin/hosted-campaigns/${CAMPAIGN_ID}/review-passed
```

### Cancel a Submitted Review

Once a campaign is pending review or reviewed it can be returned to the draft status with cancel.

```bash
curl -H 'x-access-token: fds' -XPOST ${HOST}/admin/hosted-campaigns/${CAMPAIGN_ID}/cancel-review
```

### Deploying a Campaign

Once the review stage is passed the server can prepare a transaction that deploys both token and crowdsale.

```bash
curl -H 'x-access-token: fdsaf' -XPOST ${HOST}/admin/hosted-campaigns/${ID}/deployment-transaction
```

This will return a transaction that needs to be sent to the Ethereum network via metamask. The user has to make sure the network is set to the same network as TrustFeed server.

The returned data will be like this;

```javascript
{
  transaction: "0x54AE23...",
}
```

It can be sent to the Ethereum network with something like this;

```javascript
web3.eth.sendTransaction(
  {
    from: '0XTHE_PUBLIC_ADDRESS_OF_USER',
    data: '0XTHE_TRANSACTION_FROM_ABOVE'
  }
)
```

### Finalise a Campaign

The campaign must be past soft cap and the closing time must be in the past.

First the proposer should request finalisation;
```bash
curl -H 'x-access-token: fdsaf' -XPOST ${HOST}/admin/hosted-campaigns/${ID}/finalise
```

This returns the byte code that will submit the transaction to the multisig wallet. Send it to the address of the multisig wallet to intialise the finalisation process. Once this transaction has been seen by the event watcher a trustfeed admin must confirm the transaction and then execute the transaction.

Next trustfeed must confirm the transaction. From backoffice get the bytecode to confirm and execute the transaction with.
```bash
curl -H 'x-access-token: fdsaf' -XPOST ${HOST}/trustfeed/finalise-campaign
```
This bytecode must be sent to the TrustFeed wallet. Once the event is seen by the event watcher the campaign status will be updated accordingly.

## Admin for External Campaigns

Users can create new external campaigns;

```bash
curl -H 'x-access-token: fdsaf' -XPOST ${HOST}/admin/external-campaigns -H 'content-type: application/json' --data '{ "name" : "some campaign" }'
```

| Field         | Type     | Description                          |
| ------------- | -------- | ------------------------------------ |
| name          | String   | The name of the campaign.            |
| symbol        | String   | The token symbol.                    |
| description   | String   | A short description of the ICO.      |
| companyURL    | String   | The URL to the main site of the company. |
| whitePaperURL | String   | A URL to the white paper.            |
| coverImageURL | String   | A URL for the image to use as a cover image. |
| preICO        | Duration | The openingTime and closingTime in unix time. |
| ico           | Duration | The openingTime and closingTime in unix time. |
| links         | [Link]   | The type and url of any additional links. |
| location      | String   | The country in which the company is based. |
| team          | [Member] | A list of the team members (this needs to be improved - members shared between ICOs). |

Users can update external campaigns;

```bash
curl -H 'x-access-token: fdsaf' -XPOST ${HOST}/admin/external-campaigns/${ID} -H 'content-type: application/json' --data '{ "name" : "some campaign" }'
```

The data packet is the same as POST.

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

## Investments

The current token investments of an account can be viewed with this;

```bash
curl -H 'x-access-token: fdsadf' '${HOST}/investments?order=symbol&offset=FDSAD'
```

Order can be; `symbol` (default), `name` or `owned`. If there is more than 20 tokens the response will include `nextOffset` which can be passed to the query to fetch the next page of tokens.

This should include all ERC20 tokens purchased after account creation. For hosted campaigns it will included all tokens (even those purchased before account creation).

## KYC

To verify our customers (ICO proposer) we will use KYC. The client should upload an image of a passport and an photo of the users face, then request KYC. The KYC should first be reviewed by TrustFeed, then forwarded to onfido. For MVP it will just be verified after 5 minutes.

Get the URLs to upload;
```bash
curl -XPOST ${HOST}/kyc/passport-image
curl -XPOST ${HOST}/kyc/facial-image
```

Submit the KYC request
```bash
curl -XPOST ${HOST}/kyc -H 'content-type: application/json' --data '{ "passportImageUrl": "some-url", "facialImageURL": "some-other-url" }'
```

The user information (fetched at `/users`) will contain a field kycStatus which may be `PENDING`, `VERIFIED` or `FAILED`.

## Alternative Payment

Request a transaction to be created for the given campaign, token amount and currency.

```bash
curl -XPOST ${HOST}/campaigns/${ID}/alternative-payment -H 'content-type: application/json' --data '{ "currency": "BTC", "tokensToPurchase": "2343252" }'
```

Supported currencies; `BTC`, `LTC`. The `tokensToPurchase` should be a string representing an integer in the tokens decimals - like wei.

The returned packed should include;

| Field          | Type     | Description                          |
| -------------- | -------- | ------------------------------------ |
| amount         | String   | The amount the payer must transfer in their chosen currency. |
| transactionId  | String   | The id as generated by coin payments. |
| address        | String   | The address into which funds should be transferred. |
| confirmsNeeded | String | The number of confirmations required before transfer is made. |
| timeout        | Number | The number of seconds for which the transfer can be made. |
| statusURL      | String | Check the status via coin payments. |
| qrCodeURL      | String | Generate a QR code (via coin payments). |
| currency       | String | The currency to make the payment in. |
| tokenTransferFee | String | The estimated gas cost to perform transfer (in wei). This is already included in the amount. |

# TrustFeed Admin APIs

These APIs are only availalbe when logged in with `TRUSTFEED_ADDRESS`. They allow the TrustFeed to accept new campaigns, pre-validate KYC to then be forwarded to an external service, and to sign multisig operations such as finalise campaign.

## Campaings to review

Get a list of campaigns that need to be reviewed;

```
bash -XGET -H 'x-access-token: fdsa' ${HOST}/trustfeed/campaigns-pending-review
```

## Campaings Review

To post the status of a reviewed campaign;

A passed review;

```
bash -XPOST -H 'x-access-token: fdsa' ${HOST}/trustfeed/campaign-review -H 'content-type: application/json' --data '{ "campaignID": "fdsaf", "isValid": true }'
```

A failed review;

```
bash -XPOST -H 'x-access-token: fdsa' ${HOST}/trustfeed/campaign-review -H 'content-type: application/json' --data '{ "campaignID": "fdsaf", "isValid": false, "note" : "Some explination of failure" }'
```

## KYC Applications to review

Get a list of KYC applications that need to be reviewed;

```
bash -XGET -H 'x-access-token: fdsa' ${HOST}/trustfeed/kycs-pending-review
```

## KYC Review

To post the status of a reviewed KYC;

A passed review;
```
bash -XPOST -H 'x-access-token: fdsa' ${HOST}/trustfeed/kyc-review-H 'content-type: application/json' --data '{ "kycID": "fdsaf", "isValid": true }'
```

This should just forward to application to some third party. For now this is the only validation that is done.

A failed review;
```
bash -XPOST -H 'x-access-token: fdsa' ${HOST}/trustfeed/kyc-review -H 'content-type: application/json' --data '{ "kycID": "fdsaf", "isValid": false, "note" : "Some explination of failure" }'
```