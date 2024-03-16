const io = require('socket.io-client');

class MyLibClient {
  constructor(url) {
    this.socket = io(url);
  }

  request(method, path, data) {
    return new Promise((resolve) => {
      this.socket.emit(`${method}:${path}`, data);
      this.socket.on(`${method}:${path}:response`, (response) => {
        resolve({ response });
      });
    });
  }

  get(path) {
    return this.request('get', path, {});
  }

  post(path, data) {
    return this.request('post', path, data);
  }

  put(path, data) {
    return this.request('put', path, data);
  }

  delete(path) {
    return this.request('delete', path, {});
  }
}

module.exports = MyLibClient;
