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
var MongoClient = require('mongodb').MongoClient;
var db;
var localhost = "localhost";
var ClienteMongoDb = function () {this.init();};

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
ClienteMongoDb.prototype.grabar = function (collection, parametros, hash, resultado) {
      if(!parametros.fechaColeccion){
        parametros.fechaColeccion = new Date();
      }
      if(parametros.registros){
          parametros.hash = hash(parametros.registros);
      }
     // console.log("grabar ..."+(typeof hash === "function"));
      if(typeof hash === "function" && parametros.index>=0){
          var buscar={index:parametros.index, hash:parametros.hash};
          if(parametros.perfil){
              buscar.perfil=parametros.perfil;
          }
          db.collection(collection).findOne(buscar,{_id:1,registros:1,hash:1}, function(err, registro) {
               if(registro){
                   if(parametros.index == 1 && parametros.perfil == 102 && collection == "emcestadodecuenta"){
                       console.log("Registros ya existen por tal motivo no se han grabado collection "+collection+ " index "+parametros.index);
                       console.log(buscar);

                           console.log(registro.hash);
                            console.log(registro.registros[registro.registros.length-1]);
                            console.log("****************************");
                            console.log("****************************");
                            console.log(hash(registro.registros));
                           console.log(parametros.registros[parametros.registros.length-1]);


                   }


               }else{
                   delete buscar.hash;
                   //console.log(buscar);
                    db.collection(collection).findOne(buscar,{_id:1,registros:1}, function(err, registroEncontrado) {
                           if(registroEncontrado){
                               db.collection(collection).remove({_id:registroEncontrado._id,}, function(err, registroEliminado) {
                    //              console.log(" eliminado graband   ...index "+parametros.index + " del pefil "+parametros.perfil +"  collection "+ collection);
                                  parametros.sincronizar = getRegistrosPorSincronizar(registroEncontrado.registros, parametros.registros);
                                  /*Borramefor( var x in parametros.registros){
									if(parametros.registros[x].registroMovil.preimpreso === "018-900-000023548"){
										console.log("encontrado");
										console.log(parametros.registros[x].registroMovil);
									}

									//console.log("data.registros[x].registroMovil.retencioniva " + data.registros[x].registroMovil.retencioniva);
									//console.log("data.registros[x].registroMovil.retencionfuente " + data.registros[x].registroMovil.retencionfuente);

								 }
                                 */
                                   db.collection(collection).insertOne(parametros, function(err, docs) {

                                      if(err){
                                          console.log(err);
                                          resultado({error:true,mensaje:err});
                                          return;
                                      }
                                     resultado(docs);
                                   });
                               });
                           }else{
                    //           console.log("grabando   ...index "+parametros.index + " del pefil "+parametros.perfil +"  collection "+ collection);
                    /*Borrameforfor( var x in parametros.registros){
                      if(parametros.registros[x].registroMovil.preimpreso === "018-900-000023548"){
                          console.log("encontrado");
                          console.log(parametros.registros[x].registroMovil);
                      }

                      //console.log("data.registros[x].registroMovil.retencioniva " + data.registros[x].registroMovil.retencioniva);
                      //console.log("data.registros[x].registroMovil.retencionfuente " + data.registros[x].registroMovil.retencionfuente);

                  }*/
                               db.collection(collection).insertOne(parametros, function(err, docs) {
                                  if(err){
                                      console.log(collection);
                                      console.log(err);
                                      console.log(parametros);
                                      console.log(new Date());
                                      db.collection(collection).findOne({hash:parametros.hash}, function(err, registroEncontrado) {
                                           console.log("parametros******************");
                                           console.log(collection);
                                           console.log(registroEncontrado);
                                           console.log("parametros******************");
                                      });
                                      resultado({error:true,mensaje:err});
                                      return;
                                  }
                                 resultado(docs);
                               });
                           }

                    });

                   resultado("ya existe");
               }
          });

      }
      else{
          //console.log("grabar  2 ...");
          /*Borrameforfor( var x in parametros.registros){
            if(parametros.registros[x].registroMovil.preimpreso === "018-900-000023548"){
                console.log("encontrado en  grabar 2");
                console.log(parametros.registros[x].registroMovil);
            }

            //console.log("data.registros[x].registroMovil.retencioniva " + data.registros[x].registroMovil.retencioniva);
            //console.log("data.registros[x].registroMovil.retencionfuente " + data.registros[x].registroMovil.retencionfuente);

        }*/
          db.collection(collection).insertOne(parametros, function(err, docs) {
  			if(err){
  				console.log(err);
  				resultado({error:true,mensaje:err});
  				return;
  			}
  			resultado(docs);
          });
      }


};
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
ClienteMongoDb.prototype.modificar = function (collection, busqueda, actualizar, callback) {
       db.collection(collection).updateOne(
             busqueda,
             actualizar, function(err, results) {

             callback(results);
        });
};
ClienteMongoDb.prototype.dropCollection = function (collection, callback) {
       db.collection(collection).drop(function(err, results) {
           callback(results);
        });
};

ClienteMongoDb.prototype.getTotalRegistrosPorPerfiles = function (collections, parametros) {
    var deferred = Q.defer();
    var colecciones = [];
    console.log(collections);
    console.log(parametros);
    collections.map(function(col){

         console.log("collections");
         console.log(col);
        colecciones.push(getTotalRegistrosPorPerfil(col.coleccion, col.tabla, parametros));
    });
    Q.all(colecciones).then(function(a){
        deferred.resolve(a);
    });
   return deferred.promise;
};

function getTotalRegistrosPorPerfil(collection,tabla, parametros){
    var deferred = Q.defer();
    var grupo = {_id:"$identificacion"};
        grupo["SELECT COUNT(*) FROM "+tabla] ={$sum:{$size:"$registros"}};

        db.collection(collection).aggregate(
         [
           { $match: parametros},
           { $group: {$group:grupo} }
         ]).toArray(function(err, result) {
             console.log(result)
             deferred.resolve(result);
       });
   return deferred.promise;
}


function getRegistrosPorSincronizar(d, d1){
    return {eliminar : (d.filter(function(x){return d1.map(function(r){return r.registroMovil.hash;}).indexOf(x.registroMovil.hash)>=0?false:true;})).map(function(r){return r.registroMovil.hash;}),
            agregar :  (d1.filter(function(x){return d.map(function(r){return r.registroMovil.hash;}).indexOf(x.registroMovil.hash)>=0?false:true;}))
        };
}

module.exports = new ClienteMongoDb();
