var EntidadesMongoOracle = require("./jsonEntity.js");
EntidadesMongoOracle.prototype.getStripValidacionUsuarioOracleConauto = function(){
    return "SELECT CLAVE from ecortpersona p JOIN ecortempresa_persona ep ON p.id=ep.persona_id JOIN esegtusuario u ON u.empresapersona_id=ep.id where identificacion=:IDENTIFICACION";
};
