# crowdsale-api

# TODO

1. ~~Basic framework (express + mongo)~~
2. ~~User account creation~~
3. ~~User login~~
4. Campaign
5. fix depricated warnings with mongo
6. add TLS to mongo
7. deploy

# Run develeopment set up

Start mongodb with docker

```bash
docker run --name crowdsale-mongo-dev -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=test -e MONGO_INITDB_ROOT_PASSWORD=test -d mongo:4.0.1
```

This can later be killed with
```bash
docker rm -f crowdsale-mongo-dev
```

Run the node server
```bash
npm install
PORT=8080 MONGO_URI=localhost:27017 MONGO_USER=test MONGO_PASSWORD=test npm run
```

Create a user
```bash
curl -XPOST localhost:8080/api/auth/register -H 'Content-Type: application/json' --data '{"username":"someuser", "password" : "somepassword"}'
```

Login
```bash
curl -XPOST localhost:8080/api/auth/login -H 'Content-Type: application/json' --data '{"username":"someuser", "password" : "somepassword"}'
```

With the token you get back, check status
```bash
curl -XPOST localhost:8080/api/auth/check -H 'x-access-token: ${TOKEN}'
```
