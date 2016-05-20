/***************
Por favor leer la siguiente pagina
https://mongodb.github.io/node-mongodb-native/driver-articles/mongoclient.html
MongoClient connection pooling
A Connection Pool is a cache of database connections maintained by the driver
so that connections can be re-used when new connections to the database are required.
To reduce the number of connection pools created by your application, we recommend
calling MongoClient.connect once and reusing the database variable returned by the callback:
****************/
var mongodb = require('mongodb');
var Q = require('q');
var hash = require('object-hash');
var MongoClient = require('mongodb').MongoClient;
var db;
var localhost = "localhost";
var ClienteMongoDb = function () {this.init();};
var collectionErroresAlGrabar = "emcerrores";
ClienteMongoDb.prototype.init = function () {
    // Initialize connection once
    MongoClient.connect("mongodb://"+localhost+":27017/movilesTest", function(err, database) {
      if(err) { console.log("Error en MongoDb al iniciar la based de datos");throw err;}

      db = database;
      console.log("Listo Conectado");
    });
};
ClienteMongoDb.prototype.getRegistros = function (collection, parametros, resultado) {
        db.collection(collection).find(parametros).toArray(function(err, docs) {
             resultado(docs);
        });
};
/*ClienteMongoDb.prototype.getRegistros = function (collection, parametros, resultado) {
        db.collection(collection).find(parametros).toArray(function(err, docs) {
             resultado(docs);
        });
}*/
ClienteMongoDb.prototype.getRegistrosCustomColumnas = function (collection, parametros, customColumnas, resultado) {
       if(customColumnas){

           db.collection(collection).find(parametros, customColumnas).toArray(function(err, docs) {

                resultado(docs);
           });
       }else{
           db.collection(collection).find(parametros).toArray(function(err, docs) {
                resultado(docs);
           });
       }

};
ClienteMongoDb.prototype.getRegistrosCustomColumnasPorGrupo = function (collection, keys, condition, initial, reduce, finalize, resultado) {

          // group(keys, condition, initial, reduce, finalize, command[, options], callback)
          /*
          db.emcitems.group(    {
			      key:   { DESCRIPCION:1 },
			     cond:   { MPERFIL_ID: 147 },
                 reduce: function( curr, result ) {
	                              result.establecimientos.push(curr.MPERFILESTABLECIMIENTO_ID)
				   },
			    initial: {establecimientos:[] }
			}
        );
          */

           db.collection(collection).group(keys, condition, initial, reduce, finalize,function(err, docs) {
                resultado(docs);
           });


};

ClienteMongoDb.prototype.getRegistro = function (collection, parametros, resultado) {
        db.collection(collection).findOne(parametros, function(err, registro) {
             resultado(registro);
        });
};
ClienteMongoDb.prototype.getCount = function (collection, parametros, resultado) {
        db.collection(collection).count(parametros, function(err, total) {
             resultado(total);
        });
};
ClienteMongoDb.prototype.getRegistroCustomColumnas = function (collection, parametros, columnas, resultado) {
        db.collection(collection).findOne(parametros, columnas, function(err, registro) {
             resultado(registro);
        });
};

function existenciaDocumentoConRegistrosArray(collection, parametros){
    var deferred = Q.defer();
    db.collection(collection).findOne(parametros.buscar, parametros.columnas, function(err, registroA) {
         if(!registroA){
             delete parametros.buscar.hash;
             delete parametros.columnas.hash;
             db.collection(collection).findOne(parametros.buscar, parametros.columnas, function(err, registroB) {
                 if(registroB && registroB._id){
                     db.collection(collection).remove({_id:registroB._id,}, function(err, registroEliminado) {
                         deferred.resolve({encontrado:true,registros:registroB.registros});
                     });
                 }else{
                      deferred.resolve({encontrado:false});
                 }
             });
         }else{
             deferred.reject({mensaje:"Registro ya existe ",coleccion:collection, id:registroA._id});
         }

    });
    return deferred.promise;
}
function existenciaDocumentoConHash(collection, documentoPorInsertar){
    var deferred = Q.defer();
    var buscar = {"registroInterno.perfil":documentoPorInsertar.registroInterno.perfil};
    db.collection(collection).findOne({"registroInterno.perfil":documentoPorInsertar.registroInterno.perfil}, {_id:1, "registroMovil.hash":1}, function(err, documentoEncontrado) {
        //console.log(documentoEncontrado);
        if(err){
             deferred.reject({error:true,mensaje:err});
              return;
        }
        if(!documentoEncontrado){
             deferred.resolve({encontrado:false});
             return;
         }
         if(documentoEncontrado && documentoEncontrado.registroMovil.hash === documentoPorInsertar.registroMovil.hash){
             deferred.reject({yaexiste:true,mensaje:"Registro ya existe ",coleccion:collection, id:documentoEncontrado._id});
             return;
         }else{
             if(documentoEncontrado._id){
                 db.collection(collection).remove({_id:documentoEncontrado._id,}, function(err, registroEliminado) {
                     deferred.resolve({encontrado:true, hashPorEliminar:documentoEncontrado.registroMovil.hash});
                     return;
                 });
             }
         }



    });
    return deferred.promise;
}

