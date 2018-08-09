# crowdsale-api

## Sign In/Sign Up

Try to sign in;
```bash
curl -XGET ${HOST}/users?publicAddress=${addr}
```

If the address is not found create the account;
```bash
curl -XPOST ${HOST}/users -h 'content-type: application/json' --data '{"publicAddress" : ${addr}}'
```

You will get a nonce to sign (if things are successful). Sign it and post to auth;
```bash
curl -XPOST ${HOST}/auth -h 'content-type: application/json' --data '{ "publicAddress" : ${addr}, "signature" : ${sig} }'
```

This should return an access token.
