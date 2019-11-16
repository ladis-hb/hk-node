const Serialport = require("serialport");

class Connection {
  constructor(portName, options) {
    this.options = options || {};
    this.options.autoOpen = true;
    this.state = Connection.states().INIT;
    this.port = null;
    return new Promise((resolve, reject) => {
      this.port = new Serialport(portName, options, err => {
        if (err) {
          console.log(1);

          this.state = Connection.states().ERROR;
          reject(new Error(err));
        } else {
          this.state = Connection.states().OPEN;
          resolve(this);
        }
      });
      this.port.on("error", () => {
        console.log(2);
        this.state = Connection.states().ERROR;
      });
      this.port.on("close", () => {
        this.state = Connection.states().CLOSED;
      });
    });
  }

  close() {
    return new Promise((resolve, reject) => {
      if (this && this.port) {
        this.port.close(err => {
          if (err) {
            console.log(3);
            this.state = Connection.states().ERROR;
            reject(new Error(err));
          } else {
            this.state = Connection.states().CLOSED;
            resolve(this);
          }
        });
      } else {
        reject(Error("not initialized yet"));
      }
    });
  }

  send(content, opts) {
    if (this.state !== Connection.states().OPEN) {
      return Promise.reject(new Error("instance not in state OPEN"));
    } /*  else if (typeof content !== 'string') {
      return Promise.reject(new Error('first argument must be a string'))
    } */
    opts = Object.assign(this.options || {}, opts || {}) || {};
    const terminator = opts.terminator || "";
    const timeoutInit = opts.timeoutInit || 100;
    const timeoutRolling = opts.timeoutRolling || 10;

    this.state = Connection.states().INUSE;
    let chunks = "";
    let timer;

    return new Promise((resolve, reject) => {
      switch (typeof content) {
        case "String": //232
          this.port.on("data", data => {
            console.log(data);

            if (timer) {
              clearTimeout(timer);
              timer = null;
            }
            chunks = chunks.concat(data);
            if (terminator) {
              if (chunks.includes(terminator)) {
                this.state = Connection.states().OPEN;
                this.port.removeAllListeners();
                resolve(chunks);
              }
            }
            timer = setTimeout(() => {
              resolve(chunks);
            }, timeoutRolling);
          });
          break;
        default:
          let bfArray = [];
          let i = 0;
          let end = 0;
          this.port.on("data", data => {
            i += data.length;
            bfArray.push(data);
            if (end == 0 && i > 2)
              end =
                Buffer.concat(bfArray, i)
                  .slice(2, 3)
                  .readUInt8() + 5;
            if (i == end) {
              this.state = Connection.states().OPEN;
              this.port.removeAllListeners();
              resolve(Buffer.concat(bfArray, i));
            }
          });
          break;
          break;
      }

      this.port.write(content, err => {
        if (err) {
          reject(new Error(err));
        }
        timer = setTimeout(() => {
          resolve(chunks);
        }, timeoutInit);
      });
    });
  }

  getState() {
    return this.state;
  }

  static states() {
    return {
      INIT: "INIT",
      ERROR: "ERROR",
      OPEN: "OPEN",
      CLOSED: "CLOSED",
      INUSE: "IN_USE"
    };
  }
}

module.exports = Connection;
