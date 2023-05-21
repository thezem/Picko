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

picko.get('/hello', (req, res) => {
  res.send('Hello World!');
});

picko.post('/sad', (req, res) => {
  res.send(req.body);
});

picko.put('/sad', (req, res) => {
  res.send({ 1: 9 });
});
picko.listen(3000, () => {
  console.log('Server started on port 3000');
});

picko.post('/users', (req, res) => {
  console.log(req.body);
  res.send(req.body);
});
