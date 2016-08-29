var express = require('express');
var request = require("request");
var UAParser = require('ua-parser-js');
var ubicacion = require("../../utils/ubicacion.js");
var router = express.Router();
var jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens, referencia https://scotch.io/tutorials/authenticate-a-node-js-api-with-json-web-tokens
var tokens = require('../../seguridad/tokens.js'); // get our config file, referencia https://scotch.io/tutorials/authenticate-a-node-js-api-with-json-web-tokens
var TipoBrowser = require('../../utils/tipoBrowser.js');
var seguridadEDC = require('../../seguridad/SeguridadEDC.js');
var oracledb = require('../../conexiones-basededatos/conexion-oracle.js');
var mongodb = require('../../conexiones-basededatos/conexion-mongodb.js');
var OracleMongo = require('../../utils/OracleMongo.js');
var Geolocalizacion = require('../../utils/geoLocalizacion.js');
    geolocalizacion = new Geolocalizacion();
var mensajes = require('../../utils/mensajesLabels.js');
var oracleMongo =  new OracleMongo(oracledb, mongodb);

var urlMatriz = process.env.DOMINIO;
var urlPefil = "/movil/sincronizacion/inicio/perfil/:coleccion/:index";
var urlDiccionario = "/movil/sincronizacion/inicio/diccionarios/:coleccion/:index";
var urlRecpcion = urlMatriz+"/movil/sincronizacion/recepcion/:tabla/";
var urlSincronizarPerifil = urlMatriz+"/movil/sincronizacion/actualizar/perfil-sinc/:coleccion/:index";
var parser = new UAParser();
/* PAGINA DE INICIO. */
router.get('/', TipoBrowser.browserAceptado, function(req, res, next) {
     res.send('MOVILE*************');


});

router.get('/geolocalizacion',function(req, res, next){
     res.render('home/index.html');
});
router.get('/movil/autentificacion-getToken/:identificacion/:empresa/:uidd/:x/:y/:token',  function(req, res) {

    oracleMongo.autentificacionMongo(req).then(function(respuesta){

       //Verifica si existe mas de una empresa
        switch (respuesta.length) {
            case 0:
                res.send(mensajes.errorIdentificacionNoExiste.identificacion);
                break;
            case 1:
                respuesta = respuesta[0];
                // creacion del token
                var token = jwt.sign({identificacion:req.params.identificacion,perfil:respuesta.registroInterno.perfil,empresa:respuesta.registroMovil.infoEmpresa.empresa_id}, tokens.secret, {
                  expiresInMinutes: 11520 //1440 expira en 24 hours
                });
                req.session.toke = token;
                req.session.datosperfil ={identificacion:req.params.identificacion,perfil:respuesta.registroInterno.perfil,empresa:respuesta.registroMovil.infoEmpresa.empresa_id};
                
                tokenAix = token;
                oracleMongo.setToken(respuesta.registroInterno.perfil,token);
                router.client.set(respuesta.registroInterno.perfil,"edi"+req.session.id);
                router.client.expire(respuesta.registroInterno.perfil,432000);
                console.log(oracleMongo.getTokens());
                respuesta.token = "edi"+req.session.id;// envia el token
                res.json({token:"edi"+req.session.id});
                break;
            default:
                res.send(mensajes.errorIdentificacionNoExiste.identificacion);
                break;
                
        }
    },function(error){
         res.json({error:true,mensaje:error});
    });
});
// =====================================
    // REGISTRAR USUARIO DEVICE
    //  Esta url permite la autenficacion y registro del device
    //  Grabando cada peticion en la base de mongo
    // =====================================
