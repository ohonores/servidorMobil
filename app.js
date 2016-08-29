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



var cronOrdenes = schedule.scheduleJob('10 * * * * *', function(){
    if(app.dispositivosConectados  && app.empresas[0] && app.empresas[0].ruc && app.conexiones[app.empresas[0].ruc]){
        oracleMongo.revisarEstadosDeOrdenesEnviadasDesdeMovil(app.conexiones[app.empresas[0].ruc], app.dispositivosConectados);
    }
    
});

var sincronizarPerfilesConNuevosDatos = schedule.scheduleJob('10 * * * * *', function(){
    if(app.dispositivosConectados  && app.empresas[0] && app.empresas[0].ruc && app.conexiones[app.empresas[0].ruc]){
        oracleMongo.sincronizarPerfilesNuevosDatos(app.conexiones[app.empresas[0].ruc], app.dispositivosConectados);
        //sincronizar:perfiles
       
    }

});
/*var sincronizarPerfilesConNuevosDatosEnviarBackup = schedule.scheduleJob('5 * * * * *', function(){
    if(app.dispositivosConectados  && app.empresas[0] && app.empresas[0].ruc && app.conexiones[app.empresas[0].ruc]){
        oracleMongo.sincronizarPerfilesNuevosDatosEnvioBackup(app.conexiones[app.empresas[0].ruc], app.dispositivosConectados);
        //sincronizar:perfiles
       // client.del("sincronizarbackup:perfiles:estado");

    }

});
*/


var j = schedule.scheduleJob('59 * * * * *', function(){
        if(Array.isArray(app.periflesConectados) && app.periflesConectados.length>0){
            
        
        oracleMongo.getTodosLosCambiosPorSincronizarPorPerfil(app.periflesConectados,  urlSincronizarPerifil).then(function(resultados){
           // app.empresas.forEach(function(empresa){
            var empresa = app.empresas[0];
                resultados.forEach(function(resultado){
                    if(resultado.urls.NOPERFIL){
                       app.periflesConectados.forEach(function(perfil){
                           resultado.urls[perfil] = resultado.urls.NOPERFIL;
                       });
                       delete resultado.urls.NOPERFIL;
                      
                    }
                    for(perfil in resultado.urls){
                        console.log("PERFIL **************** ",perfil);
                        try{
                            var nuevoResultado = JSON.parse(JSON.stringify(resultado));
                            nuevoResultado.urls = resultado.urls[perfil];
                            delete nuevoResultado.perfiles;
                           //app.conexiones[empresa.ruc].to(perfil).emit('sincronizar',{token:oracleMongo.getTokens()[perfil],sincronizacion:[nuevoResultado]});
                            
                            oracleMongo.getTotalRegistrosPorPerfil(perfil, nuevoResultado).then(function(resultadoValidacioes){
                                if(Array.isArray(resultadoValidacioes.datos)){
                                    var validarSincronizacion =[];
                                    try{
                                        validarSincronizacion = resultadoValidacioes.datos.map(function(script){
                                            var map = {};
                                            for(var key in script){
                                                map.sql = key;
                                                map.total = script[key];
                                                map.tabla = key.split("FROM")[1].trim();
                                            }
                                            return map;
                                        });
                                      
                                    
                                        validarSincronizacion.push({sql:oracleMongo.validarExistenciaPerfilMobil(),total:1, tabla:oracleMongo.validarExistenciaPerfilMobil().split("FROM")[1].trim()});
                                        
                                        /**
                                            Se obtiene los dispositivos que fueron sincronizados
                                            Se hace un cruce con aquellos que hace falta por sincronizar
                                            Ejemplo.
                                                Un perfil puede tener varios dispositivos:
                                                1 samsung
                                                1 ipod
                                                1 tablet
                                                Los tres iniciarion sesion con el perfil 101, pero con diferente dispositivo
                                                Es decir se creó un room que tiene tres usuarios.
                                                El objetivo es sincrinizar a los tres:
                                                    1. Opción se envia una sincronizacion a los tres, una vez realizado se adjunta el uidd registro que se actualizara
                                                        con el objetivo de no volverlo a sincronizar
                                                    2.  
                                                
                                        */
                                       
                                        oracleMongo.getDispositivosYaSincronizados(resultado.coleccion, resultadoValidacioes.perfil).then(function(dispositivos){
                                           console.log("getDispositivosYaSincronizados",resultado.coleccion,dispositivos)
                                           console.log("getDispositivosYaSincronizados app.dispositivosConectados[resultadoValidacioes.perfil]",app.dispositivosConectados[resultadoValidacioes.perfil])
                                            if(dispositivos.length>0){
                                               
                                                for(dispositivoIniciado  in app.dispositivosConectados[resultadoValidacioes.perfil] ){
                                                    if(dispositivos.indexOf(dispositivoIniciado)<0){
                                                        if(app.dispositivosConectados[resultadoValidacioes.perfil][dispositivoIniciado]){
                                                                   console.log("notificando a ", d, app.dispositivosConectados[resultadoValidacioes.perfil][dispositivoIniciado]);
                                                                    client.get(resultadoValidacioes.perfil).then(function(token){
                                                                        app.conexiones[empresa.ruc].to(app.dispositivosConectados[resultadoValidacioes.perfil][dispositivoIniciado]).emit('sincronizar',{token:token,sincronizacion:[resultadoValidacioes.nuevoResultado],validarSincronizacion:validarSincronizacion,"registroInterno":{perfil:resultadoValidacioes.perfil}});
                                                                    });
                                                                }
                                                    }
                                                    
                                                    
                                                }
                                               
                                            }else{
                                                console.log("notificando a todos del room",resultadoValidacioes.perfil)
                                                client.get(resultadoValidacioes.perfil).then(function(token){
                                                    app.conexiones[empresa.ruc].to(resultadoValidacioes.perfil).emit('sincronizar',{token:token,sincronizacion:[resultadoValidacioes.nuevoResultado],validarSincronizacion:validarSincronizacion,"registroInterno":{perfil:resultadoValidacioes.perfil}});
                                                });
                                                
                                            }
                                            
                                        });
                                        

                                    }catch(er){
                                           validarSincronizacion=[];
                                           console.log("getTotalRegistrosPorPerfiles erroiiii ", er);
                                    }
                                }else{
                                    console.log("getTotalRegistrosPorPerfiles error ::validar ",perfil, validar);
                                }
                                
                            },function(x){
                                console.log("getTotalRegistrosPorPerfiles errro ",x);
                            });
                           
                           
                        }catch(e){
                            console.log(e);
                       
                        } 
                    }
                    
                })
                
           // })
                   
        });
        }
});