function validarDocumentoConRegistroArray(collection, parametros){
    var deferred = Q.defer();
    var buscar;
    //Valida que el registros tenga presente las keys:
    //index y registros
    //Con este antes de enviar a grabar hace una busqueda del registro, para evitar duplicaciones
    if(parametros.index>=0 && Array.isArray(parametros.registros)){
            //Crear un hash del array registros, para hacerlo unico
            parametros.hash = hash(parametros.registros);
            //Parametros a buscar
            buscar={index:parametros.index, hash:parametros.hash};
            //si tiene perfil se agrega  a la busqueda
            if(parametros.perfil){
                buscar.perfil=parametros.perfil;
            }
            existenciaDocumentoConRegistrosArray(collection, {buscar:buscar, columnas:{_id:1,registros:1,hash:1}}). //Primera busqueda, Segunda busqueda y eliminacion del registro en la segunda busqueda
            then(function(r){
                if(r.encontrado){
                    parametros.sincronizar = getRegistrosPorSincronizarPorArrays(r.registros, parametros.registros);
                }
                deferred.resolve({grabar:true,documento:parametros});
            },function(x){
                deferred.reject(x);
            });
    }else{
        //Validad si el registro tiene un key registroInterno y registroInterno.perfil con el objetivo de buscarlo
        if(parametros.registroInterno && parametros.registroInterno.perfil && !parametros.index){

                existenciaDocumentoConHash(collection, parametros).
                then(function(r){
                    if(r.encontrado){
                        parametros.sincronizar = getRegistrosPorSincronizarPorDocumento(r.hashPorEliminar, {registroMovil:parametros.registroMovil});
                    }
                    deferred.resolve({grabar:true,documento:parametros});
                },function(x) {
                    if(x.error){
                        deferred.reject(x);
                    }else{
                        deferred.resolve({grabar:false, mensaje:x});
                    }
                });
        }else{
            deferred.resolve({grabar:true,documento:parametros});
        }


    }
    return deferred.promise;
}

ClienteMongoDb.prototype.grabar = function (collection, parametros) {
    var deferred = Q.defer();
    grabarQ(collection, parametros).then(function(r){
        if(r.estado){
            deferred.resolve(r);
        }else {
            deferred.reject(r);
        }

    },function(x){
        deferred.reject(x);
    });
     return deferred.promise;
};
function grabarErrores(error){
    var deferred = Q.defer();
    db.collection(collectionErroresAlGrabar).insertOne(error, function(err, docs) {
            deferred.resolve();
     });
     return deferred.promise;
}
ClienteMongoDb.prototype.grabarRegistrosDesdeMovil = function (collection, documento, resultado) {
    var deferred = Q.defer();
      if(!documento.fechaDocumento){
        documento.fechaDocumento = new Date();
      }
      if(documento.registroMovil){
          documento.hash = hash({a:documento.registroMovil,b:documento.perfil,c:documento.empresa});
     }
      db.collection(collection).insertOne(documento, function(err, docs) {
          if(err){
             grabarErrores({fecha:new Date(), metodo:"grabarRegistrosDesdeMovil", error:err, documento:documento});
             if(err.message  && err.message.indexOf("duplicate key")){
                 deferred.reject("Registro duplicado");
             }else{
                 deferred.reject(err);
             }
         }else {
             deferred.resolve(true);
         }
       });
     return deferred.promise;
};
function grabarQ(collection, parametros) {
    var deferred = Q.defer();
      if(!parametros.fechaColeccion){
        parametros.fechaColeccion = new Date();
      }

      validarDocumentoConRegistroArray(collection, parametros).
      then(function(resultado){

          if(resultado && resultado.grabar){
              db.collection(collection).insertOne(resultado.documento, function(err, docs) {
                  if(err){
                     deferred.notify({mensaje:err});
                 }else{
                      deferred.resolve({estado:true,docs:docs});
                 }
               });
          }else{
               deferred.resolve({estado:false,mensaje:resultado});
          }
      },function(x){
           deferred.reject({error:true,mensaje:x});
      });
     return deferred.promise;
}

