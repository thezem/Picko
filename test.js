const picko = require('./client');
const PickoClient = new picko('http://localhost:3000', {
  authorization: '55',
});

PickoClient.get('/hello').then((data) => {
  console.log(data);
});

PickoClient.post('/sad', { 1: 5 }).then((data) => {
  console.log(data);
});

PickoClient.put('/sad', { 1: 5 }).then((data) => {
  console.log(data);
});
