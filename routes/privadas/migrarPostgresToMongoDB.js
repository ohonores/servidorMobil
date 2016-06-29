'use strict'
var mongodb = require('../../conexiones-basededatos/conexion-mongodb.js');
var postgres = require('../../conexiones-basededatos/conexion-postgres.js');
var hash = require('object-hash');
var Q = require('q');
var mongodbD = require('mongodb');
var Binary = mongodbD.Binary;
function getDatosPorDocumento(tipo, json){
    switch(tipo){
        case '01':
            return {
                razonSocial : json.factura.infoFactura[0].razonSocialComprador[0],
                identificacion : json.factura.infoFactura[0].identificacionComprador[0],
				direccionComprador:json.factura.infoFactura[0].direccionComprador[0],
				
                /*preimpreso:preimpreso[0],
                fecha:{emision:json.factura.infoFactura[0].fechaEmision[0]},
                total:json.factura.infoFactura[0].importeTotal[0]*/
                
            }
            
        case '04':
            return {
                razonSocial : json.notaCredito.infoNotaCredito[0].razonSocialComprador[0],
                identificacion : json.notaCredito.infoNotaCredito[0].identificacionComprador[0],
                /*preimpreso:preimpreso,
                fecha:{emision:json.notaCredito.infoNotaCredito[0].fechaEmision},
                total:json.notaCredito.infoNotaCredito[0].valorModificacion[0]*/
                
            }
            
        case '05':
            break;
        case '06':
             return {
                transportista : json.guiaRemision.infoGuiaRemision[0].razonSocialTransportista[0],
                transportistaIdentificacion : json.guiaRemision.infoGuiaRemision[0].rucTransportista[0],
                razonSocial : json.guiaRemision.destinatarios[0].destinatario[0].razonSocialDestinatario[0],
                identificacion : json.guiaRemision.destinatarios[0].destinatario[0].identificacionDestinatario[0],
                /*preimpreso:preimpreso,
                fecha:{inicio:json.guiaRemision.infoGuiaRemision[0].fechaIniTransporte[0],fin:json.guiaRemision.infoGuiaRemision[0].fechaFinTransporte[0]}*/
                
            }
           
          
        case '07':
            break;
    }
}
function getTotalQ(id, limite, busquedaInicio, callback) {
		getTotal(id, limite, busquedaInicio).then(function(id_){
			console.log("Grabados los ",limite," nuevo inicio ",id_);
			getTotalQ(id_, limite, busquedaInicio, callback);
		},function(e){
			callback(e);
		});
	
}
function crearColeccionesConIndices(coleccionesIndices){
	var deferred = Q.defer();
    var coleccionesIndicesArray = [];
	coleccionesIndices.forEach(function(d){
		d.indices.forEach(function(index){
			coleccionesIndicesArray.push(mongodb.crearIndices(d.coleccion,index));
		})
		
	})
	Q.all(coleccionesIndicesArray).then(function(r){
		console.log("Colecion e indices creados")
		deferred.resolve(true);
	},function(ru){
		console.log("Error e crearColeccionesConIndices ",ru)
		deferred.reject(false);
	});
	
	return deferred.promise;
}

