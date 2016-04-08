var EntidadesMongoOracle = require("./jsonEntity.js");
var entidesMonogoDB = new EntidadesMongoOracle();
var oracle,mongodb;
//Selects para obtener los datos a Oracle
var sqlBusquedaPerfilesNew = "SELECT * FROM  SWISSMOVI.EMOVTPERFIL WHERE ROWNUM <2";
var sqlBusquedaEstabPorPerfilNew = "SELECT * FROM SWISSMOVI.EMOVTPERFIL_ESTABLECIMIENTO PE WHERE PE.MPERFIL_ID =:ID AND  PE.ID>=:A AND ROWNUM<=:B ORDER BY PE.ID ASC";
var sqlBusquedaEstabPorPerfilMinNew = "SELECT MIN(ID) AS ID FROM SWISSMOVI.EMOVTPERFIL_ESTABLECIMIENTO WHERE MPERFIL_ID =:ID AND ID>:ID";

function getDatos(origen, destino){
    for(key in destino){
        if(typeof(destino[key]) == "string"){
            //console.log(destino[key] + " " + origen[destino[key]]);
            destino[key] =(destino[key] && destino[key].indexOf("*")===0 )? destino[key].substring(1,destino[key].length):( origen[destino[key]] ?origen[destino[key]] : "");
            //console.log(destino);
        }else{
            if(key != "arrayJson"){
                getDatos(origen, destino[key]);
            }
        }
    }
}

