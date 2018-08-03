const jwt = require('jsonwebtoken')
const User = require('../../../models/user');

exports.register = (req, res) => {
    const { username, password } = req.body;
    let newUser = null;

    const createUser = (user) => {
        if(user) {
            throw new Error('username exists');
        } else {
            return User.create(username, password);
        }
    };

    const countUsers = (user) => {
        newUser = user;
        return User.count({}).exec();
    };

    const assignAdmin = (count) => {
        if(count === 1) {
            return newUser.assignAdmin();
        } else {
            return Promise.resolve(false);
        }
    };

    const respond = (isAdmin) => {
        res.json({
            message: 'registered successfully',
            admin: isAdmin ? true : false
        });
    };

    const onError = (error) => {
        res.status(409).json({
            message: error.message
        });
    };

    // check username duplication
    User.findOneByUsername(username)
    .then(createUser)
    .then(countUsers)
    .then(assignAdmin)
    .then(respond)
    .catch(onError);
};

exports.login = (req, res) => {
    const {username, password} = req.body;
    const privateKey = req.app.get('jwt-private-key');

    // check the user info & generate the jwt
    const check = (user) => {
        if(!user) {
            // user does not exist
            throw new Error('login failed');
        } else {
            // user exists, check the password
            if(user.verify(password)) {
                // create a promise that generates jwt asynchronously
                const p = new Promise((resolve, reject) => {
                    jwt.sign(
                        {
                            _id: user._id,
                            username: user.username,
                            admin: user.admin
                        }, 
                        privateKey, 
                        {
                            expiresIn: '1d',
                            issuer: 'velopert.com',
                            subject: 'userInfo'
                        }, (err, token) => {
                            if (err) reject(err)
                            resolve(token) 
                        })
                });
                return p;
            } else {
                throw new Error('login failed');
            }
        }
    };

    // respond the token 
    const respond = (token) => {
        res.json({
            message: 'logged in successfully',
            token
        });
    };

    // error occured
    const onError = (error) => {
        res.status(403).json({
            message: error.message
        });
    };

    // find the user
    User.findOneByUsername(username)
    .then(check)
    .then(respond)
    .catch(onError);
}

exports.check = (req, res) => {
    res.json({
        success: true,
        info: req.decoded
    })
}
