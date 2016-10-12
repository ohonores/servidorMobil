//var sys = require('sys')
var exec = require('child_process').exec;
var fs = require('fs');
var Q = require('q');

//var sqlite3 = require('sqlite3').verbose();
var mongodb = require('../conexiones-basededatos/conexion-mongodb.js');
var lineReader = require('line-reader');
//var sq = require('./sqliteCliente.js');
/**
Ejemplo:
exec("cp -rf  /home/ecuaquimica/sqlite/bds/diccionarios.dbEEE /home/ecuaquimica/sqlite/bds/perfil101test011.db",function(error, stdout, stderr){
    console.log(error);
    console.log(stdout);
    console.log(stderr);
});
*/
var ComandosPorConsola = function () {

};




var coleccion = {nombre:"emcversiones",datos:{tipo:"diccionarios",version:"",nombreBackupSql:"",ubicacion:"/u02/movil/sqlite/bds/", origen:"",resultado:{}}};
ComandosPorConsola.prototype.copiarDiccionarios = function(perfilDestino){
    var deferred = Q.defer();
    mongodb.getRegistrosCustomColumnasOrdenLimite(coleccion.nombre, {tipo:"diccionarios",estado:true}, {nombreBackupSql:1,ubicacion:1,version:1}, {version:-1}, 1, function(res){
        if(res && res[0] && res[0].ubicacion && res[0].nombreBackupSql && res[0].version){
    var origen = res[0].ubicacion + res[0].nombreBackupSql;
            var versionPerfil = new Date().getTime();
            var nombreArchivo = ("#version_#vperfil_#destino.db").replace("#destino",perfilDestino).replace("#version",res[0].version).replace("#vperfil",versionPerfil);
            var destino = res[0].ubicacion + nombreArchivo;
            exec("cp -rf #origen #destino".replace("#origen",origen).replace("#destino",destino), function(error, stdout, stderr){
                console.log(error);
                console.log(stdout);
                console.log(stderr);
                if(error || stderr ){
                    res[0].error = error;
                    res[0].stderr = stderr;
                   deferred.reject(res[0]);
                }else{

                    res[0].nombreArchivo = nombreArchivo;
                    res[0].versionPerfil = versionPerfil;
                    console.log("getRegistrosCustomColumnasOrdenLimite",res[0]);
                    deferred.resolve(res[0]);
                }


            });
        }else{
             deferred.reject({error:true,mensaje:"No se ha econtrado una version en la coleccion emcversiones con tipo ::diccionarios y estado::true"});
        }
    });


    return deferred.promise;

}

