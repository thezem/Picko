const picko = require('./client');
const PickoClient = new picko('http://localhost:3000', {
  authorization: '555',
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

PickoClient.post('/users', {
  name: 'John Doe',
  email: 'johndoe@example.com',
}).then((data) => {
  console.log(data);
});
