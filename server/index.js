const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

class Picko {
  constructor(options) {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = new Server(this.server, {
      maxHttpBufferSize: 2e8, // 200MB
    });
    this.routes = {};
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use((req, res, next) => {
      if (options.auth) {
        if (options.auth(req, res)) {
          next();
        } else {
          res.status(401).send('Unauthorized');
        }
      } else {
        next();
      }
    });
    this.io.on('connection', (socket) => {
      console.log('a user connected');
      socket.on('disconnect', () => {
        console.log('user disconnected');
      });
      socket.on('GET', (path, callback) => {
        if (this.routes[path]) {
          const req = { query: {} };
          const res = {
            send: (data) => {
              callback(data);
            },
          };
          this.routes[path](req, res);
        }
      });
      socket.on('POST', (path, data, callback) => {
        if (this.routes[path]) {
          const req = { body: data };
          const res = {
            send: (data) => {
              callback(data);
            },
          };
          this.routes[path](req, res);
        }
      });
    });
  }

  listen(port, callback) {
    this.server.listen(port, callback);
  }

  get(path, callback) {
    this.app.get(path, (req, res) => {
      callback(req, res);
    });
    this.routes[path] = callback;
  }

  post(path, callback) {
    this.app.post(path, (req, res) => {
      callback(req, res);
    });
    this.routes[path] = callback;
  }

  // Implement other HTTP methods similar to how GET and POST are implemented.
}

module.exports = Picko;
