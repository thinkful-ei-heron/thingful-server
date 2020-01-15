const AuthService = require('../auth/auth-service');

function requireAuth(req, res, next){
  const authToken = req.get('Authorization') || '';

  let basicToken;
  if (!authToken.toLowerCase().startsWith('basic ')) {
    return res.status(401).json({ error: 'Missing basic token' });
  } else {
    basicToken = authToken.slice('basic '.length, authToken.length);
  }

  const [tokenUserName, tokenPassword] = Buffer
    .from(basicToken, 'base64')
    .toString()
    .split(':');

  if (!tokenUserName || !tokenPassword) {
    return res.status(401).json({ error: 'Unauthorized request.' });
  }
  console.log('TokenUserName', tokenUserName);
  req.app.get('db')('thingful_users')
    .where({ user_name: tokenUserName })
    .first()
    .then(user => {
      if (!user) {
        console.log('got here', user);
        return res.status(401).json({ error: 'Unauthorized request' });
      }
      console.log('made it hereeeee');
      return AuthService.comparePasswords(tokenPassword, user.password)
        .then(passwordsMatch => {

          if(!passwordsMatch){
            console.log('Failing here');
            return res.status(401).json({ error: `Unauthorized request`});
          }
          req.user = user;
          next();
        });

    })
    .catch(next);
}

module.exports = { requireAuth };