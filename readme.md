# Picko: A Hybrid HTTP Server

Picko is a powerful hybrid HTTP server that utilizes the best of both worlds with its combination of Express and Socket.IO. This package provides a seamless way to handle HTTP requests, making it a perfect tool for developers looking to create a flexible and really fast server.

## Features

- Built on the tried-and-true Express framework and Socket.IO libraries
- Provides flexible routing options for GET, POST, and other HTTP methods
- Offers real-time communication and event-driven architecture with Socket.IO
- Simple and easy-to-use API for HTTP request handling
- A middle layer for authentication and authorization
- A client for communicating with the server via Socket.IO

## Getting Started

To get started with Picko, first, install the package with the following command:

```
npm install picko
```

Once installed, you can initialize the server by creating a new instance of the `Picko` class and passing in any options you desire. Then, you can listen on a port of your choosing using the `listen()` method.

```javascript
const Picko = require('picko/server');

// simple server
const picko = new Picko();

// Authentication for both Express and Socket.io
picko.authenticate((headers, callback) => {
  if (headers.authorization === '555') {
    callback(null, true); // Authorized
  } else {
    callback(401, false); // Unauthorized
  }
});

// Define your routes
picko.get('/', (req, res) => {
  res.send('Hello, world!');
});

// Start listening on port 3000
picko.listen(3000, () => {
  console.log('Server started on port 3000');
});
```

You can also create a client instance of Picko using the `PickoClient` class to communicate with the server via Socket.IO. The `PickoClient` class allows you to send GET and POST requests to the server and receive responses.

```javascript
const PickoClient = require('picko/client');
const client = new PickoClient();

// Send a GET request to the server
const data = await client.get('/api/data');

// Send a POST request to the server
const res = await client.post('/users', {
  name: 'John Doe',
  email: 'johndoe@example.com',
});
```

## Why?

I really do like the simplicity of Express, but I also like the real-time communication that Socket.IO provides. I wanted to create a server that could handle both HTTP requests and real-time communication, so I decided to combine the two. I also wanted to create a server that was easy to use and had a simple API, so I created _Picko_.

### No websocket support on the client side?

No problem! Picko will automatically fall back to HTTP polling if the client does not support WebSockets.

### You don't wanna use the client?

No problem! Picko is built on top of Express, so you can use it just like you would any other Express server.

- You can easily write your server in Express-like Api
- And use a fetch-like client to communicate with the server
- isn't that cool?

## How it Works

Picko builds upon the Express framework, offering a familiar API for defining routes and handling HTTP requests. It also utilizes the Socket.IO library to enable real-time communication with clients via WebSockets.

The Picko class sets up an instance of the Express app and a Socket.IO server. Calling the listen() method starts the server, allowing it to listen for incoming requests.

Routes are defined using the get() and post() methods on the Picko instance, similar to Express. Route handlers are provided as callback functions that execute when a request is received.

To communicate with the server via Socket.IO, use the PickoClient class. It supports sending GET and POST requests to the server and receiving responses through callback functions.

## Todo

- [ ] Add support for Dynamic Routes in socket.io
- [ ] Add support for Express-like middlewares

###### !NO HASSL3

###### @antiihope
