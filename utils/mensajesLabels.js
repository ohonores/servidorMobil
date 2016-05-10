var Labels = function() {
  // json

    this.errorIngreso001 = {
        "ingreso":{tipo:"error",mensaje:"Por favor int\u00E9ntelo mas tarde"},
    };
    this.errorServidorWS = {
        "noresponde":{tipo:"error",mensaje:"SERVIDOR WS NO ESTA DANDO RESPUESTA POR FAVOR VERIFIQUE Q ESTE ARRIBA"}
    };
    this.errorIdentificacion = {
        "identificacion":{tipo:"error",mensaje:"LA IDENTIFICACION o EMPRESA INGRESADA NO ES ACEPTADA"},
        "perfil":{tipo:"error",mensaje:"EL PERIFL INGRESADO NO ES ACEPTADO"},
    };
    this.errorIdentificacionNoExiste = {
        "identificacion":{tipo:"error",mensaje:"LA IDENTIFICACION NO EXISTE"}
    };
    this.errorToken = {
        "token":{tipo:"error",mensaje:"EL TOKEN NO ES ACEPTADO O YA ESTA EXPIRADO"},
        "notoken":{tipo:"error",mensaje:"TOKEN NO ENCONTRADO"}
    };
};

module.exports = new Labels();