ComandosPorConsola.prototype.removerArchivosAreaTrabajo = function(){
    exec("cd /u02/movil/sqlite/areatrabajo/ ; rm -rf * ", function(error, stdout, stderr){
        if(error || stderr ){
           console.log(error, stderr);
        }else{
            console.log("/u02/movil/sqlite/areatrabajo/ -->Archivos eliminados");
        }
    });
}
var ubicacionZips = "/u02/movil/zipsSqls/";
ComandosPorConsola.prototype.copiarArchivosZips = function(perfil){
    var deferred = Q.defer();
    setTimeout(function(){
        mongodb.getRegistrosCustomColumnasOrdenLimite(coleccion.nombre, {tipo:"perfiles",estado:true, perfil:perfil.toString()}, {nombreBackupSql:1,ubicacion:1,version:1,versionPerfil:1}, {versionPerfil:-1}, 1, function(res){
            if(res && res[0] && res[0].ubicacion && res[0].nombreBackupSql && res[0].version && res[0].versionPerfil){
                var ubicacionArchivoSqlite = res[0].ubicacion + res[0].nombreBackupSql;
                var ubicacionArchivoZipSqlite = ubicacionZips + res[0].nombreBackupSql.replace(".db",".zip");

                exec("cp #ubicacionArchivoSqlite swiss.db && zip #ubicacionArchivoZipSqlite swiss.db && rm -rf swiss.db".replace("#ubicacionArchivoSqlite",ubicacionArchivoSqlite).replace("#ubicacionArchivoZipSqlite",ubicacionArchivoZipSqlite), function(error, stdout, stderr){
                    
                    if(error || stderr ){
                        console.log(error, stderr, stdout);
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

function getDispositivosSincronizados(parametros){
    var deferred = Q.defer();
    var parametrosBusqueda = {tipo:"zip", perfil:parametros.perfilDestino.toString(),"dispositivos.origen":{$exists:true},"dispositivos":{$elemMatch:{ip:{$exists:true},uidd:parametros.dispositivo}}};
    console.log(parametrosBusqueda);
    mongodb.getRegistrosCustomColumnasOrdenLimite(coleccion.nombre, parametrosBusqueda, {versionPerfil:1,dispositivos:1}, {versionPerfil:-1}, 1, function(dispositivosEncontrados){
        if(dispositivosEncontrados && dispositivosEncontrados[0] && Array.isArray(dispositivosEncontrados[0].dispositivos) && dispositivosEncontrados[0].dispositivos.length>0){
             
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
             console.log("No se encontraron dispositivos sincronizados para el perfil",parametros);
            deferred.reject({mensaje:"No se encontraron dispositivos sincronizados para el perfil ", parametros:parametros, metodo:"getDispositivosSincronizados"});
        }
        
    });
    return deferred.promise;
}

function crearSqliteDiffPorPerfilyDispositivoRecursive(index, versionesPorPerfil, parametros, resultados, errores, callback){
    if(index<versionesPorPerfil.length){
        var resultado = versionesPorPerfil[index];
        var ubicacionArchivoSqliteActual = resultado.ubicacion + resultado.nombreBackupSql;
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

function crearSqliteDiffPorPerfilyDispositivo(parametros){
    var deferred = Q.defer();
    parametrosBusqueda = {tipo:"perfiles",estado:true, perfil:parametros.perfilDestino.toString(), versionPerfil:{ $in: parametros.listaPerfilVersion }}; 
    mongodb.getRegistrosCustomColumnas(coleccion.nombre, parametrosBusqueda, {nombreBackupSql:1,ubicacion:1,version:1,versionPerfil:1,dispositivos:1}, function(resultadoVersionesEntregadas){
        if(resultadoVersionesEntregadas && Array.isArray(resultadoVersionesEntregadas) && resultadoVersionesEntregadas.length>0){
            crearSqliteDiffPorPerfilyDispositivoRecursive(0, resultadoVersionesEntregadas, parametros, [], [], function(resultados, errores){
                deferred.resolve({success:resultados,error:errores});
            });
        }else{
           deferred.reject({mensaje:"No existen versiones entregadas a los disposivivos con el perfil "+parametros.perfilDestino, parametros:parametrosBusqueda});
        }
    });//fin getRegistrosCustomColumnasOrdenLimite
   return deferred.promise;
}

/**
    function: getUltimaSincronizacion
    Prametros: perfilDestino, dispositivo
    Descripcion: Consigue la ultima sincronizacion del perfil segun el dispositivo
                 Lo hace de la siguiente forma:
                    1. Busca en la coleccion emcversiones con el tipo actualizaciones
                    2. Busca en la coleccion emvversiones con el tipo zip
                    3. Entrega la versionPerfil o indica que no existe una ultima sincronizacion
*/
function getUltimaSincronizacion(perfilDestino, dispositivo, versionEncontrada){
    var deferred = Q.defer();
      console.log("XXXXXXXXXXXXXXXXXX VERSION ENCONTRADA versionEncontrada", versionEncontrada );
    if(versionEncontrada){
        deferred.resolve(parseInt(versionEncontrada));
    }else{
        // db.emcversiones.find({tipo:"zip", perfil:"101","dispositivos.versionActualizacion":{$exists:false},"dispositivos.origen":{$exists:true}},{versionPerfil:1, dispositivos:{$elemMatch:{uidd:dispositivo}}}).sort({versionPerfil:-1}).limit(1)
        //db.emcversiones.find({tipo:"actualizaciones", perfil:"156","sincronizado":{$elemMatch:{estado:true,"dispositivo":"47676b2a043f8517","totales":{$exists:true}}}},{"sincronizado":1}).sort({versionActualizacion:-1}).limit(1).pretty()
        console.log("getUltimaSincronizacion",perfilDestino, dispositivo);
        var parametrosBusqueda = {tipo:"actualizaciones", perfil:perfilDestino.toString(),"sincronizado":{$elemMatch:{estado:true,"dispositivo":dispositivo,"totales":{$exists:true}}}};
         console.log("getUltimaSincronizacion",parametrosBusqueda);
        mongodb.getRegistrosCustomColumnasOrdenLimite(coleccion.nombre, parametrosBusqueda, {sincronizado:1}, {versionActualizacion:-1}, 1, function(resultadoVersionesEntregadas){
              console.log("getUltimaSincronizacion",resultadoVersionesEntregadas);
            if(resultadoVersionesEntregadas && resultadoVersionesEntregadas[0] && Array.isArray(resultadoVersionesEntregadas[0].sincronizado) &&  resultadoVersionesEntregadas[0].sincronizado[0] && resultadoVersionesEntregadas[0].sincronizado[0].versionPerfil){
                console.log("getUltimaSincronizacion ---------------->",resultadoVersionesEntregadas[0].sincronizado[0].versionPerfil);
                
                
                //db.emcversiones.find({tipo:"zip", perfil:"156","dispositivos":{$elemMatch:{ip:{$exists:true},uidd:"d73609213b6a643"}},"dispositivos.origen":{$exists:true}},{versionPerfil:1, dispositivos:{$elemMatch:{ip:{$exists:true},uidd:"d73609213b6a643"}}}).sort({versionPerfil:-1}).limit(1)
                 parametrosBusqueda = {tipo:"zip", perfil:perfilDestino.toString(),"dispositivos":{$elemMatch:{ip:{$exists:true},uidd:dispositivo}},"dispositivos.origen":{$exists:true}};
                   mongodb.getRegistrosCustomColumnasOrdenLimite(coleccion.nombre, parametrosBusqueda, {versionPerfil:1, dispositivos:{$elemMatch:{ip:{$exists:true},uidd:dispositivo}}}, {versionPerfil:-1}, 1, function(res){
                       console.log("getUltimaSincronizacion Obteniendo la primera version -->",res[0])
                        if(res && res[0] && res[0].versionPerfil && res[0].dispositivos && res[0].dispositivos[0].uidd == dispositivo){
                            
                            if(parseInt(res[0].versionPerfil)>parseInt(resultadoVersionesEntregadas[0].sincronizado[0].versionPerfil)){
                                deferred.resolve(parseInt(res[0].versionPerfil));
                            }else{
                                deferred.resolve(parseInt(resultadoVersionesEntregadas[0].sincronizado[0].versionPerfil));    
                            }
                             
                            
                        }else{
                            deferred.resolve(parseInt(resultadoVersionesEntregadas[0].sincronizado[0].versionPerfil));   
                        } 
                   });
                
            }else{
                //db.emcversiones.find({tipo:"zip", perfil:"156","dispositivos":{$elemMatch:{ip:{$exists:true},uidd:"d73609213b6a643"}},"dispositivos.origen":{$exists:true}},{versionPerfil:1, dispositivos:{$elemMatch:{ip:{$exists:true},uidd:"d73609213b6a643"}}}).sort({versionPerfil:-1}).limit(1)
                 parametrosBusqueda = {tipo:"zip", perfil:perfilDestino.toString(),"dispositivos":{$elemMatch:{ip:{$exists:true},uidd:dispositivo}},"dispositivos.origen":{$exists:true}};
                   mongodb.getRegistrosCustomColumnasOrdenLimite(coleccion.nombre, parametrosBusqueda, {versionPerfil:1, dispositivos:{$elemMatch:{ip:{$exists:true},uidd:dispositivo}}}, {versionPerfil:-1}, 1, function(res){
                       console.log("getUltimaSincronizacion Obteniendo la primera version -->",res[0])
                        if(res && res[0] && res[0].versionPerfil && res[0].dispositivos && res[0].dispositivos[0].uidd == dispositivo){
                           deferred.resolve(parseInt(res[0].versionPerfil));
                          }else{
                            console.log({error:true,mensaje:"No se encontro sqlite para el perfil ",dispositivo:dispositivo,perfil:perfilDestino, metodo:"getUltimaSincronizacion"});
                            deferred.resolve("No se encontro sqlite para el perfil ");
                        } 
                   });
            }
           
        });
    }
    return deferred.promise;
}

 
function getUltimaBaseSqlitePorPerfilServidor(perfilDestino, origen, versionEncontrada, dispositivo){
     var deferred = Q.defer();
     mongodb.getRegistrosCustomColumnasOrdenLimite(coleccion.nombre, {tipo:"perfiles",estado:true, perfil:perfilDestino.toString()}, {nombreBackupSql:1, ubicacion:1,version:1,versionPerfil:1}, {versionPerfil:-1}, 1, function(res){
              if(res && res[0] &&  res[0].ubicacion && res[0].nombreBackupSql && res[0].versionPerfil){
                  var difference = parseInt(res[0].versionPerfil) - parseInt(versionEncontrada); 
                  var resultInMinutes = Math.round(difference / 60000);
                    
                  if(res[0].versionPerfil != versionEncontrada){
                    console.log("getUltimaBaseSqlitePorPerfilServidor version servidor-->",res[0].versionPerfil, " version dispositivo ", versionEncontrada, "tiempo transcurrido en minutos ",resultInMinutes, "dispositivo", dispositivo);
                    deferred.resolve({ubicacionArchivoSqlite:res[0].ubicacion + res[0].nombreBackupSql, versionPerfil:res[0].versionPerfil,perfilDestino:perfilDestino,origen:origen,versionEncontrada:versionEncontrada, dispositivo:dispositivo});
            
                  }else{
                    deferred.reject({mensaje:"No se encontraron nuevas versiones",perfil:perfilDestino,origen:origen, minutos:resultInMinutes});
                  }
            }else{
                  deferred.reject({mensaje:"No se encontraron sqlite para el perfil",perfil:perfilDestino,origen:origen});
            }
     });
     return deferred.promise;
}

ComandosPorConsola.prototype.crearScriptsPorPerfil = function(perfilDestino, origen, versionEncontrada, dispositivo){
    
    
    var deferred = Q.defer();
    
    console.log("ComandosPorConsola --> crearScriptsPorPerfil perfil y version ", perfilDestino , versionEncontrada);
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


function crearArchivoSqlParaActualizacion(actual, nuevo, versionPerfil, perfil, origen, dispositivos, referencia){
    var deferred = Q.defer();
    //Primero se copia la db actual al area de trabajo
    var versionActualizacion = new Date().getTime();
    var areaTrabajo = "/u02/movil/sqlite/areatrabajo/";
    var sqliteA = "swissA"+versionActualizacion + ".db";
    var sqliteB = "swissB"+versionActualizacion + ".db";
    var copiar = "cp -rf  #actual #areaTrabajo#sqliteA;cp -rf  #nuevo #areaTrabajo#sqliteB";
    var nombreScript = "srcript_"+versionActualizacion+"_"+perfil+".sql";
    var sqldiff;
    if(process.env.GRUPO == "1"){
         sqldiff = "LD_PRELOAD=/opt/glibc-2.14/lib/libc.so.6 /usr/bin/sqldiff #areaTrabajo#sqliteA #areaTrabajo#sqliteB > #areaTrabajo#nombreScript";
    }else{
        sqldiff = "sqldiff #areaTrabajo#sqliteA #areaTrabajo#sqliteB > #areaTrabajo#nombreScript";
    }
    var 
    copiar = copiar.replace("#actual",actual).replace("#nuevo",nuevo).replace(/#areaTrabajo/g,areaTrabajo).replace("#sqliteB",sqliteB).replace("#sqliteA",sqliteA);
    console.log(copiar);
    exec(copiar,function(error, stdout, stderr){
        console.log("error",error,"stdout",stdout,"stderr",stderr);
        if(error || stderr){
            deferred.reject(error || stderr)
        }else {
            sqldiff = sqldiff.replace(/#areaTrabajo/g,areaTrabajo).replace("#sqliteA",sqliteA).replace("#sqliteB",sqliteB).replace("#nombreScript",nombreScript);
            console.log(sqldiff);
            exec(sqldiff, function(error1, stdout1, stderr1){
                
                if(error1 || stderr1){
                    console.log("SQLDIFF *****************  error1",error1,"stdout1",stdout1,"stderr1",stderr1);
                     deferred.reject(error1 || stderr1)
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

        }

    });
    return deferred.promise;
}
var coleccion = {nombre:"emcversiones",datos:{tipo:"diccionarios",version:"",nombreBackupSql:"",ubicacion:"/u02/movil/sqlite/bds/", origen:"",resultado:{}}};

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
    
    //crearNuevoArchivo(consoleSuccess.ubicacionScripTemp + consoleSuccess.nombreScriptTemp, consoleSuccess.ubicacionScripTemp + consoleSuccess.nombreScriptTemp.replace(".sql",".txt"), function(res){
    leerArchivoEnMemoria(consoleSuccess.ubicacionScripTemp + consoleSuccess.nombreScriptTemp, consoleSuccess.ubicacionScripTemp + consoleSuccess.nombreScriptTemp.replace(".sql",".txt"), function(res){
               
              
                fs.rename(consoleSuccess.ubicacionScripTemp + consoleSuccess.nombreScriptTemp.replace(".sql",".txt"), consoleSuccess.ubicacionScripTemp + consoleSuccess.nombreScriptTemp, function(err) {
                    if (err) {
                        console.log(err);
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
                
                console.log(res);
    });
    
    
    
    

     return deferred.promise;
}


var texto = [];
function crearNuevoArchivo(archivo, nuevoArchivo, callback){
    var logStream = fs.createWriteStream(nuevoArchivo, {'flags': 'a'});
    var contadorA = 0;
    lineReader.eachLine(archivo, function(line, last) {
        contadorA ++;
      if (last) {
          if(line && !(line.indexOf("emovtcartera")>=0 || line.indexOf("emovtcartera_detalle")>=0 || line.indexOf("emovtafecta")>=0 ||line.indexOf("emovtorden")>=0||line.indexOf("emovtorden_detalle")>=0||line.indexOf("emovtorden_condicion")>=0 || line.indexOf("UPDATE emovtperfil SET version=")>=0)){
             logStream.write(line);
          }
         // logStream.write(line);
        logStream.end();
        logStream.close();
        callback(true);
      }else{
            grabarEnArchivoTexto(logStream, line, function(){}); 
            if(contadorA % 500 === 0 && contadorA !== 0){
                  grabarEnArchivoTexto(logStream, "iniciodenuevogrupoparagrabarsqlite", function(){});
                  contadorA = 0;
            }
            
            
         
      }
        
    },function(err){
         callback(err);
    });
}
function eliminarAlgunosDatosEnElUpdate(index, line, campos){
   
    if(index<campos.length){
         var total = (line.match(/=/g) || []).length;
        // console.log("index",index, "total", total);
        if(total>2){
          //  console.log("index",index, "campos[index]", campos[index]);
           var a = new RegExp("\, #campo=.*?' ".replace("#campo", campos[index]));
           var b = new RegExp("\#campo=.*?', ".replace("#campo", campos[index]));
            var c = new RegExp("\, #campo=.*? ".replace("#campo", campos[index]));
           var d = new RegExp("\#campo=.*?, ".replace("#campo", campos[index]));
           line = line.replace(a, " ").replace(b, " ").replace(c, " ").replace(d, " ");
           index +=1;
            //console.log("index recursive ",index, "line", line);
           return eliminarAlgunosDatosEnElUpdate(index, line, campos);
       
        }else{
            return line;
        }
    }else{
        return line;
    }
     
}
function leerArchivoEnMemoria(archivo, nuevoArchivo, callback ){
    fs.readFile(archivo, function(err, data) { // read file to memory
        if (!err) {
            data = data.toString(); // stringify buffer
            data = data.split("\n");
            dataAux =[];
            for(var i=0;i<data.length;i++){
                line = data[i];
                if(line && !(line.indexOf("emovtcartera")>=0 || line.indexOf("emovtcartera_detalle")>=0 || line.indexOf("emovtafecta")>=0 ||line.indexOf("emovtorden")>=0||line.indexOf("emovtorden_detalle")>=0||line.indexOf("emovtorden_condicion")>=0 || line.indexOf("UPDATE emovtperfil")>=0)){
                   
                    dataAux.push(line);
                    if(i % 500 === 0 && i !== 0){
                      dataAux.push("iniciodenuevogrupoparagrabarsqlite");

                    }

                }else{
                    if(line && line.indexOf("ALTER TABLE")>=0){
                        dataAux.push(line);
                        if(i % 500 === 0 && i !== 0){
                          dataAux.push("iniciodenuevogrupoparagrabarsqlite");

                        }
                    }
                    if(line && line.indexOf("UPDATE emovtperfil")>=0){
                        var nuevalinea_url = eliminarAlgunosDatosEnElUpdate(0, line, ["url","version"]);
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
                    if (err) { // if error, report
                        console.log (err);
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

function grabarEnArchivoTexto(logStream, line, callback){
    
     if(line && !(line.indexOf("emovtcartera")>=0 || line.indexOf("emovtcartera_detalle")>=0 || line.indexOf("emovtafecta")>=0 ||line.indexOf("emovtorden")>=0||line.indexOf("emovtorden_detalle")>=0||line.indexOf("emovtorden_condicion")>=0)){
             logStream.write(line+'\n');
            
    }
   callback(true);     
}
/*console.log('renamed complete');
            fs.readFile('/home/ecuaquimica/sqlite/areatrabajo/srcript_1470938772709_101.sql' , function(err, buf){
                var d = buf.toString().split("iniciodenuevogrupoparagrabarsqlite");
                console.log(d.length);
                
                for(var i=0;i<d.length;i++){
                    var dq = d[i].split("\n");
                    dq = dq.filter(function(a){if(a){return a;}})
                    for(var y=0;y<dq.length;y++){
                        if(!dq[y]){
                           console.log("Vacio "+y);
                            console.log(dq[y]); 
                        }
                    }
                   
                    
                    
                    
                }
               
                    
                
                
    });*/
/*crearNuevoArchivo("/home/ecuaquimica/sqlite/areatrabajo/srcript_1470782496081_101.sql", "/home/ecuaquimica/sqlite/areatrabajo/srcript_1470782496081_101A.sql", function(res){
    console.log(true);
    fs.rename('/home/ecuaquimica/sqlite/areatrabajo/srcript_1470782496081_101A.sql', '/home/ecuaquimica/sqlite/areatrabajo/srcript_1470782496081_101.sql', function(err) {
        if (err) {
            //console.log(err);
        }else{
            
        }
        
    });
   
    
});*/

//d = new ComandosPorConsola();
//console.log("iniciando");

//var  sq_ = new sq('');
//setTimeout(function(){
  //  console.log("db iniciando");

    /*mongodb.getRegistrosCustomColumnasOrdenLimite(coleccion.nombre, {tipo:"actualizaciones",versionActualizacion:1470784589517}, {scripts:1}, {versionPerfil:-1}, 1, function(res){
        console.log("resultados QQQQQQQQQQQQQWWWWWWWWWWWWWWWWWWWWWW######################33333 ",res.length)
        for(var i = 0;i<res[0].scripts.length;i++){
            console.log("i",i)
             for(var y = 0;y<res[0].scripts.length;y++){

                 if(res[0].scripts[y].id == (i+1)){
                     console.log("i",i,"encontrado")
                     sq_.grabar('base1','/home/ecuaquimica/sqlite/areatrabajo/swissA1470784492228.db',res[0].scripts[y].script);
                     break;
                 }
             }

        }

    });*/
    /* d.crearScriptsPorPerfil(101, {test:"pruebas"}).then(function(res){
        console.log(res);
    });
},15000);
   */

module.exports = ComandosPorConsola;

