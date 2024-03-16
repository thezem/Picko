const io = require('socket.io'); // Include the socket.io library for WebSocket connections
const http = require('http'); // Include the http module to create HTTP server
const url = require('url'); // Include the url module for URL resolution and parsing

class Router {
  constructor() {
    this.routes = {};
    this.middlewares = [];
    this.indexHolder = 0;
  }

  use(path, handler) {
    if (typeof path === 'function') {
      handler = path;
      path = '';
    }
    this.middlewares.push({ route: path, handler, index: this.indexHolder++ });
  }

  register(method, path, handler) {
    if (!this.routes[path]) {
      this.routes[path] = {};
    }
    if (!this.routes[path][method]) {
      this.routes[path][method] = [];
    }
    this.routes[path][method].push({ handler, index: this.indexHolder++ });
  }
  // Helper methods to register route handlers for specific HTTP methods
  post(path, handler) {
    this.register('post', path, handler);
  }

  put(path, handler) {
    this.register('put', path, handler);
  }

  get(path, handler) {
    this.register('get', path, handler);
  }

  delete(path, handler) {
    this.register('delete', path, handler);
  }
}

class MyLib {
  constructor(port) {
    this.routes = {}; // Object to store route handlers
    this.middlewares = []; // Array to store middleware functions
    this.httpServer = http.createServer(this.handleHttpRequest.bind(this)); // Create an HTTP server and bind request handler
    this.io = io(this.httpServer); // Initialize a new instance of socket.io by passing the HTTP server object

    this.indexHolder = 0;
    // Listen for new socket connections
    this.io.on('connection', (socket) => {
      // Handle any incoming socket events
      socket.onAny((event, data) => {
        this.handleSocketRequest(event, data, socket);
      });
    });

    // Start the HTTP server on the specified port
    this.httpServer.listen(port, () => console.log(`Server listening on port ${port}`));
  }

  handleHttpRequest(req, res) {
    const parsedUrl = url.parse(req.url, true); // Parse the request URL
    const routePath = parsedUrl.pathname; // Extract the pathname as the route path
    const method = req.method.toLowerCase(); // Get the request method and convert it to lowercase
    const { handlers, params } = this.findRouteHandlers(routePath, method); // Find the handlers and parameters for the route

    // Attach query, params, and path properties to the request object
    req.query = { ...parsedUrl.query };
    req.params = params;
    req.path = routePath;

    // Define a send method on the response object for sending JSON responses
    res.send = (response) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response));
    };

    // Get the middleware stack for the current route and execute it along with the route handlers
    const stack = this.getMiddlewareStack(routePath).concat(handlers);
    this.executeMiddleware(stack, req, res);
  }

  handleSocketRequest(event, data, socket) {
    // Split the event string to extract the method and path
    const [method, path] = event.split(':');
    const parsedUrl = url.parse(path, true);
    const routePath = parsedUrl.pathname;
    const { handlers, params } = this.findRouteHandlers(routePath, method);

    // Create request and response objects for the socket event
    const req = {
      body: data,
      query: { ...parsedUrl.query },
      params: params,
      path: routePath,
      socket: socket,
      method: method,
      originalUrl: path,
    };

    const res = {
      listeners: {},
      on: (event, listener) => {
        res.listeners[event] = listener;
      },
      send: (response) => {
        socket.emit(`${method}:${path}:response`, response);
        if (res.listeners['finish']) res.listeners['finish']();
        if (res.listeners['end']) res.listeners['end']();
      },
      removeListener: (event, listener) => {
        delete res.listeners[event];
      },
    };

    // Execute middleware and handlers for the socket request
    const stack = this.getMiddlewareStack(routePath).concat(handlers);
    const stackSorted = stack.sort((a, b) => a.index - b.index).map(({ handler }) => handler);

    this.executeMiddleware(stackSorted, req, res);
  }

  executeMiddleware(stack, req, res, index = 0) {
    // Recursive function to execute each middleware in the stack
    const next = () => {
      this.executeMiddleware(stack, req, res, index + 1);
    };

    // If there are more middlewares in the stack, execute the next one
    if (index < stack.length) {
      const middleware = stack[index];
      middleware(req, res, next);
    }
  }

  getMiddlewareStack(path) {
    // Filter and return middleware that applies to the current route
    let stack = this.middlewares
      .filter(({ route }) => route === '' || path.startsWith(route))
      .map(({ handler, index }) => {
        return { handler, index };
      });
    return stack;
  }

  findRouteHandlers(path, method) {
    // Find route handlers that match the given path and method
    let params = {};
    let handlers = [];
    for (const route in this.routes) {
      const routePattern = new RegExp('^' + route.replace(/:\w+/g, '(\\w+)') + '$');
      if (routePattern.test(path)) {
        const match = path.match(routePattern);
        const keys = route.match(/:\w+/g);

        if (keys) {
          params = keys.reduce((acc, key, index) => {
            acc[key.slice(1)] = match[index + 1];
            return acc;
          }, {});
        }

        handlers = this.routes[route][method] || [];
        break;
      }
    }

    return { handlers, params };
  }

  use(route, handler) {
    if (handler instanceof Router) {
      // Mount the router: iterate over the router's routes and middlewares
      for (const path in handler.routes) {
        for (const method in handler.routes[path]) {
          handler.routes[path][method].forEach((routeHandler) => {
            this.register(method, route + path, routeHandler.handler);
          });
        }
      }

      handler.middlewares.forEach((middleware) => {
        this.middlewares.push({
          route: route + middleware.route,
          handler: middleware.handler,
          index: middleware.index,
        });
      });
    } else {
      // Add a new middleware function to the stack
      if (typeof route === 'function') {
        handler = route;
        route = '';
      }
      this.middlewares.push({ route, handler, index: this.indexHolder++ });
    }
  }

  register(method, path, handler) {
    // Register a new route handler for a specific method and path
    if (!this.routes[path]) {
      this.routes[path] = {};
    }
    if (!this.routes[path][method]) {
      this.routes[path][method] = [];
    }
    this.routes[path][method].push({ handler, index: this.indexHolder++ });
  }

  // Helper methods to register route handlers for specific HTTP methods
  post(path, handler) {
    this.register('post', path, handler);
  }

  put(path, handler) {
    this.register('put', path, handler);
  }

  get(path, handler) {
    this.register('get', path, handler);
  }

  delete(path, handler) {
    this.register('delete', path, handler);
  }
}

module.exports = MyLib; // Export the class for use in other modules
module.exports.Router = Router;