/*var j = schedule.scheduleJob(rule2, function(){
        //oracleMongo.crearColecciones(true);
});*/
setTimeout(function () {
    
    /**************
    SINCRONIZADOR CADA 
    **************/
    
    
    /*oracleMongo.getTotalRegistrosPorPerfiles("1714417035").then(function(validar){
                                   console.log(validar);
                               });
*/
        //oracleMongo.testItems();
    //oracleMongo.crearItemPromocionVenta();
   // oracleMongo.llamarProcedimiento("cargarpedido(:pvcodret,:pvmsret)",{pvcodret:"out",pvmsret:"out"});
  //  oracleMongo.crearColecciones(true);
    /*oracleMongo.getColumnasOracle("select * from SWISSMOVI.emovtafecta where rownum=1", function(d){
        console.log(d);

    });*/
    /*oracleMongo.getTablasScript(function(script){
            console.log(script);
    });*/
    /*var datos = {
        ID:2,
        MPERFILESTABLECIMIENTO_ID:14779,
        PREIMPRESO:"001-001-000012345",
        FECHACREACION:new Date(),
        DISPOSITIVO:"03030303",
        ESTADO:1,
        REGISTROSASOCIADOS:[{tabla:"emovtcartera_detalle", registros:[
            {MFORMAPAGO_ID:1,
                MDOCUMENTO_ID:1,
                VALOR:1,
                SALDO:1,
                REFERENCIA:1,
                CUENTA:"TEST",
                FECHACARTERA:new Date(),
                FECHAVENCIMIENTO:new Date(),
                FECHAFINANCIERA:new Date(),
                FECHADOCUMENTO:new Date(),
                MCUENTABANCARIA_ID:1,
                MBANCO_ID:1,
                IDENTIFICACION:"161616",
                RAZONSOCIAL:"ORLANDO HOONRES",
                REGISTROSASOCIADOS:[
                                    {
                                        tabla:"emovtafecta",
                                        registros:[
                                                    {
                                                        MDETALLECREDITO_ID:1,
                                                        MDETALLEDEBITO_ID:1,
                                                        VALOR:1,
                                                        FECHAAFECTA:new Date()
                                                    }
                                                ]
                                    }
                                    ]
            }

            ]}
        ]


    }*/
    /*oracleMongo.setDatosDinamicamente("emovtcartera", datos, function(estado, resultado){
            console.log(estado);
            console.log(resultado);
    });*/
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
   // res.render('404', { status: 404, url: "404/404.html" });
    //res.render("404/404.html",404);
});






module.exports = app;
