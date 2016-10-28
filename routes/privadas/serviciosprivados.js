var express = require('express');
var sincronizar = express.Router();
var jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens
var tokens = require('../../seguridad/tokens.js'); // get our config file
var TipoBrowser = require('../../utils/tipoBrowser.js');
/****Cuando es local por favor se debe comentar*/
var oracledb = require('../../conexiones-basededatos/conexion-oracle.js');
var mongodb = require('../../conexiones-basededatos/conexion-mongodb.js');
var OracleMongo = require('../../utils/OracleMongo.js');
var oracleMongo =  new OracleMongo(oracledb, mongodb);
var urlSincronizarPerifil = process.env.DOMINIO + "/movil/sincronizacion/actualizar/perfil-sinc/:coleccion/:index";
var client = require("ioredis").createClient();
var UAParser = require('ua-parser-js');
var parser = new UAParser();
var Geolocalizacion = require('../../utils/geoLocalizacion.js');
    geolocalizacion = new Geolocalizacion();
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


var seguridadEDC = require('../../seguridad/SeguridadEDC.js');
var mesnajes = require('../../utils/menusYestados.js');



sincronizar.all("/*", function(req, res, next) {
    next(); // if the middleware allowed us to get here,
          // just move on to the next route handler
});

sincronizar.get('/inicio/perfil/:coleccion/:index', seguridadEDC.verficarInjections, seguridadEDC.validarIndex, function(req, res){
        //Datos por Perfil
    var token = req.get("x-access-token");
    if (token) {
   // Or using a promise if the last argument isn't a function
    client.get(token).then(function (result) {
      if(result){
          var datosperfil = JSON.parse(result).datosperfil;
          oracleMongo.getDatosDinamicamenteDeInicio(req.params.coleccion, parseInt(datosperfil.perfil), req.params.index, function(resultado){
                    res.json(resultado);
           });
      }else{
         res.json("Token no encontrado");
      }
    });

  }else{
      res.json("Token no encontrado");
  }
    /*oracleMongo.getDatosDinamicamenteDeInicio(req.params.coleccion, parseInt(datosperfil.perfil), req.params.index, function(resultado){
                    res.json(resultado);
           });*/

});
sincronizar.get('/actualizar/perfil-sinc/:coleccion/:index', seguridadEDC.verficarInjections, function(req, res){
    console.log('/perfil/:coleccion/:index************************',req.params.coleccion,oracleMongo.isColeccionesTipoDiccionario(req.params.coleccion).length);
        oracleMongo.getDatosPorSincronizarPorPerfilIndex(req.params.coleccion, oracleMongo.isColeccionesTipoDiccionario(req.params.coleccion).length>0 ? null : parseInt(req.datosperfil.perfil), parseInt(req.params.index)).then(function(resultado){
            
            var respuesta = {sincronizarDatos:resultado};
            oracleMongo.getTotalRegistrosPorIdentificacion(req.datosperfil.identificacion).then(function(validar){
                    try{
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
                    
                    }catch(e){
                        console.log(e);
                    }
                    client.get(req.datosperfil.perfil).then(function(token){
                        respuesta.token = token ;// envia el token
                        res.json(respuesta);    
                    },function(){
                        respuesta.token = "Error al generar el token"
                         res.json(respuesta);  
                    });
                        
                    
                    
            },function(x){
                res.json({"error":"validarSincronizacion"});
            });

        });
});
sincronizar.get('/actualizar/perfil/urls-para-sincronizar', seguridadEDC.verficarInjections, function(req, res){
    console.log('/actualizar/perfil/urls-para-sincronizar');
    oracleMongo.getTodosLosCambiosPorSincronizarPorPerfil(parseInt(req.datosperfil.perfil), urlSincronizarPerifil).then(function(resultado){
                res.json({sincronizacion:resultado});
    });
});

/*sincronizar.get('/perfil/:coleccion/:perfil/:index', seguridadEDC.verficarInjections, seguridadEDC.validarIndex, function(req, res){
        //Datos por Perfil
        console.log('/perfil/:coleccion/:index************************');
        console.log(req.params);
            oracleMongo.getDatosDinamicamente(req.params.coleccion, parseInt(req.params.perfil), req.params.index, function(resultado){
                    res.json(resultado);
            });
});*/
//Datos diccionarios
sincronizar.get('/inicio/diccionarios/:coleccion/:index', seguridadEDC.validarIndex, function(req, res){
    console.log('/inicio/diccionarios/:coleccion/:index');
    var token = req.get("x-access-token");
   if (token) {
       // Or using a promise if the last argument isn't a function
        client.get(token).then(function (result) {
          if(result){
              var datosperfil = JSON.parse(result).datosperfil;
              oracleMongo.getDatosDinamicamenteDeInicio(req.params.coleccion, null, req.params.index, function(resultado){
                // console.log(resultado);
                res.json(resultado);
            });
          }else{
             res.json("Token no encontrado");
          }
        });

  }else{
       res.json("Token no encontrado");
  }
     //Datos diccionarios
});
 

