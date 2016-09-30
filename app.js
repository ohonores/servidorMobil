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
/*app.use(session({ resave: true,
                  saveUninitialized: true,
                  secret: 'alien200525' }));*/
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.use(express.static(path.join(__dirname, 'public')));

//app.use(express.session({ secret: 'alien' }));
app.use('/recursos',express.static(path.join(__dirname, 'bower_components')));
app.use('/socket',express.static(path.join(__dirname, 'node_modules')));
app.use('/pnotify',express.static(path.join(__dirname, 'bower_components/pnotify/dist')));
app.use('/sincronizador',express.static(path.join(__dirname, 'sincronizador')));
app.use('/zipsSqls',express.static(path.join(__dirname, 'public/zipsSqls/')));

var client;
var redisStore;
//if(process.env.REDIS == 1){
    log.info("Entro a redis");
    /***********
    	CONFIGURACION DE REDIS, SI NO TIENE LA BASE DE REDIS POR FAVOR COMENTAR HASTA "FIN REDIS"
    *************/

    client = require("ioredis").createClient();
    redisStore = require('connect-redis')(session);
    client.on("error", function (err) {
        log.info("Error " + err);
    });
     client.on("connect", function () {
        log.info("Conectado ::",client.options.host, client.options.port,client.status);
         rutasPrivadas.client = client;
         rutasPublicas.client = client;
    });
    /*********FIN REDIS**************/
    app.use(session({
        secret: 'alien200525',
        store: new redisStore({ host: "localhost", port: 6379, prefix:'edi', client: client,ttl :360}),
        saveUninitialized: true,
        resave: false
    }));
/*}else{
    //app.use(express.session({ secret: 'alien' }));

}*/
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


app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,accept,x-requested-with,Authorization,x-access-token,autentificacion-ps');
    res.setHeader('Access-Control-Request-Headers', 'X-Requested-With,content-type, authorization, x-access-token,autentificacion-ps');
    if ('OPTIONS' == req.method) {
      res.send(200);
    }
    else {
      next();
    }

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
					//pfx: fs.readFileSync(__dirname+"/certificados/KEYSTORE.p12"),
					//passphrase: 'Alien20150521EQ',
					//securityOptions: 'SSLv2',
					//strictSSL: false, // allow us to use our self-signed cert for testing
					//rejectUnauthorized: false
					//rejectUnhauthorized : false
				};
//Mensaje de errores
var mesnajeLabels = require('./utils/mensajesLabels.js');

/****Cuando es local por favor se debe comentar*/
var oracledb = require('./conexiones-basededatos/conexion-oracle.js');
var mongodb = require('./conexiones-basededatos/conexion-mongodb.js');
//var sqllite = require('./conexiones-basededatos/conexion-sqllite.js');
var OracleMongo = require('./utils/OracleMongo.js');
var oracleMongo =  new OracleMongo(oracledb, mongodb);
var schedule = require('node-schedule');
//oracleMongo.crearTareas();
var rule2 = new schedule.RecurrenceRule();
rule2.dayOfWeek = [0,1,2,3,4,5,6]; //Corre todos los dias
rule2.hour = 05;//4 de la mañana
rule2.minute = 07;//Con 06 minutos
var urlSincronizarPerifil = "http://documentos.ecuaquimica.com.ec:8080/movil/sincronizacion/actualizar/perfil-sinc/:coleccion/:index";

console.log("app.get('port'",app.get('port'));
//if(app.get('port') == "8091"){ //
    console.log("entro...a scheduleJob");
    var cronOrdenes = schedule.scheduleJob('10 * * * * *', function(){
        if(app.dispositivosConectados  && app.empresas[0] && app.empresas[0].ruc && app.conexiones[app.empresas[0].ruc]){
            oracleMongo.revisarEstadosDeOrdenesEnviadasDesdeMovil(app.conexiones[app.empresas[0].ruc], app.dispositivosConectados);
        }

    });
    var cronCarteras = schedule.scheduleJob('10 * * * * *', function(){
        if(app.dispositivosConectados  && app.empresas[0] && app.empresas[0].ruc && app.conexiones[app.empresas[0].ruc]){
            oracleMongo.revisarEstadosDeCartertasEnviadasDesdeMovil(app.conexiones[app.empresas[0].ruc], app.dispositivosConectados);
        }

    });

    var sincronizarPerfilesConNuevosDatos = schedule.scheduleJob('10 * * * * *', function(){
        if(app.dispositivosConectados  && app.empresas[0] && app.empresas[0].ruc && app.conexiones[app.empresas[0].ruc]){
            oracleMongo.sincronizarPerfilesNuevosDatos(app.conexiones[app.empresas[0].ruc], app.dispositivosConectados);
            //sincronizar:perfiles

        }

    });

//}


if(process.env.GRUPO == "2"){
    var rule = new schedule.RecurrenceRule();
    rule.minute = 5;
     var crearBases = schedule.scheduleJob(rule, function(){
            oracleMongo.crearBackupsSqliteAutomatica({cron:"Automatico","mensaje":"Cada hora despues de 5 minutos"});

    });
   /* if(app.get('port') == "8091"){ //
        
        var crearBases = schedule.scheduleJob(rule, function(){
            oracleMongo.crearBackupsSqliteAutomatica({cron:"Automatico","mensaje":"Cada hora despues de 5 minutos"});

        });
    
    }*/
    var pingOracle = schedule.scheduleJob('*/30 * * * * *', function(){
        try{
            console.log(app.get('port'));
        }catch(error){
            console.log(error);
        }
        
         oracleMongo.pingOracle();
     });


    
}

/*var sincronizarPerfilesConNuevosDatosEnviarBackup = schedule.scheduleJob('5 * * * * *', function(){
    if(app.dispositivosConectados  && app.empresas[0] && app.empresas[0].ruc && app.conexiones[app.empresas[0].ruc]){
        oracleMongo.sincronizarPerfilesNuevosDatosEnvioBackup(app.conexiones[app.empresas[0].ruc], app.dispositivosConectados);
        //sincronizar:perfiles
       // client.del("sincronizarbackup:perfiles:estado");

    }

});
*/


setTimeout(function () {
  
    console.log(app.empresas);
    rutasPublicas.conexiones = app.conexiones;
},20000);
rutasPrivadas.log = log;
rutasPrivadas.oracleMongo = oracleMongo;

rutasPublicas.use('/movil/sincronizacion', rutasPrivadas);

app.use('/', rutasPublicas);
app.oracleMongo = oracleMongo;
//The 404 Route (ALWAYS Keep this as the last route)
app.get('/*', function(req, res, next){
      res.status(400);
     res.render("404/404.html", {title: '404: File Not Found'});
   
});





require('./utils/validarAmbientePorEmpresa.js');
module.exports = app;
