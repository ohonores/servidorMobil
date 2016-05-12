
var schedule = require('node-schedule');
var EntidadesMongoOracle = require("./jsonEntity.js");
var entidesMonogoDB = new EntidadesMongoOracle();
var hash = require('object-hash');
var oracle,mongodb,oracledb;
//Selects para obtener los datos a Oracle
var sqlBusquedaPerfilesNew = "SELECT * FROM  SWISSMOVI.EMOVTPERFIL WHERE ROWNUM <2";
var sqlBusquedaEstabPorPerfilNew = "SELECT * FROM SWISSMOVI.EMOVTPERFIL_ESTABLECIMIENTO PE WHERE PE.MPERFIL_ID =:ID AND  PE.ID>=:A AND ROWNUM<=:B ORDER BY PE.ID ASC";
var sqlBusquedaEstabPorPerfilMinNew = "SELECT MIN(ID) AS ID FROM SWISSMOVI.EMOVTPERFIL_ESTABLECIMIENTO WHERE MPERFIL_ID =:ID AND ID>:ID";

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

function buscandoRegistrosRecursivos (index, listaRegistros, jsonEntity, callBack){
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
                    /*listaRegistros[index][jsonEntity.etiqueta]=respuestaora.rows.map(function(registro){
                            jsonClon = JSON.parse(JSON.stringify(jsonEntity.registroMovil));
                            getDatos(registro, jsonClon);
                            return jsonClon;
                    });*/
                    var datoMapeado = respuestaora.rows.map(function(registro){
                            jsonClon = JSON.parse(JSON.stringify(jsonEntity.registroMovil));
                            if(jsonClon.infoDiccionario && jsonClon.infoDiccionario.arrayJson){
                                delete jsonClon.infoDiccionario.arrayJson;
                            }

                            if(jsonClon.tipoNegocios && jsonClon.tipoNegocios.arrayJson){
                                delete jsonClon.tipoNegocios.arrayJson;
                            }
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
}
function grabarRegistrosRecursivos (i, a, id, identificacion, perfil, cantidad, jsonEntity, callBack){
    if(jsonEntity.parametrosBusquedaValores){
        jsonEntity.parametrosBusquedaValores.push(a);
        jsonEntity.parametrosBusquedaValores.push(cantidad);
    }
    console.log(grabarRegistrosRecursivos);
    console.log(jsonEntity.sqlOrigen);
    console.log(jsonEntity.parametrosBusquedaValores);
    oracledb.getPoolClienteConexion(jsonEntity.sqlOrigen, jsonEntity.parametrosBusquedaValores ? jsonEntity.parametrosBusquedaValores :[] , false, function(respuestaora){
        if(respuestaora && respuestaora.rows && respuestaora.rows.length>0){
            /*Borrameforfor(var tt in respuestaora.rows){
                if(respuestaora.rows[tt].PREIMPRESO =="018-900-000023548"){
                        console.log("Encontrado en lo que entrega oracle ");
                        console.log(respuestaora.rows[tt]);
                }
            }*/
            var jsonClon;
            var nuevoRegistro={
                    index : i,
                    registros : respuestaora.rows.map(function(registro){
                            jsonClon = JSON.parse(JSON.stringify(jsonEntity.registroMongo));
                            if(jsonClon.registroMovil.arrayJson){
                                delete jsonClon.registroMovil.arrayJson;
                            }

                            if(jsonClon.registroMovil.infoDiccionario && jsonClon.registroMovil.infoDiccionario.arrayJson){
                                delete jsonClon.registroMovil.infoDiccionario.arrayJson;
                            }
                            if(jsonClon.registroMovil.tipoNegocios && jsonClon.registroMovil.tipoNegocios.arrayJson){
                                delete jsonClon.registroMovil.tipoNegocios.arrayJson;
                            }
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
                buscarEtiquetaJsonCallFuncion(jsonEntity.registroMongo, function(nuevoArrayJson){
                    buscandoRegistrosRecursivos (0, nuevoRegistro.registros, nuevoArrayJson, function(resp){
                        nuevoRegistro.registros = resp;

                        mongodb.grabar(jsonEntity.coleccion, nuevoRegistro, hash, function(respuesta){

                        });//Fin mongodb
                    });
                });

            }else{

                mongodb.grabar(jsonEntity.coleccion, nuevoRegistro, hash, function(respuesta){

                });//Fin mongodb
            }

            if(jsonEntity.parametrosBusquedaValores){jsonEntity.parametrosBusquedaValores.pop();}
            if(jsonEntity.parametrosBusquedaValores){jsonEntity.parametrosBusquedaValores.pop();}
            i = i + 1;
            grabarRegistrosRecursivos (i, (respuestaora.rows[respuestaora.rows.length -1].ID + 1), id, identificacion, perfil, cantidad, jsonEntity, callBack);


        }else{
            //console.log("FIN***************DEL CURSO");
            callBack(i);
        }
    });
}
function grabarRegistrosRecursivosDesdeUnArraySqls(index, listaSqls, i, callBack){
    console.log("grabarRegistrosRecursivosDesdeUnArraySqls "+index);
    if(index < listaSqls.length){
        grabarRegistrosRecursivos (i, 0, null , null, null, 50, listaSqls[index] , function(resultado){
            //console.log("grabarRegistrosRecursivosDesdeUnArraySqls");
            //console.log(resultado);
            index = index + 1;
            grabarRegistrosRecursivosDesdeUnArraySqls(index, listaSqls, resultado, callBack);
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

OracleMongo.prototype.crearPerfiles = function(borrar, callBack){

        mongodb.dropCollection(entidesMonogoDB.getJsonPerfiles().coleccion , function(coleccionBorrada){
            oracledb.getPoolClienteConexion(entidesMonogoDB.getJsonPerfiles().sqlOrigen, [], false, function(respuestaora){
                if(respuestaora && respuestaora.rows &&  respuestaora.rows.length > 0  ){


                    var conjuntoPerfiles = respuestaora.rows.map(function(registro){
                        var jsonPerfilesClon = JSON.parse(JSON.stringify(entidesMonogoDB.getJsonPerfiles()));
                        getDatos(registro, jsonPerfilesClon.registroMongo);
                        return jsonPerfilesClon.registroMongo;
                    });
                    mongodb.grabarArray(entidesMonogoDB.getJsonPerfiles().coleccion, conjuntoPerfiles, function(respuesta){
                        callBack(respuesta.result.ok ===1?true:false, {totalRegistros:respuesta.result.n});
                    });//Fin mongodb
                }
             });
        });


};

OracleMongo.prototype.crearEstablecimientos = function(borrar){
    console.log("crearEstablecimientos borrar "+borrar);
    var jsonEstablecimiento = {};
    mongodb.dropCollection(borrar ? entidesMonogoDB.getJsonEstablecimientos().coleccion : "noborrar", function(coleccionBorrada){
            console.log("crearEstablecimientos creado");
            mongodb.getRegistrosCustomColumnas(entidesMonogoDB.getJsonPerfiles().coleccion,{},{_id:1,"registroMovil.identificacion":1,"registroInterno.perfil":1}, function(respuesta){
                respuesta.forEach(function(r){
                    jsonEstablecimiento = entidesMonogoDB.getJsonEstablecimientos();
                //    console.log(jsonEstablecimiento.parametrosBusqueda);
                    jsonEstablecimiento.parametrosBusqueda.forEach(function(b){
                        jsonEstablecimiento.parametrosBusquedaValores.push(eval("r."+b));
                    });
                //    console.log(jsonEstablecimiento.parametrosBusquedaValores);
                    grabarRegistrosRecursivos (1, 0, r._id, r.registroMovil.identificacion, r.registroInterno.perfil, 50, jsonEstablecimiento , function(resultado){
                            //console.log(resultado);
                    });
                });
            });

    });
};

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
                    grabarRegistrosRecursivos (inicio, 0, null , null, null, 50, jsonBodega , function(resultado){
                            //console.log(resultado);
                    });
                });
            });

    });
}


OracleMongo.prototype.crearDiccionarios = function(borrar){
    console.log("crearDiccionarios borrar "+borrar);
    //En el json jsonEntity existen vairas entidades que pertencen a la misma collection
    mongodb.dropCollection(borrar ? entidesMonogoDB.getJsonDiccionarioBanco().coleccion : "noborrar", function(coleccionBorrada){
        var dicicionarios = [
                            entidesMonogoDB.getJsonDiccionarioBanco(),
                            entidesMonogoDB.getJsonDiccionarioCuentaBancaria(),
                            entidesMonogoDB.getJsonDiccionarioDocumento(),
                            entidesMonogoDB.getJsonDiccionarioBodegaVenta()
                        ];
        console.log("creadno crearDiccionarios ");
        grabarRegistrosRecursivosDesdeUnArraySqls(0, dicicionarios, 1, function(resultado){
            console.log("crearDiccionarios");
            console.log(resultado);
            //crearBodegasPorPefil(false,resultado+1);
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
                grabarRegistrosRecursivos (1, 0, r._id, r.registroMovil.identificacion, r.registroInterno.perfil, 50, jsonEstadoCuenta , function(resultado){
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
        grabarRegistrosRecursivos (1, 0, null, null, null, 50, jsonItems , function(resultado){
                //console.log(resultado);
        });
    });
};

OracleMongo.prototype.crearItemPromocionVenta = function(borrar){
    mongodb.dropCollection(borrar ? entidesMonogoDB.getJsonPromocionVenta().coleccion : "noborrar", function(coleccionBorrada){
        var jsonItemPromocionVenta = entidesMonogoDB.getJsonPromocionVenta();
                                //(i, a, id, identificacion, cantidad, jsonEntity, callBack)
        grabarRegistrosRecursivos (1, 0, null, null, null, 50, jsonItemPromocionVenta , function(resultado){
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
OracleMongo.prototype.getDatosDinamicamenteParaActualizar = function(coleccion, perfil, index, callBack){
    var parametros = {index: parseInt(index)};
    if(perfil){
        parametros.perfil=perfil;
    }
    mongodb.getRegistroCustomColumnas(coleccion, parametros, {sincronizar:1,_id:0}, function(respuesta){
            callBack(respuesta);
    });
};

//Para entregar al restful
OracleMongo.prototype.setDatosDinamicamente = function(tabla, datos, callBack){

        oracledb.grabarJson(datos, tabla, function(estado, respuestaora){
            callBack(estado, respuestaora);
        });
};

OracleMongo.prototype.getUrlsPorPefil = function(identificacion, perfil, urlPorPefil, urlDiccionario, urlRecpcion, callBack){
    getTotalesParcialesPorPerifil(0, entidesMonogoDB.getColecciones(), identificacion, perfil, function(nuevaColeccion){
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
        padre.crearPerfiles(borrar, function(estado, resultado){

            if(estado && !creandoA){
               console.log("crearPerfiles "+estado);
                //1.1. Una vez creado perfil se crean los establecimiento y estados de cuenta
                padre.crearEstablecimientos(borrar);
                padre.crearEstadoCuenta(borrar);
                creandoA = false;
            }else{
                console.log("Por favor revise la consola, no se grabaron los perfiles");
            }
        });
    //diccionarios
    padre.crearDiccionarios(borrar);
    padre.crearItems(borrar);
    padre.crearItemPromocionVenta(borrar);
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
