var express = require('express');
var request = require("request");
var UAParser = require('ua-parser-js');
var ubicacion = require("../../utils/ubicacion.js");
var router = express.Router();
var client_a = require("ioredis").createClient();
var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens, referencia https://scotch.io/tutorials/authenticate-a-node-js-api-with-json-web-tokens
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
var urlsProduccion = JSON.parse(process.env.DOMINIO);
var urlMatriz = urlsProduccion[process.env.GRUPO];
var urlPefil = "/movil/sincronizacion/inicio/perfil/:coleccion/:index";
var urlDiccionario = "/movil/sincronizacion/inicio/diccionarios/:coleccion/:index";
var urlRecpcion = urlMatriz+"/movil/sincronizacion/recepcion/:tabla/";
var urlSincronizarPerifil = urlMatriz+"/movil/sincronizacion/actualizar/perfil-sinc/:coleccion/:index";
var parser = new UAParser();
/* PAGINA DE INICIO . */
router.get('/', function(req, res, next) {
     res.send('MOVILE*************');
});
router.get('/test/:id/otros/:nombre',function(req, res, next){
    res.send(req.params.id);
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


function getDiaActual(){
    var fecha = new Date();
    return (fecha.getDate()<10?"0"+fecha.getDate():fecha.getDate())+(fecha.getMonth()<10?"0"+fecha.getMonth():fecha.getMonth())+fecha.getFullYear();
}
// =====================================
    // REGISTRAR USUARIO DEVICE
    //  Esta url permite la autenficacion y registro del device
    //  Grabando cada peticion en la base de mongo
    // =====================================
var coleccion = {nombre:"emcversiones",datos:{tipo:"diccionarios",version:"",nombreBackupSql:"",ubicacion:"/u02/movil/sqlite/bds/", origen:"",resultado:{}}};
router.get('/movil/autentificacion/:tipo/:identificacion/:empresa/:uidd/:x/:y/:token', seguridadEDC.validarIdentificacion, function(req, res) {
    req.params.tipo = 'device';
    oracleMongo.autentificacionOracle(req).
    then(oracleMongo.autentificacionMongo).
    then(function(respuesta){
            //Verifica si existe mas de una empresa
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
                    router.client.hmset(getDiaActual(), respuesta.registroInterno.perfil,"Perfil econtrado y esperando su base, fecha:"+new Date());
                    router.client.expire(respuesta.registroInterno.perfil,259200);
                   
                    //Buscano la url del archivo zip
                    switch(req.params.tipo){
                        case "device":
                             mongodb.getRegistrosCustomColumnasOrdenLimite(coleccion.nombre, {tipo:"zip",estado:true,perfil:respuesta.registroInterno.perfil.toString()}, {nombreBackupZip:1,ubicacion:1,version:1,versionPerfil:1}, {versionPerfil:-1}, 1, function(resMDB){
                                if(resMDB && resMDB[0] && resMDB[0].nombreBackupZip){
                                    respuesta.zipUrl = urlMatriz+"/zipsSqls/#archivo".replace("#archivo",resMDB[0].nombreBackupZip);
                                    respuesta.versionPerfil = resMDB[0].versionPerfil;
                                    /**MODIFICANDO LA COLECCION VERSIONES CON LOS DISPOSITIVOS**/
                                    ubicacion.getUbicacionIp(req.header('x-forwarded-for') || req.connection.remoteAddress, function(resultadoIp, ip){
                                         console.log("getUbicacionIp",resultadoIp)
                                         mongodb.modificarOinsertar(coleccion.nombre, {versionPerfil:resMDB[0].versionPerfil, tipo:"zip"}, {$push:{"dispositivos":{uidd:req.params.uidd, fecha:new Date(),ip:ip,origen:resultadoIp}}}, function(resultadoD1){});
                                         mongodb.modificarOinsertar(coleccion.nombre, {versionPerfil:resMDB[0].versionPerfil, tipo:"perfiles"}, {$push:{"dispositivos":{uidd:req.params.uidd, fecha:new Date(),ip:ip,origen:resultadoIp}}}, function(resultadoD1){});
                                    });
                                     client_a.hget('dispositivos:sokectid', req.params.uidd , function(error, socketid){
                                         console.log("autenfificacion de inicio ", socketid, error);
                                         if(socketid){
                                              client_a.hmset('perfiles:dispositivos:sokectid:'+respuesta.registroInterno.perfil,req.params.uidd,socketid);
                                             console.log("autenfificacion de inicio agregado");
                                         }
                                        
                                     });
                                     router.client.hmset(getDiaActual(), respuesta.registroInterno.perfil,"Perfil econtrado y base entregada(#zipUrl), fecha:#fecha".replace("#fecha",+new Date()).replace("#zipUrl",respuesta.zipUrl));
                                    res.json(respuesta);
                                }else{
                                    respuesta.zipUrl = "Backup de slqlite no encontrado";
                                    res.json(respuesta);
                                }

                            });
                            break;
                        default :
                          
                            oracleMongo.getUrlsPorPefil(respuesta.registroMovil.identificacion, respuesta.registroInterno.perfil, urlMatriz+urlPefil, urlMatriz+urlDiccionario, urlRecpcion, function(total){
                                oracleMongo.getTablasScript(function(script){
                                        respuesta.scripts = [];
                                        respuesta.scripts = respuesta.scripts.concat(oracleMongo.getScripts_(oracleMongo.getTablasScriptDrop()));
                                        respuesta.scripts = respuesta.scripts.concat(oracleMongo.getScripts_(script));
                                        respuesta.scripts = respuesta.scripts.concat(oracleMongo.getScripts_(oracleMongo.getTablasScriptUniqueKey()));
                                        respuesta.sincronizacion = total;
                                        oracleMongo.getTotalRegistrosPorIdentificacion(respuesta.registroMovil.identificacion).then(function(validar){
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


router.get('/movil/iniciar/sensor/sincronizador/get-datos', function(req, res) {
     console.log('/movil/iniciar/sensor/sincronizador/get-datos',new Date());
  
});


router.get('/movil/iniciar/sensor/sincronizador/actualizar-datos/:tablas', function(req, res) {
    oracleMongo.crearBackupsSqliteAutomatica(parser.setUA(req.headers['user-agent']).getResult(), req.app.conexiones[req.app.empresas[0].ruc]);
	res.json("Actualizando Colecciones..");
});

//No usada
router.get('/movil/iniciar/cargar-datos-diccionarios', function(req, res) {
    oracleMongo.crearColeccionesBdSqliteTipoDiccionarios(parser.setUA(req.headers['user-agent']).getResult()).then(function(success){
        console.log("crearColeccionesBdSqliteTipoDiccionarios",success);
    },function(error){
        console.log("crearColeccionesBdSqliteTipoDiccionarios",success);
    });
    res.send("Listo diccionarios");
});

/**
    Ruta para crear la base de un perfil
    Ejemplo: 
            ...../movil/iniciar/cargar-datos-iniciales/101
*/
router.get('/movil/iniciar/cargar-datos-iniciales/:perfil', function(req, res) {

    if(req.params.perfil === "todos"){
        oracleMongo.crearColeccionesPorPerfilRecursivo(parser.setUA(req.headers['user-agent']).getResult(), 0, [140,101,123], [],req.app.conexiones[req.app.empresas[0].ruc] );
    }else{
        oracleMongo.crearColeccionesScriptsPorPerfil(parser.setUA(req.headers['user-agent']).getResult(), req.app.conexiones[req.app.empresas[0].ruc], req.params.perfil);
    }
    res.send("Creando la base...");
});

/**
    Creando un sqldiff para un perfil específico
*/
router.get('/movil/iniciar/cargar-sqldiff/:perfil', function(req, res) {
    oracleMongo.crearSqlDiffPorPerfil(req.params.perfil, req.app.conexiones[req.app.empresas[0].ruc]);
    res.send("Creando sqldiff...");
});

/**
    Restfull para actualizar la empresora
*/
router.get('/movil/actualizar/impresora/:perfil/:impresora', function(req, res) {
    oracleMongo.actualizarImpresora( req.params.perfil, req.params.impresora);
    res.send("Listo perfil actualizado");
});

/**
    Ruta no usada
*/
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

/**
    Procesa un pedido DC -> MV, el perfil es usando para enviar por correo e indicar a cual peril pertenecio la orden
*/
router.get('/movil/procesar/pedidos/:perfil', function(req, res) {
        oracleMongo.procesarPedidos(req.params.perfil);
    res.send("Proceso enviado");
});
/**
    Procesar cartera DC -> MV
*/
router.get('/movil/procesar/cartera', function(req, res) {
        oracleMongo.procesarCartera();
        res.send("Proceso enviado");
});

/**
    Enviar mensaje al dispositivo
*/
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

/**
    Obtiene la geolocalizacion de un perfil, pruebas
*/
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

/**
    Envia la orden de mongo a oracle
*/
router.get('/movil/procesar/pedidos/mongodb/:tabla/:hash', function(req, res) {
        oracleMongo.procesarPedidosDesdeMongoDbHaciaOracle(req.params);          
        res.send("Proceso pedidos mongodb");
});

module.exports = router;
