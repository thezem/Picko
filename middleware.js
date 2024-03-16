const Picko = require('./server');

const picko = new Picko({
  cors: {
    origin: '*',
  },
});
// Authentication for both Express and Socket.io
picko.authenticate((headers, callback) => {
  if (headers.authorization === '555') {
    callback(null, true); // Authorized
  } else {
    callback(401, false); // Unauthorized
  }
});

picko.use('/testuse', (req, res, next) => {
  res.send({ message: 'Middleware 2' });
});

module.exports = picko;
