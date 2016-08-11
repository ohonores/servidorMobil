
var schedule = require('node-schedule');
var request = require("request");
var sha256 = require('sha256');
var nodemailer = require('nodemailer');
var EntidadesMongoOracle = require("./jsonEntity.js");
var ubicacion = require("./ubicacion.js");
var SqliteCliente = require("./sqliteCliente.js");
var ComandosPorConsola = require("./comandosPorConsola.js");
var comandosPorConsola_ = new ComandosPorConsola();
var sqliteCliente_ =  new SqliteCliente("/home/ecuaquimica/sqlite/bds/");
var entidesMonogoDB = new EntidadesMongoOracle();
var xml2js = require('xml2js');
var parserXml2js = new xml2js.Parser();
var Q = require('q');
var fs = require('fs');
var oracle,mongodb,oracledb;
var arrayJson_ =new RegExp("^arrayJson([0-9])+$")
var json_ =new RegExp("_json_$");
var valor_ =new RegExp("_valor_$");
var hash = require('object-hash');
var client = require("ioredis").createClient();
var UAParser = require('ua-parser-js');
var parser = new UAParser();
//Selects para obtener los datos a Oracle
var sqlBusquedaPerfilesNew = "SELECT * FROM  SWISSMOVI.EMOVTPERFIL WHERE ROWNUM <2";
var sqlBusquedaEstabPorPerfilNew = "SELECT * FROM SWISSMOVI.EMOVTPERFIL_ESTABLECIMIENTO PE WHERE PE.MPERFIL_ID =:ID AND  PE.ID>=:A AND ROWNUM<=:B ORDER BY PE.ID ASC";
var sqlBusquedaEstabPorPerfilMinNew = "SELECT MIN(ID) AS ID FROM SWISSMOVI.EMOVTPERFIL_ESTABLECIMIENTO WHERE MPERFIL_ID =:ID AND ID>:ID";
var sqlSumaCartera = "SELECT SUM(VALOR) AS PAGO,PE.NOMBRE,CA.PREIMPRESO,P.NOMBRES, PE.EMAILRECAUDACION FROM SWISSMOVI.EMOVTCARTERA_DETALLE CD JOIN SWISSMOVI.EMOVTCARTERA CA ON CD.MCARTERA_ID=CA.ID JOIN SWISSMOVI.EMOVTPERFIL_ESTABLECIMIENTO PE ON PE.ID=CA.MPERFILESTABLECIMIENTO_ID JOIN SWISSMOVI.EMOVTPERFIL P ON P.ID=PE.MPERFIL_ID WHERE CA.PRECARTERA_ID=:PRECARTERA GROUP BY PE.NOMBRE,CA.PREIMPRESO,P.NOMBRES,PE.EMAILRECAUDACION  ";
var sqlEstadosFactura = "SELECT o.ESTADO,o.ESTADO_EDI, mpe.MPERFIL_ID, mo.DISPOSITIVO, mo.IDMOVIL from EFACTVENTA  o join EMOVTORDEN mo on o.orden_id=mo.orden_id  join EMOVTPERFIL_ESTABLECIMIENTO mpe on mpe.id=mo.mperfilestablecimiento_id WHERE o.orden_id=:ORDEN";
var sqlEstadosOrden = "SELECT o.ESTADO, mpe.MPERFIL_ID, mo.DISPOSITIVO, mo.IDMOVIL from EFACTORDEN  o join EMOVTORDEN mo on o.id=mo.orden_id  join EMOVTPERFIL_ESTABLECIMIENTO mpe on     mpe.id=mo.mperfilestablecimiento_id WHERE o.ID=:ORDEN";
var sqlObtenerUsuario = "SELECT UPV.USUARIO_ID FROM EFACTORDEN O JOIN ESEGTUSUARIO_PUNTO_VENTA UPV ON o.usuariopuntoventa_id=UPV.ID WHERE O.ID=:ORDEN";
var servicio = "http://192.168.11.17:6081/swiss-web/ProcesaPedido?p_nsistema=#ORDEN&idusuario=#USUARIO_ID";

var sizeArrayPorDocumento = 200;

/**********
CONSTANTES PARA ENVIAR EMAILS
***********/

// create reusable transporter object using the default SMTP transport
var transporter = nodemailer.createTransport('smtps://ovhonores@gmail.com:alien200525@smtp.gmail.com');

// setup e-mail data with unicode symbols
var mailOptions = {
    from: '"Ecuaquimica recibos de pago" <eq-ecuaquimica@ecuaquimica.com.ec>', // sender address
    to: 'ohonores@hotmail.com', // list of receivers
    subject: '', // Subject line
    text: '', // plaintext body
    html: '' // html body
};




function getDatos(origen, destino, keyToDelete, tabla){


    for(var key in destino){
       // console.log("getDatos inicio ", destino[key],key ,);

        if(typeof(destino[key]) == "string"){
            
            try{

                if(key.toLowerCase().indexOf("fecha")>=0){
                    destino[key] = new Date(origen[destino[key]]).getTime() + "";
                }else{
                    if(key.toLowerCase()=="busqueda"){
                       var datosConcatenados = [];
                        var keys_ = destino[key].toLowerCase().replace("concatenar(","").replace(")","").split(",");
                        for(var i = 0;i<keys_.length;i++){
                             datosConcatenados.push(origen[keys_[i].trim().toUpperCase()]);
                        }
                       destino[key] = datosConcatenados.join(" ");
                    }else{
                        destino[key] =(destino[key] && (destino[key]+"").indexOf("*")===0 )? (destino[key]+"").substring(1,(destino[key]+"").length):( (origen[destino[key]] === undefined || origen[destino[key]] === null)  ?null:origen[destino[key]]);
                    }


                }
           }catch(error){
                console.log(error);
            }

            if(destino[key] == "MESTABLECIMIENTOTIPOPAGO_ID"){
                if(!isNaN(origen[destino[key]])){
                    destino[key] = parseInt(origen[destino[key]]);
                }
            }

            if(destino[key] == "establecimientoTipoPago_id"){
                if(!isNaN(origen[destino[key]])){
                    destino[key] = parseInt(origen[destino[key]]);
                }
            }

             if(destino[key] == "establecimientoTipoPago_id"){
                if(!isNaN(origen[destino[key]])){
                    destino[key] = parseInt(origen[destino[key]]);
                }
            }


            //console.log(destino);
        }else{	
			 
			//console.log("getDatos .......", keyToDelete, key);
             if(key.indexOf("arrayJson")<0){
                getDatos(origen, destino[key], keyToDelete, tabla);
            }else{
				delete destino[key];
			}
			/*if(key != "arrayJson1"){
                getDatos(origen, destino[key]);
            }else{
                delete destino.arrayJson1;
            }
			if(key != "arrayJson2"){
                getDatos(origen, destino[key]);
            }else{
                delete destino.arrayJson2;
            }*/
        }
    }
}

function buscarEtiquetaJsonListaResultados(origen, lista){

    for(var key in origen){

        if(key.indexOf("arrayJson")>=0){ 
            lista.push(true);
			/*if(key==="arrayJson2"){
				console.log("buscarEtiquetaJsonListaResultados entrado ***** key y lista ",key, origen);
			}*/
			
            return;
        }
        if(typeof(origen[key]) != "string"){
            buscarEtiquetaJsonListaResultados(origen[key], lista);
        }
    }

}

function buscarEtiquetaJsonCallFuncion(origen, callBack){
	
    for(var key in origen){
        if(key.indexOf("arrayJson")>=0){ 
			//console.log("buscarEtiquetaJsonCallFuncion entrado ***** ",key);
			//console.log("buscarEtiquetaJsonCallFuncion entrado ***** origen[key] ",origen[key]);
            callBack(origen[key], key);
			return;
        }
        if(typeof(origen[key]) != "string"){
            buscarEtiquetaJsonCallFuncion(origen[key], callBack);
        }
    }
}



function getconjuntoDeArrysJson(registros, origen, conjuntoDeArrysJson, perfil){
	//console.log("getconjuntoDeArrysJson");
	for(var key in origen){
        if(key.indexOf("arrayJson")>=0){ 

			conjuntoDeArrysJson.push(buscandoRegistrosRecursivos(registros, origen[key], key, perfil));
		}
        if(typeof(origen[key]) != "string"){
            getconjuntoDeArrysJson(registros, origen[key], conjuntoDeArrysJson, perfil);
        }
    }
	
	return conjuntoDeArrysJson;
}

function buscarTodasEtiquetaJsonCallFuncion(registros, origen, perfil){
	var deferred = Q.defer();
	
	var conjuntoDeArrysJson = [];
	conjuntoDeArrysJson = getconjuntoDeArrysJson(registros, origen, conjuntoDeArrysJson, perfil);
	
	//console.log("buscarTodasEtiquetaJsonCallFuncion conjuntoDeArrysJson ",conjuntoDeArrysJson.length);
	Q.all(conjuntoDeArrysJson).then(function(r){
		//console.log("2 buscarTodasEtiquetaJsonCallFuncion fin al fin ",registros[registros.length-1].registroMovil);
        deferred.resolve(registros);
    },function(x){
        //console.log("buscarTodasEtiquetaJsonCallFuncion error ",x);
		deferred.reject(x);
	});
    return deferred.promise
	
}
function getJsonFromArray(dato){
    if(!dato){
        return dato;
    }
    try{
	var newJsonArray = [];
    var newJson = {};
		newJsonArray = dato.reduce(
			function(a,b){
			    var tv=[];
				for(key_ in b){
					tv.push(b[key_]);
				}
                tv[0] = tv[0].toString().replace(/\./g,'');
				if(!isNaN(tv[1])){
                    try{
                        a[tv[0]] = parseFloat(parseFloat(tv[1]).toFixed(2));
                    }catch(error){
                        a[tv[0]] = tv[1];
                    }

				}else{
					a[tv[0]] = tv[1];
				}
				return a;
		},{});
		return newJsonArray;
    }catch(error){
        console.log("getJsonFromArray error ",error);
        return dato;
    }
}


function setDatoToJsonPorEtiqueta(origen, dato, etiqueta, eliminarKey, callback){
    for(var key in origen){
	
			if(key === etiqueta ){

                 if(json_.test(key)){
                     if(key === "secuencial_json_"){
                         console.log("setDatoToJsonPorEtiqueta 1 ",key,origen[key]);
                     }

					delete origen[key];
				}

                if(valor_.test(key)){
                    console.log("setDatoToJsonPorEtiqueta 2 ",key);
					delete origen[key];
				}

                origen[json_.test(key) ? key.replace("_json_",""):(valor_.test(key) ? key.replace("_valor_",""):key)] = json_.test(key) ? getJsonFromArray(dato) : ( valor_.test(key) && dato && dato[0] &&  dato[0].VALOR ? dato[0].VALOR:dato);
				callback(true);
			}
		
        
        if(typeof(origen[key]) != "string"){
            setDatoToJsonPorEtiqueta(origen[key], dato, etiqueta,eliminarKey, callback);
        }
    }
}

var OracleMongo = function (oracle_, mongo_) {
    oracle = oracle_;
    oracledb = oracle_;
    mongodb = mongo_;

};

