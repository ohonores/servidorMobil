var express = require('express');
var request = require("request");
var router = express.Router();
var jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens, referencia https://scotch.io/tutorials/authenticate-a-node-js-api-with-json-web-tokens
var tokens = require('../../seguridad/tokens.js'); // get our config file, referencia https://scotch.io/tutorials/authenticate-a-node-js-api-with-json-web-tokens
var TipoBrowser = require('../../utils/tipoBrowser.js');
var seguridadEDC = require('../../seguridad/SeguridadEDC.js');
var oracledb = require('../../conexiones-basededatos/conexion-oracle.js');
var mongodb = require('../../conexiones-basededatos/conexion-mongodb.js');
var OracleMongo = require('../../utils/OracleMongo.js');
var mensajes = require('../../utils/mensajesLabels.js');
var oracleMongo =  new OracleMongo(oracledb, mongodb);
var urlMatriz = "http://documentos.ecuaquimica.com.ec:8080";
var urlPefil = "/movil/sincronizacion/inicio/perfil/:coleccion/:index";
var urlDiccionario = "/movil/sincronizacion/inicio/diccionarios/:coleccion/:index";
var urlRecpcion = "http://documentos.ecuaquimica.com.ec:8080/movil/sincronizacion/recepcion/:tabla/";
var urlSincronizarPerifil = "http://documentos.ecuaquimica.com.ec:8080/movil/sincronizacion/actualizar/perfil-sinc/:coleccion/:index";
/* PAGINA DE INICIO. */
router.get('/', TipoBrowser.browserAceptado, function(req, res, next) {
     res.send('MOVILE*************');


});
/**
    ESTE GET ES SOLO DE PRUEBA
*/
var tokenAix="";
router.get('/datos',function(req, res, next){
    var header={
           'x-access-token':tokenAix
   };
   request({

               uri: "http://documentos.ecuaquimica.com.ec:8087/movil/sincronizacion/perfil/emcperfilestablecimientos/3",
               method: "GET",
               headers: header,
               timeout : 10000 //Maximo espera 10 segundos por peticion

           }, function(error, response, body) {
                res.send(body);
           });
});
router.get('/movil/autentificacion-getToken/:identificacion/:empresa/:uidd/:x/:y/:token', seguridadEDC.validarIdentificacion, function(req, res) {
    oracleMongo.autentificacion(req.params, false, function(respuesta){
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
    });
});
// =====================================
    // REGISTRAR USUARIO DEVICE
    //  Esta url permite la autenficacion y registro del device
    //  Grabando cada peticion en la base de mongo
    // =====================================
router.get('/movil/autentificacion/:identificacion/:empresa/:uidd/:x/:y/:token', seguridadEDC.validarIdentificacion, function(req, res) {
    console.log('/movil/autentificacion/:identificacion/:empresa/:uidd/:x/:y/:token');
    oracleMongo.autentificacion(req.params, true, function(respuesta){
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
                
                
                 //console.log(req)
                console.log("idsesion ",req.session.id)
                router.client.set(respuesta.registroInterno.perfil,"edi"+req.session.id);
                router.client.expire(respuesta.registroInterno.perfil,432000);
               // consol.log()
                tokenAix = token;
                oracleMongo.setToken(respuesta.registroInterno.perfil,token);
                console.log(oracleMongo.getTokens());
                oracleMongo.getUrlsPorPefil(respuesta.registroMovil.identificacion, respuesta.registroInterno.perfil, urlMatriz+urlPefil, urlMatriz+urlDiccionario, urlRecpcion, function(total){
                    // console.log("token*****", total);
                    oracleMongo.getTablasScript(function(script){
                            //console.log("token*****", script);
                            respuesta.scriptsDrops = oracleMongo.getTablasScriptDrop();
                            respuesta.scripts = script;
                            respuesta.scriptsUniqueKeys = oracleMongo.getTablasScriptUniqueKey();
                            respuesta.sincronizacion = total;
                            oracleMongo.getTotalRegistrosPorIdentificacion(respuesta.registroMovil.identificacion).then(function(validar){
                                console.log("getTotalRegistrosPorPerfiles", validar);
                                if(!validar){
                                    
                                    res.json({error:"No existen registros"});
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
                break;
            default:
            res.json(respuesta.map(function(a){ return a.infoEmpresa;}));

        }//fin switch



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
router.get('/movil/iniciar/sensor/sincronizador/actualizar-datos', function(req, res) {
        console.log('/movil/iniciar/sensor/sincronizador/actualizar-datos',new Date());
       if(!sincronizarColeeciones){
        sincronizarColeeciones = true;
        oracleMongo.crearColecciones(false).then(function(a){
            res.json(a);
            sincronizarColeeciones = false;
        },function(x){
            sincronizarColeeciones = false;
            res.json(x);
            
        });
    }else{
        res.json("Existe un proceso ya iniciado");
    }
});
var creandoColeeciones = false;
router.get('/movil/iniciar/cargar-datos-iniciales', function(req, res) {
   
        console.log('/movil/iniciar/cargar-datos-iniciales',new Date());
    if(!creandoColeeciones){
        creandoColeeciones = true;
        oracleMongo.crearColecciones(true).then(function(a){
            res.json(a);
            creandoColeeciones = false;
        },function(x){
             creandoColeeciones = false;
             res.json(x);
           
        });
    }else{
        res.json("Existe un proceso ya iniciado");
    }
       
});

router.get('/movil/iniciar/forzarSincronizacion/:identificacion/:empresa/:notificar', function(req, res) {
   
    console.log('/movil/iniciar/forzarSincronizacion/:identificacion/:empresa',new Date());
    oracleMongo.getPerfil(req.params.identificacion, req.params.empresa).then(function(perfil){
        console.log("req.app.conexiones",req.app.conexiones);
        console.log("req.params.empresa",req.params.empresa);
        console.log("perfil",perfil);
        req.app.conexiones[req.params.empresa].to(perfil).emit("forzarSincronizacion",{identificacion:req.params.identificacion,empresa:req.params.empresa,notificar:req.params.notificar});
        res.send("Listo");
    },function(error){
        res.send(mensajes.errorIdentificacionNoExiste.identificacion);
    });
    
       
});

router.get('/movil/iniciar/socket-notificar/:pefil/:nombre/:estado', function(req, res) {
    var sockectNotificaciones = {
      tryAndCatch:{estado:false, nombre:"tryAndCatch"},
      notificar:{estado:false, nombre:"notificar"},
      notificaesCrud:{estado:false, nombre:"notificaesCrud"},
      erroresCrud:{estado:false, nombre:"erroresCrud"},
      reject:{estado:false, nombre:"refect"},
      autentificacion:{mensaje:"Inicio de conexion, validacion de existencia de perfil y comunicacion con el socket.io"}
    }
    if(sockectNotificaciones[req.nombre]){
        sockectNotificaciones[req.nombre] = req.estado ==="true" ? true:false; 
        oracleMongo.socketEmit(req.app.conexiones[req.app.empresas[0].ruc], req.params.perfil, "sockectActivarNotificaciones", sockectNotificaciones,function(resultado){
            res.send("Activado");
        });
        
    }else{
        res.json({error:"Error al activar el servicio de notificacones, por favor seleccione una de los siguientes servicios",servcioPorNotificar:sockectNotificaciones,ejemplo:"/movil/iniciar/socket-notificar/139/tryAndCatch/true"});
    }
       
});





module.exports = router;
