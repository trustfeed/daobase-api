# crowdsale-api

## Sign In/Sign Up

Try to sign in;
```bash
curl -XGET ${HOST}/users?publicAddress=${addr}
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

## Public Campaign
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
