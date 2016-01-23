
export default class Session {
  constructor(socket, server) {
    this.onClose = this.onClose.bind(this);
    this.onError = this.onError.bind(this);
    this.onHello = this.onHello.bind(this);
    this.onCreate = this.onCreate.bind(this);

    let {address} = socket.handshake;

    this.name = `${address}`;
    this.email = null;
    this.server = server;
    this.socket = socket;

    this.socket.on('disconnect', this.onClose);
    this.socket.on('error', this.onError);
    this.socket.on('hello', this.onHello);
    this.socket.on('create', this.onCreate);

    console.log(this.name, '-', 'new connection');
  }
  onHello(data) {
    console.log(this.name, '-', 'authenticated as ', data.email);

    // send to the user the initial state
    let users = this.server.sessions
      .filter(session => !!session.email)
      .map(session => {email: session.email});

    this.socket.emit('load', {
      postIts: this.server.postIts,
      users: users
    });

    this.email = data.email;

    // then broadcast login
    this.server.io.sockets.emit('login', {email: data.email});
  }
  onCreate() {
    let postIt = {
      id: this.server.nextId(),
      title: '',
      description: '',
      takenBy: this.email
    };

    this.server.postIts.push(postIt);

    this.server.io.sockets.emit('update', postIt);
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

      if (this.email) {
        this.server.io.sockets.emit('logout', {email: this.email});
      }
    }
  }
}
