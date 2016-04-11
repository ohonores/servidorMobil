var express = require('express');
var sincronizar = express.Router();
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



sincronizar.all("/*", TipoBrowser.browserAceptado, function(req, res, next) {
  next(); // if the middleware allowed us to get here,
          // just move on to the next route handler
});
sincronizar.get('/identificacion/:coleccion/:identificacion/:index', seguridadEDC.verficarInjections, seguridadEDC.validarIdentificacion, function(req, res){
        //Datos por Perfil
            oracleMongo.getDatosDinamicamente(req.params.coleccion, req.params.identificacion, req.params.index, function(resultado){
                    res.json(resultado);
            });
            console.log("getCount inicio");
            oracleMongo.getCount(req.params.identificacion, '/movil/sincronizacion/identificacion/:coleccion/:identificacion/:index', '/movil/sincronizacion/diccionarios/:coleccion/:index', function(total){
                console.log("total");
                console.log(total);
            });

});
    //Datos diccionarios
sincronizar.get('/diccionarios/:coleccion/:index',  function(req, res){
            oracleMongo.getDatosDinamicamente(req.params.coleccion, null, req.params.index, function(resultado){
                    res.json(resultado);
            });
        //Datos diccionarios
});


//The 404 Route (ALWAYS Keep this as the last route)
/*sincronizar.get('/*', function(req, res, next){
   res.render("404/404.html");
});*/
module.exports = sincronizar;
