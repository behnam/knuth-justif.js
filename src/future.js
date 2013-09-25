function Future() {
  this.callbacks = [];
}

Future.prototype.ready = function(callback) {
  if(this.value !== undefined) {
    setTimeout(function() {
      callback(this.value);
    }, 0);
  } else {
    this.callbacks.push(callback);
  }
};

Future.prototype.complete = function(value) {
  this.value = value;
  this.callbacks.forEach(function(cb) {
    cb(value);
  });
  delete this.callbacks;
};

module.exports = Future;
