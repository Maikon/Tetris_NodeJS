module.exports = {
  requiresUser: function(req, res, next) {
    if (req.session && req.session.user) {
      next();
    } else {
      res.redirect('/session/new');
    }
  }
};
