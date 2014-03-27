var fs = require('fs');

function Scores() {
  this.data = [];
  this.filename = __dirname + '/data/scores.json';
}

Scores.prototype.save = function(options, cb) {
  this.loadFile(function(err) {
    if (err) return cb(err);

    options.createdAt = new Date();

    if (!this.data.length) {
      this.data.push(options);
    } else {
      for (var i = 0; i < this.data.length; i++) {
        if (options.score > this.data[i].score) {
          this.data.push(options);
          break;
        }
      }
    }

    this.saveFile(cb);
  }.bind(this));
};

Scores.prototype.findAll = Scores.prototype.loadFile = function(cb) {
  fs.readFile(this.filename, function(err, data) {
    if (err) return cb(err);
    this.data = JSON.parse(data);
    cb(null, this.data);
  }.bind(this));
};

Scores.prototype.sort = function() {
  this.data.sort(function(a, b) {
    return b.score - a.score;
  });
};

Scores.prototype.truncate = function() {
  this.data = this.data.slice(0, 10);
};

Scores.prototype.saveFile = function(cb) {
  this.sort();
  this.truncate();

  var data = JSON.stringify(this.data);
  fs.writeFile(this.filename, data, cb);
};

module.exports = Scores;