function getDocumentos(coleccion) {
	var deferred = Q.defer();
    var datosAgrabar = [];
	 postgres.getPoolClienteConexion("select * from swissedi.eedittipo_documento_sri",[],
		function(resultado){
			datosAgrabar.push(mongodb.grabarRegistroGrupo(coleccion, resultado.rows ));
			Q.all(datosAgrabar).then(function(r){
			deferred.resolve("Ok ",coleccion," creados");
			},function(ru){
			deferred.resolve(resultado.rows[resultado.rows.length - 1].idpostgres);
			},function(x){
				console.log("x..",x);
			});
		}
	);
	return deferred.promise;
}
function grabarRegistrosEnMongo(parametros) {
	var deferred = Q.defer();
    var datosAgrabar = [];
	console.log(parametros);
	 postgres.getPoolClienteConexion(parametros.sql,[],
		function(resultado){
			datosAgrabar.push(mongodb.grabarRegistroGrupo(parametros.coleccion, resultado.rows ));
			Q.all(datosAgrabar).then(function(r){
			deferred.resolve("Ok ",coleccion," creados");
			},function(ru){
			  deferred.resolve(false);
			},function(x){
				console.log("x..",x);
			});
		}
	);
	return deferred.promise;
}
function getTotal(id, limite, busquedaInicio) {
	var deferred = Q.defer();
    var datosAgrabar = [];
    var sql = "select m.fechacreacion, m.id as idpostgres, md5(m.infjson::text) as hash, m.claveacceso,m.numeroautorizacion, replace(m.serie||m.comprobante,'-','')  as preimpreso,"+busquedaInicio.parametro+"  m.infjson, m.xmlorigen, m.xmlfirmado, m.xmlsri, m.ride , m.estado from swissedi.eeditmovimiento m join swissedi.eedittipo_documento_sri d on d.id=m.tipodocumentosri_id join swissedi.eeditempresa e on e.id=m.empresa_id  where m.estado=$1 and m.tipodocumentosri_id=$2  and m.empresa_id=$3 and m.ambiente=$4   and m.id>$5  order by m.id asc limit $6";
	//var sql = "select m.id as idpostgres, "+busquedaInicio.parametro+"  from swissedi.eeditmovimiento m join swissedi.eedittipo_documento_sri d on d.id=m.tipodocumentosri_id join swissedi.eeditempresa e on e.id=m.empresa_id  where m.estado=$1 and m.tipodocumentosri_id=$2  and m.empresa_id=$3 and m.ambiente=$4   and m.id>$5  order by m.id asc limit $6";
	console.log("getTotal ",id, limite, busquedaInicio);
    postgres.getPoolClienteConexion(sql,[busquedaInicio.estado, busquedaInicio.empresa_id,busquedaInicio.tipodocumentosri_id,busquedaInicio.ambiente, id, limite],
		function(resultado){
			
            if(resultado && resultado.rows && resultado.rows.length>0){
				console.log("Total encontrados ",resultado.rows.length);
				/*var ddd = resultado.rows.map(function(datoR){
					datoR.hash = hash(datoR.infjson);
                    /*var dato = {
                                hash:hash(datoR.infjson),
                                claseacceso:datoR.claveacceso,
                                json:datoR.infjson,
                                datos:getDatosPorDocumento(datoR.codigo, datoR.infjson, datoR.preimpreso),
                                xmlorigen:new Binary(datoR.xmlorigen),
                                xmlfirmado:new Binary(datoR.xmlfirmado),
                                xmlsri:new Binary(datoR.xmlsri),
                                rdie:new Binary(datoR.ride),
                                estado:datoR.estado,
                                fechamigracion:datoR.fechacreacion,
                                fecha:new Date()
                    }*/
				//	return datoR
				/*resultado.rows.forEach(function(dato){
					datosAgrabar.push(mongodb.grabarRegistroIndividual(busquedaInicio.coleccion, dato ));
				});*/
				datosAgrabar.push(mongodb.grabarRegistroGrupo(busquedaInicio.coleccion, resultado.rows ));
				Q.all(datosAgrabar).then(function(r){
					console.log("Grabados..");
					deferred.resolve(resultado.rows[resultado.rows.length - 1].idpostgres);
				},function(ru){
					console.log("ru..",ru);
					deferred.resolve(resultado.rows[resultado.rows.length - 1].idpostgres);
				},function(x){
					console.log("x..",x);
				});
							 
			}else{
				console.log("Fin getTotal");
				deferred.reject(true);
			}
			
		});
		
		
    return deferred.promise;
		
} 
//Ambiente de produccion
var ruc="0990018707001.2.A";
var busquedaInicio1 = {
	tipodocumentosri_id:1,
	empresa_id:1,
	ambiente:"2",
	estado:"A",
	coleccion:"emitidos.01."+ruc,
	indices:[
			{"$**":"text"},
			{"infjson.factura.infoFactura.identificacionComprador":1},
			{"infjson.factura.infoFactura.razonSocialComprador":1},
			{"infjson.factura.infoAdicional.campoAdicional.#":1},
			{"claveacceso":1,unique:true},
			{"hash":1, unique:true}
	],
	parametro:"m.infjson->'factura'->'infoFactura'->0->'importeTotal'->>0 as total, m.infjson->'factura'->'infoFactura'->0->'razonSocialComprador'->>0 as razonSocial,"
}
var busquedaInicio2 = {
	tipodocumentosri_id:2,
	empresa_id:1,
	ambiente:"2",
	estado:"A",
	coleccion:"04."+ruc,
	indices:[
			{"$**":"text"},
			{"infjson.notaCredito.infoNotaCredito.identificacionComprador":1},
			{"infjson.notaCredito.infoNotaCredito.razonSocialComprador":1},
			{"infjson.notaCredito.infoNotaCredito.campoAdicional.#":1},
			{"claveacceso":1,unique:true},
			{"hash":1, unique:true}
	],
	parametro:"m.infjson->'notaCredito'->'infoNotaCredito'->0->'valorModificacion'->>0 as total, m.infjson->'notaCredito'->'infoNotaCredito'->0->'razonSocialComprador'->>0 as razonSocial,"
}
var busquedaInicio3 = {
	tipodocumentosri_id:3,
	empresa_id:1,
	ambiente:"2",
	estado:"A",
	coleccion:"05."+ruc,
	indices:[
			{"$**":"text"},
			{"infjson.notaDebito.infoNotaDebito.identificacionComprador":1},
			{"infjson.notaDebito.infoNotaDebito.razonSocialComprador":1},
			{"infjson.notaDebito.infoNotaDebito.campoAdicional.#":1},
			{"claveacceso":1,unique:true},
			{"hash":1, unique:true}
	],
	parametro:"m.infjson->'notaDebito'->'infoNotaDebito'->0->'totalSinImpuestos'->>0 as total, m.infjson->'notaDebito'->'infoNotaDebito'->0->'razonSocialComprador'->>0 as razonSocial,"
	
}
var busquedaInicio4 = {
	tipodocumentosri_id:4,
	empresa_id:1,
	ambiente:"2",
	estado:"A",
	coleccion:"06."+ruc,
	indices:[
			{"$**":"text"},
			{"infjson.comprobanteRetencion.infoCompRetencion.identificacionSujetoRetenido":1},
			{"infjson.comprobanteRetencion.infoCompRetencion.razonSocialSujetoRetenido":1},
			{"infjson.comprobanteRetencion.infoCompRetencion.campoAdicional.#":1},
			{"infjson.comprobanteRetencion.infoCompRetencion.campoAdicional.#":1},
			{"claveacceso":1,unique:true},
			{"hash":1, unique:true}
			
	],
	parametro:"m.infjson->'comprobanteRetencion'->'infoCompRetencion'->0->'razonSocialSujetoRetenido'->>0 as razonSocial,"
	
}
var busquedaInicio5 = {
	tipodocumentosri_id:5,
	empresa_id:1,
	ambiente:"2",
	estado:"A",
	coleccion:"07."+ruc,
	indices:[
			{"$**":"text"},
			{"infjson.guiaRemision.infoGuiaRemision.razonSocialTransportista":1},
			{"infjson.guiaRemision.infoGuiaRemision.rucTransportista":1},
			{"infjson.guiaRemision.destinatarios.destinatario.razonSocialDestinatario":1},
			{"infjson.guiaRemision.destinatarios.destinatario.identificacionDestinatario":1},
			{"infjson.guiaRemision.infoGuiaRemision.campoAdicional.#":1},
			{"claveacceso":1,unique:true},
			{"hash":1, unique:true}
	],
	parametro:"m.infjson->'guiaRemision'->'infoGuiaRemision'->0->'razonSocialTransportista'->>0 as razonSocial, m.infjson->'guiaRemision'->'destinatarios'->0->'destinatario'->0->'razonSocialDestinatario'->>0 as razonSocialDestinatario, m.infjson->'guiaRemision'->'destinatarios'->0->'destinatario'->0->'identificacionDestinatario'->>0 as identificacionDestinatario,  "
}
//Nombres

