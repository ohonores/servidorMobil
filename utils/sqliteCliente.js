var sqlite3 = require('sqlite3').verbose();
var TransactionDatabase = require("sqlite3-transactions").TransactionDatabase;
var Q = require('q');
var directorio = "";
var mongodb;
var SqliteCliente = function(directorio_, mongodb_){
    directorio = directorio_;
    mongodb = mongodb_;
}
/**
    Crea las tablas en el sqlite
    @param {string} nombreBaseDatos - Ubicación de la base de datos
    @param {array} scriptsTablas - Conjunto de scripts
*/
SqliteCliente.prototype.crearTablas = function(nombreBaseDatos, scriptsTablas){
    var deferred = Q.defer();
    console.log("crearTablas", scriptsTablas)
    try{
        // Wrap sqlite3 database
        /*var db = new TransactionDatabase(
            new sqlite3.Database(directorio+nombreBaseDatos, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE)
        );*/
        console.log(directorio+nombreBaseDatos)
        var db = new sqlite3.Database(directorio+nombreBaseDatos);
        //Estableciendo modo timeout,synchronous y WAL, con el objetivo de aumentar el performnce
        //  db.configure("busyTimeout", 30000);
        db.run('PRAGMA busy_timeout = 5000');
        try{
            db.serialize(function() {
                db.exec('BEGIN IMMEDIATE');
                scriptsTablas.forEach(function(scriptTabla){
                      console.log("crearTablas BEGIN IMMEDIATE")
                        db.run(scriptTabla);
                });
                 db.exec("COMMIT")
                .close(function(){
                     deferred.resolve(true);
                });
            });
        }catch(error){
            deferred.reject(error);
        }
    }catch(error){
        deferred.reject(error);
    }
    return deferred.promise;
}

SqliteCliente.prototype.crearTablasPorPerfil = function(bdPorPerfil, scriptsTablas){
    var deferred = Q.defer();
    var arrayCrearTablas = [];
    var padre = this;
    bdPorPerfil.forEach(function(nombre){
        arrayCrearTablas.push(padre.crearTablas(nombre, scriptsTablas));
    });
    Q.all(arrayCrearTablas).then(function(success){
        deferred.resolve(true);
    },function(error){
        deferred.reject(error);
    });
    return deferred.promise;

}


var db = {};
SqliteCliente.prototype.instanciarBaseSqlite = function(nombre){
    db[nombre] = new sqlite3.Database(directorio+nombre);
}

/**
    Cierra la base de datos sqlite
*/
SqliteCliente.prototype.cerrarBaseSqlite = function(nombre){
     db[nombre].close();
}

function waitSeconds(iMilliSeconds) {
    var counter= 0
        , start = new Date().getTime()
        , end = 0;
    while (counter < iMilliSeconds) {
        end = new Date().getTime();
        counter = end - start;
    }
}
/**
    Inserta registros
*/
SqliteCliente.prototype.insertarRegistros = function(nombre, tabla, arrayDeRegistros){
    var deferred = Q.defer();
    var padre = this;
   
    try{
        if(!db[nombre]){

            db[nombre] = new sqlite3.Database(directorio+nombre);
           // db[nombre].configure("busyTimeout", 30000);
            db[nombre].run('PRAGMA busy_timeout = 40000');
        }
        try{
            db[nombre].serialize(function() {
                
                db[nombre].exec('BEGIN IMMEDIATE');
                var stmt = db[nombre].prepare(padre.getSqlInsercion(arrayDeRegistros[0].registroMovil, tabla));
                arrayDeRegistros.forEach(function(registro){

                    stmt.run(padre.getValoresPorInsertar(registro.registroMovil),function(error, resultado){
                        if(error){
                            console.log("SQLITE: insertarRegistros ", error, " Registro --> ", registro.registroMovil)
                             mongodb.grabarErroresMobiles({fecha:new Date(), tipo:"sqlite", metodo:"insertarRegistros", error:error, referencia:{nombre:nombre, tabla:tabla, length:arrayDeRegistros.length}});
                        }

                    });
                })
                stmt.finalize();
                db[nombre].exec("COMMIT",function(d){
                    deferred.resolve(true);
                });

            });
        }catch(error){
            // db[nombre].close();
            deferred.reject(error);
        }
        //waitSeconds(1000);
        //deferred.resolve(true);
       

    }catch(error){
         //db[nombre].close();
        deferred.reject(error);
    }
    return deferred.promise;
}


/**
 * Funcion que permite obtener crear en forma dinamica
 * el insert y valores para la insercion en la base
 */
