var exec = require('child_process').exec;
var fs = require('fs');
var Q = require('q');
var mongodb = require('../conexiones-basededatos/conexion-mongodb.js');
var lineReader = require('line-reader');
var EntidadesMongoOracle = require("./jsonEntity.js");
var entidesMonogoDB = new EntidadesMongoOracle();
var coleccion = {nombre:"emcversiones",datos:{tipo:"diccionarios",version:"",nombreBackupSql:"",ubicacion:process.env.BDS, origen:"",resultado:{}}};
var ubicacionZips = process.env.ZIPSSQLITE;
/**
     * Constructor de la clase ComandosPorConsola
 */
var ComandosPorConsola = function () {

};

/**
     * Copia la base diccionarios_xxx.db a una direccion para formar la base sqlite final-->versionDiccionario_versionPerfil_perfil.db.
     * @param {number} perfilDestino - Perfil destino.
*/
ComandosPorConsola.prototype.copiarDiccionarios = function(perfilDestino){
    var deferred = Q.defer();
    mongodb.getRegistrosCustomColumnasOrdenLimite(coleccion.nombre, {tipo:"diccionarios",estado:true}, {nombreBackupSql:1,ubicacion:1,version:1}, {version:-1}, 1, function(res){
        if(res && res[0] && res[0].ubicacion && res[0].nombreBackupSql && res[0].version){
            var origen = res[0].ubicacion + res[0].nombreBackupSql;
            var versionPerfil = new Date().getTime();
            var nombreArchivo = ("#version_#vperfil_#destino.db").replace("#destino", perfilDestino).replace("#version", res[0].version).replace("#vperfil", versionPerfil);
            var destino = res[0].ubicacion + nombreArchivo;
            exec("cp -rf #origen #destino".replace("#origen",origen).replace("#destino",destino), function(error, stdout, stderr){
                if(error || stderr ){
                    res[0].error = error;
                    res[0].stderr = stderr;
                    deferred.reject(res[0]);
                }else{
                    res[0].nombreArchivo = nombreArchivo;
                    res[0].versionPerfil = versionPerfil;
                    deferred.resolve(res[0]);
                }


            });
        }else{
             deferred.reject({error:true,mensaje:"No se ha econtrado una version en la coleccion emcversiones con tipo ::diccionarios y estado::true"});
        }
    });
    return deferred.promise;
}

/**
     * Elimina el directorio /u02/movil/sqlite/areatrabajo/ 
     * Es muy importante mantener la ubicacion como una constante y que no se reciba como variable para evitar que borre algo en forma accidental
     
*/
ComandosPorConsola.prototype.removerArchivosAreaTrabajo = function(){
    exec("cd /u02/movil/sqlite/areatrabajo/ ; rm -rf * ", function(error, stdout, stderr){
        if(error || stderr ){
           console.log(error, stderr);
        }else{
            console.log("/u02/movil/sqlite/areatrabajo/ -->Archivos eliminados");
        }
    });
}

