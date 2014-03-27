module.exports = {
  new: function(req, res, next) {
    res.render('session/new');
  },

  create: function(req, res, next) {
    // Sign in
    req.session.user = { name: req.body.name };
    res.redirect('/board');
  },

  delete: function(req, res, next) {
  }
};
