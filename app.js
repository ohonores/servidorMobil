var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var rutasPrivadas = require('./routes/privadas/serviciosprivados');
var rutasPublicas = require('./routes/publicas/serviciospublicos.js');

var Promise = require('promise');
var fs = require('fs');
var StringDecoder = require('string_decoder').StringDecoder;
var request = require("request");
var methodOverride = require('method-override');
var session  = require('express-session');

/**************
Logger
********************/
var bunyan = require('bunyan');
var log = bunyan.createLogger({
    name: 'ediwebpage',
    serializers: {
      req: bunyan.stdSerializers.req,
      res: bunyan.stdSerializers.res
    }
});


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));

//app.set('view engine', 'jade');
app.engine('html', require('ejs').renderFile);

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
//app.use(logger('dev'));
//app.use(favicon(__dirname + '/public/favicon.ico'));
//pp.use(logger('dev'));
app.use(methodOverride());
app.use(session({ resave: true,
                  saveUninitialized: true,
                  secret: 'alien200525' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.use(express.static(path.join(__dirname, 'public')));

//app.use(express.session({ secret: 'alien' }));
app.use('/recursos',express.static(path.join(__dirname, 'bower_components')));
var client;
var redisStore;
if(process.env.REDIS == 1){
    log.info("Entro a redis");
    /***********
    	CONFIGURACION DE REDIS, SI NO TIENE LA BASE DE REDIS POR FAVOR COMENTAR HASTA "FIN REDIS"
    *************/

    client = require("redis").createClient(6379,process.env.NODE_ENV==="development"?"192.168.1.6":"localhost");
    redisStore = require('connect-redis')(session);
    client.on("error", function (err) {
        log.info("Error " + err);
    });
    /*********FIN REDIS**************/
    app.use(session({
        secret: 'alien200525',
        store: new redisStore({ host: process.env.NODE_ENV==="development"?"192.168.1.6":"localhost", port: 6379,prefix:'edi', client: client,ttl :120}),
        saveUninitialized: true,
        resave: false
    }));
}else{
    //app.use(express.session({ secret: 'alien' }));

}
/*
app.use(passport.initialize());
app.use(passport.session());
*/


// development error handler
// will print stacktrace
if (app.get('env') === 'development') {

  app.use(function(err, req, res, next) {
    log.info("development");
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  log.info("production");
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


// now `readFile` will return a promise rather than expecting a callback
log.info("NODE_ENV: "+ process.env.NODE_ENV);




/*
  ESPECIFICAMOS EL CERTIFICADO P12 PARA QUE PUEDA CONTARTSE CON EL WEBSERVICE
*/
var agentOptions_= {

					//cert: fs.readFileSync("C:/restful-nodeEdi-v01/certificados/client.cer"),
					//key: fs.readFileSync("C:/restful-nodeEdi-v01/certificados/client.keystore"),
					// Or use `pfx` property replacing `cert` and `key` when using private key, certificate and CA certs in PFX or PKCS12 format:
					pfx: fs.readFileSync(__dirname+"/certificados/KEYSTORE.p12"),
					passphrase: 'Alien20150521EQ',
					securityOptions: 'SSLv2',
					strictSSL: false, // allow us to use our self-signed cert for testing
					rejectUnauthorized: false
					//rejectUnhauthorized : false
				};
//Mensaje de errores
var mesnajeLabels = require('./utils/mensajesLabels.js');

/****Cuando es local por favor se debe comentar*/
var oracledb = require('./conexiones-basededatos/conexion-oracle.js');
var mongodb = require('./conexiones-basededatos/conexion-mongodb.js');
var OracleMongo = require('./utils/OracleMongo.js');
var oracleMongo =  new OracleMongo(oracledb, mongodb);


rutasPrivadas.log = log;
rutasPrivadas.oracleMongo = oracleMongo;
rutasPublicas.use('/ver', rutasPrivadas);
app.use('/', rutasPublicas);

//The 404 Route (ALWAYS Keep this as the last route)
app.get('/*', function(req, res, next){
   res.render("404/404.html");
});

module.exports = app;