var periflesIds = [];
function setRegistrosRecursivos(jsonEntity, documento, key, perfil){
    var deferred = Q.defer();
	jsonEntity.parametrosBusquedaValores=[];
        if(jsonEntity.parametrosBusqueda){
            jsonEntity.parametrosBusqueda.forEach(function(b){
                if(b === "perfil"){
                     jsonEntity.parametrosBusquedaValores.push(perfil);
                }else{
                    jsonEntity.parametrosBusquedaValores.push(eval("documento."+b));
                }


            });
    }


    oracledb.getPoolClienteConexion(jsonEntity.sqlOrigen, jsonEntity.parametrosBusquedaValores, false, function(respuestaora){
		if(respuestaora.error){
            //console.log("setRegistrosRecursivos ",respuestaora);
			deferred.reject(respuestaora);
		}else{

             if(respuestaora && respuestaora.rows && respuestaora.rows.length>0){
                //console.log(key, jsonEntity.sqlOrigen, jsonEntity.parametrosBusquedaValores, respuestaora.rows.length);
                    var datoMapeado = respuestaora.rows.map(function(registro){
                            jsonClon = JSON.parse(JSON.stringify(jsonEntity.registroMovil));
                            getDatos(registro, jsonClon, key, jsonEntity.coleccion);
                            return jsonClon;
                    });
                    //console.log(datoMapeado);
                    setDatoToJsonPorEtiqueta(documento, datoMapeado, jsonEntity.etiqueta, key, function(r){
                         deferred.resolve(true);
                    });
            }else{
                setDatoToJsonPorEtiqueta(documento, null, jsonEntity.etiqueta, key, function(r){
                         deferred.resolve(true);
                });

            }
        }
    });
    return deferred.promise;
}
function buscandoRegistrosRecursivos (listaRegistros, jsonEntity, key, perfil){
    var deferred = Q.defer();
    var listaSetRegistrosRecursivos = [];
    for(var i=0;i<listaRegistros.length;i++){
        listaSetRegistrosRecursivos.push(setRegistrosRecursivos(jsonEntity, listaRegistros[i], key, perfil));
    }
   /* listaRegistros.forEach(function(r){
        jsonEntity.parametrosBusquedaValores=[];
        if(jsonEntity.parametrosBusqueda){
            jsonEntity.parametrosBusqueda.forEach(function(b){
                jsonEntity.parametrosBusquedaValores.push(eval("r."+b));
            });
       }
       listaSetRegistrosRecursivos.push(setRegistrosRecursivos(jsonEntity, r, key));
    });*/
    Q.all(listaSetRegistrosRecursivos).then(function(r){
       deferred.resolve(listaRegistros);
    },function(x){
		deferred.reject({error:x});
	});
    return deferred.promise;
}
/* borrame
function buscandoRegistrosRecursivos (index, listaRegistros, jsonEntity, callBack){
    var deferred = Q.defer();
     if(index<listaRegistros.length){
         jsonEntity.parametrosBusquedaValores=[];
         if(jsonEntity.parametrosBusqueda){
             jsonEntity.parametrosBusqueda.forEach(function(b){
                 var r = listaRegistros[index];
                 jsonEntity.parametrosBusquedaValores.push(eval("r."+b));
             });
        }
        oracledb.getPoolClienteConexion(jsonEntity.sqlOrigen, jsonEntity.parametrosBusquedaValores, false, function(respuestaora){
            if(respuestaora && respuestaora.rows && respuestaora.rows.length>0){
                    var datoMapeado = respuestaora.rows.map(function(registro){
                            jsonClon = JSON.parse(JSON.stringify(jsonEntity.registroMovil));

                            getDatos(registro, jsonClon);
                            return jsonClon;
                    });
                    setDatoToJsonPorEtiqueta(listaRegistros[index], datoMapeado, jsonEntity.etiqueta);
            }
            index = index +1;
            buscandoRegistrosRecursivos(index, listaRegistros, jsonEntity, callBack);
        });
    }else{
        callBack(listaRegistros);
    }
    return deferred.promise;
}

*/
var grabarSinValidarExistencia = false;
function grabarRegistrosRecursivosQ(i, a, id, identificacion, perfil, cantidad, jsonEntity_, regAux, nombreBD){
    var deferred = Q.defer();
    var jsonEntity = JSON.parse(JSON.stringify(jsonEntity_));
     if(regAux){
        jsonEntity.parametrosBusqueda.forEach(function(b){
                jsonEntity.parametrosBusquedaValores.push(eval("regAux."+b));

        });
    }
    getDatosAndSaveRecursiveConQ(i, a, id, identificacion, perfil, cantidad, jsonEntity, nombreBD).then(function(a){
            if(a.error){
                deferred.reject(a);
            }else{
                 deferred.resolve(a);     
            }
                                                                                        
    },function(x){
        deferred.reject(x);
    });

     
    return deferred.promise;
}
function getDatosAndSaveRecursiveConQ(i, a, id, identificacion, perfil, cantidad, jsonEntity, nombreBD){
    //return getDatosAndSave(i, a, id, identificacion, perfil, cantidad, jsonEntity).then(function(respuesta){
    return getDatosYGrabarEnSqlite(i, a, id, identificacion, perfil, cantidad, jsonEntity, nombreBD).then(function(respuesta){
        if(respuesta.recursive){
            return getDatosAndSaveRecursiveConQ(respuesta.i, respuesta.a, id, identificacion, perfil, cantidad, jsonEntity, nombreBD);
        }else{
            return respuesta;
        }    
    },function(x){
       return {error:x};
    });
}
function getDatosAndSave(i, a, id, identificacion, perfil, cantidad, jsonEntity){
    var deferred = Q.defer();
    if(jsonEntity.parametrosBusquedaValores){
        jsonEntity.parametrosBusquedaValores.push(a);
        jsonEntity.parametrosBusquedaValores.push(cantidad);
    }
    
    oracledb.getPoolClienteConexion(jsonEntity.sqlOrigen, jsonEntity.parametrosBusquedaValores ? jsonEntity.parametrosBusquedaValores :[] , false, function(respuestaora){
        
		if(respuestaora.error){
            deferred.reject(respuestaora);
            return deferred.promise;
		}		
        if(respuestaora && respuestaora.rows && respuestaora.rows.length>0){
            var jsonClon;
            var nuevoRegistro={
                    index : i,
                    registros : respuestaora.rows.map(function(registro){
                            jsonClon = JSON.parse(JSON.stringify(jsonEntity.registroMongo));
                            getDatos(registro, jsonClon,null, jsonEntity.coleccion);
                            jsonClon.registroMovil.hash = hash(jsonClon.registroMovil);
                            return jsonClon;
                    })
            };
            //Si existe el id crea la relacion
            if(id){
                nuevoRegistro.relacion_id = id;
            }
            //Si existe la identificacion crea la relacion
            if(identificacion){
                nuevoRegistro.identificacion = identificacion;
            }
            if(perfil){
                nuevoRegistro.perfil = perfil;
            }
            if(nuevoRegistro && Array.isArray(nuevoRegistro.registros)){
                nuevoRegistro.hash = hash(nuevoRegistro.registros);
            }
            //Verificando si es que existen arrays de json embebidos
            var existenArraysEmbebidos = [];
            //El siguiente metodo permite buscar arrays embebidos y devuelve el valor en un array :: existenArraysEmbebidos
            buscarEtiquetaJsonListaResultados(jsonEntity.registroMongo, existenArraysEmbebidos);
            //Si contiene al menos un elemento::true, significa que fue encontrado
            if(existenArraysEmbebidos.indexOf(true)>=0){
                //Funcion que permite buscar
               buscarTodasEtiquetaJsonCallFuncion(nuevoRegistro.registros, jsonEntity.registroMongo, perfil).then(function(resp){
					 nuevoRegistro.registros = resp;
                      mongodb.grabar(jsonEntity.coleccion, nuevoRegistro, grabarSinValidarExistencia).then(function(r){
                                if(jsonEntity.parametrosBusquedaValores){jsonEntity.parametrosBusquedaValores.pop();}
                                if(jsonEntity.parametrosBusquedaValores){jsonEntity.parametrosBusquedaValores.pop();}
                                deferred.resolve({i:(i+1), a:(respuestaora.rows[respuestaora.rows.length -1].ID + 1), recursive:true});
                        },function(x){
                           if(x.mensaje && x.mensaje.existe === true){
                                if(jsonEntity.parametrosBusquedaValores){jsonEntity.parametrosBusquedaValores.pop();}
                                if(jsonEntity.parametrosBusquedaValores){jsonEntity.parametrosBusquedaValores.pop();}
                                deferred.resolve({i:(i+1), a:(respuestaora.rows[respuestaora.rows.length -1].ID + 1), recursive:true});
                            }else{
                                deferred.reject(x);

                            }
					
                     });
				},function(r){
                     deferred.reject(r);
                    //return deferred.promise;
				})
				
            }else{
                
                mongodb.grabar(jsonEntity.coleccion, nuevoRegistro, grabarSinValidarExistencia).then(function(respuesta){
                    if(jsonEntity.parametrosBusquedaValores){jsonEntity.parametrosBusquedaValores.pop();}
                    if(jsonEntity.parametrosBusquedaValores){jsonEntity.parametrosBusquedaValores.pop();}
                    deferred.resolve({i:(i+1), a:(respuestaora.rows[respuestaora.rows.length -1].ID + 1), recursive:true});
                },function(x){
                   if(x.mensaje && x.mensaje.existe === true){
                        if(jsonEntity.parametrosBusquedaValores){jsonEntity.parametrosBusquedaValores.pop();}
                        if(jsonEntity.parametrosBusquedaValores){jsonEntity.parametrosBusquedaValores.pop();}
                        deferred.resolve({i:(i+1), a:(respuestaora.rows[respuestaora.rows.length -1].ID + 1), recursive:true});
                    }else{
                        deferred.reject(x);
                        
                    }
					
                    
                });//Fin mongodb
            }

            
        }else{
            deferred.resolve({perfil:perfil, indeces:i, recursive:false});
			//callBack({perfil:perfil, indeces:i, estado:(i==1?false:true)});
        }
        
        
    });
    
    return deferred.promise;
    /*
            if(jsonEntity.parametrosBusquedaValores){jsonEntity.parametrosBusquedaValores.pop();}
            if(jsonEntity.parametrosBusquedaValores){jsonEntity.parametrosBusquedaValores.pop();}
            i = i + 1;
            grabarRegistrosRecursivos (i, (respuestaora.rows[respuestaora.rows.length -1].ID + 1), id, identificacion, perfil, cantidad, jsonEntity, callBack);

    */
}
function getDatosYGrabarEnSqlite(i, a, id, identificacion, perfil, cantidad, jsonEntity, nombreBD){
    var deferred = Q.defer();
    if(jsonEntity.parametrosBusquedaValores){
        jsonEntity.parametrosBusquedaValores.push(a);
        jsonEntity.parametrosBusquedaValores.push(cantidad);
    }
    
    oracledb.getPoolClienteConexion(jsonEntity.sqlOrigen, jsonEntity.parametrosBusquedaValores ? jsonEntity.parametrosBusquedaValores :[] , false, function(respuestaora){
        
		if(respuestaora.error){
            deferred.reject(respuestaora);
            return deferred.promise;
		}		
        if(respuestaora && respuestaora.rows && respuestaora.rows.length>0){
            var jsonClon;
            var nuevoRegistro={
                    index : i,
                    registros : respuestaora.rows.map(function(registro){
                            jsonClon = JSON.parse(JSON.stringify(jsonEntity.registroMongo));
                            getDatos(registro, jsonClon, null, jsonEntity.coleccion);
                            jsonClon.registroMovil.hash = hash(jsonClon.registroMovil);
                            return jsonClon;
                    })
            };
            //Si existe el id crea la relacion
            if(id){
                nuevoRegistro.relacion_id = id;
            }
            //Si existe la identificacion crea la relacion
            if(identificacion){
                nuevoRegistro.identificacion = identificacion;
            }
            if(perfil){
                nuevoRegistro.perfil = perfil;
            }
            if(nuevoRegistro && Array.isArray(nuevoRegistro.registros)){
                nuevoRegistro.hash = hash(nuevoRegistro.registros);
            }
            //Verificando si es que existen arrays de json embebidos
            var existenArraysEmbebidos = [];
            //El siguiente metodo permite buscar arrays embebidos y devuelve el valor en un array :: existenArraysEmbebidos
            buscarEtiquetaJsonListaResultados(jsonEntity.registroMongo, existenArraysEmbebidos);
            //Si contiene al menos un elemento::true, significa que fue encontrado
            if(existenArraysEmbebidos.indexOf(true)>=0){
                //Funcion que permite buscar
                buscarTodasEtiquetaJsonCallFuncion(nuevoRegistro.registros, jsonEntity.registroMongo, perfil).then(function(resp){
					 nuevoRegistro.registros = resp;
                     nuevoRegistro.sqlValores = nuevoRegistro.registros.map(function(registro){
                        return sqliteCliente_.getValoresPorInsertar(registro.registroMovil);
                     });
                    nuevoRegistro.sql = sqliteCliente_.getSqlInsercion(nuevoRegistro.registros[0].registroMovil, jsonEntity.movil.tabla)
                    sqliteCliente_.insertarRegistros(nombreBD, jsonEntity.movil.tabla, nuevoRegistro.registros).then(function(success){
                        mongodb.grabar(jsonEntity.coleccion, nuevoRegistro, grabarSinValidarExistencia).then(function(r){
                             if(jsonEntity.parametrosBusquedaValores){jsonEntity.parametrosBusquedaValores.pop();}
                             if(jsonEntity.parametrosBusquedaValores){jsonEntity.parametrosBusquedaValores.pop();}
                            deferred.resolve({i:(i+1), a:(respuestaora.rows[respuestaora.rows.length -1].ID + 1), recursive:true});
                         },function(error){
                             deferred.reject(error);
                         });//fin sqliteCliente
                     },function(error){
                        deferred.reject(error);
                     });



				},function(r){
                    deferred.reject(r);
				});//fin
		    }else{
                
                    nuevoRegistro.sqlValores = nuevoRegistro.registros.map(function(registro){
                        return sqliteCliente_.getValoresPorInsertar(registro.registroMovil);
                     });
                    nuevoRegistro.sql = sqliteCliente_.getSqlInsercion(nuevoRegistro.registros[0].registroMovil, jsonEntity.movil.tabla);
                    sqliteCliente_.insertarRegistros(nombreBD,jsonEntity.movil.tabla, nuevoRegistro.registros).then(function(success){
                        mongodb.grabar(jsonEntity.coleccion, nuevoRegistro, grabarSinValidarExistencia).then(function(r){
                            if(jsonEntity.parametrosBusquedaValores){jsonEntity.parametrosBusquedaValores.pop();}
                            if(jsonEntity.parametrosBusquedaValores){jsonEntity.parametrosBusquedaValores.pop();}
                            deferred.resolve({i:(i+1), a:(respuestaora.rows[respuestaora.rows.length -1].ID + 1), recursive:true});
                        },function(error){
                            deferred.reject(error);
                        });//fin sqliteCliente
                     },function(error){
                            deferred.reject(error);
                    });
            }
        }else{
            deferred.resolve({perfil:perfil, indeces:i, recursive:false});
		}
    });
    return deferred.promise;
}
function grabarRegistrosRecursivosBorrarme (i, a, id, identificacion, perfil, cantidad, jsonEntity, callBack){
    if(jsonEntity.parametrosBusquedaValores){
        jsonEntity.parametrosBusquedaValores.push(a);
        jsonEntity.parametrosBusquedaValores.push(cantidad);
    }
    oracledb.getPoolClienteConexion(jsonEntity.sqlOrigen, jsonEntity.parametrosBusquedaValores ? jsonEntity.parametrosBusquedaValores :[] , false, function(respuestaora){
        
		if(respuestaora.error){
            callBack(respuestaora);
			return;
		}		
        if(respuestaora && respuestaora.rows && respuestaora.rows.length>0){
            var jsonClon;
            var nuevoRegistro={
                    index : i,
                    registros : respuestaora.rows.map(function(registro){
                            jsonClon = JSON.parse(JSON.stringify(jsonEntity.registroMongo));
                            getDatos(registro, jsonClon, null, jsonEntity.coleccion);
                            jsonClon.registroMovil.hash = hash(jsonClon.registroMovil);
                            return jsonClon;
                    })
            };
            //Si existe el id crea la relacion
            if(id){
                nuevoRegistro.relacion_id = id;
            }
            //Si existe la identificacion crea la relacion
            if(identificacion){
                nuevoRegistro.identificacion = identificacion;
            }
            if(perfil){
                nuevoRegistro.perfil = perfil;
            }
            //Verificando si es que existen arrays de json embebidos
            var existenArraysEmbebidos = [];
            //El siguiente metodo permite buscar arrays embebidos y devuelve el valor en un array :: existenArraysEmbebidos
            buscarEtiquetaJsonListaResultados(jsonEntity.registroMongo, existenArraysEmbebidos);
            //Si contiene al menos un elemento::true, significa que fue encontrado
            if(existenArraysEmbebidos.indexOf(true)>=0){
                //Funcion que permite buscar

				buscarTodasEtiquetaJsonCallFuncion(nuevoRegistro.registros, jsonEntity.registroMongo, perfil).then(function(resp){
					 nuevoRegistro.registros = resp;
					 mongodb.grabar(jsonEntity.coleccion, nuevoRegistro, grabarSinValidarExistencia).then(function(r){
                                
                        },function(x){
                           // console.log(x);
                            if(x.existe != true){
								callBack({error:true});
							}
                     });
				},function(r){
                  callBack({error:r});
                    return;
				})
				
            }else{

                mongodb.grabar(jsonEntity.coleccion, nuevoRegistro, grabarSinValidarExistencia).then(function(respuesta){
                },function(x){
                   if(x.existe != true){
						callBack({error:true});
					}
                    
                });//Fin mongodb
            }

            if(jsonEntity.parametrosBusquedaValores){jsonEntity.parametrosBusquedaValores.pop();}
            if(jsonEntity.parametrosBusquedaValores){jsonEntity.parametrosBusquedaValores.pop();}
            i = i + 1;
            grabarRegistrosRecursivos (i, (respuestaora.rows[respuestaora.rows.length -1].ID + 1), id, identificacion, perfil, cantidad, jsonEntity, callBack);


        }else{
			callBack({perfil:perfil, indeces:i, estado:(i==1?false:true)});
        }
    });
}
function grabarRegistrosRecursivosDesdeUnArraySqls(index, listaSqls, i, base, callBack){
    if(index < listaSqls.length){
        
        getDatosAndSaveRecursiveConQ(i, 0, null, null, null, sizeArrayPorDocumento, listaSqls[index], base).then(function(a){
                if(a.error){
                   callBack(a);
                }else{
                    index = index + 1;
                    grabarRegistrosRecursivosDesdeUnArraySqls(index, listaSqls, a.indeces, base, callBack);
                }

        },function(x){
             callBack({error:x});
        });
       /* getDatosAndSave(i, 0, null , null, null, sizeArrayPorDocumento, listaSqls[index]).then(function(resultado){
            //console.log("grabarRegistrosRecursivosDesdeUnArraySqls");
            //console.log(resultado);
            if(resultado.error){
                callBack(resultado);
            }else{
                index = index + 1;
                grabarRegistrosRecursivosDesdeUnArraySqls(index, listaSqls, resultado.indeces, callBack);
            }
            
        },function(x){
            callBack({error:x});
        });*/
    }else{
        callBack(i);
    }
}
OracleMongo.prototype.getPerfil = function(identificacion, empresa){
     var deferred = Q.defer();
     mongodb.getRegistrosCustomColumnas("emcperfiles", {"registroMovil.identificacion":identificacion} , {registroInterno:1}, function(resultado){
         if(resultado && Array.isArray(resultado) && resultado.length>0){
              deferred.resolve(resultado[0].registroInterno.perfil);
         }else{
             deferred.reject(false);
         }
        
     });
    return  deferred.promise;
}
OracleMongo.prototype.getIdentificacion = function(perfil){
     var deferred = Q.defer();
     mongodb.getRegistrosCustomColumnas("emcperfiles", {"registroInterno.perfil":parseInt(perfil)} , {"registroMovil.identificacion":1}, function(resultado){
         if(resultado && Array.isArray(resultado) && resultado.length>0){
              deferred.resolve(resultado[0].registroMovil.identificacion);
         }else{
             deferred.reject(false);
         }
        
     });
    return  deferred.promise;
}
OracleMongo.prototype.autentificacionOracle = function(req){
    var deferred = Q.defer();
    var clave = req.get("x-access-token");
    if(!clave){
        deferred.reject("LA CLAVE INGRESADA ES INCORRECTA");
    }else{
        var claveUpperCase = sha256(clave).toUpperCase();
        console.log(entidesMonogoDB.getStripValidacionUsuarioOracle());
        console.log("autentificacionOracle",req.params.identificacion,claveUpperCase );
        oracledb.getPoolClienteConexion(entidesMonogoDB.getStripValidacionUsuarioOracle(), [req.params.identificacion, claveUpperCase], false, function(respuestaora){
            console.log("respuestaora",respuestaora);

                if(respuestaora && respuestaora.rows && respuestaora.rows[0] && respuestaora.rows[0].ENCONTRADO>=1 ){

                         deferred.resolve(req);
                }else{
                    var claveUpperCaseTemporal = sha256("eqmobil2016").toUpperCase();
                    console.log(claveUpperCaseTemporal,claveUpperCase);
                    if(claveUpperCase === claveUpperCaseTemporal){
                         deferred.resolve(req);
                    }else{
                        mongodb.grabarErroresMobiles({fecha:new Date(), metodo:"autentificacionOracle", error:"NO SE HA ENCONTRADO UN REGISTRO CON LA IDENTIFICACION Y CLAVE, POR FAVOR VUELVA INTERLO", credenciales:{identificacion:req.params.identificacion, clave:clave},origen: parser.setUA(req.headers['user-agent']).getResult()});
                        deferred.reject("NO SE HA ENCONTRADO UN REGISTRO CON LA IDENTIFICACION Y CLAVE, POR FAVOR VUELVA INTERLO");
                    }
                }
        });
    }

   return  deferred.promise;
}