var busquedaPorNombres={
	tipodocumentosri_id:1,
	empresa_id:1,
	ambiente:"2",
	estado:"A",
	coleccion:"clientes.proveedores",
	indices:[
			{"identificacion":1,unique:true},
			{"razonsocial":1},
			
	],
	parametro:"infjson->'factura'->'infoFactura'->0->'razonSocialComprador'->>0 as razonSocial, infjson->'factura'->'infoFactura'->0->'identificacionComprador'->>0 as identificacion, infjson->'factura'->'infoFactura'->0->'fechaEmision'->>0 as fecha, m.claveacceso, infjson->'factura'->'infoFactura'->0->'importeTotal'->>0 as importeTotal"
}

var busquedaEmpresas={
	
	coleccion:"eedcempresas",
	indices:[
			{"numero_ruc":1,unique:true},
	],
	sql:"select r.*  from swissedi.registro_unico_contribuyentes r join swissedi.eeditempresa e on r.numero_ruc=e.ruc and numero_establecimiento=' 1'"
}


var coleciones_ = [busquedaInicio1,busquedaInicio2,busquedaInicio3,busquedaInicio4,busquedaInicio5];
var coleciones2_ = [busquedaPorNombres];
var coleciones3_ = [busquedaEmpresas];
setTimeout(function(){
	/*getDocumentos("sri.documentos").then(function(d){
			console.log("ok ",d);
	})*/
	
	crearColeccionesConIndices(coleciones3_).then(function(d){
		console.log("ok ",d);
		grabarRegistrosEnMongo(coleciones3_[0]);
		/*coleciones_.forEach(function(busquedaInicio){
			getTotalQ(0, 10000, busquedaInicio, function(r){
				console.log(r);
			});
		});*/
		
	},function(error){
		console.log("error colecciones ", error);
	});
},10000);

//Creacion de 
//busquedaInicio.empresa_id,busquedaInicio.tipodocumentosri_id,busquedaInicio.ambiente
/*getTotalQ(0, 10000, busquedaInicio, function(r){
	console.log(r);
});*/

/*
db["clientes.proveedores"].aggregate([{$match:{"identificacion":"1714784251"}}, { $project:{_id:0,identificacion:1, documentosRecibidosEcuaquimicad:{ $filter:{ input:"$documentosRecibidosEcuaquimica.fechaemision", as:"fechaemision", cond:{$eq:["$$fechaemision","25082015"]}  } } } }])
db["01.0990018707001.2.A"].find({$text:{$search:"1790710319001"}},{"infjson.factura.detalles.detalle":1}).count()

 db["emitidos.01.0990018707001.2.A"].find({},{"fechacreacion":1,razonsocila:1,preimpreso:1,claveacceso:1,autorizacion:1,total:1}).sort({"fechacreacion":-1}).limit(10)

*/