function buscarEtiquetaJsonListaResultados(origen, lista){

    for(key in origen){

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
    for(key in origen){
        if(key === "arrayJson"){
            callBack(origen[key]);
        }
        if(typeof(origen[key]) != "string"){
            buscarEtiquetaJsonCallFuncion(origen[key], callBack);
        }
    }
}

function setDatoToJsonPorEtiqueta(origen, dato, etiqueta){
    for(key in origen){
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
    mongodb = mongo_;
}

var periflesIds = [];

function buscandoRegistrosRecursivos (index, listaRegistros, jsonEntity, callBack){
     if(index<listaRegistros.length){
         jsonEntity.parametrosBusquedaValores=[];
         if(jsonEntity.parametrosBusqueda){
             jsonEntity.parametrosBusqueda.forEach(function(b){
                 var r = listaRegistros[index];
                 jsonEntity.parametrosBusquedaValores.push(eval("r."+b));
             })
        }
        oracledb.getPoolClienteConexion(jsonEntity.sqlOrigen, jsonEntity.parametrosBusquedaValores, false, function(respuestaora){
            if(respuestaora && respuestaora.rows && respuestaora.rows.length>0){
                    /*listaRegistros[index][jsonEntity.etiqueta]=respuestaora.rows.map(function(registro){
                            jsonClon = JSON.parse(JSON.stringify(jsonEntity.registroMovil));
                            getDatos(registro, jsonClon);
                            return jsonClon;
                    });*/
                    var datoMapeado = respuestaora.rows.map(function(registro){
                            jsonClon = JSON.parse(JSON.stringify(jsonEntity.registroMovil));
                            getDatos(registro, jsonClon);
                            return jsonClon;
                    });
                    setDatoToJsonPorEtiqueta(listaRegistros[index], datoMapeado, jsonEntity.etiqueta);
            }
            index = index +1;
            buscandoRegistrosRecursivos(index, listaRegistros, jsonEntity, callBack)
        });
    }else{
        callBack(listaRegistros);
    }
}
function grabarRegistrosRecursivos (i, a, id, identificacion, cantidad, jsonEntity, callBack){
    if(jsonEntity.parametrosBusquedaValores){
        jsonEntity.parametrosBusquedaValores.push(a);
        jsonEntity.parametrosBusquedaValores.push(cantidad);
    }

    oracledb.getPoolClienteConexion(jsonEntity.sqlOrigen, jsonEntity.parametrosBusquedaValores ? jsonEntity.parametrosBusquedaValores :[] , false, function(respuestaora){
        if(respuestaora && respuestaora.rows && respuestaora.rows.length>0){
            var jsonClon;
            var nuevoRegistro={
                    index : i,
                    registros : respuestaora.rows.map(function(registro){
                            jsonClon = JSON.parse(JSON.stringify(jsonEntity.registroMongo));
                            if(jsonClon.registroMovil.arrayJson){
                                delete jsonClon.registroMovil.arrayJson;
                            }
                            getDatos(registro, jsonClon);
                            return jsonClon;
                    })
            }
            //Si existe el id crea la relacion
            if(id){
                nuevoRegistro.relacion_id = id;
            }

            //Si existe la identificacion crea la relacion
            if(identificacion){
                nuevoRegistro.identificacion = identificacion;
            }

            //Verificando si es que existen arrays de json embebidos
            var existenArraysEmbebidos = [];
            //El siguiente metodo permite buscar arrays embebidos y devuelve el valor en un array :: existenArraysEmbebidos
            buscarEtiquetaJsonListaResultados(jsonEntity.registroMongo, existenArraysEmbebidos);
            //Si contiene al menos un elemento::true, significa que fue encontrado
            if(existenArraysEmbebidos.indexOf(true)>=0){
                //Funcion que permite buscar
                buscarEtiquetaJsonCallFuncion(jsonEntity.registroMongo, function(nuevoArrayJson){
                    buscandoRegistrosRecursivos (0, nuevoRegistro.registros, nuevoArrayJson, function(resp){
                        nuevoRegistro.registros = resp;
                        mongodb.grabar(jsonEntity.coleccion, nuevoRegistro, function(respuesta){

                        });//Fin mongodb
                    })
                });

            }else{
                mongodb.grabar(jsonEntity.coleccion, nuevoRegistro, function(respuesta){

                });//Fin mongodb
            }
            /*if(jsonEntity.registroMongo && jsonEntity.registroMongo.registroMovil && jsonEntity.registroMongo.registroMovil.arrayJson){

                buscandoRegistrosRecursivos (0, nuevoRegistro.registros, jsonEntity.registroMongo.registroMovil.arrayJson, function(resp){
                    nuevoRegistro.registros = resp;
                    mongodb.grabar(jsonEntity.coleccion, nuevoRegistro, function(respuesta){

                    });//Fin mongodb
                })

            }else{
                mongodb.grabar(jsonEntity.coleccion, nuevoRegistro, function(respuesta){

                });//Fin mongodb
            }*/


            if(jsonEntity.parametrosBusquedaValores){jsonEntity.parametrosBusquedaValores.pop()};
            if(jsonEntity.parametrosBusquedaValores){jsonEntity.parametrosBusquedaValores.pop()};
            i = i + 1;
            grabarRegistrosRecursivos (i, (respuestaora.rows[respuestaora.rows.length -1].ID + 1), id, identificacion, cantidad, jsonEntity, callBack);
        }else{
            console.log("FIN***************DEL CURSO");
            callBack(i);
        }
    });
}
function grabarRegistrosRecursivosDesdeUnArraySqls(index, listaSqls, i, callBack){
    if(index < listaSqls.length){
        grabarRegistrosRecursivos (i, 0, null , null, 50, listaSqls[index] , function(resultado){
            console.log("grabarRegistrosRecursivosDesdeUnArraySqls");
            console.log(resultado);
            index = index + 1;
            grabarRegistrosRecursivosDesdeUnArraySqls(index, listaSqls, resultado, callBack)
        });
    }else{
        callBack(i);
    }
}

OracleMongo.prototype.crearPerfiles = function(){
    oracledb.getPoolClienteConexion(entidesMonogoDB.getJsonPerfiles().sqlOrigen, [], false, function(respuestaora){
        if(respuestaora && respuestaora.rows &&  respuestaora.rows.length > 0  ){
            respuestaora.rows.forEach(function(registro){
                var jsonPerfilesClon = JSON.parse(JSON.stringify(entidesMonogoDB.getJsonPerfiles()));
                getDatos(registro, jsonPerfilesClon.registroMongo);
                mongodb.grabar(jsonPerfilesClon.coleccion, jsonPerfilesClon.registroMongo, function(respuesta){
                    if(respuesta && respuesta.insertedId){
                        //periflesIds.push({idMongo:respuesta.insertedId,idPerfil:jsonPerfilesClon.registroMongo.registroInterno.perfil});
                        //console.log(periflesIds)
                    }
                });//Fin mongodb
            });
        }
     });
}
OracleMongo.prototype.crearEstablecimientos = function(){
    var jsonEstablecimiento = {};
    mongodb.getRegistrosCustomColumnas(entidesMonogoDB.getJsonPerfiles().coleccion,{},{_id:1,"registroMovil.identificacion":1,"registroInterno.perfil":1}, function(respuesta){
        respuesta.forEach(function(r){
            jsonEstablecimiento = entidesMonogoDB.getJsonEstablecimientos();
            console.log(jsonEstablecimiento.parametrosBusqueda);
            jsonEstablecimiento.parametrosBusqueda.forEach(function(b){
                jsonEstablecimiento.parametrosBusquedaValores.push(eval("r."+b));
            })
            console.log(jsonEstablecimiento.parametrosBusquedaValores);
            grabarRegistrosRecursivos (1, 0, r["_id"], r.registroMovil.identificacion, 50, jsonEstablecimiento , function(resultado){
                    //console.log(resultado);
            });
        })
    });
}


OracleMongo.prototype.crearDiccionarios = function(){
    var dicicionarios = [
                        entidesMonogoDB.getJsonDiccionarioBanco(),
                        entidesMonogoDB.getJsonDiccionarioCuentaBancaria(),
                        entidesMonogoDB.getJsonDiccionarioDocumento(),
                        entidesMonogoDB.getJsonDiccionarioBodegaVenta()
                    ]
                    grabarRegistrosRecursivosDesdeUnArraySqls(0, dicicionarios, 1, function(resultado){
                        console.log("crearDiccionarios");
                        console.log(resultado);
                    });
}

OracleMongo.prototype.crearEstadoCuenta = function(){
    var jsonEstadoCuenta = {};
    mongodb.getRegistrosCustomColumnas(entidesMonogoDB.getJsonPerfiles().coleccion,{},{_id:1,"registroMovil.identificacion":1,"registroInterno.perfil":1}, function(respuesta){
        respuesta.forEach(function(r){
            jsonEstadoCuenta = entidesMonogoDB.getJsonEstadoDeCuenta();
            console.log(jsonEstadoCuenta.parametrosBusqueda);
            jsonEstadoCuenta.parametrosBusqueda.forEach(function(b){
                jsonEstadoCuenta.parametrosBusquedaValores.push(eval("r."+b));
            })
            console.log(jsonEstadoCuenta.parametrosBusquedaValores);
            grabarRegistrosRecursivos (1, 0, r["_id"], r.registroMovil.identificacion, 50, jsonEstadoCuenta , function(resultado){
                    //console.log(resultado);
            });
        })
    });

}

OracleMongo.prototype.crearItems = function(){
    var jsonItems = entidesMonogoDB.getJsonItems();
                            //(i, a, id, identificacion, cantidad, jsonEntity, callBack)
    grabarRegistrosRecursivos (1, 0, null, null, 50, jsonItems , function(resultado){
            //console.log(resultado);
    });
}

OracleMongo.prototype.getTablasScript = function(){
    var jsonItems = entidesMonogoDB.getTablasScript();
    console.log(jsonItems);
}

OracleMongo.prototype.getDatosDinamicamente = function(coleccion, identificacion, index, callBack){
    var parametros = {index: parseInt(index)};
    if(identificacion){
        parametros.identificacion=identificacion;
    }
    console.log("getDatosDinamicamente");
    console.log(parametros);
    mongodb.getRegistroCustomColumnas(coleccion,parametros, {registros:1,_id:0}, function(respuesta){
            callBack(respuesta);
    });
}
OracleMongo.prototype.getCount = function(identificacion, urlPorPefil, urlDiccionario, callBack){
    console.log("getCount OracleMongo");
    getTotalesParcialesPorPerifil(0, entidesMonogoDB.getColecciones(), identificacion, function(nuevaColeccion){
        nuevaColeccionA = nuevaColeccion.map(function(col){
            if(col.diccionario){
                url = urlDiccionario.replace(":coleccion", col.coleccion);
            }else{
                url = urlPorPefil.replace(":coleccion", col.coleccion).replace(":identificacion", identificacion);
            }
            col.urls = col.indices.map(function(indice){
                return url.replace(":index", indice.index);;
            });
            delete col.indices;
            return col;
        })
        callBack(nuevaColeccionA);
    });
}

function getTotalesParcialesPorPerifil(index, colecciones, identificacion, callBack){
    if(index < colecciones.length){
        var parametros = {}
        if(!colecciones[index].diccionario){
            parametros["identificacion"] = identificacion;
        }
        mongodb.getRegistrosCustomColumnas(colecciones[index].coleccion, parametros, {index:1,_id:0}, function(respuesta){
                colecciones[index].indices = respuesta;
                index = index +1;
                getTotalesParcialesPorPerifil(index, colecciones, identificacion, callBack);
        });
    }else{
        callBack(colecciones);
    }
}


module.exports = OracleMongo;
