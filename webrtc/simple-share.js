const SimpleShare = (function () {

  const {parse, stringify} = JSON;
  const {min, random} = Math;
  const {fromCharCode} = String;

  const BYTES_PER_CHUNK = 1200;

  const ss = new WeakMap;
  
  let uniqueID = Date.now();
  
  class SimpleShare {
    constructor(options) {
      const initiator = !!(options && options.initiator);
      const peer = new SimplePeer(options);
      const connect = new Promise($ => { peer.on('connect', $); });
      const uid = (initiator ? '🎱' : '🕳').concat(uniqueID++, random());
      peer.on('error', console.error);
      ss.set(this, {initiator, peer, connect, uid, listeners: new Map});
    }
    get isInitiator() { return ss.get(this).initiator; }
    sendFile(file) {
      return new Promise($ => {
        const {name, type, size} = file;
        p.send({action: "init", data: {name, type, size}});
        let currentChunk = 0;
        const fileReader = new FileReader();
        fileReader.onload = () => {
          const dv = new DataView(fileReader.result);
          const data = [];
          for (let i = 0, {byteLength} = dv; i < byteLength; i++)
            data.push(dv.getUint8(i));
          p.send({action: "data", data});
          currentChunk++;
          if(BYTES_PER_CHUNK * currentChunk < file.size)
            readNextChunk();
          else {
            p.send({action: "end", data: {name, type, size}});
            $(file);
          }
        };
        readNextChunk();
        function readNextChunk() {
          const start = BYTES_PER_CHUNK * currentChunk;
          const end = min(size, start + BYTES_PER_CHUNK);
          fileReader.readAsArrayBuffer(file.slice(start, end));
        }
      });
    }
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