/**
     * Copia la base versionDiccionario_versionPefil_perfil.db a swiss.db con el objetivo de formar el zip versionDiccionario_versionPefil_perfil.zip que sera enviado al dispositivo.
     * @param {number} perfil - El perfil de la base sqlite.
*/
ComandosPorConsola.prototype.copiarArchivosZips = function(perfil){
    var deferred = Q.defer();
    setTimeout(function(){
        mongodb.getRegistrosCustomColumnasOrdenLimite(coleccion.nombre, {tipo:"perfiles",estado:true, perfil:perfil.toString()}, {nombreBackupSql:1,ubicacion:1,version:1,versionPerfil:1}, {versionPerfil:-1}, 1, function(res){
            if(res && res[0] && res[0].ubicacion && res[0].nombreBackupSql && res[0].version && res[0].versionPerfil){
                var ubicacionArchivoSqlite = res[0].ubicacion + res[0].nombreBackupSql;
                var ubicacionArchivoZipSqlite = ubicacionZips + res[0].nombreBackupSql.replace(".db",".zip");
                exec("cp #ubicacionArchivoSqlite swiss.db && zip #ubicacionArchivoZipSqlite swiss.db && rm -rf swiss.db".replace("#ubicacionArchivoSqlite",ubicacionArchivoSqlite).replace("#ubicacionArchivoZipSqlite",ubicacionArchivoZipSqlite), function(error, stdout, stderr){
                    if(error || stderr ){
                        res[0].error = error;
                        res[0].stderr = stderr;
                        deferred.reject(res[0]);
                    }else{
                        res[0].nombreArchivo = res[0].nombreBackupSql.replace(".db",".zip");
                        res[0].ubicacionZips = ubicacionZips;
                        deferred.resolve(res[0]);
                    }
                });
            }else{
                 deferred.reject({error:true,mensaje:"No se ha econtrado una version en la coleccion emcversiones con tipo ::perfiles y estado::true"});
            }
        });
    },5000);
    return deferred.promise;
}

/**
     * Crea el la diferencia entre versiones por perfil.
     * @param {numer} perfilDestino - Perfil a crear la diferencia.
     * @param {Objecto json} origen - Origen http de la peticion para crear la diferencia entre base de datos.
     * @param {number} versionEncontrada - Version del perfil econtrada en el dispositivo.
     * @param {string} dispositivo - Dispositivo del perfil.
*/
ComandosPorConsola.prototype.crearScriptsPorPerfil = function(perfilDestino, origen, versionEncontrada, dispositivo){
    var deferred = Q.defer();
    setTimeout(function(){
        getUltimaBaseSqlitePorPerfilServidor(perfilDestino, origen, versionEncontrada, dispositivo). //
        then(getDispositivosSincronizados).
        then(crearSqliteDiffPorPerfilyDispositivo).
        then(function(success){
           deferred.resolve(success);
        },function(error){
             deferred.reject(error);
        });
    },5000);
    return deferred.promise;
}


/**
     * Valida que el parametros.dispositivo haya recibido una sincronizacion de inicio.
     * @param {Objecto json} parametros - Parmátros de busqueda.
*/
function getDispositivosSincronizados(parametros){
    var deferred = Q.defer();
    var parametrosBusqueda = {tipo:"zip", perfil:parametros.perfilDestino.toString(),"dispositivos.origen":{$exists:true},"dispositivos":{$elemMatch:{ip:{$exists:true},uidd:parametros.dispositivo}}};
    mongodb.getRegistrosCustomColumnasOrdenLimite(coleccion.nombre, parametrosBusqueda, {versionPerfil:1,dispositivos:1}, {versionPerfil:-1}, 1, function(dispositivosEncontrados){
        if(dispositivosEncontrados && dispositivosEncontrados[0] && Array.isArray(dispositivosEncontrados[0].dispositivos) && dispositivosEncontrados[0].dispositivos.length>0 ){
            parametros.dispositivos = dispositivosEncontrados[0].dispositivos.reduce(function(nuevo,disp){if(nuevo.indexOf(disp.uidd)<0){nuevo.push(disp.uidd)}return nuevo;},[]);
             var nuevoDispositivo = parametros.dispositivos.filter(function(dispositivo){
                    return (dispositivo == parametros.dispositivo);
            });
            if(Array.isArray(nuevoDispositivo) && nuevoDispositivo.length>0){
                parametros.dispositivos = nuevoDispositivo;
                parametros.listaPerfilVersion = [parseInt(parametros.versionEncontrada)];
                deferred.resolve(parametros);
            }else{
                deferred.reject({mensaje:"Se encontraron dispositivos sincronizados para el perfil pero no hacen referencia al dispositivo entregado", parametros:parametros, metodo:"getDispositivosSincronizados"});
            }
        }else{
             console.log("Importante: No se encontraron dispositivos sincronizados para el perfil",parametros,dispositivosEncontrados);
            deferred.reject({mensaje:"No se encontraron dispositivos sincronizados para el perfil ", parametros:parametros, metodo:"getDispositivosSincronizados"});
        }
        
    });
    return deferred.promise;
}

