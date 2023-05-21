// client/index.js
// Importing socket.io-client module
const io = require('socket.io-client');

// Class for PickoClient
class PickoClient {
  // Constructor for PickoClient class, takes url, headers, and timeout as optional parameters
  constructor(url = 'http://localhost:3000', headers = {}, timeout = 10000) {
    // Creating a socket instance with given url and headers
    this.socket = io(url, {
      extraHeaders: headers,
    });

    // Listening for message event from server and logging the data
    this.socket.on('message', (data) => {
      console.log(`Received ${data}`);
    });
    // Listening for connect event from server and logging it
    this.socket.on('connect', () => {
      console.log('Connected');
    });
    // Listening for disconnect event from server and logging it
    this.socket.on('disconnect', () => {
      console.log('Disconnected');
    });
    // Listening for 401 event from server and logging the data
    this.socket.on('401', (data, statusCode) => {
      console.log(`Unauthorized (${statusCode}): ${data}`);
    });
    // Setting timeout property
    this.timeout = timeout;
  }

  // Method for making a request to server
  async request(method, path, data) {
    // Returning a promise that resolves or rejects based on server response
    return new Promise((resolve, reject) => {
      // Setting a timer for the request
      const timer = setTimeout(() => {
        reject(new Error('Request timed out'));
      }, this.timeout);

      // Emitting the request to server with method, path, and data
      this.socket.emit(method, path, data, (response) => {
        // Clearing the timer
        clearTimeout(timer);
        // Checking for error in server response and rejecting the promise if there's one
        if (response.error) {
          reject(new Error(response.error));
        } else {
          // Resolving the promise if there's no error in server response
          resolve(response.data);
        }
      });
    });
  }

  // Methods for GET, POST, PUT, and DELETE requests
  async get(path) {
    return this.request('GET', path);
  }

  async post(path, data) {
    return this.request('POST', path, data);
  }

  async put(path, data) {
    return this.request('PUT', path, data);
  }

  async delete(path, data) {
    return this.request('DELETE', path, data);
  }

  // Method for disconnecting from server
  disconnect() {
    this.socket.disconnect();
  }
}

// Exporting PickoClient class
module.exports = PickoClient;
