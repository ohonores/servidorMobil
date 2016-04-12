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



sincronizar.all("/*", function(req, res, next) {
  next(); // if the middleware allowed us to get here,
          // just move on to the next route handler
});
sincronizar.get('/perfil/:coleccion/:index', seguridadEDC.verficarInjections, seguridadEDC.validarIndex, function(req, res){
        //Datos por Perfil
        console.log('/perfil/:coleccion/:index************************');
        console.log(req.params);
            oracleMongo.getDatosDinamicamente(req.params.coleccion, parseInt(req.datosperfil.perfil), req.params.index, function(resultado){
                    res.json(resultado);
            });


});

sincronizar.get('/perfil/:coleccion/:perfil/:index', seguridadEDC.verficarInjections, seguridadEDC.validarIndex, function(req, res){
        //Datos por Perfil
        console.log('/perfil/:coleccion/:index************************');
        console.log(req.params);
            oracleMongo.getDatosDinamicamente(req.params.coleccion, parseInt(req.params.perfil), req.params.index, function(resultado){
                    res.json(resultado);
            });


});
    //Datos diccionarios
sincronizar.get('/diccionarios/:coleccion/:index',  function(req, res){
            oracleMongo.getDatosDinamicamente(req.params.coleccion, null, req.params.index, function(resultado){
                    res.json(resultado);
            });
        //Datos diccionarios
});

function supportCrossOriginScript(req, res, next) {

    res.status(200);
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Cache-Control, Pragma, Origin, Authorization, Content-Type,content-Type, accept, X-Requested-With, x-access-token");
    res.header("Access-Control-Allow-Methods","POST, GET, OPTIONS, DELETE, PUT, HEAD");
	res.header("Access-Control-Request-Method","POST, GET, OPTIONS, DELETE, PUT, HEAD");
	res.header("Access-Control-Request-Headers","content-Type, accept, x-access-token");
	next();
}
//The 404 Route (ALWAYS Keep this as the last route)
/*sincronizar.get('/*', function(req, res, next){
   res.render("404/404.html");
});*/
module.exports = sincronizar;
