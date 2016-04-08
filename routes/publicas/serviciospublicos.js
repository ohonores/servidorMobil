var express = require('express');
var router = express.Router();
var TipoBrowser = require('../../utils/tipoBrowser.js');

var seguridadEDC = require('../../seguridad/SeguridadEDC.js');
/* PAGINA DE INICIO. */
router.get('/', TipoBrowser.browserAceptado, function(req, res, next) {
     res.send('MOVILE*************');

});


module.exports = router
