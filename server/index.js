// Import the required libraries/modules
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

// Create a class called Picko
class Picko {
  constructor(options) {
    // Initialize some properties
    this.app = express(); // Express instance
    this.server = http.createServer(this.app); // HTTP server instance
    this.io = new Server(this.server, {
      // Socket.io instance
      maxHttpBufferSize: 2e8, // Specify maximum allowed buffer size
      cors: options.cors, // Allow cross-origin resource sharing
    });
    this.routes = {}; // Mapping of routes to callbacks
    this.rejected = {}; // Initialize an empty object for rejected requests

    // Set up middleware for request and response objects
    this.app.use(express.json()); // Parse request bodies as JSON
    this.app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies

    // If CORS is enabled, use it as middleware
    if (options.cors) {
      this.app.use(cors(options.cors));
    }
    // default authentication function
    this.authFunction = (headers, callback) => {
      callback(null, true);
    };
    // Set up event listener for incoming socket connections
    this.io.on('connection', (socket) => {
      // Log that a user has connected
      console.log('a user connected');

      // Listen for disconnection events and log them when they happen
      socket.on('disconnect', () => {
        console.log('user disconnected');
      });

      // Function that builds the response to send back to the client
      const buildResponse = (method, path, data, callback) => {
        // Check authorization before invoking the route's callback
        this.authFunction(
          socket.handshake.headers,
          (statusCode, authorized) => {
            if (statusCode) {
              return callback({ error: 'Unauthorized' }, statusCode);
            }
            if (!authorized) {
              return callback({ error: 'Forbidden' }, 403);
            }

            const routeKey = `${method}-${path}`;
            const routeCallback = this.routes[routeKey];

            // If a route isn't found, return an error message
            if (!routeCallback) {
              return callback({ error: 'Route not found' });
            }

            // If the route is found, invoke the route's callback function
            routeCallback(
              { body: data },
              {
                send: (data) => {
                  callback({ data });
                },
                error: (error) => {
                  callback({ error: error.message });
                },
              }
            );
          }
        );
      };
      // Array of supported HTTP methods
      const supportedMethods = ['GET', 'POST', 'PUT', 'DELETE'];
      // For each of the supported HTTP methods, set up a listener on the socket
      supportedMethods.forEach((method) => {
        socket.on(method, (path, data, callback) =>
          buildResponse(method, path, data, callback)
        );
      });
    });
  }
  // Method to start listening on a given port
  listen(port, callback) {
    this.server.listen(port, callback);
  }

  // Method to add a new route with a given method and path
  addRoute(method, path, callback) {
    const routeKey = `${method}-${path}`;
    this.routes[routeKey] = (req, res) => {
      try {
        callback(req, res);
      } catch (error) {
        console.error(`Error handling ${method} ${path}:`, error);
        res.status(500).send('Internal Server Error');
      }
    };
    // Add the route to the Express app with the specified method and path
    this.app[method.toLowerCase()](path, (req, res) => {
      this.routes[routeKey](req, res);
    });
  }
  // Method to add a new GET route
  get(path, callback) {
    this.addRoute('GET', path, callback);
  }
  // Method to add a new POST route
  post(path, callback) {
    this.addRoute('POST', path, callback);
  }
  // Method to add a new PUT route
  put(path, callback) {
    this.addRoute('PUT', path, callback);
  }
  // Method to add a new DELETE route
  delete(path, callback) {
    this.addRoute('DELETE', path, callback);
  }
  authenticate(authFunction) {
    this.authFunction = authFunction;
    this.app.use((req, res, next) => {
      this.authFunction(req.headers, (statusCode, authorized) => {
        if (statusCode) {
          return res.status(statusCode).send('Unauthorized');
        }
        if (!authorized) {
          return res.status(403).send('Forbidden');
        }
        next();
      });
    });
  }
}

// Export the Picko class
module.exports = Picko;
