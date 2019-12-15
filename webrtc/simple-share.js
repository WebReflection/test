const SimpleShare = (function () {

  const {parse, stringify} = JSON;
  const {min, random} = Math;

  const BYTES_PER_CHUNK = 12000;

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
    receiveFile() {
      const {peer, connect} = ss.get(this);
      connect.then(() => {
        let buffer = [];
        let bytesReceived = 0;
        let fileSize = 0;
        this.on('data', function onData({action, data}) {
          switch (action) {
            case "data":
              const ui8 = new Uint8Array(data);
              bytesReceived += ui8.byteLength;
              buffer.push(ui8);
              peer.emit('receive:progress', bytesReceived / fileSize);
              break;
            case "start":
              fileSize = data.size;
              peer.emit('receive:start', data);
              break;
            case "end":
              const {name, type} = data;
              const blob = new Blob(buffer, {type});
              const href = URL.createObjectURL(blob);
              const anchor = document.createElement('a');
              anchor.href = href;
              anchor.download = name;
              anchor.textContent = 'DOWNLOAD';
              this.removeListener('data', onData);
              peer.emit('receive:end', data);
              this.send('completed');
              document.body.appendChild(anchor);
              anchor.onclick = () => {
                document.body.removeChild(anchor);
              };
              try {
                anchor.click();
              }
              catch(meh) {

              }
              // setTimeout(() => URL.revokeObjectURL(href), 5000);
              break;
          }
        });
      });
    }
    sendFile(file) {
      const {peer, connect} = ss.get(this);
      this.on('data', function onData(downloaded) {
        if (downloaded === 'completed')
          peer.emit('send:completed');
      });
      return connect.then(() => new Promise($ => {
        const {name, type, size} = file;
        this.send({action: "start", data: {name, type, size}});
        let currentChunk = 0;
        const fileReader = new FileReader();
        fileReader.onload = () => {
          const dv = new DataView(fileReader.result);
          const data = [];
          for (let i = 0, {byteLength} = dv; i < byteLength; i++)
            data.push(dv.getUint8(i));
          this.send({action: "data", data});
          currentChunk++;
          if(BYTES_PER_CHUNK * currentChunk < file.size)
            readNextChunk();
          else {
            this.send({action: "end", data: {name, type, size}});
            $(file);
          }
        };
        readNextChunk();
        function readNextChunk() {
          const start = BYTES_PER_CHUNK * currentChunk;
          const end = min(size, start + BYTES_PER_CHUNK);
          fileReader.readAsArrayBuffer(file.slice(start, end));
          peer.emit('send:progress', end / size);
        }
      }));
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