var coleccion = {nombre:"emcversiones",datos:{tipo:"diccionarios",version:"",nombreBackupSql:"",ubicacion:"/u02/movil/sqlite/bds/", origen:"",resultado:{}}};
router.get('/movil/autentificacion/:tipo/:identificacion/:empresa/:uidd/:x/:y/:token', seguridadEDC.validarIdentificacion, function(req, res) {
    oracleMongo.autentificacionOracle(req).
    then(oracleMongo.autentificacionMongo).
    then(function(respuesta){
      //oracleMongo.autentificacion(req.params, true, function(respuesta){
            //Verifica si existe mas de una empresa
              console.log("autentificacion",respuesta);
            switch (respuesta.length) {
                case 0:
                    res.send({error:true,mensaje:mensajes.errorIdentificacionNoExiste.identificacion});
                    break;
                case 1:
                    respuesta = respuesta[0];

                    req.session.datosperfil ={identificacion:req.params.identificacion,perfil:respuesta.registroInterno.perfil,empresa:respuesta.registroMovil.infoEmpresa.empresa_id};
                    router.client.set(respuesta.registroInterno.perfil,"edi"+req.session.id);
                    router.client.expire(respuesta.registroInterno.perfil,432000);
                    router.client.expire("edi"+req.session.id,432000);
                    respuesta.token = "edi"+req.session.id;// envia el token
                    respuesta.perfil = respuesta.registroInterno.perfil;
                    respuesta.emisor = respuesta.registroMovil.emisor;

                    console.log("herxxxxxxxxxxxxxxxxxSDDDDDDDDDDDDDDDDD",respuesta.emisor,respuesta.registroMovil.emisor);
                    //Buscano la url del archivo zip
                    switch(req.params.tipo){
                        case "device":
                             mongodb.getRegistrosCustomColumnasOrdenLimite(coleccion.nombre, {tipo:"zip",estado:true,perfil:respuesta.registroInterno.perfil.toString()}, {nombreBackupZip:1,ubicacion:1,version:1,versionPerfil:1}, {versionPerfil:-1}, 1, function(resMDB){
                                if(resMDB && resMDB[0] && resMDB[0].nombreBackupZip){
                                    respuesta.zipUrl = urlMatriz+"/zipsSqls/#archivo".replace("#archivo",resMDB[0].nombreBackupZip);
                                    respuesta.versionPerfil = resMDB[0].versionPerfil;
                                    console.log("respuesta",respuesta);
                                    /**MODIFICANDO LA COLECCION VERSIONES CON LOS DISPOSITIVOS**/
                                    ubicacion.getUbicacionIp(req.header('x-forwarded-for') || req.connection.remoteAddress, function(resultadoIp, ip){
                                         console.log("getUbicacionIp",resultadoIp)
                                         mongodb.modificarOinsertar(coleccion.nombre, {versionPerfil:resMDB[0].versionPerfil, tipo:"zip"}, {$push:{"dispositivos":{uidd:req.params.uidd, fecha:new Date(),ip:ip,origen:resultadoIp}}}, function(resultadoD1){});
                                         mongodb.modificarOinsertar(coleccion.nombre, {versionPerfil:resMDB[0].versionPerfil, tipo:"perfiles"}, {$push:{"dispositivos":{uidd:req.params.uidd, fecha:new Date(),ip:ip,origen:resultadoIp}}}, function(resultadoD1){});
                                    });

                                    res.json(respuesta);
                                }else{
                                    respuesta.zipUrl = "Backup de slqlite no encontrado";
                                    console.log("respuesta",respuesta);
                                    res.json(respuesta);
                                }

                            });
                            break;
                        default :
                            console.log("respuesta.registroMovil.identificacion, respuesta.registroInterno.perfil,",respuesta.registroMovil.identificacion, respuesta.registroInterno.perfil)
                            oracleMongo.getUrlsPorPefil(respuesta.registroMovil.identificacion, respuesta.registroInterno.perfil, urlMatriz+urlPefil, urlMatriz+urlDiccionario, urlRecpcion, function(total){
                                oracleMongo.getTablasScript(function(script){
                                        respuesta.scripts = [];
                                        respuesta.scripts = respuesta.scripts.concat(oracleMongo.getScripts_(oracleMongo.getTablasScriptDrop()));
                                        respuesta.scripts = respuesta.scripts.concat(oracleMongo.getScripts_(script));
                                        respuesta.scripts = respuesta.scripts.concat(oracleMongo.getScripts_(oracleMongo.getTablasScriptUniqueKey()));
                                        respuesta.sincronizacion = total;
                                        console.log("scripts", respuesta.scripts);
                                        oracleMongo.getTotalRegistrosPorIdentificacion(respuesta.registroMovil.identificacion).then(function(validar){
                                            console.log("getTotalRegistrosPorPerfiles", validar);
                                            if(!validar){
                                                res.json({error:"No existen registros"});
                                                return;
                                            }
                                            if(!Array.isArray(validar)){
                                                res.json({error:validar});
                                                return;
                                            }
                                            respuesta.validarSincronizacion = validar.map(function(script){
                                                var map = {};
                                                for(var key in script){
                                                    map.sql = key;
                                                    map.total = script[key];
                                                    map.tabla = key.split("FROM")[1].trim();
                                                }
                                                return map;
                                            });

                                            respuesta.validarSincronizacion.push({sql:oracleMongo.validarExistenciaPerfilMobil(),total:1, tabla:oracleMongo.validarExistenciaPerfilMobil().split("FROM")[1].trim()});
                                            respuesta.token = "edi"+req.session.id;// envia el token
                                            res.json(respuesta);
                                        },function(x){
                                            //respuesta.token = token;// envia el token
                                            console.log("error en getTotalRegistrosPorPerfiles",x);
                                            res.json(x);
                                            return;
                                        });

                                });

                            });

                    }


                    break;
                default:
                res.json(respuesta.map(function(a){ return a.infoEmpresa;}));

            }//fin switch


    },function(errorAutentificacionOracle){
        res.json({error:true,mensaje:errorAutentificacionOracle});
    });
});


