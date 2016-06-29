
var schedule = require('node-schedule');
var EntidadesMongoOracle = require("./jsonEntity.js");
var entidesMonogoDB = new EntidadesMongoOracle();
var hash = require('object-hash');
var Q = require('q');
var oracle,mongodb,oracledb;
var arrayJson_ =new RegExp("^arrayJson([0-9])+$")
var json_ =new RegExp("_json_$");
//Selects para obtener los datos a Oracle
var sqlBusquedaPerfilesNew = "SELECT * FROM  SWISSMOVI.EMOVTPERFIL WHERE ROWNUM <2";
var sqlBusquedaEstabPorPerfilNew = "SELECT * FROM SWISSMOVI.EMOVTPERFIL_ESTABLECIMIENTO PE WHERE PE.MPERFIL_ID =:ID AND  PE.ID>=:A AND ROWNUM<=:B ORDER BY PE.ID ASC";
var sqlBusquedaEstabPorPerfilMinNew = "SELECT MIN(ID) AS ID FROM SWISSMOVI.EMOVTPERFIL_ESTABLECIMIENTO WHERE MPERFIL_ID =:ID AND ID>:ID";
var sizeArrayPorDocumento = 200;
function getDatos(origen, destino, keyToDelete){
	//console.log("getDatos inicio ", keyToDelete);
    for(var key in destino){
        if(typeof(destino[key]) == "string"){
            
            destino[key] =(destino[key] && destino[key].indexOf("*")===0 )? destino[key].substring(1,destino[key].length):( (origen[destino[key]] === undefined || origen[destino[key]] === null)  ?null:origen[destino[key]]);
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

            //console.log(destino);
        }else{	
			 
			//console.log("getDatos .......", keyToDelete, key);
             if(key.indexOf("arrayJson")<0){
                getDatos(origen, destino[key], keyToDelete);
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

function getconjuntoDeArrysJson(registros, origen, conjuntoDeArrysJson){
	//console.log("getconjuntoDeArrysJson");
	for(var key in origen){
        if(key.indexOf("arrayJson")>=0){ 
			//console.log("getconjuntoDeArrysJson",key);
			conjuntoDeArrysJson.push(buscandoRegistrosRecursivos(registros, origen[key], key));
		}
        if(typeof(origen[key]) != "string"){
           getconjuntoDeArrysJson(registros, origen[key], conjuntoDeArrysJson);
        }
    }
	
	return conjuntoDeArrysJson;
}

function buscarTodasEtiquetaJsonCallFuncion(registros, origen){
	var deferred = Q.defer();
	
	var conjuntoDeArrysJson = [];
	conjuntoDeArrysJson = getconjuntoDeArrysJson(registros, origen, conjuntoDeArrysJson);
	
	//console.log("buscarTodasEtiquetaJsonCallFuncion conjuntoDeArrysJson ",conjuntoDeArrysJson.length);
	Q.all(conjuntoDeArrysJson).then(function(r){
		//console.log("2 buscarTodasEtiquetaJsonCallFuncion fin al fin ",registros[registros.length-1].registroMovil);
        deferred.resolve(registros);
    },function(x){
		deferred.reject(x);
	});
    return deferred.promise
	
}
function getJsonFromArray(dato){
	var newJsonArray = [];
    var newJson = {};
		newJsonArray = dato.reduce(
			function(a,b){
			    var tv=[];
				for(key_ in b){
					tv.push(b[key_]);
				}
				if(!isNaN(tv[1])){
					a[tv[0]] = parseFloat(parseFloat(tv[1]).toFixed(2))
				}else{
					a[tv[0]] = tv[1];
				}
				return a;
		},{});
		/*console.log("setDatoToJsonPorEtiqueta",newJsonArray.length);
        for(var i=0;i<newJsonArray.length;i++){
			if((i+1)<newJsonArray.length){
				newJson[newJsonArray[i]]= newJsonArray[i+1];
			}
		}*/
		return newJsonArray;
}

function setDatoToJsonPorEtiqueta(origen, dato, etiqueta, eliminarKey, callback){
    for(var key in origen){
	
			if(key === etiqueta ){
				
				origen[json_.test(key) ? key.replace("_json_",""):key] = json_.test(key) ? getJsonFromArray(dato) : dato;
				if(json_.test(key)){
					delete origen[key];
				}
			
				
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
function setRegistrosRecursivos(jsonEntity, documento, key){
    var deferred = Q.defer();
	
    oracledb.getPoolClienteConexion(jsonEntity.sqlOrigen, jsonEntity.parametrosBusquedaValores, false, function(respuestaora){
		if(respuestaora.error){
			deferred.reject(respuestaora);
			return deferred.promise;
		}
        if(respuestaora && respuestaora.rows && respuestaora.rows.length>0){
			//console.log(key, jsonEntity.sqlOrigen, jsonEntity.parametrosBusquedaValores, respuestaora.rows.length);
                var datoMapeado = respuestaora.rows.map(function(registro){
                        jsonClon = JSON.parse(JSON.stringify(jsonEntity.registroMovil));
                        getDatos(registro, jsonClon, key);
                        return jsonClon;
                });
				//console.log(datoMapeado);
                setDatoToJsonPorEtiqueta(documento, datoMapeado, jsonEntity.etiqueta,key, function(r){
					 deferred.resolve(true);
				});
        }else{
			deferred.resolve(true);
		}
       

    });
    return deferred.promise;
}
function buscandoRegistrosRecursivos (listaRegistros, jsonEntity, key){
    var deferred = Q.defer();
    var listaSetRegistrosRecursivos = [];
    listaRegistros.forEach(function(r){
        jsonEntity.parametrosBusquedaValores=[];
        if(jsonEntity.parametrosBusqueda){
            jsonEntity.parametrosBusqueda.forEach(function(b){
                jsonEntity.parametrosBusquedaValores.push(eval("r."+b));
            });
       }
       listaSetRegistrosRecursivos.push(setRegistrosRecursivos(jsonEntity, r, key));
    });
    Q.all(listaSetRegistrosRecursivos).then(function(r){
		deferred.resolve(listaRegistros);
    },function(x){
		console.log("Error e buscandoRegistrosRecursivos ", x);
		 deferred.reject({error:x});
	});
    return deferred.promise;
}
/* rorrame
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
function grabarRegistrosRecursivosQ(i, a, id, identificacion, perfil, cantidad, jsonEntity){
    var deferred = Q.defer();
    var listaGrabarRegistrosRecursivos = [];
    //console.log("grabarRegistrosRecursivosQ ",jsonEntity.coleccion);
    grabarRegistrosRecursivos(i, a, id, identificacion, perfil, cantidad, jsonEntity, function(r){
		if(r.error){
			deferred.reject(r);
		}else{
			deferred.resolve(r);
		}
        
    });
    return deferred.promise;
}
function grabarRegistrosRecursivos (i, a, id, identificacion, perfil, cantidad, jsonEntity, callBack){
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
                            getDatos(registro, jsonClon);
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
                //console.log("Registros recursivos");
				
				buscarTodasEtiquetaJsonCallFuncion(nuevoRegistro.registros, jsonEntity.registroMongo).then(function(resp){
					 nuevoRegistro.registros = resp;
					 //console.log("last buscarTodasEtiquetaJsonCallFuncion fin ", resp);
					 mongodb.grabar(jsonEntity.coleccion, nuevoRegistro, grabarSinValidarExistencia).then(function(r){
                                
                        },function(x){
                           // console.log(x);
                            if(x.existe != true){
								callBack({error:true});
							}
                     });
				},function(r){
					callBack(r);
				})
				
            }else{

                mongodb.grabar(jsonEntity.coleccion, nuevoRegistro, grabarSinValidarExistencia).then(function(respuesta){
                //    console.log(respuesta);
                },function(x){
                    //console.log(x);
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
function grabarRegistrosRecursivosDesdeUnArraySqls(index, listaSqls, i, callBack){
    console.log("grabarRegistrosRecursivosDesdeUnArraySqls "+index);
    if(index < listaSqls.length){
        grabarRegistrosRecursivos (i, 0, null , null, null, sizeArrayPorDocumento, listaSqls[index] , function(resultado){
            //console.log("grabarRegistrosRecursivosDesdeUnArraySqls");
            //console.log(resultado);
            index = index + 1;
            grabarRegistrosRecursivosDesdeUnArraySqls(index, listaSqls, resultado.indeces, callBack);
        });
    }else{
        callBack(i);
    }
}
OracleMongo.prototype.autentificacion = function(parametros, callBack){
	console.log(parametros);
    var busquedaPerfil = {"registroMovil.identificacion":parametros.identificacion };
        if(parseInt(parametros.empresa) !== 0 ){
            busquedaPerfil["infoEmpresa.empresa_id"] = parametros.empresa;
        }
        
        mongodb.getRegistrosCustomColumnas("emcperfiles", {"registroMovil.identificacion":parametros.identificacion} , {registroMovil:1,registroInterno:1}, function(resultado){
			console.log(resultado);
            callBack(resultado);
        /*    mongodb.modificar("emcperfiles", {_id:resultado._id}, {actualizar}, function(){

        })*/
        });
};

function borrarColeccion(borrar, json){
    var deferred = Q.defer();
    if(borrar){
        console.log("Borrar tabla 1",json.coleccion);
        mongodb.dropCollection(json.coleccion , function(coleccionBorrada){
                console.log("borrada",json.coleccion);
                deferred.resolve(json);
        });
    }else{
        console.log("ACTUALIZANDO ",json.coleccion);
        deferred.resolve(json);
    }

    return deferred.promise;
}

function grabarPerfiles(json){
    var deferred = Q.defer();
    console.log("grabarPerfiles");
    console.log(json);
    //Obtiene todos los perfiles en Oracle
    oracledb.getPoolClienteConexion(json.sqlOrigen, [], false, function(respuestaora){
		if(respuestaora.error){
			deferred.reject(respuestaora);
			return deferred.promise; 
		}
        if(respuestaora && respuestaora.rows &&  respuestaora.rows.length > 0  ){
            //crea un nuevo registro para grabar en mongo a partir del registro individual en oracle
            console.log("tota "+respuestaora.rows.length);
            var conjuntoPerfiles = respuestaora.rows.map(function(registro){
                var jsonPerfilesClon = JSON.parse(JSON.stringify(json.registroMongo));
                getDatos(registro, jsonPerfilesClon);
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
                buscarEtiquetaJsonCallFuncion(json.registroMongo, function(nuevoArrayJson, key){
					console.log("perfiles buscarEtiquetaJsonCallFuncion recursivo ",key);
                    buscandoRegistrosRecursivos (conjuntoPerfiles, nuevoArrayJson, key).then(function(resp){
                        conjuntoPerfiles = resp;
                        console.log("buscandoRegistrosRecursivos");
                        mongodb.grabarArrayQ(json.coleccion, conjuntoPerfiles).then(function(total){
                            deferred.resolve({totalRegistros:total,nested:true});
                        },function(x){
                            deferred.resolve({totalRegistros:total,nested:true});
                        });
                    });
                });

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

OracleMongo.prototype.crearPerfiles = function(borrar){
    var deferred = Q.defer();
    borrarColeccion(borrar, entidesMonogoDB.getJsonPerfiles()).
    then(grabarPerfiles).
    then(function(r){
        //console.log(r);
        deferred.resolve(r);
    },function(r){
        console.log(r);
        deferred.reject(r);
    });
    return deferred.promise;
};
OracleMongo.prototype.setSizeArrayPorDocumento = function(nuevoSize){
    sizeArrayPorDocumento = nuevoSize;
};
OracleMongo.prototype.crearColeccionesMongo = function(borrar, jsonEntityArray){
    var deferred = Q.defer();
    var coleccionesPorCrear = [];
    jsonEntityArray.forEach(function(jsonEntity){
        coleccionesPorCrear.push(crearColeccionMongo(borrar, jsonEntity));
    });
    Q.all(coleccionesPorCrear).then(function(r){
        deferred.resolve(r);
    },function(x){
		deferred.reject(x);
	});
    return deferred.promise;
};

function crearColeccionMongo(borrar, jsonEntity){
    var deferred = Q.defer();
    borrarColeccion(borrar, jsonEntity).
    then(insertarDocumentos).
    then(function(r){
	    deferred.resolve(r);
    },function(r){
		deferred.reject(r);
    });
    return deferred.promise;
};


function insertarDocumentos(jsonEntity){
    var deferred = Q.defer();
    var listaRegistrosGrabados = [];
    var jsonEstablecimiento = {};
    var nuevoJsonDoc = {};
    //Valida si la entidad tiene que ser recorrida por cada perfil
    if(jsonEntity.iteracionPorPerfil){
        //Inicia el recorrido
        //Se grabara los documentos  por perfil en un conjunto de sizeArrayPorDocumento
        mongodb.getRegistrosCustomColumnas(entidesMonogoDB.getJsonPerfiles().coleccion,{},{_id:1,"registroMovil.identificacion":1,"registroInterno.perfil":1,"registroMovil.infoEmpresa.empresa_id":1}, function(respuesta){
                    respuesta.forEach(function(r){
                        nuevoJsonDoc = JSON.parse(JSON.stringify(jsonEntity));
                        nuevoJsonDoc.parametrosBusqueda.forEach(function(b){
                            nuevoJsonDoc.parametrosBusquedaValores.push(eval("r."+b));
                        });
                        listaRegistrosGrabados.push(grabarRegistrosRecursivosQ(1, 0, r._id, r.registroMovil.identificacion, r.registroInterno.perfil, sizeArrayPorDocumento, nuevoJsonDoc ));
                    });
                    Q.all(listaRegistrosGrabados).then(function(a){
                        deferred.resolve(a);
                    },function(x){
						deferred.reject(x);
					});
        });
    }else{
        console.log("No se hace el recorrdio por perfil");
        //Graba los documentos segun la tabla de oracle en un conjunto de sizeArrayPorDocumento
        grabarRegistrosRecursivosQ(1, 0, null, null, null, sizeArrayPorDocumento, jsonEntity).then(function(resultado){
			deferred.resolve(resultado);
			 
        },function(x){
			deferred.reject(resultado);
		});
    }

    return deferred.promise;
}

function crearBodegasPorPefil(borrar, inicio){
    console.log("crearEstablecimientos borrar "+borrar);
    var jsonBodega = {};
    borrar = false;
    mongodb.dropCollection(borrar ? entidesMonogoDB.getJsonEstablecimientos().coleccion : "noborrar", function(coleccionBorrada){
            console.log("crearEstablecimientos creado");
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


OracleMongo.prototype.crearDiccionarios = function(borrar){
	var deferred = Q.defer();
    borrarColeccion(borrar, entidesMonogoDB.getJsonDiccionarioBanco()).
    then(function(r){
        var diccionarios = [
                            entidesMonogoDB.getJsonDiccionarioBanco(),
                            entidesMonogoDB.getJsonDiccionarioCuentaBancaria(),
                            entidesMonogoDB.getJsonDiccionarioDocumento(),
                            entidesMonogoDB.getJsonDiccionarioBodegaVenta(),
							entidesMonogoDB.getJsonDiccionarioLineaNegocio()
                        ];
        grabarRegistrosRecursivosDesdeUnArraySqls(0, diccionarios, 1, function(a){
                console.log("crearColecciones crearDiccionarios listo",a);
				deferred.resolve(true);
        });

    });
	 return deferred.promise;

};

OracleMongo.prototype.crearEstadoCuenta = function(borrar){
    console.log("crearDiccionarios borrar "+borrar);
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


//    return  entidesMonogoDB.getTablasScript();

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

//Para entregar al restful
OracleMongo.prototype.getDatosDinamicamenteDeInicio = function(coleccion, perfil, index, callBack){
    var parametros = {index: parseInt(index)};
    if(perfil){
        parametros.perfil=perfil;
    }
    mongodb.getRegistroCustomColumnas(coleccion, parametros, {registros:1,_id:0}, function(respuesta){
            callBack(respuesta);
    });

};
OracleMongo.prototype.getTodosLosCambiosPorSincronizarPorPerfil = function(perfil, url){
    var deferred = Q.defer();
    var resultados = [];
	console.log("getTodosLosCambiosPorSincronizarPorPerfil inicio");
    entidesMonogoDB.getColecciones().forEach(function(c){
        resultados.push(getDatosDinamicamenteParaActualizar(c.coleccion,c.tabla, perfil, null, {index:1}));
    });
    Q.all(resultados).then(function(res){
		if(Array.isArray(res)){
			console.log("array getTodosLosCambiosPorSincronizarPorPerfil", res)
		}
        res = res.filter(function(r){
			console.log("r******",r);
            if(r.urls && Array.isArray(r.urls) && r.urls.length>0){
                r.urls = r.urls.reduce(function(nuevo, z){
						console.log("z******",z);
						
						nuevo.push(url.replace(":coleccion",r.coleccion).replace(":index",z.index));
						
                        
                        return nuevo;
                },[]);
                return true;
            }else{
               return false;

			}
        });
        console.log("despes getTodosLosCambiosPorSincronizarPorPerfil ",res);
        deferred.resolve(res);
    },function(c){
		console.log("error en getTodosLosCambiosPorSincronizarPorPerfil",c);
		 deferred.reject(c);
	});
    return deferred.promise;
};

OracleMongo.prototype.getDatosPorSincronizarPorPerfilIndex = function(coleccion, perfil, index){
    var deferred = Q.defer();
    console.log(coleccion);
        console.log(perfil);
            console.log(index);
    getDatosDinamicamenteParaActualizar(coleccion, null, perfil, index, {sincronizar:1,_id:0}).then(function(res){
        console.log(res);
        deferred.resolve(res);
    });



    return deferred.promise;
};

function getDatosDinamicamenteParaActualizar(coleccion, tabla, perfil, index, mostrarColumnas){
    var deferred = Q.defer();
    var parametros ={};
    if(perfil){
        parametros.perfil=perfil;
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
    console.log(parametros);
    console.log(mostrarColumnas);
    mongodb.getRegistrosCustomColumnas(coleccion, parametros, mostrarColumnas, function(respuesta){
        console.log("getRegistrosCustomColumnas ",coleccion,parametros,mostrarColumnas, respuesta);
      
            if(mostrarColumnas.index){
				console.log("mostrarColumnas.index resolve ok ",coleccion);
                deferred.resolve({coleccion:coleccion,tabla:tabla,urls:respuesta});
            }else{
				if(parametros.index){
					deferred.resolve(respuesta);
					console.log("mostrarColumnas.index resolve ok ",coleccion);
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
            console.log(r);
        deferred.resolve(true)
    });
    return deferred.promise;
}
var procedimientos_oracle = {
    pedidos:"cargarpedido(:pvcodret,:pvmsret)"
}
//Para entregar al restful
OracleMongo.prototype.setDatosDinamicamente = function(tabla, datos, datosperfil, callBack){
        coleccion = entidesMonogoDB.getColecciones().filter(function(c){
                if(c.tabla === tabla){
                    return true;
                }
        });
        var documento = {registroMovil : datos, perfil : datosperfil.perfil, empresa:datosperfil.empresa};
        mongodb.grabarRegistrosDesdeMovil(coleccion[0].coleccion, documento).then(function(r){
            oracledb.grabarNestedJson(datos, tabla).then(function(r){
				if(r){
                    //Llamar procedimiento almacenado
                    oracledb.llamarProcedimiento(procedimientos_oracle.pedidos,{pvcodret:"out",pvmsret:"out"},function(r){
                        console.log(r);
                    });
                }
                callBack(r);
            },function(r){
                console.log("listo no  grabarJson ",r);
                callBack(r);
            });
        },function(x){
            callBack(x);
        });


};


OracleMongo.prototype.getUrlsPorPefil = function(identificacion, perfil, urlPorPefil, urlDiccionario, urlRecpcion, callBack){
    getTotalesParcialesPorPerifil(0, entidesMonogoDB.getColeccionesParaSincronzar(), identificacion, perfil, function(nuevaColeccion){
        nuevaColeccionA = nuevaColeccion.map(function(col){
            if(col.diccionario){
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
var creandoA= false;
OracleMongo.prototype.crearColecciones = function(borrar){
	grabarSinValidarExistencia = borrar;
	var deferred = Q.defer();
    //1. Crear perfiles
    var padre = this;
        padre.crearPerfiles(borrar).
        then(function(r){
			console.log("crearPerfiles ok");
            padre.crearColeccionesMongo(borrar, [entidesMonogoDB.getJsonEstablecimientos()]).then(function(a){
				console.log("getJsonEstablecimientos ok");
				padre.crearColeccionesMongo(borrar, [entidesMonogoDB.getJsonEstadoDeCuenta()]).then(function(a1){
					console.log("getJsonEstadoDeCuenta ok ");
					padre.crearColeccionesMongo(borrar, [entidesMonogoDB.getJsonItems()]).then(function(a){
						console.log("getJsonItems ok");
						padre.crearColeccionesMongo(borrar, [entidesMonogoDB.getJsonPromocionVenta()]).then(function(a){
							console.log("getJsonPromocionVenta ok");
							padre.crearColeccionesMongo(borrar, [entidesMonogoDB.getJsonCruce()]).then(function(a){
								 console.log("getJsonCruce ok");
								 padre.crearDiccionarios(borrar).then(function(t){
									deferred.resolve(t);
								 });
							},function(x4){
								console.log("Fin por favor iniciar nuevamente getJsonCruce",error);
								deferred.reject(x4);
							});
						},function(x3){
							console.log("Fin por favor iniciar nuevamente getJsonPromocionVenta",error);
							deferred.reject(x3);
						});
					},function(x2){
						console.log("Fin por favor iniciar nuevamente getJsonItems",error);
						deferred.reject(x2);
					});
				},function(x1){
					console.log("Fin por favor iniciar nuevamente getJsonEstadoDeCuenta",error);
					deferred.reject(x1);
				});
            },function(x){
				console.log("Fin por favor iniciar nuevamente getJsonEstablecimientos",error);
				deferred.reject(x);
			});

            //padre.crearEstadoCuenta(borrar);
        },function(error){
            console.log("Fin por favor iniciar nuevamente",error);
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
OracleMongo.prototype.getTotalRegistrosPorPerfiles = function(identificacion){
    return mongodb.getTotalRegistrosPorPerfiles(entidesMonogoDB.getColecciones(),{identificacion:identificacion});
};

OracleMongo.prototype.validarExistenciaPerfilMobil = function(){
    return entidesMonogoDB.getJsonPerfiles().validarExistenciaPerfilMobil;
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

function getTotalesParcialesPorPerifil(index, colecciones, identificacion, perfil, callBack){
    if(index < colecciones.length){

        var parametros = {};
        if(!colecciones[index].diccionario){
            parametros.identificacion = identificacion;
            parametros.perfil = perfil;
        }

        mongodb.getRegistrosCustomColumnas(colecciones[index].coleccion, parametros, {index:1,_id:0}, function(respuesta){
                colecciones[index].indices = respuesta;
                index = index +1;
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




module.exports = OracleMongo;
