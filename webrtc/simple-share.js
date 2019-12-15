const SimpleShare = (function () {
  const {parse, stringify} = JSON;

  const ss = new WeakMap;
  
  let uniqueID = Date.now();
  
  class SimpleShare {
    constructor(options) {
      const initiator = !!(options && options.initiator);
      const peer = new SimplePeer(options);
      const connect = new Promise($ => { peer.on('connect', $); });
      const uid = (initiator ? '🎱' : '🕳').concat(uniqueID++, Math.random());
      peer.on('error', console.error);
      ss.set(this, {initiator, peer, connect, uid, listeners: new Map});
    }
    get isInitiator() { return ss.get(this).initiator; }
    send(data) {
      const {peer, connect, uid} = ss.get(this);
      connect.then(() => {
        peer.send(stringify({
          from: uid,
          value: data
        }));
      });
      return this;
    }
    signal(data) {
      const {peer} = ss.get(this);
      peer.signal(typeof data === "string" ? parse(data) : data);
      return this;
    }
    removeListener(type, listener) {
      const {peer, listeners} = ss.get(this);
      peer.removeListener(type, listeners.get(listener) || listener);
      return this;
    }
    on(type, listener) {
      const {peer, uid, listeners} = ss.get(this);
      if (type === "data") {
        const real = listener;
        listener = function (data) {
          const {from, value} = parse(data);
          if (from !== uid)
            real.call(this, value);
        };
        listeners.set(real, listener);
      }
      peer.on(type, listener.bind(this));
      return this;
    }
  }

  return SimpleShare;
}());
