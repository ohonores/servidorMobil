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

var coleccion = {nombre:"emcversiones",datos:{tipo:"diccionarios",version:"",nombreBackupSql:"",ubicacion:"/home/ecuaquimica/sqlite/bds/", origen:"",resultado:{}}};
ComandosPorConsola.prototype.copiarDiccionarios = function(pefilDestino){
    var deferred = Q.defer();
    mongodb.getRegistrosCustomColumnasOrdenLimite(coleccion.nombre, {tipo:"diccionarios",estado:true}, {nombreBackupSql:1,ubicacion:1,version:1}, {version:-1}, 1, function(res){
             console.log("getRegistrosCustomColumnasOrdenLimite",res);
        if(res && res[0] && res[0].ubicacion && res[0].nombreBackupSql && res[0].version){

            console.log("getRegistrosCustomColumnasOrdenLimite", "entro");
            var origen = res[0].ubicacion + res[0].nombreBackupSql;
            console.log("origen", origen);
            console.log("origen", res[0].ubicacion,res[0].nombreBackupSql);
            var versionPerfil = new Date().getTime();
            var nombreArchivo = ("#version_#vperfil_#destino.db").replace("#destino",pefilDestino).replace("#version",res[0].version).replace("#vperfil",versionPerfil);
            console.log("nombreArchivo", nombreArchivo);
            var destino = res[0].ubicacion + nombreArchivo;
             console.log("entro");
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
var ubicacionZips = "/home/ecuaquimica/servidores/servidorMobilDesarrollo/public/zipsSqls/";
ComandosPorConsola.prototype.copiarArchivosZips = function(perfil){
    var deferred = Q.defer();
    setTimeout(function(){
        mongodb.getRegistrosCustomColumnasOrdenLimite(coleccion.nombre, {tipo:"perfiles",estado:true}, {nombreBackupSql:1,ubicacion:1,version:1,versionPerfil:1}, {versionPerfil:-1}, 1, function(res){
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
                            console.log("getRegistrosCustomColumnasOrdenLimite",res[0]);
                            deferred.resolve(res[0]);
                    }
                });
            }else{
                 deferred.reject({error:true,mensaje:"No se ha econtrado una version en la coleccion emcversiones con tipo ::perfiles y estado::true"});
            }
        });
    },10000);
    return deferred.promise;
}

