const io = require('socket.io-client');
const { v4: uuidv4 } = require('uuid'); // Importing UUID library to generate unique IDs

class MyLibClient {
  constructor(url) {
    this.socket = io(url);
  }

  request(method, path, data) {
    const requestId = uuidv4(); // Generate a unique ID for this request
    const event = `${method}:${path}`;
    const responseEvent = `${event}:response:${requestId}`;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.socket.off(responseEvent); // Unsubscribe from the event
        reject(new Error('Request timed out'));
      }, 5000); // 5 seconds timeout

      this.socket.emit(event, { body: data, _requestId: requestId });
      this.socket.on(responseEvent, (response) => {
        clearTimeout(timeout); // Clear the timeout as we received the response
        this.socket.off(responseEvent); // Unsubscribe from the event
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve({ response });
        }
      });
    });
  }

  get(path, query = {}) {
    return this.request('get', path, {}, query);
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
