var postgres = require('../conexiones-basededatos/conexion-postgres.js');
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
var MovmientoJS = function(){

}
MovmientoJS.prototype.getInformacionCliente = function(id, callBack){
    var sql = "SELECT true as cambiarinfo,  identificacion||' '||razonsocial||' '||email as query,* FROM swissedi.eeditpersona WHERE estado='A' AND id = $1";
    var criterios = [id];

    postgres.getPoolClienteConexion(sql, criterios, function(resultado){
        if(resultado && resultado.rows && resultado.rows.length>0){
            callBack(true, resultado.rows);
        }else{
            callBack(false);
        }
    });

}
MovmientoJS.prototype.getTipoDocumentos = function(callBack){
    postgres.getPoolClienteConexion("SELECT true as estado,id,codigo,descripcion,orden, id ||' '||codigo||' '||descripcion as query, docrecepsri,abreviado FROM swissedi.eedittipo_documento_sri ORDER BY id DESC ", null, function(resultado){
    	if(resultado && resultado.rows && resultado.rows.length>0){
            callBack(true,resultado.rows);
    	}else{
    		callBack(false);
        }
	});
}
var   tablaMovimientos = "swissedi.docelectronicos";
var   tablaMovimientosleft = "swissedi.docelectronicosleft";
MovmientoJS.prototype.consultarRegistrosDinamicamente = function(parametros, perfil, callback){

            parametros.tabla = perfil == "edi" ? tablaMovimientosleft : tablaMovimientos ;
            log.info(parametros.tabla);
            postgres.consultarRegistrosDinamicamente(parametros, function(registros){
                callback(registros);
    })

}
MovmientoJS.prototype.consultarTotalRegistrosDinamicamente = function(parametros, perfil, callback){
            parametros.tabla = perfil == "edi" ? tablaMovimientosleft : tablaMovimientos ;
            log.info(parametros.tabla);
            postgres.consultarTotalRegistrosDinamicamente(parametros,  function(registros){
                callback(registros);
    })

}
MovmientoJS.prototype.consultarclientesporcriterio = function(criterio, callBack){
    try{
		if(criterio){
			var criterios = ['%'+criterio+'%'];

			var sqlRegistros = "SELECT true as cambiarinfo, razonsocial, cliente_proveedor, ARRAY_TO_STRING(ARRAY[identificacion,razonsocial,email], ' ') as query,* FROM swissedi.eeditpersona where estado='A'   and  ARRAY_TO_STRING(ARRAY[identificacion,razonsocial,email], ' ')  ilike $1::varchar  limit 60";

			postgres.getPoolClienteConexion(sqlRegistros, criterio ? criterios:null, function(resultado){
					if(resultado){
                        callBack(true, resultado.rows);
					}else{
						callBack(false);
					}
			});
		}else{
		   callBack(false);
		}
	}catch(error){
		console.log(error);
		console.log(criterio)
	}
}

module.exports = new MovmientoJS();
