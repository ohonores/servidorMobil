var EntidadesMongoOracle = require("./jsonEntity.js");
var schedule = require('node-schedule');
var entidesMonogoDB = new EntidadesMongoOracle();

var oracle,mongodb,oracledb;
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
    oracledb = oracle_;
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
function grabarRegistrosRecursivos (i, a, id, identificacion, perfil, cantidad, jsonEntity, callBack){
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
                        mongodb.grabar(jsonEntity.coleccion, nuevoRegistro, function(respuesta){

                        });//Fin mongodb
                    })
                });

            }else{
                mongodb.grabar(jsonEntity.coleccion, nuevoRegistro, function(respuesta){

                });//Fin mongodb
            }


            if(jsonEntity.parametrosBusquedaValores){jsonEntity.parametrosBusquedaValores.pop()};
            if(jsonEntity.parametrosBusquedaValores){jsonEntity.parametrosBusquedaValores.pop()};
            i = i + 1;
            grabarRegistrosRecursivos (i, (respuestaora.rows[respuestaora.rows.length -1].ID + 1), id, identificacion, perfil, cantidad, jsonEntity, callBack);
        }else{
            console.log("FIN***************DEL CURSO");
            callBack(i);
        }
    });
}
function grabarRegistrosRecursivosDesdeUnArraySqls(index, listaSqls, i, callBack){
    if(index < listaSqls.length){
        grabarRegistrosRecursivos (i, 0, null , null, null, 50, listaSqls[index] , function(resultado){
            console.log("grabarRegistrosRecursivosDesdeUnArraySqls");
            console.log(resultado);
            index = index + 1;
            grabarRegistrosRecursivosDesdeUnArraySqls(index, listaSqls, resultado, callBack)
        });
    }else{
        callBack(i);
    }
}
OracleMongo.prototype.autentificacion = function(parametros, callBack){
    var busquedaPerfil = {"registroMovil.identificacion":parametros.identificacion };
        if(parametros.empresa != 0){
            busquedaPerfil["infoEmpresa.empresa_id"] = parametros.empresa;
        }
        mongodb.getRegistrosCustomColumnas("emcperfiles", {"registroMovil.identificacion":parametros.identificacion} , {registroMovil:1,registroInterno:1}, function(resultado){
            callBack(resultado);
        /*    mongodb.modificar("emcperfiles", {_id:resultado._id}, {actualizar}, function(){

        })*/
        });
}