/**
     * Funcion recursiva que llama a crearArchivoSqlParaActualizacion segun el numero de versiones(versionesPorPerfil) entegadas.
     * @param {index} index - Inicio, generalmente es 0.
     * @param {Array} versionesPorPerfil - Versiones del perfil a iterar.
     * @param {json}  parametros - Parametros de busqueda segun el perfil.
     * @param {Array} resultados - Resultados de la funcion recursiva.
     * @param {Array} errores - Errores encontrados al llamar a la función crearArchivoSqlParaActualizacion.
     * @param {function} callback - Funcion callbak.
*/
function crearSqliteDiffPorPerfilyDispositivoRecursive(index, versionesPorPerfil, parametros, resultados, errores, callback){
    if(index<versionesPorPerfil.length){
        var resultado = versionesPorPerfil[index];
        var ubicacionArchivoSqliteActual = resultado.ubicacionZip + resultado.nombreBackupZip;//Es la base que tiene el dispositivo en formato zip
        crearArchivoSqlParaActualizacion(ubicacionArchivoSqliteActual, parametros.ubicacionArchivoSqlite, parametros.versionPerfil, parametros.perfilDestino, parametros.origen, resultado.dispositivos, resultado.versionPerfil).then(function(success){
            resultados.push(success);
            index +=1;
            crearSqliteDiffPorPerfilyDispositivoRecursive(index, versionesPorPerfil, parametros, resultados, errores, callback);
        },function(error){
            errores.push(error);
            index +=1;
            crearSqliteDiffPorPerfilyDispositivoRecursive(index, versionesPorPerfil, parametros, resultados, errores, callback);
        });
    }else{
        callback(resultados, errores);
    }
}

/**
     * Funcion que llama a la funcion recursiva crearSqliteDiffPorPerfilyDispositivoRecursive para crear la base sqlite .
     * @param {json}  parametros - Parametros de busqueda segun el perfil.
*/
function crearSqliteDiffPorPerfilyDispositivo(parametros){
    var deferred = Q.defer();
    parametrosBusqueda = {tipo:"zip",estado:true, perfil:parametros.perfilDestino.toString(), versionPerfil:{ $in: parametros.listaPerfilVersion }}; 
    mongodb.getRegistrosCustomColumnas(coleccion.nombre, parametrosBusqueda, {nombreBackupZip:1, ubicacionZip:1, version:1, versionPerfil:1, dispositivos:1}, function(resultadoVersionesEntregadas){
        if(resultadoVersionesEntregadas && Array.isArray(resultadoVersionesEntregadas) && resultadoVersionesEntregadas.length>0){
            crearSqliteDiffPorPerfilyDispositivoRecursive(0, resultadoVersionesEntregadas, parametros, [], [], function(resultados, errores){
                deferred.resolve({success:resultados, error:errores});
            });
        }else{
           deferred.reject({mensaje:"No existen versiones entregadas a los disposivivos con el perfil "+parametros.perfilDestino, parametros:parametrosBusqueda});
        }
    });//fin getRegistrosCustomColumnasOrdenLimite
   return deferred.promise;
}


