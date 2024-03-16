const picko = require('./client');
const PickoClient = new picko('http://localhost:3001', {
  authorization: '555',
});

PickoClient.get('/testuse?count=0').then(({ response }) => {
  console.log(response.text());
});

const MyLibClient = new Mylib('http://localhost:3001', {});

MyLibClient.get('/testuse?count=0').then(({ response }) => {
  console.log(response.text());
});
