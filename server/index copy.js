// Import the required libraries/modules
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

// Import the Router class
const Router = require('./router');

// Create a class called Picko
class Picko {
  constructor(options) {
    this.middlewares = []; // Initialize middleware stack
    // Initialize some properties
    this.app = express(); // Express instance
    this.server = http.createServer(this.app); // HTTP server instance
    this.io = new Server(this.server, {
      // Socket.io instance
      maxHttpBufferSize: 2e8, // Specify maximum allowed buffer size
      cors: options.cors, // Allow cross-origin resource sharing
    });
    this.routes = new Set(); // Mapping of routes to callbacks
    this.rejected = {}; // Initialize an empty object for rejected requests
    this.router = new Router(); // Create a new Router instance

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
      // console.log('a user connected');

      // Listen for disconnection events and log them when they happen
      socket.on('disconnect', () => {
        // console.log('user disconnected');
      });

      // Function that builds the response to send back to the client
      const buildResponse = (method, path, data, callback) => {
        // Check authorization before invoking the route's callback
        this.authFunction(socket.handshake.headers, (statusCode, authorized) => {
          if (statusCode) {
            return callback({ error: 'Unauthorized' }, statusCode);
          }
          if (!authorized) {
            return callback({ error: 'Forbidden' }, 403);
          }

          // Find the registered route that matches the incoming request path
          const routeMatch = this.router.find(path);
          if (!routeMatch) {
            return callback({ status: 404, error: 'Route not found' });
          }

          const { originalPath, params, query } = routeMatch;

          const routeCallback = Array.from(this.routes).find((route) => route.path === originalPath)?.callback;

          // If a route isn't found, return an error message
          if (!routeCallback) {
            return callback({ error: 'Route not found' });
          }

          // If the route is found, invoke the route's callback function with the params and query params
          routeCallback(
            { body: data, params, query, path },
            {
              send: (data) => {
                callback({ data });
              },
              error: (error) => {
                callback({ error: error.message });
              },
              end: (data) => {
                callback({ data });
              },
              json: (data) => {
                callback({ data });
              },
              status: (statusCode) => {
                callback({ statusCode });
              },
            }
          );
        });
      };
      // Array of supported HTTP methods
      const supportedMethods = ['GET', 'POST', 'PUT', 'DELETE'];
      // For each of the supported HTTP methods, set up a listener on the socket
      supportedMethods.forEach((method) => {
        socket.on(method, (path, data, callback) => buildResponse(method, path, data, callback));
      });
    });
  }

  use(path, middleware) {
    if (typeof path === 'function') {
      middleware = path;
      path = '*'; // Apply middleware to all routes if no specific path is provided
    }
    this.middlewares.push({ path, middleware });
    // do something
  }

  // Method to start listening on a given port
  listen(port, callback) {
    this.server.listen(port, callback);
  }

  // Method to execute middlewares
  executeMiddlewares(index, req, res, finalCallback) {
    if (index >= this.middlewares.length) {
      finalCallback(); // No more middlewares to execute
      return;
    }

    const middleware = this.middlewares[index];
    // Check if the middleware applies to the current path
    if (req.path.startsWith(middleware.path) || middleware.path === '*') {
      middleware.middleware(req, res, () => this.executeMiddlewares(index + 1, req, res, finalCallback));
    } else {
      this.executeMiddlewares(index + 1, req, res, finalCallback); // Skip this middleware
    }
  }

  // Method to add a new route with a given method and path
  addRoute(method, path, callback) {
    const routeKey = path.split('*')[0];
    this.routes.add({
      path: routeKey,
      callback: (req, res) => {
        // Execute middlewares before invoking the route callback
        this.executeMiddlewares(0, req, res, () => {
          try {
            callback(req, res);
          } catch (error) {
            console.error(`Error handling ${method} ${path}:`, error);
            res.send('Internal Server Error');
          }
        });
      },
    });
    // Add the route to the Express app with the specified method and path
    this.app[method.toLowerCase()](path, callback);

    // Add the route to the router
    this.router.add(path);
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
module.exports = Picko;
