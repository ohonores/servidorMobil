var sqlite3 = require('sqlite3').verbose();
var Q = require('q');

var directorio = "";
var SqliteCliente = function(directorio_){
    directorio = directorio_;
}
SqliteCliente.prototype.crearTablas = function(nombreBaseDatos, scriptsTablas){
    var deferred = Q.defer();
    console.log("crearTablas",nombreBaseDatos);
    try{
        var db = new sqlite3.Database(directorio+nombreBaseDatos);
        try{
            db.serialize(function() {

                scriptsTablas.forEach(function(scriptTabla){
                    db.run(scriptTabla);
                })


            });
        }catch(error){
            deferred.reject(error);
        }
        db.close();
        deferred.resolve(true);
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
/*
insertarRegistros { [Error: SQLITE_CONSTRAINT: UNIQUE constraint failed: emovtafecta.id] errno: 19, code: 'SQLITE_CONSTRAINT' }
insertarRegistros { [Error: SQLITE_CONSTRAINT: UNIQUE constraint failed: emovtafecta.id] errno: 19, code: 'SQLITE_CONSTRAINT' }
insertarRegistros { [Error: SQLITE_CONSTRAINT: UNIQUE constraint failed: emovtafecta.id] errno: 19, code: 'SQLITE_CONSTRAINT' }

*/
SqliteCliente.prototype.insertarRegistros = function(nombre, tabla, arrayDeRegistros){
    var deferred = Q.defer();
    var padre = this;
    try{
        if(!db[nombre]){

             db[nombre] = new sqlite3.Database(directorio+nombre);
        }
        try{
            db[nombre].serialize(function() {
                var stmt = db[nombre].prepare(padre.getSqlInsercion(arrayDeRegistros[0].registroMovil, tabla));


                arrayDeRegistros.forEach(function(registro){

                    stmt.run(padre.getValoresPorInsertar(registro.registroMovil),function(error, resultado){
                        if(error){
                            console.log("insertarRegistros",error)
                        }

                    });
                })
                stmt.finalize();

            });
        }catch(error){
            // db[nombre].close();
            deferred.reject(error);
        }
        waitSeconds(1000);

        deferred.resolve(true);

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
var test = {}
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
SqliteCliente.prototype.comporarRegistros = function(nombreActual, nombreNueva, tabla){
    var deferred = Q.defer();
    var padre = this;
    try{
       var actual = new sqlite3.Database(nombreActual);
       var nueva = new sqlite3.Database(nombreNueva);

        try{
            actual.serialize(function() {

             actual.each("SELECT hash FROM #tabla".replace("#tabla",tabla), function(err, row) {
                  console.log(row.id + ": " + row.info);

                     nueva.serialize(function() {
                         nueva.each("SELECT id FROM #tabla WHERE hash=?1".replace("#tabla",tabla),[] , function(err, row) {
                              console.log(row.id + ": " + row.info);
                          });
                     });


              });


            });
        }catch(error){
            // db[nombre].close();
            deferred.reject(error);
        }
        waitSeconds(1000);

        deferred.resolve(true);

    }catch(error){
         //db[nombre].close();
        deferred.reject(error);
    }
    return deferred.promise;
}



module.exports = SqliteCliente;