/**
     * Funcion que consigue la ultima sincronizacion del perfil segun el dispositivo
                 Lo hace de la siguiente forma:
                    1. Busca en la coleccion emcversiones con el tipo actualizaciones
                    2. Busca en la coleccion emvversiones con el tipo zip
                    3. Entrega la versionPerfil o indica que no existe una ultima sincronizacion
     * @param {number}  perfilDestino - Perfil a obtener la ultima sincronizacion.
     * @param {string}  dispositivo - Dispositivo del perfil.
     * @param {number}  versionEncontrada - Version del perfil.
*/
function getUltimaBaseSqlitePorPerfilServidor(perfilDestino, origen, versionEncontrada, dispositivo){
     var deferred = Q.defer();
     mongodb.getRegistrosCustomColumnasOrdenLimite(coleccion.nombre, {tipo:"zip", estado:true, perfil:perfilDestino.toString()}, {nombreBackupZip:1, ubicacionZip:1,version:1,versionPerfil:1}, {versionPerfil:-1}, 1, function(res){
            if(res && res[0] &&  res[0].ubicacionZip && res[0].nombreBackupZip && res[0].versionPerfil){
                  if(res[0].versionPerfil != versionEncontrada){
                    deferred.resolve({ubicacionArchivoSqlite:res[0].ubicacionZip + res[0].nombreBackupZip, versionPerfil:res[0].versionPerfil,perfilDestino:perfilDestino,origen:origen,versionEncontrada:versionEncontrada, dispositivo:dispositivo, nombreBackupZip:res[0].nombreBackupZip});
                  }else{
                    deferred.reject({mensaje:"No se encontraron nuevas versiones",perfil:perfilDestino,origen:origen});
                  }
            }else{
                  deferred.reject({mensaje:"No se encontraron sqlite para el perfil",perfil:perfilDestino,origen:origen});
            }
     });
     return deferred.promise;
}

