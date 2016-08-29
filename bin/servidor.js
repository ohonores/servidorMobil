/**
 * Module dependencies.
 */
require('./variablesProduccion.js');
var app = require('../app');
//var debug = require('debug')('servidorFacturacionElectronica:server');

var http = require('http');

/**
 * Get port from environment and store in Express.
 */
 /****************************************
 	SERVICIOS CON EL SERVLET DE WS
 ****************************************/
var puertoPrincipal = {"development":{"1":{puerto:8080}},"production":{"1":{puerto:8080}}};  //8080;Conauto//8084;QUI; //80; Farmagro
var port = puertoPrincipal[process.env.NODE_ENV][process.env.GRUPO].puerto;
app.set('port', normalizePort(process.env.PORT || port ));
app.set('ipaddr', "0.0.0.0");

/**
* CREANDO EL SOCKET
*/
var empresas = [{ruc:"0990018707001"}, {ruc:"2"}];

//new sockectServidor(http, empresas);
/**
 * Create HTTP server.
 */

var server = http.createServer(app);

var SockectServidorIO = require('../routes/socket/sokectServerIo.js');
var sockectServidor =  new SockectServidorIO(server, empresas);
app.socket = sockectServidor.getSocket();
app.conexiones = sockectServidor.getConexiones();
app.empresas = empresas;
app.periflesConectados = sockectServidor.getPerfilesConectados();
app.dispositivosConectados = sockectServidor.getDispositivosConectados();
/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  //debug('Listening on ' + bind);
}
