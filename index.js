const Picko = require('./server');
const morgan = require('morgan');
const picko = new Picko(3001);

const router = new Picko.Router();

picko.use(morgan('dev'));

router.get('/user', (req, res) => {
  console.log(req.query);
  res.send({ message: 'User route' });
});

picko.use('/api', router);

picko.post('/testParam/:id', (req, res, next) => {
  res.send(req.body);
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

picko.use((req, res, next) => {
  res.send('not found');
  // console.log(Date.now());
});
