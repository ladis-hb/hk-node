const serialport = require('serialport')
const Connection = require('./connection')

class SerialIo {
  /**
   * Get list of all available ports.
   * @returns {Promise} Resolves to array of port objects
   *                             https://github.com/EmergingTechnologyAdvisors/node-serialport#module_serialport--SerialPort.list
   */
  static ports () {
    return new Promise((resolve, reject) => {
      serialport.list((err, ports) => {
        if (err) {
          reject(new Error(err))
        } else {
          resolve(ports)
        }
      })
    })
  }

  /**
   * Send a single command to a port.
   * @return {Promise} Resolves to response.
   */
  static send (portName, content, opts) {
    let connection
    return new Connection(portName, opts)
      .then(conn => {
        connection = conn
        return connection.send(content, opts)
      })
      .then(response => {
        connection.close()
        return response
      })
  }
  /**
   * @return {Promise} Resolves to response.
   */
  static connect (portName, options) {
    return new Connection(portName, options)
  }
}

module.exports = SerialIo