ClienteMongoDb.prototype.grabarArray = function (collection, arrayJson, resultado) {

       db.collection(collection).insert(arrayJson, function(err, docs) {
			if(err){
				console.log(err);
				resultado({error:true,mensaje:err});
				return;
			}
			resultado(docs);
        });
};
ClienteMongoDb.prototype.grabarArrayQ = function(collection, arrayJson){
    var deferred = Q.defer();
    var registrosGrabados = [];
    arrayJson.forEach(function(d){
        registrosGrabados.push(grabarQ(collection, d));
    });
    Q.all(registrosGrabados).then(function(r){
        var nuevo = r.reduce(function(totales,a){
            if(a.estado){
                totales.grabados +=1;
            }else{
                totales.nograbados +=1;
                if(!totales.mensaje){
                    totales.mensaje = {};
                }
                totales.mensaje.yaexiste = a.mensaje.mensaje.yaexiste;
            }
            return totales;
        },{grabados:0,nograbados:0});
        deferred.resolve(nuevo);
    },function(x){
        deferred.reject("No se grabaron todos los registros");
    },function(x){
        deferred.notify(x);
    });
    return deferred.promise;
};
ClienteMongoDb.prototype.modificar = function (collection, busqueda, actualizar, callback) {
       db.collection(collection).updateOne(
             busqueda,
             actualizar, function(err, results) {

             callback(results);
        });
};
ClienteMongoDb.prototype.dropCollection = function (collection, callback) {
        console.log(collection);
       db.collection(collection).remove({},function(err, results) {
           callback(results);
        });
};

ClienteMongoDb.prototype.getTotalRegistrosPorPerfiles = function (collections, parametros) {
    var deferred = Q.defer();
    var colecciones = [];
     collections.forEach(function(col){
         if(!col.espejo && col.coleccion && col.tabla){
             colecciones.push(getTotalRegistrosPorPerfil(col.coleccion, col.tabla, col.diccionario ? {}:parametros));
         }

    });
    Q.all(colecciones).then(function(a){
        deferred.resolve(a);
    },function(x){
        deferred.resolve(x);
    });
   return deferred.promise;
};

function getTotalRegistrosPorPerfil(collection,tabla, parametros){
    var deferred = Q.defer();
    //db.emcdiccionarios.aggregate([{$project:{_id:"$index", d:{$size:"$registros"}}}])
    var grupo = {_id:"$identificacion"};
        grupo["SELECT COUNT(*) as total FROM "+tabla] ={$sum:{$size:"$registros"}};
        db.collection(collection).aggregate(
         [
           { $match: parametros},
           {$group:grupo}
         ]).toArray(function(err, result) {
             if(result && result[0]){
                 delete result[0]._id;
                 deferred.resolve(result[0]);
             }else{
                 deferred.reject(false);
             }

       });
   return deferred.promise;
}


function getRegistrosPorSincronizarPorArrays(d, d1){
    return  {eliminar : (d.filter(function(x){return d1.map(function(r){return r.registroMovil.hash;}).indexOf(x.registroMovil.hash)>=0?false:true;})).map(function(r){return r.registroMovil.hash;}),
            agregar :  (d1.filter(function(x){return d.map(function(r){return r.registroMovil.hash;}).indexOf(x.registroMovil.hash)>=0?false:true;}))
        };
}
function getRegistrosPorSincronizarPorDocumento(hash, documento){
    return  {eliminar : [hash],
            agregar :  [documento]
        };
}


module.exports = new ClienteMongoDb();