/**
     * Funcion que crea el archivo sql de la diferencia entre dos bases sqlite
     * @param {string}  actual - Ubicacion de la base de datos que se encuetra en el dispositivo en formato zip.
     * @param {string}  nuevo -  Ubicacion de la última base de datos que se encuetra en el servidor en formato zip..
     * @param {number}  versionPerfil - Version del perfil.
     * @param {number}  perfil - Perfil.
     * @param {json}  origen - Cabecera http.
     * @param {string}  dispositivos - Dispositivo del perfil.
     * @param {number}  referencia - Version referencia del perfil.
     
*/
function crearArchivoSqlParaActualizacion(actual, nuevo, versionPerfil, perfil, origen, dispositivos, referencia){
    var deferred = Q.defer();
    var versionActualizacion = new Date().getTime();
    var areaTrabajo = process.env.AREATRABAJO;
    var sqliteA = "swissA"+versionActualizacion + ".db";
    var sqliteB = "swissB"+versionActualizacion + ".db";
    var nombreScript = "srcript_"+versionActualizacion+"_"+perfil+".sql";
    var sqldiff;
    if(process.env.GRUPO == "1"){
         sqldiff = "LD_PRELOAD=/opt/glibc-2.14/lib/libc.so.6 /usr/bin/sqldiff #areaTrabajo#sqliteA #areaTrabajo#sqliteB > #areaTrabajo#nombreScript";
    }else{
        sqldiff = "sqldiff #areaTrabajo#sqliteA #areaTrabajo#sqliteB > #areaTrabajo#nombreScript";
    }
    
    //Ejemplo  unzip -p /u02/movil/sqlite/backups/1475690217765_1475690999106_101.zip  swiss.db > /u02/movil/sqlite/backups/test/bt.db
    var destinoArchivoExtradoA = "#areaTrabajo#sqliteA".replace(/#areaTrabajo/g,areaTrabajo).replace("#sqliteA",sqliteA);
    var destinoArchivoExtradoB = "#areaTrabajo#sqliteB".replace(/#areaTrabajo/g,areaTrabajo).replace("#sqliteB",sqliteB);
    unzipArchivosQall([{archivoZip:actual, archivoAExtraer:"swiss.db", destinoArchivoExtrado:destinoArchivoExtradoA},{archivoZip:nuevo, archivoAExtraer:"swiss.db", destinoArchivoExtrado:destinoArchivoExtradoB}]).then(function(success){
        sqldiff = sqldiff.replace(/#areaTrabajo/g,areaTrabajo).replace("#sqliteA",sqliteA).replace("#sqliteB",sqliteB).replace("#nombreScript",nombreScript);
        exec(sqldiff, function(error1, stdout1, stderr1){
                if(error1 || stderr1){
                     console.log("SQLDIFF ERRORES*****************  ",error1,"stdout1",stdout1,"stderr1",stderr1);
                     deferred.reject(error1 || stderr1);
                }else{
                    setTimeout(function(){
                        leerArchivoSqlParaInsertarloEnMongo(
                            areaTrabajo+nombreScript,
                            {versionPerfil:versionPerfil,
                             versionActualizacion:versionActualizacion,
                             ubicacionScripTemp:areaTrabajo,
                             nombreScriptTemp:nombreScript,
                             versionPerfilReferencia:referencia
                            }, origen, perfil,dispositivos
                        ).then(function(success){
                            deferred.resolve(success);
                        },function(error){
                            deferred.reject(error);
                        });

                    },2000);
                }
        });
    });
    return deferred.promise;
}

/**
     * Una vez creado la diferencia entre las dos base sqlite, esta funcion crear un archivo zip y lo graba en el mongo, dejando temporalmente el archivo zip en su propio directorio, que luego será borrado por un proceso
     * @param {string}  t - Este parametro es la ubicacion del archivo sql pero no es usado, por favor borrame luego.
     * @param {json}  consoleSuccess -  Json del resultado al formar la diferencia entre dos bases.
     * @param {json}  origen - Cabecera http.
     * @param {number}  perfil - Perfil.
     * @param {Array}  dispositivos - Dispositivos del perfil.
     
     
*/
function leerArchivoSqlParaInsertarloEnMongo(t, consoleSuccess, origen, perfil, dispositivos){
    var deferred = Q.defer();
    var dispositivosFiltrados = dispositivos.reduce(function(nuevo,disp){if(nuevo.indexOf(disp.uidd)<0){nuevo.push(disp.uidd)}return nuevo;},[]);
    var coleccion = {
                        nombre:"emcversiones",
                        datos:{
                                tipo:"actualizaciones",
                                versionPerfil:consoleSuccess.versionPerfil,
                                versionPerfilReferencia:consoleSuccess.versionPerfilReferencia,
                                versionActualizacion:consoleSuccess.versionActualizacion,
                                nombreScriptTemp:consoleSuccess.nombreScriptTemp.replace(".sql",".zip"),
                                ubicacionScripTemp:consoleSuccess.ubicacionScripTemp,
                                origen:origen,
                                perfil:perfil.toString(),
                                dispositivos:dispositivosFiltrados,
                                estado:true
                            }
                    };
    var coleccionArchivos = {
                        nombre:"emcscriptsVersiones",
                        datos:{
                                versionActualizacion:consoleSuccess.versionActualizacion,
                                nombreScriptTemp:consoleSuccess.nombreScriptTemp.replace(".sql",".zip"),
                                ubicacionScripTemp:consoleSuccess.ubicacionScripTemp,
                                estado:true
                            }
                    };
    var dispositivosFiltradosParaActualizacionEnVersiones = dispositivosFiltrados.map(function(uidd){return {uidd:uidd,origen:"Añadido en forma automática por una nueva sincronización",versionActualizacion:consoleSuccess.versionActualizacion,fecha:new Date()};});
    leerArchivoEnMemoria(consoleSuccess.ubicacionScripTemp + consoleSuccess.nombreScriptTemp, consoleSuccess.ubicacionScripTemp + consoleSuccess.nombreScriptTemp.replace(".sql",".txt"), function(res){
                fs.rename(consoleSuccess.ubicacionScripTemp + consoleSuccess.nombreScriptTemp.replace(".sql",".txt"), consoleSuccess.ubicacionScripTemp + consoleSuccess.nombreScriptTemp, function(err) {
                    if (err) {
                        deferred.reject(err);
                    }else{
                        exec("cd #directorio && zip #nuevoArchivzip #nuevoArchivo && rm -rf #nuevoArchivo".replace("#directorio",(consoleSuccess.ubicacionScripTemp)).replace("#nuevoArchivzip",(consoleSuccess.nombreScriptTemp).replace(".sql",".zip")).replace("#nuevoArchivo",(consoleSuccess.nombreScriptTemp)), function(error, stdout, stderr){
                            if(error || stderr ){
                                    deferred.reject(error);
                                }else{
                                     fs.readFile(consoleSuccess.ubicacionScripTemp + consoleSuccess.nombreScriptTemp.replace(".sql",".zip") , function(err, buf){
                                        if(err){
                                            coleccion.datos.estado = false;
                                            coleccion.datos.error = err;
                                            coleccionArchivos.datos.estado = false;
                                            coleccionArchivos.datos.error = err;
                                        }else{
                                            coleccionArchivos.datos.buffer = buf;
                                            mongodb.grabarRegistro(coleccion.nombre,coleccion.datos).then(function(success){
                                                mongodb.grabarRegistro(coleccionArchivos.nombre,coleccionArchivos.datos).then(function(success){

                                                    mongodb.modificarOinsertar("emcversiones", {versionPerfil:consoleSuccess.versionPerfil, tipo:"zip"}, {$pushAll:{"dispositivos":dispositivosFiltradosParaActualizacionEnVersiones}}, function(resultadoD1){});
                                                    mongodb.modificarOinsertar("emcversiones", {versionPerfil:consoleSuccess.versionPerfil, tipo:"perfiles"}, {$pushAll:{"dispositivos":dispositivosFiltradosParaActualizacionEnVersiones}}, function(resultadoD1){});
                                                    deferred.resolve({perfil:perfil, versionPerfil:consoleSuccess.versionPerfil,versionPerfilReferencia:consoleSuccess.versionPerfilReferencia,versionActualizacion:consoleSuccess.versionActualizacion,dispositivos:dispositivosFiltrados});

                                                },function(error){
                                                        deferred.reject(error);
                                                });
                                            },function(error){
                                                    deferred.reject(error);
                                            });

                                        }
                                    });
                            }
                        });
                                  
                              
                    }

                });
    });
    return deferred.promise;
}

/**
     * Función recursiva, que elimina datos en una sentencia sql, para que justo ese campo a actualizar no sea tomado en cuenta
     * @param {number}  index - Inicio del array a ser leido.
     * @param {string}  line -  Sentencia sql.
     * @param {Array}  campos - Nombre de los campos a quitar de la sentencia update sql.
*/
function eliminarAlgunosDatosEnElUpdate(index, line, campos){
    if(index<campos.length){
        var total = (line.match(/=/g) || []).length;
        if(total>2){
           var a = new RegExp("\, #campo=.*?' ".replace("#campo", campos[index]));
           var b = new RegExp("\#campo=.*?', ".replace("#campo", campos[index]));
            var c = new RegExp("\, #campo=.*? ".replace("#campo", campos[index]));
           var d = new RegExp("\#campo=.*?, ".replace("#campo", campos[index]));
           line = line.replace(a, " ").replace(b, " ").replace(c, " ").replace(d, " ");
           index +=1;
           return eliminarAlgunosDatosEnElUpdate(index, line, campos);
       }else{
            return line;
       }
    }else{
        return line;
    }
}

/**
     * Valida si alguna tabla definida como transaccion se encuentra en una sentencia sql
     * @param {string}  line -  Sentencia sql.
*/
function validarQueNoSeEnvieTablasDeTransaccion(line){
    var tablasTransaccion = entidesMonogoDB.getEntityPorParametros("trasaccion","sincronizar");
    var econtrado = false;
    tablasTransaccion.forEach(function(tabla){
        console.log(line, tabla.movil.tabla, line.toLowerCase() )
        if(line && tabla && tabla.movil && tabla.movil.tabla && line.toLowerCase().indexOf(tabla.movil.tabla)>=0){
            econtrado = true;
            return;
        }
    });
    return econtrado;
}

/**
     * Lee el archivo sql(diferencia entre base de datos sqlite) y crea uno nuevo, para evitar que se envien las tablas de transacion, para agregar una linea auxiliar(iniciodenuevogrupoparagrabarsqlite) utilizada en el dispositivo para que pueda grabar por lotes y no enviar todo el archivo ya que puede consumir mucha memoria en sqlite al utilizar la funcion batch
     * @param {string}  archivo -  Ruta del archivo.
     * @param {string}  nuevoArchivo -  Ruta del nuevo archivo.
     * @param {function}  callback -  Funcion callback.
*/
function leerArchivoEnMemoria(archivo, nuevoArchivo, callback ){
    fs.readFile(archivo, function(err, data) { // read file to memory
        if (!err) {
            data = data.toString(); // stringify buffer
            data = data.split("\n");
            dataAux =[];
            for(var i=0;i<data.length;i++){
                line = data[i];
                if(line && !(validarQueNoSeEnvieTablasDeTransaccion(line) || line.toLowerCase().indexOf("update emovtperfil")>=0)){
                    dataAux.push(line);
                    if(i % 500 === 0 && i !== 0){
                      dataAux.push("iniciodenuevogrupoparagrabarsqlite");

                    }

                }else{
                    if(line && line.toUpperCase().indexOf("ALTER TABLE")>=0){
                        dataAux.push(line);
                        if(i % 500 === 0 && i !== 0){
                          dataAux.push("iniciodenuevogrupoparagrabarsqlite");

                        }
                    }
                    if(line && line.toLowerCase().indexOf("update emovtperfil")){
                        var nuevalinea_url = eliminarAlgunosDatosEnElUpdate(0, line, ["url","version","dispositivo","emisor"]);
                        if(nuevalinea_url){
                            dataAux.push(nuevalinea_url);
                            if(i % 500 === 0 && i !== 0){
                              dataAux.push("iniciodenuevogrupoparagrabarsqlite");

                            }
                        }
                        
                    }
                    
                }
            }
            fs.writeFile(nuevoArchivo, dataAux.join("\n"), function(err) { // write file
                    if (err) { 
                        callback(err);
                    }else{
                        callback(true);
                    }
            });
        } else {
           callback(err);
        }
    });
}


/**
     * Unzip un conjunto de archivos
     * @param {Array}  datos -  Ruta de los archivos zip.
*/
function unzipArchivosQall(datos){
    var deferred = Q.defer();
    if(Array.isArray(datos) && datos.length>0){
        var datosArchivosADescomprimir = [];
        datos.forEach(function(dato){
            datosArchivosADescomprimir.push(unzipArchivos(dato));
        });
        Q.all(datosArchivosADescomprimir).then(function(success){
            setTimeout(function(){
                 deferred.resolve(true);
            },3000); //Espero tres segundos
		     
        },function(x){
            deferred.reject(x);
        });
    }else{
        deferred.reject({mensaje:"El parametro datos debe ser un array en la funcion unzipArchivosQall",parametroRecibido:datos});
    }
    return deferred.promise;
}

/**
     * Unzip un archivo
     * @param {json}  datos -  Datos del archivo a descomprimir.
*/
function unzipArchivos(datos){
    var deferred = Q.defer();
    //Ejemplo  unzip -p /u02/movil/sqlite/backups/1475690217765_1475690999106_101.zip  swiss.db > /u02/movil/sqlite/backups/test/bt.db
    var comandoBorrarArchivos = "unzip -p #archivoZip #archivoAExtraer > #destinoArchivoExtrado".replace("#archivoZip",datos.archivoZip).replace("#archivoAExtraer", datos.archivoAExtraer).replace("#destinoArchivoExtrado", datos.destinoArchivoExtrado);
    exec(comandoBorrarArchivos, function(error, stdout, stderr){
        if(error || stderr ){
            console.log("error en unzipArchivos", error, stderr);
            deferred.reject(error || stderr);
        }else{
            deferred.resolve(true);
        }
    });
   return deferred.promise;
}

module.exports = ComandosPorConsola;