/*router.get('/movil/iniciar/sensor/sincronizador/:perfil', function(req, res) {
        console.log('/movil/iniciar/sensor/sincronizador');
        oracleMongo.crearColecciones(false);
        req.app.conexiones[req.app.empresas[0].ruc].emit('respuesta::namespace', {mensaje:'server todos respuesta!', estado:true,datos:{"key":"es un prueba desde el servidor"}});
        //req.app.conexiones[req.app.empresas[1].ruc].emit('respuesta::namespace', {mensaje:'server todos respuesta!', estado:true,datos:{"key":"es un prueba desde el servidor"}});
        console.log('/actualizar/perfil/urls-para-sincronizar');
        oracleMongo.getTodosLosCambiosPorSincronizarPorPerfil(parseInt(req.params.perfil)).then(function(resultado){
                    res.json({sincronizacion:resultado});
        });
        //res.send("listo");
});*/

router.get('/movil/iniciar/sensor/sincronizador/get-datos', function(req, res) {
     console.log('/movil/iniciar/sensor/sincronizador/get-datos',new Date());
    oracleMongo.getTodosLosCambiosPorSincronizarPorPerfil(null,  urlSincronizarPerifil).then(function(resultado){
                    res.json({sincronizacion:resultado});
    });
});
var sincronizarColeeciones = false;
var sincronizarColeecionesPendientes  = [];
router.get('/movil/iniciar/sensor/sincronizador/actualizar-datos/:tablas', function(req, res) {
       console.log('/movil/iniciar/sensor/sincronizador/actualizar-datos/:tablas', req.headers)
		oracleMongo.crearBackupsSqliteAutomatica(parser.setUA(req.headers['user-agent']).getResult());
		/*oracleMongo.actualizarColecciones(req.params.tablas.split(','), parser.setUA(req.headers['user-agent']).getResult()).then(function(succes){
            
        },function(error){
            
        });*/
       res.json("Actualizando Colecciones..");
   
});
var creandoColeeciones = false;
router.get('/movil/iniciar/cargar-datos-diccionarios', function(req, res) {
     console.log('/movil/iniciar/cargar-datos-diccionarios',new Date());
    oracleMongo.crearColeccionesBdSqliteTipoDiccionarios(parser.setUA(req.headers['user-agent']).getResult()).then(function(success){
        console.log("crearColeccionesBdSqliteTipoDiccionarios",success);
    },function(error){
        console.log("crearColeccionesBdSqliteTipoDiccionarios",success);
    });
    res.send("Listo diccionarios");
});
router.get('/movil/iniciar/cargar-datos-iniciales/:perfil', function(req, res) {

    if(req.params.perfil === "todos"){
        oracleMongo.crearColeccionesPorPerfilRecursivo(parser.setUA(req.headers['user-agent']).getResult(), 0, [140,101,123]);
    }else{
        oracleMongo.crearColeccionesScriptsPorPerfil(parser.setUA(req.headers['user-agent']).getResult(), req.params.perfil);
    }
    res.send("Listo perfil");
});
router.get('/movil/iniciar/cargar-sqldiff/:perfil', function(req, res) {
    oracleMongo.crearSqlDiffPorPerfil(req.params.perfil, parser.setUA(req.headers['user-agent']).getResult(), true);
    res.send("Listo perfil");
});
router.get('/movil/iniciar/cargar-sqldiff-version/:perfil/:version', function(req, res) {
    console.log(req.params,req.params.version );
    oracleMongo.crearSqlDiffPorPerfil(req.params.perfil, parser.setUA(req.headers['user-agent']).getResult(), req.params.version);
    res.send("Listo perfil");
});
router.get('/movil/actualizar/impresora/:perfil/:impresora', function(req, res) {
    oracleMongo.actualizarImpresora( req.params.perfil, req.params.impresora);
    res.send("Listo perfil actualizado");
});


