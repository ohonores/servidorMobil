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
var urlSincronizarPerifil = "http://documentos.ecuaquimica.com.ec:8080/movil/sincronizacion/actualizar/perfil-sinc/:coleccion/:index";
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



sincronizar.all("/*", seguridadEDC.validarToken, function(req, res, next) {
    next(); // if the middleware allowed us to get here,
          // just move on to the next route handler
});

sincronizar.get('/inicio/perfil/:coleccion/:index', seguridadEDC.verficarInjections, seguridadEDC.validarIndex, function(req, res){
        //Datos por Perfil
        console.log('/perfil/:coleccion/:index************************');
        console.log(req.params);
            oracleMongo.getDatosDinamicamenteDeInicio(req.params.coleccion, parseInt(req.datosperfil.perfil), req.params.index, function(resultado){
                    res.json(resultado);
            });
});
sincronizar.get('/actualizar/perfil-sinc/:coleccion/:index', seguridadEDC.verficarInjections, function(req, res){
    console.log('/perfil/:coleccion/:index************************');
        oracleMongo.getDatosPorSincronizarPorPerfilIndex(req.params.coleccion, parseInt(req.datosperfil.perfil), parseInt(req.params.index)).then(function(resultado){
            var respuesta = {sincronizarDatos:resultado};
            oracleMongo.getTotalRegistrosPorPerfiles(req.datosperfil.identificacion).then(function(validar){
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
                    respuesta.token = token;// envia el token
                    res.json(respuesta);
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
sincronizar.get('/inicio/diccionarios/:coleccion/:index',  function(req, res){
    oracleMongo.getDatosDinamicamenteDeInicio(req.params.coleccion, null, req.params.index, function(resultado){
        res.json(resultado);
    });
    //Datos diccionarios
});
//Recibir datos
sincronizar.all('/recepcion/:tabla/',  function(req, res){
    try{
        console.log("/recepcion/:tabla/");
        oracleMongo.setDatosDinamicamente(req.params.tabla, req.body, req.datosperfil, function(resultado){
            if(resultado === true){
                res.json({estado:"R"});
            }else{
                res.json({error:"Error al grabar",tabla:req.params.tabla,mensaje:resultado});
            }
        });
    }catch(error){
        console.log(error);
        res.status(403).send({
            estado: false,
            message:"Error en el json",
            error:error
        });
    }

        //Datos diccionarios
});



//The 404 Route (ALWAYS Keep this as the last route)
/*sincronizar.get('/*', function(req, res, next){
   res.render("404/404.html");
});*/
module.exports = sincronizar;
