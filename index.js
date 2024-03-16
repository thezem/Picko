const Picko = require('./server');
const morgan = require('morgan');
const picko = new Picko(3001);

picko.use('/testQuery', (req, res, next) => {
  console.log('iam a specific middleware');
  next();
});

picko.get('/testParam/:id', (req, res) => {
  res.send(req.params);
});

picko.get('/testQuery', (req, res) => {
  res.send(req.query);
});

picko.get('/hello', (req, res) => {
  res.send('Hello World!');
});

picko.post('/sad', (req, res) => {
  res.send(req.body);
});

picko.put('/test', (req, res) => {
  res.send({ 1: 9 });
});

picko.get('/users/:id/:state', (req, res) => {
  const { id, state } = req.params;
  // Do something with the user ID, like query a database
  res.send(`User ${id} ${state} found!`);
});
