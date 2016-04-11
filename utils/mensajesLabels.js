var Labels = function() {
  // json

    this.errorIngreso001 = {
        "ingreso":{tipo:"error",mensaje:"Por favor int\u00E9ntelo mas tarde"},
    }
    this.errorServidorWS = {
        "noresponde":{tipo:"error",mensaje:"SERVIDOR WS NO ESTA DANDO RESPUESTA POR FAVOR VERIFIQUE Q ESTE ARRIBA"}
    }
    this.errorIdentificacion = {
        "identificacion":{tipo:"error",mensaje:"LA IDENTIFICACION INGRESDA NO ES ACEPTADA"}
    }
}

module.exports = new Labels();
