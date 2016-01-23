
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
    this.onRemove = this.onRemove.bind(this);

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
    this.socket.on('remove', this.onRemove);

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

    this.avatar = gravatar.url(data.email, {s: '80'});
    this.email = data.email;

    // then broadcast login
    this.server.io.sockets.emit('login', {
      email: data.email,
      avatar: this.avatar
    });
  }
  onCreate(data) {
    console.log(this.name, '-', 'create post it', this.email);
    data = data || {};

    let postIt = {
      color: data.color || 'lightgrey',
      x: data.x || 0,
      y: data.y || 0,
      id: this.server.nextId(),
      title: 'New Post-It',
      description: 'Double click to edit',
      user: this.email
    };

    this.server.postIts.push(postIt);

    this.server.io.sockets.emit('update', postIt);
  }
  onRemove(data) {
    let postIt = this.server.getPostIt(data.id);

    if (postIt && (!postIt.user || postIt.user === this.email)) {
      console.log(this.name, '-', 'remove post it', postIt.id);

      let index = this.server.postIts.indexOf(postIt);
      this.server.postIts.splice(index, 1);

      this.server.io.sockets.emit('remove', postIt);
    } else if (!postIt) {
      console.error(this.name, '-', 'post id does not exists : ', postIt.id);
    }
  }
  onTake(data) {
    let postIt = this.server.getPostIt(data.id);

    if (postIt && !postIt.user) {
      console.log(this.name, '-', 'take post it', postIt.id);
      postIt.user = this.email;

      this.server.io.sockets.emit('take', postIt);
    } else if (!postIt) {
      console.error(this.name, '-', 'post id does not exists : ', postIt.id);
    }
  }
  onRelease(data) {
    let postIt = this.server.getPostIt(data.id);

    if (postIt && postIt.user) {
      console.log(this.name, '-', 'release post it', postIt.id);
      postIt.user = null;

      this.server.io.sockets.emit('release', postIt);
    } else if (!postIt) {
      console.error(this.name, '-', 'post id does not exists : ', postIt.id);
    }
  }
  onUpdate(data) {
    let postIt = this.server.getPostIt(data.id);

    if (postIt && postIt.user === this.email) {
      console.log(this.name, '-', 'update post it', postIt.id);
      postIt.title = data.title;
      postIt.description = data.description;

      this.server.io.sockets.emit('update', postIt);
    } else if (postIt && postIt.user !== this.email) {
      console.error(this.name, '-', 'post it already taken by : ',
        postIt.user);
    } else if (!postIt) {
      console.error(this.name, '-', 'post id does not exists : ', data.id);
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
    let postIt = this.server.getPostIt(this.email);

    if (postIt) {
      postIt.user = null;
    }

    let index = this.server.sessions.indexOf(this);

    if (index !== -1) {
      this.server.sessions.splice(index, 1);

      if (this.email) {
        this.server.io.sockets.emit('logout', {email: this.email});
      }
    }
  }
}