OracleMongo.prototype.crearPerfiles = function(callBack){
    mongodb.dropCollection(entidesMonogoDB.getJsonPerfiles().coleccion, function(coleccionBorrada){
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
}
OracleMongo.prototype.crearEstablecimientos = function(){
    var jsonEstablecimiento = {};
    mongodb.dropCollection(entidesMonogoDB.getJsonEstablecimientos().coleccion, function(coleccionBorrada){

            mongodb.getRegistrosCustomColumnas(entidesMonogoDB.getJsonPerfiles().coleccion,{},{_id:1,"registroMovil.identificacion":1,"registroInterno.perfil":1}, function(respuesta){
                respuesta.forEach(function(r){
                    jsonEstablecimiento = entidesMonogoDB.getJsonEstablecimientos();
                    console.log(jsonEstablecimiento.parametrosBusqueda);
                    jsonEstablecimiento.parametrosBusqueda.forEach(function(b){
                        jsonEstablecimiento.parametrosBusquedaValores.push(eval("r."+b));
                    })
                    console.log(jsonEstablecimiento.parametrosBusquedaValores);
                    grabarRegistrosRecursivos (1, 0, r["_id"], r.registroMovil.identificacion, r.registroInterno.perfil, 50, jsonEstablecimiento , function(resultado){
                            //console.log(resultado);
                    });
                })
            });

    });
}


OracleMongo.prototype.crearDiccionarios = function(){
    //En el json jsonEntity existen vairas entidades que pertencen a la misma collection
    mongodb.dropCollection(entidesMonogoDB.getJsonDiccionarioBanco().coleccion, function(coleccionBorrada){
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
    });
}

OracleMongo.prototype.crearEstadoCuenta = function(){
    mongodb.dropCollection(entidesMonogoDB.getJsonEstadoDeCuenta().coleccion, function(coleccionBorrada){
        var jsonEstadoCuenta = {};
        mongodb.getRegistrosCustomColumnas(entidesMonogoDB.getJsonPerfiles().coleccion,{},{_id:1,"registroMovil.identificacion":1,"registroInterno.perfil":1}, function(respuesta){
            respuesta.forEach(function(r){
                jsonEstadoCuenta = entidesMonogoDB.getJsonEstadoDeCuenta();
                console.log(jsonEstadoCuenta.parametrosBusqueda);
                jsonEstadoCuenta.parametrosBusqueda.forEach(function(b){
                    jsonEstadoCuenta.parametrosBusquedaValores.push(eval("r."+b));
                })
                console.log(jsonEstadoCuenta.parametrosBusquedaValores);
                grabarRegistrosRecursivos (1, 0, r["_id"], r.registroMovil.identificacion, r.registroInterno.perfil, 50, jsonEstadoCuenta , function(resultado){
                        //console.log(resultado);
                });
            })
        });
    });

}

OracleMongo.prototype.crearItems = function(){
    mongodb.dropCollection(entidesMonogoDB.getJsonItems().coleccion, function(coleccionBorrada){
        var jsonItems = entidesMonogoDB.getJsonItems();
                                //(i, a, id, identificacion, cantidad, jsonEntity, callBack)
        grabarRegistrosRecursivos (1, 0, null, null, null, 50, jsonItems , function(resultado){
                //console.log(resultado);
        });
    });
}

OracleMongo.prototype.getTablasScript = function(){
    return  entidesMonogoDB.getTablasScript();

}

OracleMongo.prototype.getDatosDinamicamente = function(coleccion, perfil, index, callBack){
    var parametros = {index: parseInt(index)};
    if(perfil){
        parametros.perfil=perfil;
    }
    console.log("getDatosDinamicamente");
    console.log(parametros);
    mongodb.getRegistroCustomColumnas(coleccion, parametros, {registros:1,_id:0}, function(respuesta){
            callBack(respuesta);
    });
}
OracleMongo.prototype.getCount = function(identificacion, perfil, urlPorPefil, urlDiccionario, callBack){

    getTotalesParcialesPorPerifil(0, entidesMonogoDB.getColecciones(), identificacion, perfil, function(nuevaColeccion){
        nuevaColeccionA = nuevaColeccion.map(function(col){
            if(col.diccionario){
                url = urlDiccionario.replace(":coleccion", col.coleccion);
            }else{
                url = urlPorPefil.replace(":coleccion", col.coleccion).replace(":perfil", perfil);
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

OracleMongo.prototype.crearColecciones = function(){

    //1. Crear perfiles
    var padre = this;
        padre.crearPerfiles(function(estado, resultado){
            if(estado){
                //1.1. Una vez creado perfil se crean los establecimiento y estados de cuenta
                padre.crearEstablecimientos();
                padre.crearEstadoCuenta();
            }else{
                console.log("Por favor revise la consola, no se grabaron los perfiles");
            }
        });
    //diccionarios
    padre.crearDiccionarios();
    padre.crearItems();
}

/**
    FUNCION QUE PERMITE CREAR UN CRON DE LA SIGUIENTE TAREA:
    crearColecciones(), CREA TODAS LAS COLECCIONES,
    PRIMERO HACE UN DROP Y LAS VUELVE A INSERTAR
    ESTA FUNCION ES LLAMAD A EN EL ARCHIVO APP.JS
*/
OracleMongo.prototype.crearTareas = function(){
    var rule2 = new schedule.RecurrenceRule();
    rule2.dayOfWeek = [0,1,2,3,4,5,6]; //Corre todos los dias
    rule2.hour = 4;//4 de la mañana
    rule2.minute = 06;//Con 06 minutos
    /*var j = schedule.scheduleJob('*5 * * * * *', function(){
        Entre *5, fala un /
            console.log("Hola "+new Date());
    });*/
    var padre = this;
    var j = schedule.scheduleJob(rule2, function(){
            padre.crearColecciones();
    });
}
function getTotalesParcialesPorPerifil(index, colecciones, identificacion, perfil, callBack){
    if(index < colecciones.length){
        var parametros = {}
        if(!colecciones[index].diccionario){
            parametros["identificacion"] = identificacion;
            parametros["perfil"] = perfil;
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


module.exports = OracleMongo;
