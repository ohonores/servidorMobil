
var schedule = require('node-schedule');
var request = require("request");
var sha256 = require('sha256');
var nodemailer = require('nodemailer');
var EntidadesMongoOracle = require("./jsonEntity.js");
var ubicacion = require("./ubicacion.js");
var SqliteCliente = require("./sqliteCliente.js");
var ComandosPorConsola = require("./comandosPorConsola.js");
var comandosPorConsola_ = new ComandosPorConsola();

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
var Reportes = function (oracle_, mongo_) {
    oracle = oracle_;
    oracledb = oracle_;
    mongodb = mongo_;
    sqliteCliente_=  new SqliteCliente("/u02/movil/sqlite/bds/", mongodb);
    
};

Reportes.prototype.getSincronizacionsDeInicioPorPerfil(perfil){
    var deferred = Q.defer();
    var padre = this;
    //db.emcversiones.find({tipo:"zip", perfil:"156","dispositivos":{$elemMatch:{ip:{$exists:true},uidd:"d73609213b6a643"}},"dispositivos.origen":{$exists:true}},{versionPerfil:1, dispositivos:{$elemMatch:{ip:{$exists:true},uidd:"d73609213b6a643"}}}).sort({versionPerfil:-1}).limit(1)
    parametrosBusqueda = {tipo:"zip", perfil:perfil.toString(),"dispositivos":{$elemMatch:{ip:{$exists:true}}},"dispositivos.origen":{$exists:true}};
    mongodb.getRegistrosCustomColumnasOrdenLimite(coleccion.nombre, parametrosBusqueda, {versionPerfil:1, dispositivos:{$elemMatch:{ip:{$exists:true}}}}, {versionPerfil:-1}, 100, function(sincronizaciones){
        getSincronizacionsRecursivePerfil(perfil, index, sincronizaciones, function(success){
            deferred.resolve(success);
        });
        
    });
    return deferred.promise;

}
var coleccion = {nombre:"emcversiones",datos:{tipo:"diccionarios",version:"",nombreBackupSql:"",ubicacion:"/u02/movil/sqlite/bds/", origen:"",resultado:{}}};
function getSincronizacionsRecursive(perfil, versionReferencia, dispositivo, resultado, callback){
   
    var parametrosBusqueda = {tipo:"actualizaciones", perfil:perfil.toString(),versionPerfilReferencia:versionReferencia, "sincronizado":{$elemMatch:{estado:true,"dispositivo":dispositivo,"totales":{$exists:true}}}};
         
    mongodb.getRegistrosCustomColumnasOrdenLimite(coleccion.nombre, parametrosBusqueda, {sincronizado:1}, {versionActualizacion:-1}, 1, function(resultadoVersionesEntregadas){
       if(resultadoVersionesEntregadas && resultadoVersionesEntregadas[0] && Array.isArray(resultadoVersionesEntregadas[0].sincronizado) &&  resultadoVersionesEntregadas[0].sincronizado[0] && resultadoVersionesEntregadas[0].sincronizado[0].versionPerfil){
            getSincronizacionsRecursive(perfil, resultadoVersionesEntregadas[0].sincronizado[0].versionPerfil, dispositivo, resultadoVersionesEntregadas[0].sincronizado, callback);
        }else{
            callback(resultado);
        }
        
    });
}

function getSincronizacions(perfil, versionReferencia, dispositivo){
    var deferred = Q.defer();
    getSincronizacionsRecursive(perfil, versionReferencia, dispositivo, {}, function(success){
        deferred.resolve(success);
    });
    return deferred.promise;
}

function getSincronizacionsPorConjutoDeVersiones(perfil, index, dispositivos, callback){
    if(index<sincronizacionesDeInicioPorPerfil){
        getSincronizacions(perfil, dispositivo[index].versionPerfil, dispositivo.uidd).then(function(success){
            dispositivo[index].ultimaSincronizacion = success;
            index +=1;
            getSincronizacionsPorConjutoDeVersiones(perfil, index, dispositivos, callback);
        });
    }else{
        callback(dispositivos);
    }
}

function getSincronizacionsRecursivePerfil(perfil, index, sincronizacionesDeInicio, callback){
    if(index<sincronizacionesDeInicioPorPerfil){
        getSincronizacionsPorConjutoDeVersiones(perfil, index, sincronizacionesDeInicio[index].dispositivos, function(success){
            index +=1;
            sincronizacionesDeInicio[index].dispositivos = success;
            getSincronizacionsRecursivePerfil(perfil, index, sincronizacionesDeInicio, callback);
        })
     
    }else{
        callback(sincronizacionesDeInicio);
    }
}



module.exports = Reportes;

