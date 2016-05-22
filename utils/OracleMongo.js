
var schedule = require('node-schedule');
var EntidadesMongoOracle = require("./jsonEntity.js");
var entidesMonogoDB = new EntidadesMongoOracle();
var hash = require('object-hash');
var Q = require('q');
var oracle,mongodb,oracledb;
//Selects para obtener los datos a Oracle
var sqlBusquedaPerfilesNew = "SELECT * FROM  SWISSMOVI.EMOVTPERFIL WHERE ROWNUM <2";
var sqlBusquedaEstabPorPerfilNew = "SELECT * FROM SWISSMOVI.EMOVTPERFIL_ESTABLECIMIENTO PE WHERE PE.MPERFIL_ID =:ID AND  PE.ID>=:A AND ROWNUM<=:B ORDER BY PE.ID ASC";
var sqlBusquedaEstabPorPerfilMinNew = "SELECT MIN(ID) AS ID FROM SWISSMOVI.EMOVTPERFIL_ESTABLECIMIENTO WHERE MPERFIL_ID =:ID AND ID>:ID";
var sizeArrayPorDocumento = 200;
function getDatos(origen, destino){
    for(var key in destino){
        if(typeof(destino[key]) == "string"){
            //console.log(destino[key] + " " + origen[destino[key]]);
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
            if(key != "arrayJson"){
                getDatos(origen, destino[key]);
            }else{
                delete destino.arrayJson;
            }
        }
    }
}

function buscarEtiquetaJsonListaResultados(origen, lista){

    for(var key in origen){

        if(key === "arrayJson"){
            lista.push(true);
            return;
        }
        if(typeof(origen[key]) != "string"){
            buscarEtiquetaJsonListaResultados(origen[key], lista);
        }
    }

}

function buscarEtiquetaJsonCallFuncion(origen, callBack){
    for(var key in origen){
        if(key === "arrayJson"){
            callBack(origen[key]);
        }
        if(typeof(origen[key]) != "string"){
            buscarEtiquetaJsonCallFuncion(origen[key], callBack);
        }
    }
}

function setDatoToJsonPorEtiqueta(origen, dato, etiqueta){
    for(var key in origen){
            if(key === etiqueta ){
            origen[key] = dato;

            return;
        }
        if(typeof(origen[key]) != "string"){
            setDatoToJsonPorEtiqueta(origen[key], dato, etiqueta);
        }
    }
}

var OracleMongo = function (oracle_, mongo_) {
    oracle = oracle_;
    oracledb = oracle_;
    mongodb = mongo_;

};

