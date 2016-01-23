
import gravatar from 'gravatar';

export default class Session {
  constructor(socket, server) {
    this.onClose = this.onClose.bind(this);
    this.onError = this.onError.bind(this);
    this.onHello = this.onHello.bind(this);
    this.onCreate = this.onCreate.bind(this);
    this.onTake = this.onTake.bind(this);
    this.onRelease = this.onRelease.bind(this);
    this.onUpdate = this.onUpdate.bind(this);

    let {address} = socket.handshake;

    this.name = `${address}`;
    this.avatar = null;
    this.email = null;
    this.server = server;
    this.socket = socket;

    this.socket.on('disconnect', this.onClose);
    this.socket.on('error', this.onError);
    this.socket.on('hello', this.onHello);
    this.socket.on('create', this.onCreate);
    this.socket.on('take', this.onTake);
    this.socket.on('release', this.onRelease);
    this.socket.on('update', this.onUpdate);

    console.log(this.name, '-', 'new connection');
  }
  onHello(data) {
    console.log(this.name, '-', 'authenticated as ', data.email);

    // send to the user the initial state
    let users = this.server.sessions
      .filter(session => !!session.email)
      .map(session => ({
        email: session.email,
        avatar: session.avatar
      }));

    this.socket.emit('load', {
      postIts: this.server.postIts,
      users: users
    });

    this.avatar = gravatar.url(data.email, {s: '100'});
    this.email = data.email;

    // then broadcast login
    this.server.io.sockets.emit('login', {
      email: data.email,
      avatar: this.avatar
    });
  }
  onCreate() {
    console.log(this.name, '-', 'create post it');
    let postIt = {
      id: this.server.nextId(),
      title: '',
      description: '',
      takenBy: this.email
    };

    this.server.postIts.push(postIt);

    this.server.io.sockets.emit('update', postIt);
  }
  onTake(data) {
    let postIt = this.server.getPostIt(data.id);

    if (postIt && !postIt.takenBy) {
      console.log(this.name, '-', 'take post it', postIt.id);
      postIt.takenBy = this.email;

      this.server.io.sockets.emit('take', {
        id: postIt.id,
        takenBy: this.email
      });
    } else if (!postIt) {
      console.error(this.name, '-', 'post id does not exists : ', postIt.id);
    }
  }
  onRelease(data) {
    let postIt = this.server.getPostIt(data.id);

    if (postIt && postIt.takenBy) {
      console.log(this.name, '-', 'release post it', postIt.id);
      postIt.takenBy = null;

      this.server.io.sockets.emit('release', {
        id: postIt.id
      });
    } else if (!postIt) {
      console.error(this.name, '-', 'post id does not exists : ', postIt.id);
    }
  }
  onUpdate(data) {
    let postIt = this.server.getPostIt(data.id);

    if (postIt && postIt.takenBy === this.email) {
      console.log(this.name, '-', 'update post it', postIt.id);
      postIt.title = data.title;
      postIt.description = data.description;

      this.server.io.sockets.emit('update', postIt);
    } else if (postIt && postIt.takenBy !== this.email) {
      console.error(this.name, '-', 'post it already taken by : ',
        postIt.takenBy);
    } else if (!postIt) {
      console.error(this.name, '-', 'post id does not exists : ', postIt.id);
    }
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