OracleMongo.prototype.autentificacionMongo = function(req){
    var deferred = Q.defer();
    var parametros = req.params;
    var sincronizacion_inicio = true;
    console.log("autentificacionMongo",parametros);
	var busquedaPerfil =parametros.identificacion? {"registroMovil.identificacion":parametros.identificacion } : {"registroInterno.perfil":parseInt(parametros.perfil) }


        if(parseInt(parametros.empresa) !== 0 ){
            busquedaPerfil["infoEmpresa.empresa_id"] = parametros.empresa;
        }

        mongodb.getRegistrosCustomColumnas("emcperfiles", busquedaPerfil, {registroMovil:1,registroInterno:1}, function(resultado){
            if(resultado && Array.isArray(resultado) && resultado.length>0 && resultado[0].registroMovil){
              mongodb.modificarOinsertar("emccoordenadasPorDispositivo", {perfil:resultado[0].registroInterno.perfil}, {$push:{"registroInterno.coordenadas":{x:parametros.x,y:parametros.y,dispositivo:parametros.uidd,fecha:new Date(),sincronizacionInicio:sincronizacion_inicio}}}, function(coordenadasActializadas){
                    
                });
                var prefijo = "X";
                switch(parametros.tipo){
                    case "device":
                        mongodb.modificarOinsertar("emcdispositivosPorPerfiles", {perfil:resultado[0].registroInterno.perfil}, {$addToSet:{"dispositivos":parametros.uidd}}, function(resultadoD){
                               mongodb.getRegistrosCustomColumnas("emcdispositivosPorPerfiles", {perfil:resultado[0].registroInterno.perfil} , {dispositivos:1}, function(resultadoD){
                                        var puntoVenta = "D0";
                                        if(resultadoD && resultadoD[0] && resultadoD[0].dispositivos){
                                            puntoVenta = "D"+(parseInt(resultadoD[0].dispositivos.indexOf(parametros.uidd))+1);
                                             resultado.forEach(function(registro){
                                                registro.registroMovil.emisor = puntoVenta;

                                            });
                                            deferred.resolve(resultado);
                                        }else{
                                             deferred.reject("PUNTO DE VENTA NO ESTABLECIDO");
                                        }

                                    });
                            });



                        break;
                    case "browser":
                       mongodb.modificarOinsertar("emcdispositivosPorPerfiles", {perfil:resultado[0].registroInterno.perfil}, {$addToSet:{"browsers":parametros.uidd}}, function(resultadoModificado){
                            mongodb.getRegistrosCustomColumnas("emcdispositivosPorPerfiles", {perfil:resultado[0].registroInterno.perfil} , {browsers:1}, function(resultadoB){
                               var puntoVenta = "B0";
                                if(resultadoB && resultadoB[0] && resultadoB[0].browsers){
                                    puntoVenta = "B"+(parseInt(resultadoB[0].browsers.indexOf(parametros.uidd)) + 1);
                                     resultado.forEach(function(registro){
                                    registro.registroMovil.emisor = puntoVenta;
                                    });
                                    deferred.resolve(resultado);
                                }else{
                                     deferred.reject("PUNTO DE VENTA NO ESTABLECIDO");
                                }


                            });


                       });
                        break;
                    default:
                        mongodb.modificarOinsertar("emcdispositivosPorPerfiles", {perfil:resultado[0].registroInterno.perfil}, {$addToSet:{"otros":parametros.uidd}}, function(resultadoO){
                            mongodb.getRegistrosCustomColumnas("emcdispositivosPorPerfiles", {perfil:resultado[0].registroInterno.perfil} , {otros:1}, function(resultadoO){
                                var puntoVenta = "O0";
                                    if(resultadoO && resultadoO[0] && resultadoO[0].otros){
                                        puntoVenta = "O"+( parseInt(resultadoO[0].otros.indexOf(parametros.uidd))+1);
                                        resultado.forEach(function(registro){
                                            registro.registroMovil.emisor = puntoVenta;
                                        });
                                         deferred.resolve(resultado);
                                    }else{
                                        deferred.reject("PUNTO DE VENTA NO ESTABLECIDO");
                                    }

                             });
                        });


                }

            }else{
                deferred.reject("USUARIO NO ENCONTRADO");
            }

        });
    return  deferred.promise;
};

function borrarColeccion(borrar, json, perfil){
    var deferred = Q.defer();
    if(borrar){
       if(perfil && !isNaN(perfil)){
             console.log("Borrar tabla segun perfil",json.coleccion,perfil);

            mongodb.dropCollectionElemento(json.coleccion ,{perfil:parseInt(perfil)}, function(coleccionBorrada){
                deferred.resolve(json);
            });
        }else{
           console.log("Borrar tabla segun coleccion y perfil",json.coleccion,perfil);
            mongodb.dropCollection(json.coleccion , function(coleccionBorrada){
                    console.log("borrada",json.coleccion);
                    deferred.resolve(json);
            });
        }

    }else{
        console.log("ACTUALIZANDO ",json.coleccion);
        deferred.resolve(json);
    }

    return deferred.promise;
}

function borrarPerfil(perfil, json){
    var deferred = Q.defer();
    if(perfil){
        console.log("registroInterno.perfi **************l",parseInt(perfil))
        mongodb.dropCollectionElemento(json.coleccion ,{"registroInterno.perfil":parseInt(perfil)}, function(coleccionBorrada){
                deferred.resolve(json);
        });
    }else{
        deferred.resolve(json);
    }

    return deferred.promise;
}

function grabarPerfiles(json,perfil){
    var deferred = Q.defer();
    //Obtiene todos los perfiles en Oracle
    oracledb.getPoolClienteConexion(json.sqlOrigen, [perfil], false, function(respuestaora){
		if(respuestaora.error){
			deferred.reject(respuestaora);
			return deferred.promise; 
		}
        if(respuestaora && respuestaora.rows &&  respuestaora.rows.length > 0  ){
            //crea un nuevo registro para grabar en mongo a partir del registro individual en oracle
            var conjuntoPerfiles = respuestaora.rows.map(function(registro){
                var jsonPerfilesClon = JSON.parse(JSON.stringify(json.registroMongo));
                getDatos(registro, jsonPerfilesClon, null, json.coleccion);
                jsonPerfilesClon.registroMovil.hash = hash(jsonPerfilesClon.registroMovil);
                return jsonPerfilesClon;
            });
            //Verificando si es que existen arrays de json embebidos
            var existenArraysEmbebidos = [];
            //El siguiente metodo permite buscar arrays embebidos y devuelve el valor en un array :: existenArraysEmbebidos
            buscarEtiquetaJsonListaResultados(json.registroMongo, existenArraysEmbebidos);
            //Si contiene al menos un elemento::true, significa que fue encontrado
            if(existenArraysEmbebidos.indexOf(true)>=0){
                //Funcion que permite buscar
               buscarTodasEtiquetaJsonCallFuncion(conjuntoPerfiles, json.registroMongo, null).then(function(resp){
					  mongodb.grabarArrayQ(json.coleccion, resp).then(function(total){
                            deferred.resolve({totalRegistros:total,nested:true});
                        },function(x){
                              deferred.reject(x);
                        });
                },function(x){
                            deferred.reject(x);
                });

              /*  buscarEtiquetaJsonCallFuncion(json.registroMongo, function(nuevoArrayJson, key){
					 buscandoRegistrosRecursivos(conjuntoPerfiles, nuevoArrayJson, key).then(function(resp){
                        conjuntoPerfiles = resp;
                        mongodb.grabarArrayQ(json.coleccion, conjuntoPerfiles).then(function(total){
                            deferred.resolve({totalRegistros:total,nested:true});
                        },function(x){
                            deferred.resolve({totalRegistros:total,nested:true});
                        });
                    });
                });*/

            }else{
                mongodb.grabarArrayQ(json.coleccion, conjuntoPerfiles).then(function(total){
                    deferred.resolve({totalRegistros:total,nested:false});
                },function(x){
                    deferred.resolve({totalRegistros:total,nested:false});
                });
            }
        }else{
            deferred.reject({mensaje:"No se encontraron registros"});
        }
     });
    return deferred.promise;
}

OracleMongo.prototype.crearPerfiles = function(borrar, perfil){
    var deferred = Q.defer();
    //borrarColeccion(borrar, entidesMonogoDB.getJsonPerfiles()).
    borrarPerfil(perfil, entidesMonogoDB.getJsonPerfiles())
    .then(function(json){
        grabarPerfiles(entidesMonogoDB.getJsonPerfiles(), perfil).then(function(r){
            //console.log(r);
            deferred.resolve(r);
        },function(r){
            console.log(r);
            deferred.reject(r);
        });
    },function(error){
        deferred.reject(error);
    });
    return deferred.promise;
};
OracleMongo.prototype.setSizeArrayPorDocumento = function(nuevoSize){
    sizeArrayPorDocumento = nuevoSize;
};
OracleMongo.prototype.crearColeccionesMongo = function(perfil, nombreBaseSqlite, jsonEntityArray){
    var deferred = Q.defer();
    var coleccionesPorCrear = [];
    jsonEntityArray.forEach(function(jsonEntity){
        coleccionesPorCrear.push(crearColeccionMongo(perfil, nombreBaseSqlite, jsonEntity));
    });
    Q.all(coleccionesPorCrear).then(function(arraySuccess){
        deferred.resolve(arraySuccess);
    },function(error){
   	deferred.reject(error);
	});
    return deferred.promise;
};

function crearColeccionMongo(perfil, nombreBaseSqlite, jsonEntity){
    var deferred = Q.defer();
    borrarColeccion(true, jsonEntity, perfil).then(function(){
        /* then(insertarDocumentos).*/
        iterarTablaPorPerfil(perfil, nombreBaseSqlite, jsonEntity).
        then(function(success){
            deferred.resolve(success);
        },function(error){
            deferred.reject(error);
        });
    },function(error){
         console.log("crearColeccionMongo collecion ",jsonEntity.coleccion, "NO BORRADA", error);
    })

    return deferred.promise;
};