var periflesIds = [];
function setRegistrosRecursivos(jsonEntity, documento){
    var deferred = Q.defer();
    oracledb.getPoolClienteConexion(jsonEntity.sqlOrigen, jsonEntity.parametrosBusquedaValores, false, function(respuestaora){
        if(respuestaora && respuestaora.rows && respuestaora.rows.length>0){
                var datoMapeado = respuestaora.rows.map(function(registro){
                        jsonClon = JSON.parse(JSON.stringify(jsonEntity.registroMovil));
                        getDatos(registro, jsonClon);
                        return jsonClon;
                });
                setDatoToJsonPorEtiqueta(documento, datoMapeado, jsonEntity.etiqueta);
        }
        deferred.resolve(true);

    });
    return deferred.promise;
}
function buscandoRegistrosRecursivos (listaRegistros, jsonEntity){
    var deferred = Q.defer();
    var listaSetRegistrosRecursivos = [];
    listaRegistros.forEach(function(r){
        jsonEntity.parametrosBusquedaValores=[];
        if(jsonEntity.parametrosBusqueda){
            jsonEntity.parametrosBusqueda.forEach(function(b){
                jsonEntity.parametrosBusquedaValores.push(eval("r."+b));
            });
       }
       listaSetRegistrosRecursivos.push(setRegistrosRecursivos(jsonEntity, r));
    });
    Q.all(listaSetRegistrosRecursivos).then(function(r){
        deferred.resolve(listaRegistros);
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
function grabarRegistrosRecursivosQ (i, a, id, identificacion, perfil, cantidad, jsonEntity){
    var deferred = Q.defer();
    var listaGrabarRegistrosRecursivos = [];
    //console.log("grabarRegistrosRecursivosQ ",jsonEntity.coleccion);
    grabarRegistrosRecursivos(i, a, id, identificacion, perfil, cantidad, jsonEntity, function(r){
        deferred.resolve(r);
    });
    return deferred.promise;
}
function grabarRegistrosRecursivos (i, a, id, identificacion, perfil, cantidad, jsonEntity, callBack){
    if(jsonEntity.parametrosBusquedaValores){
        jsonEntity.parametrosBusquedaValores.push(a);
        jsonEntity.parametrosBusquedaValores.push(cantidad);
    }
    //if(jsonEntity.sqlOrigen.indexOf("item")>=0){
    //console.log(jsonEntity.sqlOrigen);
    //console.log(jsonEntity.parametrosBusquedaValores);
//}
    oracledb.getPoolClienteConexion(jsonEntity.sqlOrigen, jsonEntity.parametrosBusquedaValores ? jsonEntity.parametrosBusquedaValores :[] , false, function(respuestaora){
//        if(jsonEntity.sqlOrigen.indexOf("item")>=0){
       //console.log("grabarRegistrosRecursivos encontrados",jsonEntity.coleccion,respuestaora.rows.length);
//}
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
                buscarEtiquetaJsonCallFuncion(jsonEntity.registroMongo, function(nuevoArrayJson){
                //    console.log("buscarEtiquetaJsonCallFuncion");
                    buscandoRegistrosRecursivos(nuevoRegistro.registros, nuevoArrayJson).then(function(resp){
                        //console.log("buscandoRegistrosRecursivos ...");
                        nuevoRegistro.registros = resp;
                        mongodb.grabar(jsonEntity.coleccion, nuevoRegistro).then(function(r){
                            //    console.log(r.estado);
                        },function(x){
                            console.log(x);
                            callBack({error:true});
                        });
                    });

                });

            }else{

                mongodb.grabar(jsonEntity.coleccion, nuevoRegistro, function(respuesta){
                //    console.log(respuesta);
                },function(x){
                    console.log(x);
                    callBack({error:true});
                });//Fin mongodb
            }

            if(jsonEntity.parametrosBusquedaValores){jsonEntity.parametrosBusquedaValores.pop();}
            if(jsonEntity.parametrosBusquedaValores){jsonEntity.parametrosBusquedaValores.pop();}
            i = i + 1;
            grabarRegistrosRecursivos (i, (respuestaora.rows[respuestaora.rows.length -1].ID + 1), id, identificacion, perfil, cantidad, jsonEntity, callBack);


        }else{

            callBack({perfil:perfil, indeces:i});
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
    var busquedaPerfil = {"registroMovil.identificacion":parametros.identificacion };
        if(parseInt(parametros.empresa) !== 0 ){
            busquedaPerfil["infoEmpresa.empresa_id"] = parametros.empresa;
        }
        //console.log(parametros.identificacion);
        mongodb.getRegistrosCustomColumnas("emcperfiles", {"registroMovil.identificacion":parametros.identificacion} , {registroMovil:1,registroInterno:1}, function(resultado){
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
        console.log("Borrar tabla 2",json.coleccion);
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
                buscarEtiquetaJsonCallFuncion(json.registroMongo, function(nuevoArrayJson){
                    buscandoRegistrosRecursivos (conjuntoPerfiles, nuevoArrayJson).then(function(resp){
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
        console.log(r);
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
    });
    return deferred.promise;
};
function crearColeccionMongo(borrar, jsonEntity){
    var deferred = Q.defer();
    borrarColeccion(borrar, jsonEntity).
    then(insertarDocumentos).
    then(function(r){

        if(Array.isArray(r)){
            console.log(jsonEntity.coleccion,r.length);
            console.log(
                    r.reduce(function(a,b){
                        a += b.indeces;
                        return a;
                    },0)
                    );
        }else{
            console.log(jsonEntity.coleccion,r);
        }

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
        mongodb.getRegistrosCustomColumnas(entidesMonogoDB.getJsonPerfiles().coleccion,{},{_id:1,"registroMovil.identificacion":1,"registroInterno.perfil":1}, function(respuesta){
                    respuesta.forEach(function(r){
                        nuevoJsonDoc = JSON.parse(JSON.stringify(jsonEntity));
                        nuevoJsonDoc.parametrosBusqueda.forEach(function(b){
                            nuevoJsonDoc.parametrosBusquedaValores.push(eval("r."+b));
                        });
                        listaRegistrosGrabados.push(grabarRegistrosRecursivosQ(1, 0, r._id, r.registroMovil.identificacion, r.registroInterno.perfil, sizeArrayPorDocumento, nuevoJsonDoc ));
                    });
                    Q.all(listaRegistrosGrabados).then(function(a){
                        deferred.resolve(a);
                    });
        });
    }else{
        console.log("No se hace el recorrdio por perfil");
        //Graba los documentos segun la tabla de oracle en un conjunto de sizeArrayPorDocumento
        grabarRegistrosRecursivosQ(1, 0, null, null, null, sizeArrayPorDocumento, jsonEntity).then(function(resultado){
                console.log("resultado items",resultado);
                deferred.resolve(resultado);
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
    borrarColeccion(borrar, entidesMonogoDB.getJsonDiccionarioBanco()).
    then(function(r){
        var diccionarios = [
                            entidesMonogoDB.getJsonDiccionarioBanco(),
                            entidesMonogoDB.getJsonDiccionarioCuentaBancaria(),
                            entidesMonogoDB.getJsonDiccionarioDocumento(),
                            entidesMonogoDB.getJsonDiccionarioBodegaVenta()
                        ];
        grabarRegistrosRecursivosDesdeUnArraySqls(0, diccionarios, 1, function(a){
                console.log("crearColecciones crearDiccionarios listo",a);
        });

    });

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
OracleMongo.prototype.getTodosLosCambiosPorSincronizarPorPerfil = function(perfil){
    var deferred = Q.defer();
    var resultados = [];

    entidesMonogoDB.getColecciones().forEach(function(c){
        resultados.push(getDatosDinamicamenteParaActualizar(c.coleccion,c.tabla, perfil, null, {index:1}));
    });
    Q.all(resultados).then(function(res){
        res = res.filter(function(r){
            if(r.urls && Array.isArray(r.urls) && r.urls.length>0){
                    r.urls = r.urls.reduce(function(nuevo, z){
                        nuevo.push(url.replace(":coleccion",r.coleccion).replace(":index",z.index));
                        return nuevo;
                },[]);
                return r;
            }else{
                console.log("no r");
                console.log(r);
            }


        });
        console.log(res);
        deferred.resolve(res);
    });
    return deferred.promise;
};

OracleMongo.prototype.getDatosPorSincronizarPorPerfilIndex = function(coleccion, perfil, index){
    var deferred = Q.defer();
    /*console.log(coleccion);
        console.log(perfil);
            console.log(index);*/
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
    parametros.sincronizar={"$gt":{$size:0}};
    if(!mostrarColumnas){
        mostrarColumnas = {};
    }
    mostrarColumnas._id=0;
    /*console.log(parametros);
    console.log(mostrarColumnas);*/
    mongodb.getRegistrosCustomColumnas(coleccion, parametros, mostrarColumnas, function(respuesta){
        //console.log("getRegistrosCustomColumnas");
        //console.log(respuesta);
            if(mostrarColumnas.index){
                deferred.resolve({coleccion:coleccion,tabla:tabla,urls:respuesta});
            }
            if(parametros.index){
                deferred.resolve(respuesta);
            }

    });
    return deferred.promise;
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

    //1. Crear perfiles
    var padre = this;
        padre.crearPerfiles(borrar).
        then(function(r){
            padre.crearColeccionesMongo(borrar, [entidesMonogoDB.getJsonEstablecimientos(),entidesMonogoDB.getJsonEstadoDeCuenta()]).then(function(a){
                console.log("crearColecciones 1 listo ",a);
            });

            //padre.crearEstadoCuenta(borrar);
        },function(error){
            console.log(error);
        });
        padre.crearColeccionesMongo(borrar, [entidesMonogoDB.getJsonItems(),entidesMonogoDB.getJsonPromocionVenta()]).then(function(a){
            console.log("crearColecciones 2 listo");
        });

        padre.crearDiccionarios(borrar);
            /*if(estado && !creandoA){
              console.log("crearPerfiles "+estado);
                //1.1. Una vez creado perfil se crean los establecimiento y estados de cuenta
                padre.crearEstablecimientos(borrar);
                padre.crearEstadoCuenta(borrar);
                creandoA = false;
            }else{
                console.log("Por favor revise la consola, no se grabaron los perfiles");
            }*/
    //    });
    //diccionarios
//    padre.crearDiccionarios(borrar);
//    padre.crearItems(borrar);
//    padre.crearItemPromocionVenta(borrar);
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
