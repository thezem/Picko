const io = require('socket.io-client');

class PickoClient {
  constructor(url = 'http://localhost:3000', headers = {}, timeout = 300) {
    this.socket = io(url, {
      extraHeaders: headers,
      timeout: timeout,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 3,
    });

    this.useFetch = false;

    this.socket.on('message', (data) => console.log(`Received ${data}`));
    this.socket.on('connect', () => console.log('Connected'));
    this.socket.on('disconnect', () => console.log('Disconnected'));
    this.socket.on('401', (data, statusCode) =>
      console.log(`Unauthorized (${statusCode}): ${data}`)
    );

    this.socket.on('error', (error) => {
      console.log(`Socket error: ${error.message}`);
      this.useFetch = true;
    });

    this.timeout = timeout;
  }

  async request(method, path, data) {
    try {
      const response = await new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          reject(new Error('Request timed out'));
        }, this.timeout);

        this.socket.emit(method, path, data, (response) => {
          clearTimeout(timer);

          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve({
              text: () => JSON.stringify(response.data),
              json: () => response.data,
              response,
            });
          }
        });
      });

      return {
        text: () => response.text(),
        json: () => response.json(),
        response,
      };
    } catch (error) {
      console.error(error.message);

      if (!this.socket.connected) {
        console.log('Switching to fetch...');
        this.useFetch = true;
      }

      if (this.useFetch) {
        const response = await fetch(path, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (response.status >= 400) {
          throw new Error(await response.text());
        }

        return {
          text: () => response.text(),
          json: () => response.json(),
          response,
        };
      }

      throw error;
    }
  }

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

  disconnect() {
    this.socket.disconnect();
  }
}

module.exports = PickoClient;
