const MyLibClient = require('./client');

const MyLibClientInstance = new MyLibClient('http://localhost:3001');

MyLibClientInstance.post('/testParam/hazoom', 'sad').then(({ response }) => {
  console.log(response);
});

MyLibClientInstance.get('/testQuery?count=6&name=hamada').then(({ response }) => {
  console.log(response);
});