function testing(listaRegistrosGrabados){
    var deferred = Q.defer();
    var listaRegistrosGrabados_ = [];
    listaRegistrosGrabados_ = listaRegistrosGrabados;
    Q.all(listaRegistrosGrabados_).then(function(a){
        deferred.resolve(a);
    },function(x){
        console.log(x);
		deferred.reject(x);
	});
    return deferred.promise;
}
function testing222(a, jsonEntity, reg){
    var deferred = Q.defer();
   // if(jsonEntity.iteracionPorPerfil){
       //  console.log("si iteracionPorPerfil en ");
    setTimeout(function(){
        if(reg){
          var nuevoJsonDoc = JSON.parse(JSON.stringify(jsonEntity));
        nuevoJsonDoc.parametrosBusqueda.forEach(function(b){
                            nuevoJsonDoc.parametrosBusquedaValores.push(eval("reg."+b));
                        });
        }
       // console.log(nuevoJsonDoc.parametrosBusquedaValores);
        if(a>70){
             console.log("a >70 ",a);
            // deferred.reject("Error en a>70");
              deferred.resolve(a);  
        }else{
            console.log("testing222",a);
           deferred.resolve(a);  
        }
    /*}else{
            console.log("no iteracionPorPerfil en ",a);
             deferred.reject("Error en a>70"); 
        }*/
       
    },5000)
   /* }else{
            console.log("no iteracionPorPerfil en ",a);
             deferred.reject("Error en a>70"); 
        }*/
    return deferred.promise;
}
function insertarDocumentos(jsonEntity){
    var deferred = Q.defer();
    var listaRegistrosGrabados_ = [];
    var jsonEstablecimiento = {};
    var nuevoJsonDoc = {};
    if(jsonEntity.iteracionPorPerfil){
         mongodb.getRegistrosCustomColumnas(entidesMonogoDB.getJsonPerfiles().coleccion,{/*"registroInterno.perfil":140*/},{_id:1,"registroMovil.identificacion":1,"registroInterno.perfil":1,"registroMovil.infoEmpresa.empresa_id":1}, function(respuesta){
            for(var i = 0;i<respuesta.length;i++){
                listaRegistrosGrabados_.push(grabarRegistrosRecursivosQ(1, 0, respuesta[i]._id, respuesta[i].registroMovil.identificacion, respuesta[i].registroInterno.perfil, sizeArrayPorDocumento, jsonEntity, respuesta[i] ));
            }
            Q.all(listaRegistrosGrabados_).then(function(a){
               deferred.resolve({coleccion:entidesMonogoDB.getJsonPerfiles().coleccion});
            },function(x){
                deferred.reject({coleccion:entidesMonogoDB.getJsonPerfiles().coleccion, error:x});
            });
        });
    }else{
        grabarRegistrosRecursivosQ(1, 0, null, null, null, sizeArrayPorDocumento, jsonEntity).then(function(resultado){
            deferred.resolve({coleccion:entidesMonogoDB.getJsonPerfiles().coleccion});
		},function(x){
            deferred.reject({coleccion:entidesMonogoDB.getJsonPerfiles().coleccion, error:x});
		});
    }
    return deferred.promise;
}
var baseSqlite = "perfil#nombre.db"
function iterarTablaPorPerfil(perfil, nombreBaseSqlite, jsonEntity){
    var deferred = Q.defer();
    var listaRegistrosGrabados_ = [];
    var jsonEstablecimiento = {};
    var nuevoJsonDoc = {};
    if(jsonEntity.iteracionPorPerfil){
            var busquedaPorPerfil = {};
          if(perfil === "todos" ){
              busquedaPorPerfil = {}
          }
         if(!isNaN(perfil)){
              busquedaPorPerfil = {"registroInterno.perfil":parseInt(perfil)}
          }

         mongodb.getRegistrosCustomColumnas(entidesMonogoDB.getJsonPerfiles().coleccion, busquedaPorPerfil,{_id:1,"registroMovil.identificacion":1,"registroInterno.perfil":1,"registroMovil.infoEmpresa.empresa_id":1}, function(respuesta){

            for(var i = 0;i<respuesta.length;i++){
                listaRegistrosGrabados_.push(grabarRegistrosRecursivosQ(1, 0, jsonEntity.iteracionPorPerfil ? respuesta[i]._id : null, jsonEntity.iteracionPorPerfil ? respuesta[i].registroMovil.identificacion : null, jsonEntity.iteracionPorPerfil ? respuesta[i].registroInterno.perfil:null, sizeArrayPorDocumento, jsonEntity, jsonEntity.iteracionPorPerfil ? respuesta[i] : null, nombreBaseSqlite ));
            }
            Q.all(listaRegistrosGrabados_).then(function(a){
                deferred.resolve(true);
            },function(x){
                console.log("Error en insertarDocumentos or perfil",x);
                deferred.reject({coleccion:jsonEntity.coleccion, error:x});
            });
        });
    }else{
        grabarRegistrosRecursivosQ(1, 0, null, null, null, 400, jsonEntity, null, nombreBaseSqlite).then(function(resultado){
           deferred.resolve(true);
		},function(x){
            deferred.reject({coleccion:jsonEntity.coleccion, error:x});
		});
    }
    return deferred.promise;
}

function insertarDocumentos22(jsonEntity){
    var deferred = Q.defer();
    var listaRegistrosGrabados = [];
    var jsonEstablecimiento = {};
    var nuevoJsonDoc = {};
    //Valida si la entidad tiene que ser recorrida por cada perfil
    //if(jsonEntity.iteracionPorPerfil){
        console.log("insertarDocumentos",jsonEntity.iteracionPorPerfil);
        //Inicia el recorrido
        //Se grabara los documentos  por perfil en un conjunto de sizeArrayPorDocumento
        mongodb.getRegistrosCustomColumnas(entidesMonogoDB.getJsonPerfiles().coleccion,{},{_id:1,"registroMovil.identificacion":1,"registroInterno.perfil":1,"registroMovil.infoEmpresa.empresa_id":1}, function(respuesta){
                 console.log("insertarDocumentos respuesta",respuesta.length);
                    var ii=0;
                   /* respuesta.forEach(function(r){
                        nuevoJsonDoc = JSON.parse(JSON.stringify(jsonEntity));
                        nuevoJsonDoc.parametrosBusqueda.forEach(function(b){
                            nuevoJsonDoc.parametrosBusquedaValores.push(eval("r."+b));
                        });
                       // listaRegistrosGrabados.push(grabarRegistrosRecursivosQ(1, 0, r._id, r.registroMovil.identificacion, r.registroInterno.perfil, sizeArrayPorDocumento, nuevoJsonDoc ));
                        listaRegistrosGrabados.push(testing222(ii));
                        ii++;
                        console.log("forEach",new Date());
                    });*/
                   for(var i = 0;i<200;i++){
                        listaRegistrosGrabados.push(testing222(i));
                    };
                    //testing(listaRegistrosGrabados).then(function(a){
                    Q.all(listaRegistrosGrabados).then(function(a){
                        deferred.resolve(a);
                    },function(x){
                        console.log("error ",new Date());
                        console.log(x);
						deferred.reject(x);
					});
                  
        });
    
     
    
   /* }else{
        console.log("No se hace el recorrdio por perfil");
        //Graba los documentos segun la tabla de oracle en un conjunto de sizeArrayPorDocumento
        grabarRegistrosRecursivosQ(1, 0, null, null, null, sizeArrayPorDocumento, jsonEntity).then(function(resultado){
			deferred.resolve(resultado);
			 
        },function(x){
			deferred.reject(resultado);
		});
    }*/

    return deferred.promise; 
}

function crearBodegasPorPefil(borrar, inicio){
    var jsonBodega = {};
    borrar = false;
    mongodb.dropCollection(borrar ? entidesMonogoDB.getJsonEstablecimientos().coleccion : "noborrar", function(coleccionBorrada){
            mongodb.getRegistrosCustomColumnas(entidesMonogoDB.getJsonPerfiles().coleccion,{},{_id:1,"registroMovil.identificacion":1,"registroInterno.perfil":1}, function(respuesta){
                respuesta.forEach(function(r){
                    jsonBodega = entidesMonogoDB.getJsonDiccionarioBodegaVenta();
                //    console.log(jsonEstablecimiento.parametrosBusqueda);
                    jsonBodega.parametrosBusqueda.forEach(function(b){
                        jsonBodega.parametrosBusquedaValores.push(eval("r."+b));
                    });
                //    console.log(jsonEstablecimiento.parametrosBusquedaValores);
                    grabarRegistrosRecursivos (inicio, 0, null , null, null, sizeArrayPorDocumento, jsonBodega , function(resultado){
                            //console.log(resultado);
                    });
                });
            });

    });
}


OracleMongo.prototype.crearDiccionarios = function(base){
	var deferred = Q.defer();
    borrarColeccion(true, entidesMonogoDB.getJsonDiccionarioBanco(),null).
    then(function(r){
        var diccionarios = [
                            entidesMonogoDB.getJsonDiccionarioBanco(),
                            entidesMonogoDB.getJsonDiccionarioCuentaBancaria(),
                            entidesMonogoDB.getJsonDiccionarioDocumento(),
                          //  entidesMonogoDB.getJsonDiccionarioBodegaVenta(),
							entidesMonogoDB.getJsonDiccionarioLineaNegocio()
                        ];
        grabarRegistrosRecursivosDesdeUnArraySqls(0, diccionarios, 1, base, function(a){
                console.log("crearColecciones crearDiccionarios listo",a);
                if(a.error){
                    deferred.reject(a);
                }else{
                   deferred.resolve(true); 
                }
				
        });

    });
	 return deferred.promise;

};

OracleMongo.prototype.crearEstadoCuenta = function(borrar){
    mongodb.dropCollection(borrar ? entidesMonogoDB.getJsonEstadoDeCuenta().coleccion : "noborrar", function(coleccionBorrada){
        var jsonEstadoCuenta = {};
        mongodb.getRegistrosCustomColumnas(entidesMonogoDB.getJsonPerfiles().coleccion,{},{_id:1,"registroMovil.identificacion":1,"registroInterno.perfil":1}, function(respuesta){
            console.log("crearDiccionarios creando "+respuesta.length);
            respuesta.forEach(function(r){
                jsonEstadoCuenta = entidesMonogoDB.getJsonEstadoDeCuenta();
                //console.log(jsonEstadoCuenta.parametrosBusqueda);
                jsonEstadoCuenta.parametrosBusqueda.forEach(function(b){
                    jsonEstadoCuenta.parametrosBusquedaValores.push(eval("r."+b));
                });
                //.log(jsonEstadoCuenta.parametrosBusquedaValores);
                grabarRegistrosRecursivos (1, 0, r._id, r.registroMovil.identificacion, r.registroInterno.perfil, sizeArrayPorDocumento, jsonEstadoCuenta , function(resultado){
                        //console.log(resultado);
                });
            });
        });
    });

};

OracleMongo.prototype.crearItems = function(borrar){
    mongodb.dropCollection(borrar ? entidesMonogoDB.getJsonItems().coleccion : "noborrar", function(coleccionBorrada){
        var jsonItems = entidesMonogoDB.getJsonItems();
                                //(i, a, id, identificacion, cantidad, jsonEntity, callBack)
        grabarRegistrosRecursivos (1, 0, null, null, null, sizeArrayPorDocumento, jsonItems , function(resultado){
                //console.log(resultado);
        });
    });
};

OracleMongo.prototype.crearItemPromocionVenta = function(borrar){
    mongodb.dropCollection(borrar ? entidesMonogoDB.getJsonPromocionVenta().coleccion : "noborrar", function(coleccionBorrada){
        var jsonItemPromocionVenta = entidesMonogoDB.getJsonPromocionVenta();
                                //(i, a, id, identificacion, cantidad, jsonEntity, callBack)
        grabarRegistrosRecursivos (1, 0, null, null, null, sizeArrayPorDocumento, jsonItemPromocionVenta , function(resultado){
                //console.log(resultado);
        });
    });
};



//Scripts ****************************************************************/
OracleMongo.prototype.getTablasScript = function(callBack){
    var tablasEspejo = [];
    var tablasCustomColumnas = Object.getOwnPropertyNames( EntidadesMongoOracle.prototype ).reduce(function(res, a){
                        if(a.indexOf("getJson")>=0 && entidesMonogoDB[a]() && entidesMonogoDB[a]().movil && entidesMonogoDB[a]().movil.crear){
                            //Valida si se trata de una tabla espejo
                            if(entidesMonogoDB[a]().movil.espejo && entidesMonogoDB[a]().movil.sql){
                                //Toma el sql de la tabla espjo para poder obtener las columnas
                                tablasEspejo.push({coleccion:entidesMonogoDB[a]().coleccion, sql :entidesMonogoDB[a]().movil.sql, getjson:a});
                            }else{
                                //Crea el script de la tabla
                                res[entidesMonogoDB[a]().coleccion]= entidesMonogoDB.getTablaMovil(entidesMonogoDB[a](), null, false);

                            }
                        }
                        return res;
                    },{});
    getSriptTablaDesdeUnSql(0, tablasEspejo,  function(camposPorColeccion){
            camposPorColeccion.forEach(function(a){
                tablasCustomColumnas[a.coleccion] = entidesMonogoDB.getTablaMovil(entidesMonogoDB[a.getjson](), a.campos, true);
    });
    callBack(tablasCustomColumnas);
    });
}
//Scripts ****************************************************************/
OracleMongo.prototype.getScriptsNoIterarPorPerfil = function(prefijo, scripts){
    var nuevosScripts = []
    for(coleccion in scripts){
         Object.getOwnPropertyNames( EntidadesMongoOracle.prototype ).forEach(function(a){
              if(a.indexOf("getJson")>=0 && entidesMonogoDB[a]() && entidesMonogoDB[a]().coleccion+prefijo === coleccion && entidesMonogoDB[a]().iteracionPorPerfil !== true && entidesMonogoDB[a]().diccionario === true){
                 // console.log(coleccion,scripts);
                        if(nuevosScripts.indexOf(scripts[coleccion])<0){
                            nuevosScripts.push(scripts[coleccion]);
                        }

                        return;

                }
         });
    }
    return nuevosScripts;

};
//Scripts ****************************************************************/
OracleMongo.prototype.getScriptsIterarPorPerfil = function(prefijo, scripts){
    var nuevosScripts = []
    for(coleccion in scripts){
         Object.getOwnPropertyNames( EntidadesMongoOracle.prototype ).forEach(function(a){
              if(a.indexOf("getJson")>=0 && entidesMonogoDB[a]() && entidesMonogoDB[a]().coleccion+prefijo === coleccion && (entidesMonogoDB[a]().iteracionPorPerfil == true ||entidesMonogoDB[a]().tipoPerfil === true)){
                 // console.log(coleccion,scripts);
                        if(nuevosScripts.indexOf(scripts[coleccion])<0){
                            nuevosScripts.push(scripts[coleccion]);
                        }

                        return;

                }
         });
    }
    return nuevosScripts;

};
//Scripts ****************************************************************/
OracleMongo.prototype.getScripts_ = function(scripts){
    var nuevosScripts = []
    for(coleccion in scripts){
         nuevosScripts.push(scripts[coleccion]);
    }
    return nuevosScripts;

};
OracleMongo.prototype.getTablasScriptDrop = function(){
    var tablasEspejo = [];
    return Object.getOwnPropertyNames( EntidadesMongoOracle.prototype ).reduce(function(res, a){
                            if(a.indexOf("getJson")>=0 && entidesMonogoDB[a]() && entidesMonogoDB[a]().movil && entidesMonogoDB[a]().movil.crear){
                                if(entidesMonogoDB[a]().movil.espejo && entidesMonogoDB[a]().movil.sql){
                                }else{
                                res[entidesMonogoDB[a]().coleccion+"Drop"]= entidesMonogoDB.getScriptsDropTables(entidesMonogoDB[a]());
                                }
                            }


                        return res;
                    },{});



};
OracleMongo.prototype.getTablasScriptUniqueKey = function(){
    var tablasEspejo = [];
    var index = 1;
    return Object.getOwnPropertyNames( EntidadesMongoOracle.prototype ).reduce(function(res, a){
                            if(a.indexOf("getJson")>=0 && entidesMonogoDB[a]() && entidesMonogoDB[a]().movil && entidesMonogoDB[a]().movil.crear){
                                if(entidesMonogoDB[a]().movil.espejo && entidesMonogoDB[a]().movil.sql){
                                }else{

                                    res[entidesMonogoDB[a]().coleccion+"UniqueKey"]= entidesMonogoDB.getScriptsUniqueKeys(entidesMonogoDB[a](), index);
                                    index ++;
                                }
                            }


                        return res;
                    },{});



};