function getJsonAGrabar(datos, tabla) {
      var columnas = [];
      var sqlInsert = "INSERT INTO #TALBA(#COLUMNAS) VALUES(#VALORES)";
      var valores = [];
      var valoresIndices = [];
      var indice = 1;
      for (var key in datos) {
        if (typeof datos[key] === 'object' && datos[key] != null ) {
          try {
                if(datos[key] instanceof Date){
                    valores.push(JSON.stringify(datos[key]).replace(/"/g,""));
                }else{
                   valores.push(JSON.stringify(datos[key]));
                }
          }catch (errorAlFormarJsonStringify) {
                valores.push(datos[key]);
          }
        }else{
            if (datos[key] == 'null') {
                valores.push(null);
            }else{
                valores.push(datos[key]);
            }
        }


        valoresIndices.push("$" + indice);
        columnas.push(key);
        indice++;
      }
      return {
        sql: sqlInsert.replace("#TALBA", tabla).replace("#COLUMNAS", columnas.join(",")).replace("#VALORES", valoresIndices.join(",")),
        valores: valores
      };
} //fin getJsonAGrabar
/**
 * Funcion que permite obtener crear en forma dinamica
 * el insert y valores para la insercion en la base
 */
SqliteCliente.prototype.getSqlInsercion = function(datos, tabla) {
      var columnas = [];
      var sqlInsert = "INSERT INTO #TALBA(#COLUMNAS) VALUES(#VALORES)";
      var valores = [];
      var valoresIndices = [];
      var indice = 1;
      for (var key in datos) {
        if (typeof datos[key] === 'object' && datos[key] != null  ) {
          try {
                if(datos[key] instanceof Date){
                    valores.push(JSON.stringify(datos[key]).replace(/"/g,""));
                }else{
                   valores.push(JSON.stringify(datos[key]));
                }

          }catch (errorAlFormarJsonStringify) {
                valores.push(datos[key]);
          }
        }else{
            if (datos[key] == 'null') {
                valores.push(null);
            }else{
                valores.push(datos[key]);
            }
        }
        valoresIndices.push("$" + indice);
        columnas.push(key);
        indice++;
      }
      return sqlInsert.replace("#TALBA", tabla).replace("#COLUMNAS", columnas.join(",")).replace("#VALORES", valoresIndices.join(","));
} //fin getSqlInsercion

/**
 * Funcion que permite obtener crear en forma dinamica
 * el insert y valores para la insercion en la base
 */
SqliteCliente.prototype.getValoresPorInsertar = function(datos) {
      var valores = [];
      var indice = 1;
      for (var key in datos) {
        if (typeof datos[key] === 'object' && datos[key] != null ) {
          try {
                if(datos[key] instanceof Date){
                    valores.push(JSON.stringify(datos[key]).replace(/"/g,""));
                }else{
                   valores.push(JSON.stringify(datos[key]));
                }
          }catch (errorAlFormarJsonStringify) {
                valores.push(datos[key]);
          }
        }else{
            if (datos[key] == 'null') {
                valores.push(null);
            }else{
                valores.push(datos[key]);
            }
        }
      }

      return valores;
} //fin getValoresPorInsertar


var test = {};
/**
    Usando para pruebas
*/
SqliteCliente.prototype.grabar = function(nombre, base , scripts){
    if(!test[nombre]){
        test[nombre] = new sqlite3.Database(base);
    }
     try{
            test[nombre].serialize(function() {
                scripts.forEach(function(script){
                    test[nombre].run(script,function(error,resultado){console.log(error,script)});
                });
            });
     }catch(error){
         console.log(error);
     }
    // return deferred.promise;
}

/**
    Ejecuta el script sql
*/
SqliteCliente.prototype.compararRegistros = function(nombre, sql){
    var deferred = Q.defer();
    try{
       if(!db[nombre]){
            db[nombre] = new sqlite3.Database(directorio+nombre);
           // db[nombre].configure("busyTimeout", 30000);
            db[nombre].run('PRAGMA busy_timeout = 20000');
             db[nombre].run('PRAGMA journal_mode = WAL');
        }
        try{
            db[nombre].serialize(function() {
                db[nombre].each(sql, function(err, row) {
                    if(row && row.TOTAL >=0){
                        deferred.resolve(row.TOTAL);
                    }else{
                        console.log("SqliteCliente.prototype.compararRegistros-->Error el script ", sql, nombre);
                        deferred.reject("Error el script "+sql);
                    }
                    
                });
            },function(error){
                deferred.reject(error);
            });
        }catch(error){
            deferred.reject(error);
        }
    }catch(error){
        deferred.reject(error);
    }
    return deferred.promise;
}



module.exports = SqliteCliente;