router.get('/movil/iniciar/forzarSincronizacion/:identificacion/:empresa/:notificar', function(req, res) {
   
    console.log('/movil/iniciar/forzarSincronizacion/:identificacion/:empresa',new Date());
    oracleMongo.getPerfil(req.params.identificacion, req.params.empresa).then(function(perfil){
        console.log("req.app.conexiones",req.app.conexiones);
        console.log("req.params.empresa",req.params.empresa);
        console.log("perfil",perfil);
        req.app.conexiones[req.params.empresa].to(perfil).emit("forzarSin:cronizacion",{identificacion:req.params.identificacion,empresa:req.params.empresa,notificar:req.params.notificar});
        res.send("Listo");
    },function(error){
        res.send(mensajes.errorIdentificacionNoExiste.identificacion);
    });
    
       
});
router.get('/movil/procesar/pedidos/:perfil', function(req, res) {
        oracleMongo.procesarPedidos(req.params.perfil);
    res.send("Proceso enviado");
});
router.get('/movil/procesar/cartera', function(req, res) {
        oracleMongo.procesarCartera();
        res.send("Proceso enviado");
});



router.get('/movil/iniciar/socket-notificar/:perfil/:nombre/:estado', function(req, res) {
    var sockectNotificaciones = {
      tryAndCatch:{estado:false, nombre:"tryAndCatch"},
      notificar:{estado:false, nombre:"notificar"},
      notificaesCrud:{estado:false, nombre:"notificaesCrud"},
      erroresCrud:{estado:false, nombre:"erroresCrud"},
      reject:{estado:false, nombre:"refect"},
      autentificacion:{mensaje:"Inicio de conexion, validacion de existencia de perfil y comunicacion con el socket.io"}
    }
    if(sockectNotificaciones[req.params.nombre]){
        sockectNotificaciones[req.params.nombre] = req.params.estado ==="true" ? true:false; 
        oracleMongo.socketEmit(req.app.conexiones[req.app.empresas[0].ruc], req.params.perfil, "sockectActivarNotificaciones", sockectNotificaciones,function(resultado){
            res.send("Activado");
        });
        
    }else{
        res.json({error:"Error al activar el servicio de notificacones, por favor seleccione una de los siguientes servicios",servcioPorNotificar:sockectNotificaciones,ejemplo:"/movil/iniciar/socket-notificar/139/tryAndCatch/true"});
    }
       
});
router.get('/movil/iniciar/socket-mensaje/:perfil/:mensaje', function(req, res) {
    
   
    if(req.app.dispositivosConectados[req.params.perfil] && req.params.mensaje ){
        
        oracleMongo.socketEmit(req.app.conexiones[req.app.empresas[0].ruc], req.params.perfil, "socket:eval", req.params.mensaje,function(resultado){
            res.send("mensaje "+req.params.mensaje);
        });
    }else{
        if(!req.app.dispositivosConectados[req.params.perfil]){
            res.json({error:"Error al activar el servicio de mensajes, el perfil no esta conectado"});
        }else{
            res.json({error:"Error al activar el servicio de mensajes, debe ingresar un pefil y el mensaje"});
        }
        
    }
       
});
router.get('/movil/iniciar/geolocalizacion/:perfil', function(req, res) {
    
   console.log('/movil/iniciar/geolocalizacion/:perfil',req.params,req.app.dispositivosConectados)
    if(req.app.dispositivosConectados[req.params.perfil] && req.params.perfil ){
        geolocalizacion.getPosicionActual(req.app.conexiones[req.app.empresas[0].ruc], req.app.dispositivosConectados, req.params.perfil);
         res.send("geolocalizacion pedida a  "+req.params.perfil);
    }else{
        if(!req.app.dispositivosConectados[req.params.perfil]){
            res.json({error:"Error al activar el servicio de mensajes, el perfil no esta conectado"});
        }else{
            res.json({error:"Error al activar el servicio de mensajes, debe ingresar un pefil y el mensaje"});
        }
    }
       
});
router.get('/movil/iniciar/backupsqlite/:perfil', function(req, res) {
    
   console.log('/movil/iniciar/backupsqlite/:perfil',req.params)
    if(req.app.dispositivosConectados[req.params.perfil] && req.params.perfil ){
        geolocalizacion.getBaseSqlite(req.app.conexiones[req.app.empresas[0].ruc], req.app.dispositivosConectados, req.params.perfil);
         res.send("geolocalizacion pedida a  "+req.params.perfil);
    }else{
        if(!req.app.dispositivosConectados[req.params.perfil]){
            res.json({error:"Error al activar el servicio de mensajes, el perfil no esta conectado"});
        }else{
            res.json({error:"Error al activar el servicio de mensajes, debe ingresar un pefil y el mensaje"});
        }
    }
       
});
router.get('/movil/procesar/pedidos/mongodb/:tabla/:hash', function(req, res) {
        oracleMongo.procesarPedidosDesdeMongoDbHaciaOracle(req.params);          
        res.send("Proceso pedidos mongodb");
});



module.exports = router;