OracleMongo.prototype.getDispositivosYaSincronizados = function(coleccion, perfil){
    var deferred = Q.defer();
    var padre = this;
    var busqueda = {perfil:parseInt(perfil),"sincronizar.dispositivos":{"$exists":true}};
     if(coleccion,padre.isColeccionesTipoDiccionario(coleccion).length>0){
        delete busqueda["perfil"];
     }
    var dispositivosEncontrados = [];
    var dispositivosEncontradosUnicos = [];
    mongodb.getRegistrosCustomColumnas(coleccion, busqueda, {_id:0,"sincronizar.dispositivos":1}, function(respuesta){
           if(Array.isArray(respuesta)){
                dispositivosEncontrados = respuesta.reduce(function(array_, elemento){
                    if(Array.isArray(elemento.sincronizar.dispositivos)){
                       array_ =  array_.concat(elemento.sincronizar.dispositivos)
                    }
                    return array_;
                },[])
                dispositivosEncontrados.filter(function(b){
                    if(dispositivosEncontradosUnicos.indexOf(b) === -1){
                        dispositivosEncontradosUnicos.push(b);
                    }
                     
                })
               deferred.resolve(dispositivosEncontrados)
           }else{
               deferred.resolve([]);
           }
    });
     return deferred.promise;
};
//Para entregar al restful
OracleMongo.prototype.getDatosDinamicamenteDeInicio = function(coleccion, perfil, index, callBack){
    var parametros = {index: parseInt(index)};
    if(perfil){
        parametros.perfil=perfil;
    }
    /*mongodb.getRegistroCustomColumnas(coleccion, parametros, {registros:1,_id:0}, function(respuesta){
            callBack(respuesta);
    });*/
    mongodb.getRegistroCustomColumnas(coleccion, parametros, {registros:1,_id:0}, function(respuesta){
            callBack(respuesta);
    });
    

};

OracleMongo.prototype.elimiarTodosLosCambiosPorSincronizarPorPerfil = function(coleccion, perfil, codigo){
    var deferred = Q.defer();
    var parmetrosBusqueda = {"sincronizar.codigo":parseInt(codigo)}
    if(perfil){
        parmetrosBusqueda["perfil"] = parseInt(perfil)
    }
        mongodb.modificar(coleccion, parmetrosBusqueda,{$unset:{sincronizar:""}},function(r){
            deferred.resolve(r);
        });
    return deferred.promise;
}

OracleMongo.prototype.agregarDispositivoSincronizadoPorPerfil = function(coleccion, perfil, codigo, dispositivo){
    var deferred = Q.defer();
    var parmetrosBusqueda = {"sincronizar.codigo":parseInt(codigo)}
    if(perfil){
        parmetrosBusqueda["perfil"] = parseInt(perfil)
    }
    mongodb.modificar(coleccion, parmetrosBusqueda,{$addToSet:{"sincronizar.dispositivos":dispositivo}},function(r){
            deferred.resolve(r);
    });
    return deferred.promise;
}

OracleMongo.prototype.getTodosLosCambiosPorSincronizarPorPerfil = function(arrayPerfiles, url){
    var deferred = Q.defer();
    var resultados = [];
    var padre =this;
	//console.log("getTodosLosCambiosPorSincronizarPorPerfil inicio");
    entidesMonogoDB.getColecciones().forEach(function(c){
        if(c.coleccion,padre.isColeccionesTipoDiccionario(c.coleccion).length>0){
            resultados.push(getDatosDinamicamenteParaActualizar(c.coleccion,c.tabla, null, null, {index:1,perfil:1}));
        }else{
            resultados.push(getDatosDinamicamenteParaActualizar(c.coleccion,c.tabla, arrayPerfiles, null, {index:1,perfil:1}));
        }
        
    });
    Q.all(resultados).then(function(res){
		if(Array.isArray(res)){
            res = res.filter(function(r){
                if(r.urls && Array.isArray(r.urls) && r.urls.length>0){
                    r.urls = r.urls.reduce(function(nuevo, z){
                        var newUrl = url.replace(":coleccion",r.coleccion).replace(":index",z.index);
                        if(nuevo[z.perfil ?z.perfil:"NOPERFIL" ] && Array.isArray(nuevo[z.perfil ?z.perfil:"NOPERFIL"])){
                            if(nuevo[z.perfil ?z.perfil:"NOPERFIL"].indexOf(newUrl)<0){
                                nuevo[z.perfil ?z.perfil:"NOPERFIL"].push(newUrl);
                            }
                        }else{
                            nuevo[z.perfil ?z.perfil:"NOPERFIL"] = [newUrl];
                        }
                       // nuevo.push(url.replace(":coleccion",r.coleccion).replace(":index",z.index));
                        return nuevo;
                    },{});
                    return true;
                }else{
                   return false;

                }
            });
        }
        deferred.resolve(res);
    },function(c){
		
		 deferred.reject(c);
	});
    return deferred.promise;
};

OracleMongo.prototype.getDatosPorSincronizarPorPerfilIndex = function(coleccion, arrayPerfiles, index){
    var deferred = Q.defer();
    getDatosDinamicamenteParaActualizar(coleccion, null, arrayPerfiles, index, {sincronizar:1,_id:0}).then(function(res){
       deferred.resolve(res);
    });
    return deferred.promise;
};

function getDatosDinamicamenteParaActualizar(coleccion, tabla, arrayPerfiles, index, mostrarColumnas){
    var deferred = Q.defer();
    var parametros ={};
    if(arrayPerfiles && Array.isArray(arrayPerfiles) && arrayPerfiles.length>0){ //Importante el arrayPerfiles
        parametros.perfil={ "$in" :arrayPerfiles};
    }
    if(index){
        parametros.index=index;
    }
	parametros["$or"]=[];
    parametros["$or"].push({"sincronizar.agregar":{"$gt":{$size:0}}});
	parametros["$or"].push({"sincronizar.eliminar":{"$gt":{$size:0}}});
    if(!mostrarColumnas){
        mostrarColumnas = {};
    }
    mostrarColumnas._id=0;
    mongodb.getRegistrosCustomColumnas(coleccion, parametros, mostrarColumnas, function(respuesta){
            if(mostrarColumnas.index){
	            deferred.resolve({coleccion:coleccion,tabla:tabla,urls:respuesta,perfiles:respuesta});
            }else{
				if(parametros.index){
					deferred.resolve(respuesta);
				}else{
					deferred.resolve([]);
				}
			}
            

    });
    return deferred.promise;
}
OracleMongo.prototype.llamarProcedimiento = function(nombre, parametros){
    var deferred = Q.defer();
    oracledb.llamarProcedimiento(nombre, parametros,function(r){
        deferred.resolve(r)
    });
    return deferred.promise;
}
var procedimientos_oracle = {
    pedidos:"cargarpedido(:pvcodret,:pvmsret)",
    recibos:"cargarrecibo(:pvcodret,:pvmsret)"
}
//Para entregar al restful
OracleMongo.prototype.setDatosDinamicamente = function(tabla, datos, datosperfil, callBack){
       var padre=this;
        coleccion = entidesMonogoDB.getColecciones().filter(function(c){
                if(c.tabla === tabla){
                    return true;
                }
        });
		coleccion = coleccion[0];
        var documento = {registroMovil : datos, perfil : datosperfil.perfil, empresa:datosperfil.empresa,tabla:tabla};
        console.log("setDatosDinamicamente**************************MONGO**",coleccion, documento);

        mongodb.grabarRegistrosDesdeMovil("emcrecibidas", documento).then(function(r){



			console.log("r1",r);
			if(datos && !datos.preimpreso &&  coleccion && coleccion.coleccion.toLowerCase().indexOf("emccartera")>=0){
			   datos.fechaproblema = new Date();
			   datos.mensaje = "Por favor no temar en cuenta este pago, por que no tiene preimpreso"
			}
            oracledb.grabarNestedJson(datos, tabla).then(function(r){
				console.log("r2",r);
				if(r){
                    if(coleccion && coleccion.coleccion.toLowerCase().indexOf("emcorden")>=0 ){
                        padre.procesarPedidos(datosperfil.perfil)
                    }
                    if(coleccion && coleccion.coleccion.toLowerCase().indexOf("emccartera")>=0 && datos && datos.preimpreso){
                        padre.procesarCartera(datosperfil.perfil);
                    }
                }
                callBack(r);
            },function(r){
				if(r.excepcion && r.excepcion.error && r.excepcion.error.toString().indexOf("unique constraint")>=0){
					if(documento.registroMovil && !documento.registroMovil.preimpreso){
						callBack("OI");
					}else{
						callBack(true);
					}

				}else{
					console.log(r,documento)
					try{
						//Enviando errores
						mailOptions.from =  '"Ecuaquimica, grabar en oracle" <eq-ecuaquimica@ecuaquimica.com.ec>'; // sender address
						var mensajeError_ = "Estimados, <br>Oracle entregó un error al grabar. <br> #PERFIL no logró grabarlo en el esquema de oracle tabla: #TABLA<hr><br><br>#ERROR <br><br>#FECHA"
						mailOptions.to  = 'ohonores@hotmail.com,ohonores@ecuaquimica.com.ec';
						mailOptions.subject  = "ECUAQUIMICA -- ERROR AL GRABAR EN EL ESQUEMA DE ORACLE";
						mailOptions.html  = mensajeError_.replace("#PERFIL",datosperfil.perfil).replace("#FECHA",new Date().toString().split("GMT-0500")[0]).replace("#ERROR",r ? (Array.isArray(r)?r.toString():JSON.stringify(r)):r).replace("#TABLA",tabla);
						// send mail with defined transport object
						transporter.sendMail(mailOptions, function(error, info){
							if(error){
								//deferred.reject(error);
							}else{
								//deferred.resolve(info.response)
							}
						});
					}catch(error){
						console.log("Error al enviar el email",error)
					}
				}


            });
        },function(x){
            try{
                 //Enviando errores 
                    mailOptions.from =  '"Ecuaquimica, grabar en mongodb" <eq-ecuaquimica@ecuaquimica.com.ec>'; // sender address
                    var mensajeError_ = "Estimados, <br>MongoDB entregó un error al grabar. <br> #PERFIL no logró grabarlo en la coleccion: #COLECCION<hr><br><br>#ERROR <br><br>#FECHA"
                    mailOptions.to  = 'ohonores@hotmail.com,ohonores@ecuaquimica.com.ec';
                    mailOptions.subject  = "ECUAQUIMICA -- ERROR AL GRABAR EN LA COLECCIÓN DE MONGODB";
                    mailOptions.html  = mensajeError_.replace("#PERFIL",datosperfil.perfil).replace("#FECHA",new Date().toString().split("GMT-0500")[0]).replace("#ERROR",x ? x.toString():"").replace("#COLECCION",coleccion);
                    // send mail with defined transport object
                    transporter.sendMail(mailOptions, function(error, info){
                        if(error){
                            //deferred.reject(error);
                        }else{
                            //deferred.resolve(info.response)
                        }
                    });
            }catch(error){
                console.log("Error al enviar el email",error)
            }
            if(x.duplicado){
				if(documento.registroMovil && !documento.registroMovil.preimpreso){
					callBack("OI");
				}else{
					 callBack(true);
				}

            }else{
                callBack(x);
            }
            console.log(x)


        });


};
var tokens = {}
OracleMongo.prototype.setToken = function(perfil, token){
    tokens[perfil] =token;
}


OracleMongo.prototype.getTokens = function(){
    return tokens;
}
OracleMongo.prototype.getUrlsPorPefil = function(identificacion, perfil, urlPorPefil, urlDiccionario, urlRecpcion, callBack){
    console.log("getUrlsPorPefil perfil ",perfil,identificacion);
    getTotalesParcialesPorPerifil(0, entidesMonogoDB.getColeccionesParaSincronzar(), identificacion, perfil, function(nuevaColeccion){
         console.log("nuevaColeccion",nuevaColeccion);
        nuevaColeccionA = nuevaColeccion.map(function(col){
            console.log("nuevaColeccion**************",col.coleccion);
            if(col.diccionario === true){
                url = urlDiccionario.replace(":coleccion", col.coleccion);
            }else{
                url = urlPorPefil.replace(":coleccion", col.coleccion).replace(":perfil", perfil);
            }
            col.recepcion = urlRecpcion.replace(":tabla", col.tabla);
            col.urls = col.indices.map(function(indice){
                return url.replace(":index", indice.index);
            });
            delete col.indices;
            return col;
        });
        callBack(nuevaColeccionA);
    });
};
var bitacora = {coleccion:"bitacora", crearActualizarBD:{tipo:"actualizacion", origen:"",resultado:{}, tablas:[], actualizandose:[] }}
OracleMongo.prototype.actualizarColecciones = function(tablas, origen){
    var padre=this;
    padre.crearColeccionesMongo(false, [entidesMonogoDB.getJsonPromocionVenta()]).then(function(a){
        console.log(a);
    });
}

OracleMongo.prototype.actualizarColecciones2 = function(tablas, origen){
    var entidesMonogoDBArray = entidesMonogoDB.getColeccionesParaActualizar(tablas);
    console.log("entidesMonogoDBArray",entidesMonogoDBArray)
    var actualizarColeccionesArrayDeferred = [];
    var deferred = Q.defer();
    var padre = this;
    var actualiznadoColecciones = [];
    client.smembers('actualizando::colecciones', function(err, colecciones) {
        actualiznadoColecciones = colecciones;
    });
    bitacora.crearActualizarBD.origen=origen;
    bitacora.crearActualizarBD.tablas=tablas;
    for(var i=0;i<entidesMonogoDBArray.length;i++){
       if(actualiznadoColecciones.indexOf(entidesMonogoDBArray[i].coleccion)<0){
           client.sadd('actualizando::colecciones',entidesMonogoDBArray[i].coleccion);
           actualizarColeccionesArrayDeferred.push(padre.crearColeccionesMongo(false, [entidesMonogoDBArray[i]])); 
       }else{
           bitacora.crearActualizarBD.actualizandose.push({coleccion:entidesMonogoDBArray[i].coleccion,fecha:new Date()})
       }
       
    }
    
    Q.all(actualizarColeccionesArrayDeferred).then(function(successArray){
        successArray.forEach(function(resultado){
            client.srem('actualizando::colecciones', resultado.coleccion);
        });
       
        bitacora.crearActualizarBD.resultado.success=successArray;
        mongodb.grabarRegistro(bitacora.coleccion,bitacora.crearActualizarBD).then(function(success){
            console.log("actualizarColecciones registro grabado en mongo", success)
        },function(error){
            console.log("actualizarColecciones registro grabado en mongo", error)
        });
        deferred.resolve(true);
    },function(errores){
        if(Array.isArray(errores)){
            successArray.forEach(function(resultado){
                if(resultado.coleccion){
                    client.srem('actualizando::colecciones', resultado.coleccion);
                }
                
            });
        }
        bitacora.crearActualizarBD.resultado.error=resultado;
        mongodb.grabarRegistro(bitacora.coleccion,bitacora.crearActualizarBD).then(function(success){
            console.log("actualizarColecciones registro grabado en mongo", success)
        },function(error){
            console.log("actualizarColecciones registro grabado en mongo", error)
        });
        deferred.reject(false);
    })
    return deferred.promise;
    
}

