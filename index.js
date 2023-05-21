const Picko = require('./server');
const picko = new Picko({
  auth: (req, reject, next) => {
    if (req.headers['x-auth'] !== '123') {
      reject();
    } else {
      next();
    }
  },
  maxHttpBufferSize: 2e8,
  port: 3000,
});

picko.get('/hello', (req, res) => {
  res.send('Hello World!');
});

picko.post('/sad', (req, res) => {
  res.send(req.body);
});
picko.listen(3000, () => {
  console.log('Server started on port 3000');
});
