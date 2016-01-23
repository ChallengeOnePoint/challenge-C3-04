
export default class Session {
  constructor(socket, server) {
    this.onClose = this.onClose.bind(this);
    this.onError = this.onError.bind(this);

    let {address} = socket.handshake;

    this.name = `${address}`;
    this.server = server;
    this.socket = socket;

    this.socket.on('disconnect', this.onClose);
    this.socket.on('error', this.onError);
    console.log(this.name, '-', 'new connection');
  }
  onClose() {
    console.log(this.name, '-', 'connection closed');
    this.dispose();
  }
  onError(err) {
    console.error(this.name, '-', 'connection error', err.message, err.stack);
    this.dispose();
  }
  dispose() {
    let index = this.server.sessions.indexOf(this);

    if (index !== -1) {
      this.server.sessions.splice(index, 1);
    }
  }
}
