const picko = require('./client');
const PickoClient = new picko('http://localhost:3000', {
  authorization: '555',
});

PickoClient.get('/testuse').then(({ response }) => {
  console.log(response.json());
});
