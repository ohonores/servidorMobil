var express = require('express');
var router = express.Router();
var TipoBrowser = require('../../utils/tipoBrowser.js');

var seguridadEDC = require('../../seguridad/SeguridadEDC.js');
var oracledb = require('../../conexiones-basededatos/conexion-oracle.js');
var mongodb = require('../../conexiones-basededatos/conexion-mongodb.js');
var OracleMongo = require('../../utils/OracleMongo.js');
var oracleMongo =  new OracleMongo(oracledb, mongodb);
var urlMatriz = "http://documentos.ecuaquimica.com.ec:8087";
/* PAGINA DE INICIO. */
router.get('/', TipoBrowser.browserAceptado, function(req, res, next) {
     res.send('MOVILE*************');
});
// =====================================
    // REGISTRAR USUARIO DEVICE
    //  Esta url permite la autenficacion y registro del device
    //  Grabando cada peticion en la base de mongo
    // =====================================
router.get('/movil/autenficacion/:identificacion/:uidd/:x/:y/:token', seguridadEDC.validarIdentificacion, function(req, res) {
    oracleMongo.autentificacion(req.params, function(respuesta){
        if(respuesta){
            oracleMongo.getCount(req.params.identificacion, urlMatriz+'/movil/sincronizacion/identificacion/:coleccion/:identificacion/:index', urlMatriz+'/movil/sincronizacion/diccionarios/:coleccion/:index', function(total){
                respuesta.scripts = oracleMongo.getTablasScript();
                respuesta.sincronizacion = total;
                res.json(respuesta);
            });

        }else{
            res.send("NO ENCONTRADO");
        }
    });
});

module.exports = router
