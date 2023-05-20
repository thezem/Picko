const io = require('socket.io-client');
class PickoClient {
  constructor(url) {
    this.socket = io(url || 'http://localhost:3000');

    this.socket.on('message', (data) => {
      console.log(`Received ${data}`);
    });
  }

  async get(path) {
    return new Promise((resolve, reject) => {
      this.socket.emit('GET', path, (data) => {
        resolve(data);
      });
      setTimeout(() => {
        reject('Request timed out');
      }, 10000);
    });
  }

  async post(path, data) {
    return new Promise((resolve, reject) => {
      this.socket.emit('POST', path, data, (data) => {
        resolve(data);
      });
      setTimeout(() => {
        reject('Request timed out');
      }, 10000);
    });
  }

  // Implement other HTTP methods similar to how GET and POST are implemented.
}

module.exports = PickoClient;