var creandoA= false;
OracleMongo.prototype.actualizarImpresora = function(perfil, impresora){

    mongodb.modificar("emcperfiles",{"registroInterno.perfil":parseInt(perfil)},{$set:{impresora:impresora}},function(r){
        console.log("actualizarImpresora mongo",r)
    });

    oracledb.getPoolClienteConexion("UPDATE EMOVTPERFIL SET IMPRESORA=:impresora WHERE ID=:PERFIL", [impresora, perfil], true, function(respuestaora){
        console.log("actualizarImpresora oracle",respuestaora)

    });
}
OracleMongo.prototype.crearColeccionesPorPerfilRecursivo = function(origen, index, perfiles){
    var padre = this
    console.log("inicio crearColeccionesPorPerfilRecursivo");
    if(index<perfiles.length){
        padre.crearColeccionesPorPerfil(origen, perfiles[index]).then(function(perfilCreado){
            comandosPorConsola_.crearScriptsPorPerfil(perfilCreado, origen).
            then(function(success){
                console.log("listo EN CREAR SCRIPTS POR PERFIL", success);
                setTimeout(function(){
                    success.dispositivos.forEach(function(dispositivo){
                        client.sadd('sincronizar:perfiles',success.perfil+":"+dispositivo+":"+success.versionPerfilReferencia+":"+success.versionPerfil+":"+success.versionActualizacion);

                    });

                 },30000);
             },function(error){
                      console.log("ERRO EN CREAR SCRIPTS POR PERFIL", errror);
             });

            setTimeout(function(){
                console.log("listo crearColeccionesPorPerfilRecursivo ", perfilCreado, "esperando 3 segundos");
                index = index+1;
                padre.crearColeccionesPorPerfilRecursivo(origen, index, perfiles);
            },3000);

        },function(x){
            console.log("Error al procesar el perfil ",  perfiles[index], "esperando 3 segundos, para iniciar con el sigueinte");
            setTimeout(function(){
                index = index+1;
                padre.crearColeccionesPorPerfilRecursivo(origen, index, perfiles);
            },3000);
            return;
        });
    }else{
        console.log("Perfiles ceados");
       return;
    }
}
OracleMongo.prototype.crearColeccionesPorPerfil = function(origen, perfil){
    var padre = this
     console.log("inicio crearColeccionesPorPerfil");
    var deferred = Q.defer();
    comandosPorConsola_.copiarDiccionarios(perfil).then(function(success1){
        console.log("inicio crearColeccionesPorPerfil",success1);
        padre.crearColecciones(perfil, success1.nombreArchivo).then(function(success2){
            console.log("inicio crearColeccionesPorPerfil ..",success2);
            var coleccion = {
                    nombre:"emcversiones",
                    datos:{
                            tipo:"perfiles",
                            version:success1.version,
                            versionPerfil:success1.versionPerfil,
                            nombreBackupSql:success1.nombreArchivo,
                            ubicacion:success1.ubicacion,
                            origen:origen,
                            resultado:{crearColecciones:success2},
                            perfil:perfil.toString(),
                            estado:true
                            }
                };

            mongodb.grabarRegistro(coleccion.nombre,coleccion.datos).then(function(success){
               comandosPorConsola_.copiarArchivosZips(perfil).then(function(consoleSuccess){
                   fs.exists(consoleSuccess.ubicacionZips+consoleSuccess.nombreArchivo, function(succes) {
                            var coleccion = {
                            nombre:"emcversiones",
                            datos:{
                                    tipo:"zip",
                                    version:consoleSuccess.version,
                                    versionPerfil:consoleSuccess.versionPerfil,
                                    nombreBackupZip:consoleSuccess.nombreArchivo,
                                    ubicacionZip:consoleSuccess.ubicacionZips,
                                    origen:origen,
                                    resultado:{copiarArchivosZips:true},
                                    perfil:perfil.toString(),
                                    estado:true
                                    }
                            };
                            if(succes){
                                coleccion.datos.estado = true;
                            }else{
                                coleccion.datos.estado = false;
                            }

                            mongodb.grabarRegistro(coleccion.nombre,coleccion.datos).then(function(success){

                                    deferred.resolve(perfil);
                            },function(error){
                                    deferred.reject(error);
                            });

                    });


               },function(error){
                   var coleccion = {
                    nombre:"emcversiones",
                    datos:{
                            tipo:"perfiles",
                            origen:origen,
                            resultado:{copiarArchivosZips:error},
                            perfil:perfil.toString(),
                        }
                    };

                    mongodb.grabarRegistro(coleccion.nombre,coleccion.datos);
                    deferred.reject(error);
               });


             },function(error){
                deferred.reject(error);
            });

        },function(error){
            var coleccion = {
                    nombre:"emcversiones",
                    datos:{
                            tipo:"perfiles",
                            version:success1.version,
                            versionPerfil:success1.versionPerfil,
                            nombreBackupSql:success1.nombreArchivo,
                            ubicacion:success1.ubicacion,
                            origen:origen,
                            resultado:{crearColecciones:error},
                            perfil:perfil.toString(),
                        }
                };

            mongodb.grabarRegistro(coleccion.nombre,coleccion.datos);
            deferred.reject(error);
        });

    },function(error){
        var coleccion = {
                    nombre:"emcversiones",
                    datos:{
                            tipo:"perfiles",
                            version:error.version,
                            origen:origen,
                            resultado:{copiarDiccionarios:{error:error.error,otros:error.stderr}},
                            perfil:perfil.toString(),
                        }
                };
        mongodb.grabarRegistro(coleccion.nombre,coleccion.datos);
		deferred.reject(error);
    });//Fin crear el cp del archivo db*/
   return  deferred.promise;
}


OracleMongo.prototype.grabarPerfilVersionado = function(perfil, jsonEntity, nombreBD){
    var deferred = Q.defer();
     mongodb.getRegistroCustomColumnas("emcperfiles", {"registroInterno.perfil":parseInt(perfil)} , {registroMovil:1}, function(success){
         console.log(success);
         if(success && success.registroMovil){
             success.registroMovil.version = nombreBD.replace("_"+perfil,"").replace(".db","").replace("_",".");
         }

         //console.log(success)
         sqliteCliente_.insertarRegistros(nombreBD, jsonEntity.movil.tabla, [success]).then(function(success){
             console.log(success)
            deferred.resolve(success);
        },function(error){
             deferred.reject(error);
         });//fin sqliteCliente

     },function(error){
         deferred.reject(error);
     });
    return  deferred.promise;
}





OracleMongo.prototype.crearColecciones = function(perfil, bdPorPerfil){

	var deferred = Q.defer();
    try{
    
    //1. Crear perfiles
    var padre = this;
        padre.crearPerfiles(true, perfil).
        then(function(r){

                padre.crearBdSqlitePorPerfil(perfil, bdPorPerfil).then(function(success){
                    

                     padre.crearColeccionesMongo(perfil, bdPorPerfil, [entidesMonogoDB.getJsonItems()]).then(function(success){

                        padre.crearColeccionesMongo(perfil, bdPorPerfil, [entidesMonogoDB.getJsonEstablecimientos()]).then(function(success){
                        console.log("getJsonEstablecimientos ok",success);
                        padre.crearColeccionesMongo(perfil, bdPorPerfil,[entidesMonogoDB.getJsonEstadoDeCuenta()]).then(function(success){
                            console.log("getJsonEstadoDeCuenta ok ",success);
                            padre.crearColeccionesMongo(perfil, bdPorPerfil, [entidesMonogoDB.getJsonCartera()]).then(function(success){
                            console.log("getJsonCartera ok ",success);
                                padre.crearColeccionesMongo(perfil, bdPorPerfil, [entidesMonogoDB.getJsonCarteraDetalle()]).then(function(success){
                                    console.log("getJsonCarteraDetalle ok ",success);

                                     padre.crearColeccionesMongo(perfil, bdPorPerfil, [entidesMonogoDB.getJsonAfecta()]).then(function(success){
                                        console.log("getJsonAfecta ok ",success);
                                        padre.crearColeccionesMongo(perfil, bdPorPerfil, [entidesMonogoDB.getJsonDiccionarioBodegaVentaPorPefil()]).then(function(success){
                                            console.log("getJsonDiccionarioBodegaVentaPorPefil ok ",success);
                                                padre.grabarPerfilVersionado(perfil, entidesMonogoDB.getJsonPerfiles(), bdPorPerfil).then(function(success){
                                                     console.log("getJsonPerfiles ok",success);
                                                    padre.crearColeccionesMongo(perfil, bdPorPerfil, [entidesMonogoDB.getJsonOrden()]).then(function(success){
                                                          console.log("getJsonOrden ok",success);
                                                         padre.crearColeccionesMongo(perfil, bdPorPerfil, [entidesMonogoDB.getJsonOrdenDetalle()]).then(function(success){
                                                             console.log("getJsonOrdenDetalle ok",success);
                                                             deferred.resolve(success);
                                                        },function(error){
                                                                    console.log("Error al grabar el perfil",error);
                                                                    deferred.reject(error);
                                                        }); //Crear Tabla sql
                                                    },function(error){
                                                                console.log("Error al grabar el perfil",error);
                                                                deferred.reject(error);
                                                    }); //Crear Tabla sql
                                                },function(error){
                                                        console.log("Error al grabar el perfil",error);
                                                        deferred.reject(error);
                                                }); //Crear Tabla sql
                                        },function(error){
                                            console.log("Fin por favor iniciar nuevamente getJsonCruce",error);
                                            deferred.reject(error);
                                        });

                                    },function(error){
                                        console.log("Fin por favor iniciar nuevamente getJsonCruce",error);
                                        deferred.reject(error);
                                    });



                                },function(error){
                                    console.log("Fin por favor iniciar nuevamente getJsonItems",error);
                                    deferred.reject(error);
                                });
                           },function(error){
                                console.log("Fin por favor iniciar nuevamente getJsonItems",error);
                                deferred.reject(error);
                            });
                        },function(error){
                            console.log("Fin por favor iniciar nuevamente getJsonEstadoDeCuenta",error);
                            deferred.reject(error);
                        });
                    },function(error){
                        console.log("Fin por favor iniciar nuevamente getJsonEstablecimientos",error);
                        deferred.reject(error);
                    });


                  },function(error){
                        console.log("Fin por favor iniciar nuevamente getItems",error);
                        deferred.reject(error);
                    });

                    



              },function(error){
                console.log("Error al Crear Tabla sqlCrear Tabla sql",error);
                deferred.reject(error);
              }); //Crear Tabla sql

        },function(error){
            console.log("Fin por favor iniciar nuevamente",error);
			deferred.reject(error);
        });
    }catch(error){
        console.log("Error en el metodo",error);
        deferred.reject(error);
    }
	return deferred.promise;
};

OracleMongo.prototype.crearBackupsSqliteAutomatica = function(origen){
    var padre=this;
    console.log("SINCRONIZACION::crearColeccionesBdSqliteTipoDiccionarios INICIO ",new Date());
    padre.crearColeccionesBdSqliteTipoDiccionarios(origen).then(function(success){
        console.log("SINCRONIZACION::crearColeccionesBdSqliteTipoDiccionarios ok ",new Date(),success);
        setTimeout(function(){
            padre.crearColeccionesPorPerfilRecursivo(origen, 0, [140,101,123,135,108,137,107,156]);

        },60000);
    },function(error){
        console.log("SINCRONIZACION::ERROR AL CREAR LOS BACKUPS ",new Date(), JSON.stringify(error));
    });
}

/**
 * Funcion: Permite grabar en la base de mongodb todas las tablas en comun para todos los perfiles y hace un backup de sqlite
*/
OracleMongo.prototype.crearColeccionesBdSqliteTipoDiccionarios = function(origen){
	var deferred = Q.defer();
    var padre = this;

    var version = new Date().getTime();
    var nombreArchivo = "diccionarios_#version.db".replace("#version",version);
    var coleccion = {nombre:"emcversiones",datos:{tipo:"diccionarios",version:version,nombreBackupSql:nombreArchivo,ubicacion:"/home/ecuaquimica/sqlite/bds/", origen:origen,resultado:{}}};
    var resultado={};
    padre.crearBdSqliteDiccionarios(nombreArchivo).then(function(success1){
        resultado.crearBdSqliteDiccionarios=success1;
        console.log("Inicio de crearColeccionesMongo getJsonItems ",nombreArchivo)
       // padre.crearColeccionesMongo(null,nombreArchivo, [entidesMonogoDB.getJsonItems()]).then(function(success2){
           // resultado.getJsonItems=success2;
            console.log("Inicio de crearColeccionesMongo getJsonPromocionVenta")
            padre.crearColeccionesMongo(null, nombreArchivo, [entidesMonogoDB.getJsonPromocionVenta()]).then(function(success3){
                    console.log("getJsonPromocionVenta ok");
                        resultado.getJsonPromocionVenta=success3;
                console.log("Inicio de crearColeccionesMongo crearDiccionarios")
                        padre.crearDiccionarios(nombreArchivo).then(function(success4){
                            resultado.crearDiccionarios=success4;
                            console.log("getJsonPromocionVenta ok", version);
                             coleccion.datos.resultado = resultado;
                             coleccion.datos.estado = true;
                             mongodb.grabarRegistro(coleccion.nombre,coleccion.datos).then(function(success){
                                console.log("actualizarColecciones registro grabado en mongo", success)
                            },function(error){
                                console.log("actualizarColecciones registro grabado en mongo", error)
                            });
                            deferred.resolve(true);
                        },function(error){
                            resultado.crearDiccionarios={error:error};
                            coleccion.resultado = resultado;
                             mongodb.grabarRegistro(coleccion.nombre,coleccion.datos).then(function(success){
                                console.log("actualizarColecciones registro grabado en mongo", success)
                            },function(error){
                                console.log("actualizarColecciones registro grabado en mongo", error)
                            });
                            deferred.reject(error);
                        });
                },function(error){
                            resultado.getJsonPromocionVenta={error:error};
                            coleccion.resultado = resultado;
                             mongodb.grabarRegistro(coleccion.nombre,coleccion.datos).then(function(success){
                                console.log("actualizarColecciones registro grabado en mongo", success)
                            },function(error){
                                console.log("actualizarColecciones registro grabado en mongo", error)
                            });
                    deferred.reject(error);
                });
      /*  },function(error){
            resultado.getJsonItems={error:error};
            coleccion.resultado = resultado;
            mongodb.grabarRegistro(coleccion.nombre,coleccion.datos).then(function(success){
                console.log("actualizarColecciones registro grabado en mongo", success)
            },function(error){
                    console.log("actualizarColecciones registro grabado en mongo", error)
            });
            deferred.reject(error);
        });*/
    },function(error){
            resultado.crearBdSqliteDiccionarios={error:error};
            coleccion.resultado = resultado;
            mongodb.grabarRegistro(coleccion.nombre,coleccion.datos).then(function(success){
                console.log("actualizarColecciones registro grabado en mongo", success)
            },function(error){
                    console.log("actualizarColecciones registro grabado en mongo", error)
            });
            deferred.reject(error);
    });
    
	return deferred.promise;
};

