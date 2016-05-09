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
var urlRecpcion = "http://documentos.ecuaquimica.com.ec:8080/movil/sincronizacion/recepcion/:tabla/"
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
// =====================================
    // REGISTRAR USUARIO DEVICE
    //  Esta url permite la autenficacion y registro del device
    //  Grabando cada peticion en la base de mongo
    // =====================================
router.get('/movil/autentificacion/:identificacion/:empresa/:uidd/:x/:y/:token', seguridadEDC.validarIdentificacion, function(req, res) {
    oracleMongo.autentificacion(req.params, function(respuesta){
        //Verifica si existe mas de una empresa
        switch (respuesta.length) {
            case 0:
                res.send(mensajes.errorIdentificacionNoExiste.identificacion);
                break;
            case 1:
                respuesta = respuesta[0];
                // creacion del token
                var token = jwt.sign({identificacion:req.params.identificacion,perfil:respuesta.registroInterno.perfil,empresa:req.params.uidd}, tokens.secret, {
                  expiresInMinutes: 60 //1440 expira en 24 hours
                });
                tokenAix = token;
                oracleMongo.getUrlsPorPefil(respuesta.registroMovil.identificacion, respuesta.registroInterno.perfil, urlMatriz+urlPefil, urlMatriz+urlDiccionario, urlRecpcion, function(total){
                    oracleMongo.getTablasScript(function(script){
                            respuesta.scriptsDrops = oracleMongo.getTablasScriptDrop();
                            respuesta.scripts = script;
                            respuesta.scriptsUniqueKeys = oracleMongo.getTablasScriptUniqueKey();
                            respuesta.sincronizacion = total;
                            oracleMongo.getTotalRegistrosPorPerfiles(respuesta.registroMovil.identificacion).then(function(validar){

                                respuesta.validarSincronizacion = validar.map(function(script){
                                    var map = {};
                                    for(var key in script){
                                        map.slq = key;
                                        map.total = script[key];
                                    }
                                    return map;
                                });
                                respuesta.validarSincronizacion.push({sql:oracleMongo.validarExistenciaPerfilMobil(),total:1});
                                respuesta.token = token;// envia el token
                                res.json(respuesta);
                            })

                    });

                });
                break;
            default:
            res.json(respuesta.map(function(a){ return a.infoEmpresa}));

        }//fin switch



    });
});

module.exports = router
