const User = require('../../../models/user');

exports.get = (req, res) => {
  username = req.decoded.username

  const respond = (user) => {
    res.json({
        username: user.username,
	campaigns: user.campaigns
    });
  };

  const onError = (error) => {
    res.status(404).json({
      message: "no message"
    });
  };

  User.findOneByUsername(username)
    .then(respond)
    .catch(onError);
}