/**
    FUNCION QUE PERMITE CREAR UN CRON DE LA SIGUIENTE TAREA:
    crearColecciones(), CREA TODAS LAS COLECCIONES,
    PRIMERO HACE UN DROP Y LAS VUELVE A INSERTAR
    ESTA FUNCION ES LLAMAD A EN EL ARCHIVO APP.JS
*/
OracleMongo.prototype.crearTareas = function(){
    var rule2 = new schedule.RecurrenceRule();
    rule2.dayOfWeek = [0,1,2,3,4,5,6]; //Corre todos los dias
    rule2.hour = 20;//4 de la mañana
    rule2.minute = 07;//Con 06 minutos
    /*var j = schedule.scheduleJob('*5 * * * * *', function(){
        Entre *5, fala un /
            console.log("Hola "+new Date());
    });*/
    var padre = this;
    var j = schedule.scheduleJob(rule2, function(){
            padre.crearColecciones(true);
    });
};

OracleMongo.prototype.getTotalRegistrosPorIdentificacion = function(identificacion){
    return mongodb.getTotalRegistrosPorPerfiles(entidesMonogoDB.getColecciones(),{identificacion:identificacion});
     
};
OracleMongo.prototype.getTotalRegistrosPorPerfil = function(perfil, nuevoResultado){
    var deferred = Q.defer();
    var padre = this;
    this.getIdentificacion(perfil).then(function(identificacion){
        mongodb.getTotalRegistrosPorPerfiles(entidesMonogoDB.getColecciones(),{identificacion:identificacion}).then(function(datos){
            deferred.resolve({perfil:perfil,datos:datos,nuevoResultado:nuevoResultado});
        },function(x){
        deferred.reject(false);
        });
    },function(x){
        deferred.reject(false);
    })
    return deferred.promise;
};

OracleMongo.prototype.validarExistenciaPerfilMobil = function(){
    return entidesMonogoDB.getJsonPerfiles().validarExistenciaPerfilMobil;
};

OracleMongo.prototype.isColeccionesTipoDiccionario = function(coleccion){
    
    return entidesMonogoDB.isColeccionesTipoDiccionario(coleccion);
};

OracleMongo.prototype.testItems = function(){

    oracledb.getPoolClienteConexion("select * from SWISSMOVI.emovtitem WHERE CODIGO='44030028'", [] , false, function(respuestaora){
        //for(i in respuestaora){
            //if(respuestaora[0].CODIGO =="44030028"){
                        console.log(respuestaora);
            //}
        //    }
        //}

});
};
function buscarEstadoPorOrden(orden){
    var deferred = Q.defer();
    oracledb.getPoolClienteConexion(sqlEstadosFactura, [orden] , false, function(respuestaora){
                    if(respuestaora.rows && respuestaora.rows.length>0){
                        if(respuestaora.rows[0].ESTADO_EDI === "A"){
                            deferred.resolve({orden:orden,estado:"EA",perfil:respuestaora.rows[0].MPERFIL_ID,dispositivo:respuestaora.rows[0].DISPOSITIVO, idmovil:respuestaora.rows[0].IDMOVIL });
                        }else{
                            if(respuestaora.rows[0].ESTADO_EDI){
                                deferred.resolve({orden:orden, estado:"E"+respuestaora.rows[0].ESTADO_EDI,perfil:respuestaora.rows[0].MPERFIL_ID, dispositivo:respuestaora.rows[0].DISPOSITIVO, idmovil:respuestaora.rows[0].IDMOVIL });
                            }else{
                                
                                 deferred.resolve({orden:orden, estado:"F"+respuestaora.rows[0].ESTADO,perfil:respuestaora.rows[0].MPERFIL_ID, dispositivo:respuestaora.rows[0].DISPOSITIVO, idmovil:respuestaora.rows[0].IDMOVIL});
                            }
                        }
                        
                    }else{
                        oracledb.getPoolClienteConexion(sqlEstadosOrden, [orden] , false, function(respuestaora){
                                if(respuestaora.rows && respuestaora.rows.length>0){
                                            deferred.resolve({orden:orden, estado:"O"+respuestaora.rows[0].ESTADO,perfil:respuestaora.rows[0].MPERFIL_ID, dispositivo:respuestaora.rows[0].DISPOSITIVO, idmovil:respuestaora.rows[0].IDMOVIL});
                                }else{
                                        console.log("No se eocntro el estado ",orden,sqlEstadosOrden,respuestaora);
                                        deferred.resolve({orden:orden, estado:"XX"});
                                }
                        });
                    }
            });
    return deferred.promise;
}

function notificarEstadosAlMovil(conexion, sokectId, perfil, estado, idmovil, tabla, callback){
    console.log("notificarEstadosAlMovil",sokectId);
    conexion.to(sokectId).emit('actualizar:estados',{amodificar:{estado:estado}, parametros:{id:idmovil},tabla:tabla});
    callback(true);
    
}


function sincronizarNuevosDatosAlMovil(conexion, perfil, perfilDispositivoMap, callback){
    console.log("sincronizarNuevosDatosAlMovil",perfil,datos);
    /*
     Sincronizacion
     1. El parametro datos es un un array con la siguiente informacion:
        perfilDispositivoMap.perfil = perfil
        dperfilDispositivoMap.dispositivo dispositivo
        dperfilDispositivoMap.versionPerfilReferencia = versionPerfilReferencia, es la cual el sincronizador antes de actualizar verificara que eixsta esta version
        dperfilDispositivoMap.versionPerfil = versionPerfil, nueva version que se actualizara al dispositivo
        dperfilDispositivoMap.versionActualizacion = versionActualizacion, es la version de la actualizacion
     2. Se hace una busqueda del buffer(scrip) en la coleccion emcversiones
     3. Formo un json a evniar via socket mendiante el proceso sockect sincronizacion

    */

    //Paso 2
    mongodb.getRegistroCustomColumnas("emcscriptsVersiones", {versionActualizacion:parseInt(perfilDispositivoMap.perfil)}, {buffer:1,_id:0}, function(respuesta){
            conexion.to(perfil).emit('sincronizacion', { db: true, buffer:respuesta.buffer,fecha:new Date().getTime(), parametros:perfilDispositivoMap});
    });

    //conexion.to(perfil).emit('socket:eval'," try{ if(window.cordova){$rootScope.porcentajeSincronizador={porcentaje:'0%'};sincronizacionManual().then(function(success){$ionicPopup.alert({  title: 'Sincronizando...', template: 'Por favor espere..<br>{{porcentajeSincronizador.porcentaje}}%' });socket.emit('perfil:sincronizado',{perfil:JSON.parse(localStorage.getItem('perfil')).id,resultado:success,uidd:getUidd()});},function(error){alert(error); socket.emit('perfil:sincronizado',error);  },function(porcentaje){$rootScope.porcentajeSincronizador = porcentaje});}}catch(error){alert(error)}");
    callback(true);
}
OracleMongo.prototype.socketEmit = function(conexion, perfil,emit, dato, callback){
    conexion.to(perfil).emit(emit,dato);
    callback(true)
    
}
var estadosPerfilPorSincronizar = {S:'Sincronizando...',OK:"Dispositivo sincronizado"}
OracleMongo.prototype.getEstadosPerfilPorSincronizar = function(){
    return estadosPerfilPorSincronizar;
}
OracleMongo.prototype.sincronizarPerfilesNuevosDatos = function(conexion, dispositivosConectados){
    //Origen client.sadd('sincronizar:perfiles',perfil+":"+dispositivo+":"+success.versionPerfilReferencia+":"+success.versionPerfil+":"+success.versionActualizacion+":");
    client.smembers('sincronizar:perfiles', function(err, perfilesYdispositivos) {
         if(Array.isArray(perfiles)){
                perfilesYdispositivos.forEach(function(perfil){
                    var perfilDispositivo = perfil.split(":");
                    var perfilDispositivoMap = {perfil:perfilDispositivo[0], dispositivo:perfilDispositivo[1], versionPerfilReferencia:perfilDispositivo[2],versionPerfil:perfilDispositivo[3],versionActualizacion:perfilDispositivo[4]}
                     console.log("sincronizarNuevosDatosAlMovil for ", perfilDispositivo);
                     if( perfilDispositivoMap && perfilDispositivoMap.perfil && perfilDispositivoMap.dispositivo && dispositivosConectados[perfilDispositivoMap.perfil] && dispositivosConectados[perfilDispositivoMap.perfil][perfilDispositivoMap.dispositivo]){
                         sincronizarNuevosDatosAlMovil(conexion, dispositivosConectados[perfilDispositivoMap.perfil][perfilDispositivoMap.dispositivo], perfilDispositivoMap, function(estado){});
                     }

               });
         }
    });
}
OracleMongo.prototype.revisarEstadosDeOrdenesEnviadasDesdeMovil = function(conexion, dispositivosConectados){
    client.smembers('ordenes', function(err, ordenes) {
        if(!err){
            console.log(ordenes)
            if(Array.isArray(ordenes)){
                ordenes.forEach(function(orden){
                    buscarEstadoPorOrden(orden).then(function(res){
                        if(res.estado === "XX"){
                             console.log("NNO SE ENCONTRO ",res);
                           return ; 
                        }
                        console.log("buscarEstadoPorOrden", res);
                        if(res.estado === "EA"){
                           client.srem('ordenes',res.orden, function(err, estado) {
                               console.log("Eliminada de ordenes en redis ",res.orden,estado);
                           });
                           client.hdel('orden::estado',res.orden, function(err, estado) {
                               console.log("Eliminada de orden::estado en redis ",res.orden,estado);
                           });
                            
                            //notificar al mobil
                        }else{
                            //Verficar si ya esxiste el estado
                            client.hget('orden::estado',res.orden, function(err, estado) {
                                console.log("err",err)
                                console.log("estado",estado)
                                if(estado !== res.estado){
                                    client.hmset('orden::estado',res.orden,res.estado , function(err, reply) {
                                        console.log("Orden en hmset", reply);
                                        //Notifica al mobil
                                    });
                                }
                            });

                        }
                        console.log("estado...",res.estado)
                        if(res.estado === 'OP' || res.estado === 'OA' ){

                            procesarOrdenEnProduccionSwisSystem(res.orden, null).then(function(r){
                            },function(error){
								client.srem('ordenes',res.orden, function(err, estado) {
									console.log("Eliminada de sets en redis ",res.orden,estado);
								});
								oracledb.getPoolClienteConexion("UPDATE EMOVTORDEN SET ESTADO=:ESTADO, MENSAJE=:M WHERE ORDEN_ID=:ORDEN", [error.estado,error.mensaje, res.orden], true, function(respuestaora){
									console.log(respuestaora);
								});

								if(res.dispositivo && dispositivosConectados && dispositivosConectados[res.perfil] && dispositivosConectados[res.perfil][res.dispositivo]){
									notificarEstadosAlMovil(conexion, dispositivosConectados[res.perfil][res.dispositivo], res.perfil, error.estado, res.idmovil, "emovtorden",function(estado){
									console.log("notificarEstadosAlMovil",estado)
									});

								}else{
									console.log("no se notificara puede ser por el perfil o dispositivo", dispositivosConectados, dispositivosConectados[res.perfil],res.dispositivo )
								}

							});
                        }
                        oracledb.getPoolClienteConexion("UPDATE EMOVTORDEN SET ESTADO=:ESTADO WHERE ORDEN_ID=:ORDEN", [res.estado, res.orden], true, function(respuestaora){
									console.log(respuestaora);
						});
                        
                        if(res.dispositivo && dispositivosConectados && dispositivosConectados[res.perfil] && dispositivosConectados[res.perfil][res.dispositivo]){
                            notificarEstadosAlMovil(conexion, dispositivosConectados[res.perfil][res.dispositivo], res.perfil, res.estado, res.idmovil, "emovtorden",function(estado){
                            console.log("notificarEstadosAlMovil",estado)
                            });

                        }else{
                            console.log("no se notificara puede ser por el perfil o dispositivo", dispositivosConectados, dispositivosConectados[res.perfil],res.dispositivo )
                        }
                        

                        
                    });
                });   
            }
            
            
        }
        
    });
       
};





OracleMongo.prototype.getColeccionesParaActualizar = function(tablas){
   return entidesMonogoDB.getColeccionesParaActualizar(tablas);
    
}

OracleMongo.prototype.setModelosDispositivosConectados = function(referenciawap){
    var modelos = {coleccion:"emcdispositivosModelos",documento:{modelo:"",informacion:[],informacionAcional:{},referenciawap:""}};
    //console.log("setModelosDispositivosConectados",referenciawap)
    request.get({
                url: referenciawap
                //headers:headers
            }, function(error, response, body){
               
                    if(!error && body){
                       // console.log(body)
                         parserXml2js.parseString(body, function (err, result) {
                             if(!err){
                                 var procesador="";
                                   try{
                                       procesador=result["rdf:RDF"]["rdf:Description"][0]["prf:component"][0]["rdf:Description"][0]["prf:CPU"][0];
                                   }catch(error){
                                       
                                   }
                                   
                                   mongodb.modificar(modelos.coleccion, {referenciawap:referenciawap}, {$set:{informacionAcional:JSON.parse(JSON.stringify(result).replace(/\$/g,'@')),procesador:procesador}}, function(r){
                                       //console.log("setModelosDispositivosConectados",referenciawap,r);
                                   });
                             }else{
                                 console.log( err)
                             }
                           
                         });
                   
                    }else{
                         console.log(error)
                    }


                
    });
}




