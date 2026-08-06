import { Platform } from 'react-native';
import { EventEmitter } from 'events';

const SOCKET_URL = 'wss://example.com/conductor-socket';

class SocketService extends EventEmitter {
  constructor() {
    super();
    this.socket = null;
    this.connected = false;
  }

  connect() {
    if (this.connected) return;

    this.socket = new WebSocket(SOCKET_URL);

    this.socket.onopen = () => {
      this.connected = true;
      this.emit('connected');
    };

    this.socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        this.emit('message', payload);
      } catch (error) {
        console.warn('Socket parse error:', error);
      }
    };

    this.socket.onclose = () => {
      this.connected = false;
      this.emit('disconnected');
      setTimeout(() => this.connect(), 3000);
    };

    this.socket.onerror = (error) => {
      console.warn('Socket error:', error);
      this.socket.close();
    };
  }

  subscribe(topic, callback) {
    this.on(topic, callback);
  }

  unsubscribe(topic, callback) {
    this.removeListener(topic, callback);
  }

  send(event, data) {
    if (!this.connected) return;
    this.socket.send(JSON.stringify({ event, data }));
  }
}

export default new SocketService();
