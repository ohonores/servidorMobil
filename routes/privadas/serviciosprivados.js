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

sincronizar.get('/actualizar/perfil/:coleccion/:index', seguridadEDC.verficarInjections, seguridadEDC.validarIndex, function(req, res){
        //Datos por Perfil
        console.log('/actualizar/perfil/:coleccion/:index************************');
        console.log(req.params);
        oracleMongo.getDatosDinamicamenteParaActualizar(req.params.coleccion, parseInt(req.datosperfil.perfil), req.params.index, function(resultado){
                    res.json(resultado);
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
        oracleMongo.setDatosDinamicamente(req.params.tabla, req.body , function(resultado){
                res.json(resultado);
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