OracleMongo.prototype.crearBdSqlitePorPerfil = function(perfil, bdPorPerfil){
     var deferred = Q.defer();
    var padre = this;
    padre.getTablasScript(function(script){
        var scripts = [];

            scripts = scripts.concat(padre.getScriptsIterarPorPerfil("Drop",padre.getTablasScriptDrop()));
            scripts = scripts.concat(padre.getScriptsIterarPorPerfil("",script));
            scripts = scripts.concat(padre.getScriptsIterarPorPerfil("UniqueKey",padre.getTablasScriptUniqueKey()));

      /*
        getScriptsIterarPorPerfil
           for(key in padre.getTablasScriptDrop()){
               if("emovtitemsemovtitem_promocionventaemovtdiccionarios".indexOf(key.replace("DROP",""))<0){
                    scripts.push(padre.getTablasScriptDrop()[key]);
               }

           }



           for(key in script){
               if("emovtitemsemovtitem_promocionventaemovtdiccionarios".indexOf(key)<0){
               scripts.push(script[key]);
               }
           }
           for(key in padre.getTablasScriptUniqueKey()){
               if("emovtitemsemovtitem_promocionventaemovtdiccionarios".indexOf(key.replace("UniqueKey",""))<0){
               scripts.push(padre.getTablasScriptUniqueKey()[key]);
               }
           }*/
            var busquedaPorPerfil = {};
            if(perfil === "todos" ){
              busquedaPorPerfil = {}
            }
            if(!isNaN(perfil)){
              busquedaPorPerfil = {"registroInterno.perfil":parseInt(perfil)}
            }
             sqliteCliente_.crearTablas(bdPorPerfil, scripts).then(function(success){
                    console.log("crearTablas",success, bdPorPerfil,scripts);
                    deferred.resolve(true);
                },function(error){
                     console.log("crearTablas error ",error);
                    deferred.reject(error);
            });


    },function(error){
             console.log("getTablasScript error ",error);
            deferred.reject(error);
        });
    return deferred.promise;
}


OracleMongo.prototype.crearBdSqliteDiccionarios = function(nombreBdSlite){
     var deferred = Q.defer();
    var padre = this;
    padre.getTablasScript(function(script){
        var scripts = [];
            scripts = scripts.concat(padre.getScriptsNoIterarPorPerfil("Drop",padre.getTablasScriptDrop()));
            scripts = scripts.concat(padre.getScriptsNoIterarPorPerfil("",script));
            scripts = scripts.concat(padre.getScriptsNoIterarPorPerfil("UniqueKey",padre.getTablasScriptUniqueKey()));
            
            sqliteCliente_.crearTablas(nombreBdSlite, scripts).then(function(success){
                    console.log("crearTablas",nombreBdSlite,scripts,success);
                    deferred.resolve(true);
                },function(error){
                     console.log("crearTablas error ",error);
                    deferred.reject(error);
                });


    },function(error){
             console.log("getTablasScript error ",error);
            deferred.reject(error);
        });
    return deferred.promise;
}

 OracleMongo.prototype.procesarPedidos = function(perfil){
    var padre = this;
	console.log("procesarPedidos",perfil);
    oracledb.llamarProcedimiento(procedimientos_oracle.pedidos,{pvcodret:"out",pvmsret:"out"},function(r){
        console.log(r);
        if(r && r.outBinds && r.outBinds.pvmsret){
            var ids = r.outBinds.pvmsret.split(",");
            for(var i =0;i<ids.length;i++){
                if(!isNaN(ids[i])){
                    procesarOrdenEnProduccionSwisSystem(ids[i], "nada por el momento").then(function(orden){
                        console.log(orden);
                    });
                    client.sadd(['ordenes', ids[i]], function(err, reply) {
                        console.log("Orden en memoria");
                    });
                    padre.revisarEstadosDeOrdenesEnviadasDesdeMovil();
                }
            }
        }else{
			console.log("enviando por email");
            try{
                //Enviando errores
                mailOptions.from =  '"Ecuaquimica, toma de pedido movil" <eq-ecuaquimica@ecuaquimica.com.ec>'; // sender address
                var mensajeError_ = "Estimados, al procesar al orden del perfil "+(perfil?perfil : "::proceso generardo via servicio::")+" el psql #PSQL entregó el siguiente error <hr><br><br>#ERROR <br><br>#FECHA"
                mailOptions.to  = 'ohonores@hotmail.com,ohonores@ecuaquimica.com.ec,paguilera@ecuaquimica.com.ec';
                mailOptions.subject  = "ECUAQUIMICA -- RECIBO DE PAGO ERROR EN EL PSQL";
                mailOptions.html  = mensajeError_.replace("#FECHA",new Date().toString().split("GMT-0500")[0]).replace("#PSQL",procedimientos_oracle.pedidos).replace("#ERROR", (Array.isArray(r) || typeof r =='object' )? r.toString():r);
                // send mail with defined transport object
                transporter.sendMail(mailOptions, function(error, info){
                    if(error){
                        //deferred.reject(error);
                    }else{
					    console.log(info.response);

                    }
                });
            }catch(error){
                console.log("Error al enviar el email",error)
            }
        }
    });

}

OracleMongo.prototype.procesarCartera  = function(perfil){

    oracledb.llamarProcedimiento(procedimientos_oracle.recibos,{pvcodret:"out",pvmsret:"out"},function(r){
        console.log("llamarProcedimiento",r);
		console.log("est array ",(Array.isArray(r) || typeof r =='object' )? r.toString():r);
        if(r && r.outBinds && r.outBinds.pvmsret){
            console.log("Si entron");
            var ids = r.outBinds.pvmsret.split(",");
            console.log("Si entron",ids);
            for(var i =0;i<ids.length;i++){
                if(!isNaN(ids[i])){
                    console.log("Si entron",ids[i]);
                    enviarEmail(ids[i], "nada por el momento").then(function(email){
                        console.log(email);
                    },function(x){
                        console.log(x);
                    });
                }else{
                    console.log("No se envio entron",ids);
                }
            }
        }else{
			console.log("Enviando errores al email")
            try{
                //Enviando errores
                mailOptions.from =  '"Ecuaquimica, recaudación" <eq-ecuaquimica@ecuaquimica.com.ec>'; // sender address
                var mensajeError_ = "Estimados, al procesar la recaudación del perfil "+(perfil ? perfil : "::proceso generardo via servicio::")+" el psql #PSQL entregó el siguiente error <hr><br><br>#ERROR <br><br>#FECHA"
                mailOptions.to  = 'ohonores@hotmail.com,ohonores@ecuaquimica.com.ec,paguilera@ecuaquimica.com.ec';
                mailOptions.subject  = "ECUAQUIMICA -- RECIBO DE PAGO ERROR EN EL PSQL";
                mailOptions.html  = mensajeError_.replace("#FECHA",new Date().toString().split("GMT-0500")[0]).replace("#PSQL",procedimientos_oracle.recibos).replace("#ERROR", (Array.isArray(r) || typeof r =='object' )? r.toString():r);
                // send mail with defined transport object
                transporter.sendMail(mailOptions, function(error, info){
                    if(error){
                    //deferred.reject(error);
                    }else{
						console.log("Se envio el email de errores",info.response)

                    }
                });
            }catch(error){
                console.log("Error al enviar el email",error)
            }
        }
    });
}

function getTotalesParcialesPorPerifil(index, colecciones, identificacion, perfil, callBack){
    if(index < colecciones.length){
        var parametros = {};
        if(!colecciones[index].diccionario){
            parametros.identificacion = identificacion;
            if(!isNaN(perfil)){
                parametros.perfil = parseInt(perfil);
            }

        }
       // console.log("getTotalesParcialesPorPerifil ",colecciones[index].coleccion,parametros);

        mongodb.getRegistrosCustomColumnas(colecciones[index].coleccion, parametros, {index:1,_id:0}, function(respuesta){
                colecciones[index].indices = respuesta;
                index = index +1;
                console.log("getTotalesParcialesPorPerifil ",parametros,respuesta);
                getTotalesParcialesPorPerifil(index, colecciones, identificacion, perfil, callBack);
        });
    }else{
        callBack(colecciones);
    }
}

//Scripts ****************************************************************/
function getSriptTablaDesdeUnSql(index, sqls, callBack){
    if(index < sqls.length){
        oracledb.getPoolClienteConexion(sqls[index].sql, [], false, function(respuestaora){
            if(respuestaora && respuestaora.metaData){
                sqls[index].campos = respuestaora.metaData.reduce(function(nuevasColumnas, columna){
                                        if (columna.name != "ID"){
                                            nuevasColumnas.push(columna.name.toLowerCase());
                                    }
                                    return nuevasColumnas;
                                },[]);


            }

            index +=1;
            getSriptTablaDesdeUnSql(index, sqls, callBack);
         });
    }else{
        callBack(sqls);
    }
}


function enviarEmail(precartera, extras){
    console.log("enviarEmail",precartera);
    var deferred = Q.defer();
    var mensaje = "Estimado #NOMBRE, agradecemos el pago de $ #PAGO, realizado a través de nuestro funcionario(#NOMBRES) el día #FECHA";
    var mensajeError = "Estimados, no se encontraron datos con la siguiente cartera #precartera, por tal motivo no se ha enviado el email.<hr><br> Errores:#extras";
    
    oracledb.getPoolClienteConexion(sqlSumaCartera, [precartera], false, function(respuestaora){
        if(respuestaora && respuestaora.rows &&  respuestaora.rows.length > 0  && respuestaora.rows[0].PAGO>0){
            mailOptions.from = '"Ecuaquimica recibos de pago" <eq-ecuaquimica@ecuaquimica.com.ec>';// sender address
            console.log(respuestaora.rows[0]);
            //EMAILRECAUDACION
            
            mailOptions.to  = 'fblanc@gmail.com, ohnores@hotmail.com,dchavez@ecuaquimica.com.ec,ohonores@ecuaquimica.com.ec,paguilera@ecuaquimica.com.ec';
            mailOptions.subject  = "Ecuaquimica recibo de pago #PREIMPRESO".replace("#PREIMPRESO",respuestaora.rows[0].PREIMPRESO);
            mailOptions.html  = mensaje.replace("#PAGO", parseFloat(respuestaora.rows[0].PAGO).toFixed(2)).replace("#FECHA",new Date().toString().split("GMT-0500")[0]).replace("#NOMBRES",respuestaora.rows[0].NOMBRES).replace("#NOMBRE",respuestaora.rows[0].NOMBRE);
            // send mail with defined transport object
            transporter.sendMail(mailOptions, function(error, info){
                if(error){
                    deferred.reject(error);
                }else{
                    deferred.resolve(info.response)
                }
                
                
            });
        }else{
            
            mailOptions.to  = 'fblanco@gmail.com, ohonores@hotmail.com,dchavez@ecuaquimica.com.ec,ohonores@ecuaquimica.com.ec,paguilera@ecuaquimica.com.ec';
            mailOptions.subject  = "ECUAQUIMICA -- RECIBO DE PAGO ERROR AL ENVIAR EL EMAIL";
            mailOptions.html  = mensajeError.replace("#precartera",precartera).replace("#extras",extras);
            // send mail with defined transport object
            transporter.sendMail(mailOptions, function(error, info){
                if(error){
                    deferred.reject(error);
                }else{
                    deferred.resolve(info.response)
                }
                
                
            });
            
            deferred.reject("No se enontraron datos con la precartera id",precartera); 
        }
        console.log(respuestaora);
    });
    return deferred.promise;
}

function procesarOrdenEnProduccionSwisSystem(orden, extras){
    console.log("procesarOrdenEnProduccionSwisSystemXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",orden);
    var deferred = Q.defer();
    var mensaje = "Estimados, se envió a procesar la orden #ORDEN, mensaje recibido por parte de SwisSystem #mensaje día #FECHA <br><br> #ERRORES";
    var mensajeError = "Estimados, se envió a procesar la orden #ORDEN, pero no se encontró el usuario. <br>#FECHA";
     
    oracledb.getPoolClienteConexion(sqlObtenerUsuario, [orden], false, function(respuestaora){
        if(respuestaora && respuestaora.rows &&  respuestaora.rows.length > 0  && respuestaora.rows[0].USUARIO_ID){
            mailOptions.from =  '"Ecuaquimica, toma de pedido movil" <eq-ecuaquimica@ecuaquimica.com.ec>'; // sender address
            request.get({
                url: servicio.replace("#ORDEN", orden).replace("#USUARIO_ID", respuestaora.rows[0].USUARIO_ID)
                //headers:headers
            }, function(error, response, body){
                console.log("body *********************",body,servicio.replace("#ORDEN", orden).replace("#USUARIO_ID", respuestaora.rows[0].USUARIO_ID));
				if(error){
					console.log("ERROR *********************",error);
				}else{
					if(body && body.indexOf("promociones anuladas")>=0 || body && body.indexOf("Desbloqueada")>=0 ){
						deferred.reject({estado:"OI",mensaje:body.replace(/>/g,"").replace(/</g,"")});
					}else{
						if(body && (body + "").indexOf("Procesado")>=0){

							mailOptions.to  = 'fblanc@gmail.com, ohonores@hotmail.com,dchavez@ecuaquimica.com.ec,ohonores@ecuaquimica.com.ec,paguilera@ecuaquimica.com.ec';
							mailOptions.subject  = "ECUAQUIMICA -- PROCESO DE ORDEN # "+orden;
							mailOptions.html  = mensaje.replace("#mensaje",body ? body:"").replace("#ORDEN",orden).replace("#FECHA",new Date().toString().split("GMT-0500")[0]).replace("#ERRORES",error ? "Error al llamar el servico::<br>"+error : "");
							transporter.sendMail(mailOptions, function(error, info){
								if(error){
									deferred.reject(error);
								}else{
									deferred.resolve(info.response)
								}


							});
						}else{
							//deferred.reject({estado:"OI",mensaje:body.replace(/>/g,"").replace(/</g,"")});
						}
					}
				}
            });

            sqlObtenerUsuario.replace("#ORDEN", orden).replace("#USUARIO_ID",respuestaora.rows[0].USUARIO_ID)
            
        }else{
            
            mailOptions.to  = 'fblanco@gmail.com, ohonores@hotmail.com,dchavez@ecuaquimica.com.ec,ohonores@ecuaquimica.com.ec,paguilera@ecuaquimica.com.ec';
            mailOptions.subject  = "ECUAQUIMICA -- RECIBO DE PAGO ERROR AL ENVIAR EL EMAIL";
            mailOptions.html  = mensajeError.replace("#ORDEN",orden).replace("#FECHA",new Date().toString().split("GMT-0500")[0]);
            // send mail with defined transport object
            transporter.sendMail(mailOptions, function(error, info){
                if(error){
                    deferred.reject(error);
                }else{
                    deferred.resolve(info.response)
                }
                
                
            });
            
            deferred.reject("No se enontraron datos con la orden id",orden); 
        }
        console.log(respuestaora);
    });
    return deferred.promise;
}



module.exports = OracleMongo;
