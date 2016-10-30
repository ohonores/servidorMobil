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
app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('ejs').renderFile);
app.use(methodOverride());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/recursos',express.static(path.join(__dirname, 'bower_components')));
app.use('/socket',express.static(path.join(__dirname, 'node_modules')));
app.use('/pnotify',express.static(path.join(__dirname, 'bower_components/pnotify/dist')));
app.use('/sincronizador',express.static(path.join(__dirname, 'sincronizador')));
app.use('/zipsSqls',express.static(path.join(__dirname, 'public/zipsSqls/')));

var client;
var redisStore;
log.info("Entro a redis");
/***********
    CONFIGURACION DE REDIS
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
if (app.get('env') === 'production') {
    app.use(function(err, req, res, next) {
      log.info("production");
      res.status(err.status || 500);
      res.render('error', {
        message: err.message,
        error: {}
      });
    });
}
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

log.info("NODE_ENV: "+ process.env.NODE_ENV);
var oracledb = require('./conexiones-basededatos/conexion-oracle.js');
var mongodb = require('./conexiones-basededatos/conexion-mongodb.js');
var OracleMongo = require('./utils/OracleMongo.js');
var oracleMongo =  new OracleMongo(oracledb, mongodb);
var schedule = require('node-schedule');
var urlSincronizarPerifil = "http://documentos.ecuaquimica.com.ec:8080/movil/sincronizacion/actualizar/perfil-sinc/:coleccion/:index";
setTimeout(function(){
    console.log("puerto ",app.get('port'));
    if(app.get('port') == "8092"){ //
   
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
         var rule3 = new schedule.RecurrenceRule();
         rule3.dayOfWeek = [1,2,3,4,5]; //Corre todos los dias
         rule3.minute = 15;//Con 06 minutos
         var removerArchivosAreaTrabajo = schedule.scheduleJob(rule3, function(){
                oracleMongo.removerArchivosAreaTrabajo();

        });
  
}

},10000);

if(process.env.GRUPO == "2"){
    var rule = new schedule.RecurrenceRule();
    rule.minute = 5;
     var crearBases = schedule.scheduleJob(rule, function(){
            oracleMongo.crearBackupsSqliteAutomatica({cron:"Automatico","mensaje":"Cada hora despues de 5 minutos"});

    });
  
    var pingOracle = schedule.scheduleJob('*/15 * * * * *', function(){
       oracleMongo.pingOracle();
     });
    
    var rule3 = new schedule.RecurrenceRule();
    rule3.dayOfWeek = [1,2,3,4,5]; //Corre todos los dias
    rule3.minute = 15;//Con 15 minutos
    var removerArchivosAreaTrabajo = schedule.scheduleJob(rule3, function(){
        oracleMongo.removerArchivosAreaTrabajo();

    });

}





setTimeout(function () {
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
