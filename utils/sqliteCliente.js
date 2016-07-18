var sqlite3 = require('sqlite3').verbose();
var Q = require('q');

var directorio = "";
var SqliteCliente = function(directorio_){
    directorio = directorio_;
}
SqliteCliente.prototype.crearTablas = function(nombreBaseDatos, scriptsTablas){
    var deferred = Q.defer();
    try{
        var db = new sqlite3.Database(directorio+nombreBaseDatos);
        try{
            db.serialize(function() {
                scriptsTablas.forEach(function(stripTabla){
                    db.run(stripTabla);
                })


            });
        }catch(error){
            deferred.reject(error);
        }
        db.close();
        deferred.resoolve(true);
    }catch(error){
        deferred.reject(error);
    }
    return deferred.promise;
}
SqliteCliente.prototype.insertarRegistros = function(scriptInsersion, arrayDeRegistros){
    var deferred = Q.defer();
    try{
        var db = new sqlite3.Database(directorio+nombre);
        try{
            db.serialize(function() {
                var stmt = db.prepare(stringInsercion);
                arrayDeRegistros.forEach(function(registro){
                    stmt.run(registro);
                })
                stmt.finalize();
            });
        }catch(error){
            deferred.reject(error);
        }
        db.close();
        deferred.resoolve(true);
    }catch(error){
        deferred.reject(error);
    }
    return deferred.promise;
}

module.exports = SqliteCliente;