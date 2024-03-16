const io = require('socket.io');
const http = require('http');
const url = require('url');

class MyLib {
  constructor(port) {
    this.routes = {};
    this.middlewares = [];
    this.httpServer = http.createServer(this.handleHttpRequest.bind(this));
    this.io = io(this.httpServer);

    this.io.on('connection', (socket) => {
      socket.onAny((event, data) => {
        this.handleSocketRequest(event, data, socket);
      });
    });

    this.httpServer.listen(port, () => console.log(`Server listening on port ${port}`));
  }

  handleHttpRequest(req, res) {
    const parsedUrl = url.parse(req.url, true);
    const routePath = parsedUrl.pathname;
    const method = req.method.toLowerCase();
    const { handlers, params } = this.findRouteHandlers(routePath, method);

    req.query = { ...parsedUrl.query };
    req.params = params;
    req.path = routePath;

    res.send = (response) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response));
    };

    const stack = this.getMiddlewareStack(routePath).concat(handlers);
    this.executeMiddleware(stack, req, res);
  }

  handleSocketRequest(event, data, socket) {
    const [method, path] = event.split(':');
    const parsedUrl = url.parse(path, true);
    const routePath = parsedUrl.pathname;
    const { handlers, params } = this.findRouteHandlers(routePath, method);

    const req = {
      body: data,
      query: { ...parsedUrl.query },
      params: params,
      path: routePath,
      socket: socket,
    };
    const res = {
      send: (response) => socket.emit(`${method}:${path}:response`, response),
    };

    const stack = this.getMiddlewareStack(routePath).concat(handlers);
    this.executeMiddleware(stack, req, res);
  }

  executeMiddleware(stack, req, res, index = 0) {
    const next = () => {
      this.executeMiddleware(stack, req, res, index + 1);
    };

    if (index < stack.length) {
      const middleware = stack[index];
      middleware(req, res, next);
    }
  }

  getMiddlewareStack(path) {
    let stack = this.middlewares.filter(({ route }) => route === '' || path.startsWith(route)).map(({ handler }) => handler);
    return stack;
  }

  findRouteHandlers(path, method) {
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
    if (typeof route === 'function') {
      handler = route;
      route = '';
    }
    this.middlewares.push({ route, handler });
  }

  register(method, path, handler) {
    if (!this.routes[path]) {
      this.routes[path] = {};
    }
    if (!this.routes[path][method]) {
      this.routes[path][method] = [];
    }
    this.routes[path][method].push(handler);
  }

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

module.exports = MyLib;