ComandosPorConsola.prototype.crearScriptsPorPerfil = function(pefilDestino, origen){
    var deferred = Q.defer();
    console.log("crearScriptsPorPerfil ", pefilDestino, origen);
    mongodb.getRegistrosCustomColumnasOrdenLimite(coleccion.nombre, {tipo:"perfiles",estado:true, perfil:pefilDestino.toString()}, {nombreBackupSql:1, ubicacion:1,version:1,versionPerfil:1}, {versionPerfil:-1}, 1, function(res){
          if(res && res[0] &&   res[0].ubicacion && res[0].nombreBackupSql && res[0].versionPerfil){
               var ubicacionArchivoSqlite = res[0].ubicacion + res[0].nombreBackupSql;
               var parametrosBusqueda = {tipo:"perfiles",estado:true, perfil:pefilDestino.toString(),dispositivos:{"$exists":true}};
                mongodb.getRegistrosCustomColumnasOrdenLimite(coleccion.nombre, parametrosBusqueda, {nombreBackupSql:1,ubicacion:1,version:1,versionPerfil:1,dispositivos:1}, {versionPerfil:-1}, 1, function(resultadoVersionesEntregadas){
                    if(Array.isArray(resultadoVersionesEntregadas)){
                        resultadoVersionesEntregadas.forEach(function(resultado){
                            if(resultado && resultado.ubicacion && resultado.nombreBackupSql && resultado.versionPerfil){
                                var ubicacionArchivoSqliteActual = resultado.ubicacion + resultado.nombreBackupSql;
                                crearArchivoSqlParaActualizacion(ubicacionArchivoSqliteActual, ubicacionArchivoSqlite, res[0].versionPerfil, pefilDestino, origen, resultado.dispositivos).then(function(success){
                                    deferred.resolve(success);
                                },function(error){
                                    deferred.reject(error);
                                });
                            }
                        });
                    }else{
                       deferred.reject({mensaje:"No existen versiones entregadas a los disposivivos con el perfil "+pefilDestino, parametros:parametrosBusqueda});
                    }

                });
        }else{
            deferred.reject({mensaje:"No existen registros con los parametros ingresados con el perfil "+pefilDestino, parametros:{tipo:"perfiles",estado:true, perfil:pefilDestino.toString()}});
        }
    });
    return deferred.promise;
}
function crearArchivoSqlParaActualizacion(actual, nuevo, versionPerfil, perfil, origen, dispositivos){
    var deferred = Q.defer();
    //Primero se copia la db actual al area de trabajo
    console.log(actual,nuevo,versionPerfil,perfil);
    var versionActualizacion = new Date().getTime();
    var areaTrabajo = "/home/ecuaquimica/sqlite/areatrabajo/";
    var sqliteA = "swissA"+versionActualizacion + ".db";
    var sqliteB = "swissB"+versionActualizacion + ".db";
    var copiar = "cp -rf  #actual #areaTrabajo#sqliteA;cp -rf  #nuevo #areaTrabajo#sqliteB";
    var nombreScript = "srcript_"+versionActualizacion+"_"+perfil+".sql"
    var sqldiff = "LD_PRELOAD=/opt/glibc-2.14/lib/libc.so.6 /usr/bin/sqldiff #areaTrabajo#sqliteA #areaTrabajo#sqliteB > #areaTrabajo#nombreScript";
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
                console.log("error1",error1,"stdout1",stdout1,"stderr1",stderr1);
                if(error1 || stderr1){
                     deferred.reject(error1 || stderr1)
                }else{
                    setTimeout(function(){

                        leerArchivoSqlParaInsertarloEnMongo(
                            areaTrabajo+nombreScript,
                            {versionPerfil:versionPerfil,
                             versionActualizacion:versionActualizacion,
                             ubicacionScripTemp:areaTrabajo,
                             nombreScriptTemp:nombreScript
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
var coleccion = {nombre:"emcversiones",datos:{tipo:"diccionarios",version:"",nombreBackupSql:"",ubicacion:"/home/ecuaquimica/sqlite/bds/", origen:"",resultado:{}}};

function leerArchivoSqlParaInsertarloEnMongo(t, consoleSuccess, origen, perfil, dispositivos){
    var deferred = Q.defer();
    var dispositivosFiltrados = dispositivos.reduce(function(nuevo,disp){if(nuevo.indexOf(disp.uidd)<0){nuevo.push(disp.uidd)}return nuevo;},[]);
    var coleccion = {
                        nombre:"emcversiones",
                        datos:{
                                tipo:"actualizaciones",
                                versionPerfil:consoleSuccess.versionPerfil,
                                versionActualizacion:consoleSuccess.versionActualizacion,
                                nombreScriptTemp:consoleSuccess.nombreScriptTemp,
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
                                estado:true
                            }
                    };
    var dispositivosFiltradosParaActualizacionEnVersiones = dispositivosFiltrados.map(function(uidd){return {uidd:uidd,origen:"Añadido en forma automática por una nueva sincronización",versionActualizacion:consoleSuccess.versionActualizacion,fecha:new Date()};});
    fs.readFile(consoleSuccess.ubicacionScripTemp + consoleSuccess.nombreScriptTemp , function(err, buf){
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
                    deferred.resolve({perfil:perfil, versionPerfil:consoleSuccess.versionPerfil,versionActualizacion:consoleSuccess.versionActualizacion,dispositivos:dispositivosFiltrados});

                },function(error){
                        deferred.reject(error);
                });
            },function(error){
                    deferred.reject(error);
            });
        }
    });

     return deferred.promise;
}


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