//Recibir datos
sincronizar.all('/recepcion/:tabla/',  function(req, res){
    console.log("RECIBIENDO DATOS DESDE EL DISPOSITIVO**********",req.params);
    var enviarRespuestaGenerica = setTimeout(function(){
        res.status(403).send({
            estado: false,
            message:"Error en el json"
            
        });
    },60000);
    
   
    try{
        //Validando el json
        if(!req.body){
            console.log("RECIBIENDO DATOS DESDE EL DISPOSITIVO********** NULL EN EL req.boy", req.body);
        }
         oracleMongo.setDatosDinamicamente(req.params.tabla, req.body, req.datosperfil ? req.datosperfil :(req.session.datosperfil?req.session.datosperfil:{}), req.headers['user-agent'], req.header('x-forwarded-for') || req.connection.remoteAddress, function(resultado){

            console.log("setDatosDinamicamente ENVIANDO AL DISPOSITIVO MOVIL ",resultado, req.datosperfil,req.params.tabla);
            clearTimeout(enviarRespuestaGenerica);
            if(resultado === true ){
                res.json({estado:"MR"});
            }else{
                var estados = "OIDCMR"
                if(estados.indexOf(resultado)>=0){
                    res.json({estado:resultado});
                }else{
                    res.json({error:"Error al grabar",tabla:req.params.tabla,mensaje:resultado,estado:"OI"});
                 //   res.json({estado:"OI"});
                }
				

            }
        });
    }catch(error){
        console.log("setDatosDinamicamente ENVIANDO AL DISPOSITIVO MOVIL error ",error);
        console.log(error);
        clearTimeout(enviarRespuestaGenerica);
        res.status(403).send({
            estado: false,
            message:"Error en el json",
            error:error
        });
    }


        //Datos diccionarios
});

var coleccion = {nombre:"emcversiones",datos:{tipo:"diccionarios",version:"",nombreBackupSql:"",ubicacion:"/home/ecuaquimica/sqlite/bds/", origen:"",resultado:{}}};

sincronizar.get('/sincronizacion-manual/:tipo/:perfil/:version/:x/:y/:uidd/', seguridadEDC.verficarInjections, function(req, res){
    console.log('/sincronizacion-manual/:tipo/:perfil/:version/:x/:y/:uidd/',req.params);
    oracleMongo.autentificacionMongo(req).then(function(respuesta){
        switch (respuesta.length) {
            case 0:
                 res.send({error:true,mensaje:mensajes.errorIdentificacionNoExiste.identificacion});
                break;
            case 1:
                respuesta = respuesta[0];
                mongodb.getRegistrosCustomColumnasOrdenLimite(coleccion.nombre, {tipo:"zip",estado:true,perfil:(req.params.perfil+"")}, {nombreBackupZip:1,ubicacion:1,version:1,versionPerfil:1}, {versionPerfil:-1}, 1, function(resMDB){
                    console.log(resMDB[0].nombreBackupZip);
                    if(resMDB && resMDB[0] && resMDB[0].nombreBackupZip && resMDB[0].version !== req.params.version){
                        respuesta.zipUrl = process.env.DOMINIO + "/zipsSqls/#archivo".replace("#archivo",resMDB[0].nombreBackupZip);
                        respuesta.versionPerfil = resMDB[0].versionPerfil;
                        respuesta.token = "edi"+req.session.id;
                        respuesta.emisor = respuesta.registroMovil.emisor;
                        res.json(respuesta)
                    }else{
                        respuesta.zipUrl = "No existen actualizaciones pendientes";
                        res.json(respuesta);
                    }

                });

                break;
        }

    },function(){

    });


});

sincronizar.get('/sincronizacion-manual-sql/:versionEncontrada/:versionAnterior/:versionActualizacion/:perfil/:dispositivo/:forzar', seguridadEDC.verficarInjections, function(req, res){
    try{
        var resAux= setTimeout(function(){
           res.json("Por favor vuelva a intentarlo en unos minutos");
        },10000);
        console.log('/sincronizacion-manual-sql/:versionEncontrada/:versionAnterior/:versionActualizacion/:perfil/:dispositivo',req.params);
        if(req.app.conexiones[req.app.empresas[0].ruc] && req.params.perfil ){
            geolocalizacion.getOrdenes(req.app.conexiones[req.app.empresas[0].ruc], req.params.perfil);
            geolocalizacion.getCarteras(req.app.conexiones[req.app.empresas[0].ruc], req.params.perfil);
         
        }
        oracleMongo.getVersionDeActualizacion(req.params.versionEncontrada, req.params.versionAnterior, req.params.versionActualizacion, req.params.perfil, req.params.dispositivo,req.params.forzar, parser.setUA(req.headers['user-agent']).getResult(), req.app.conexiones[req.app.empresas[0].ruc], null).then(function(success){
            clearTimeout(resAux);
            res.json(success);
        },function(error){
            clearTimeout(resAux);
            res.json(error);
        });
        
        
    }catch(error){
        console.log(error);
        clearTimeout(resAux);
        res.json("Por favor vuelva a intentarlo en unos minutos");
    }
   
});
//The 404 Route (ALWAYS Keep this as the last route)
/*sincronizar.get('/*', function(req, res, next){
   res.render("404/404.html");
});*/
module.exports = sincronizar;
