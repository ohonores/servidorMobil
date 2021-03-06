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
var Binary = mongodb.Binary;
var Q = require('q');
var hash = require('object-hash');
var MongoClient = require('mongodb').MongoClient;
var db;
var localhost = "localhost";
var ClienteMongoDb = function () {this.init();};
var collectionErroresAlGrabar = "emcerrores";
ClienteMongoDb.prototype.Binary = function () {
        return Binary;
}
ClienteMongoDb.prototype.init = function () {
    // Initialize connection once  movilesTestBackSqlite  movilesDB
    MongoClient.connect("mongodb://localhost:27017/movilesTestBackSqlite", function(err, database) {
   //MongoClient.connect("mongodb://localhost:27017/swisssmart?replicaSet=otros", function(err, database) {
      if(err) { console.log("Error en MongoDb al iniciar la based de datos");throw err;}

      db = database;
      console.log("Listo Conectado");
    });
};
ClienteMongoDb.prototype.crearIndices = function (collection, index) {
	var deferred = Q.defer();
	console.log(index);
	if(index.unique){
		 delete index.unique;
		 console.log(index);
		 db.collection(collection).createIndex(index,{unique:true}, function(err, docs) {
				if(err){
					deferred.reject(err);
				}else{
					deferred.resolve(true);
				}
				 
		  });
	}else{
		db.collection(collection).ensureIndex(index, function(err, docs) {
			if(err){
				deferred.reject(err);
			}else{
				deferred.resolve(true);
			}
             
		});
	}
	return deferred.promise;
}

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
ClienteMongoDb.prototype.getRegistrosCustomColumnasOrdenLimite = function (collection, parametros, customColumnas, sort, limite, resultado) {
       if(customColumnas && sort && limite){
           db.collection(collection).find(parametros, customColumnas).sort(sort).limit(limite).toArray(function(err, docs) {

                resultado(docs);
           });
       }else  if(customColumnas && sort && !limite){
           db.collection(collection).find(parametros, customColumnas).sort(sort).toArray(function(err, docs) {
               resultado(docs);
           });
       }else if(customColumnas && sort && !limite){
            db.collection(collection).find(parametros, customColumnas).limit(limite).toArray(function(err, docs) {
               resultado(docs);
           });
       }else{
            db.collection(collection).find(parametros).toArray(function(err, docs) {
                resultado(docs);
           });
       }

};
ClienteMongoDb.prototype.getRegistrosCustomColumnasPorGrupo = function (collection, keys, condition, initial, reduce, finalize, resultado) {
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

function existenciaDocumentoConRegistrosArray(collection, parametros, new_registros){
    var deferred = Q.defer();
    
   
    db.collection(collection).findOne(parametros.buscar, parametros.columnas, function(err, registroEncontrado) {
         if(!registroEncontrado){
             //Si el registro no es encontrado con el perfil, hash e index, se hace una nueva busqueda pero solo con el index u perfil
             delete parametros.buscar.hash;
             delete parametros.columnas.hash;
             db.collection(collection).findOne(parametros.buscar, parametros.columnas, function(err, registroB) {
                 if(registroB && registroB._id){

                    //console.log(" grabado ",registroB.registros[0]," contra nuevo ", new_registros[0]);
                      //console.log(registroEncontrado.hash);
                    var sincronizar = getRegistrosPorSincronizarPorArrays(registroB.registros, new_registros);
                    if(!(sincronizar && sincronizar.eliminar && sincronizar.eliminar.length==0 &&  sincronizar.agregar && sincronizar.agregar.length==0)){
                        db.collection(collection).remove({_id:registroB._id,}, function(err, registroEliminado) {
                            
                            if(registroEliminado){
                                deferred.resolve({encontrado:true, sincronizar:sincronizar});
                            }else{
                               if(err){
                                    deferred.reject({mensaje:"Registro no pudo ser elimiando ", coleccion:collection, id:registroB._id, problemasEliminar:true, error:err});
                                }else{
                                    deferred.reject({mensaje:"Registro no pudo ser elimiando ", coleccion:collection, id:registroB._id, problemasEliminar:true});
                                } 
                            }
                            
                        });
                    }else{
                       // console.log("2 no econtrado", parametros.buscar, collection);
                        //console.log(registroEncontrado.hash);
                        deferred.reject({mensaje:"Registro ya existe ",coleccion:collection, id:registroB._id, existe:true});
                    }
                
                     
                 }else{
                     deferred.resolve({encontrado:false});
                 }
             });
         }else{
             //console.log("Registro ya existe ",parametros.buscar);
            
             deferred.reject({mensaje:"Registro ya existe ",coleccion:collection, id:registroEncontrado._id, existe:true});
         }

    });
    return deferred.promise;
}
function existenciaDocumentoConHash(collection, documentoPorInsertar){
    var deferred = Q.defer();
    var buscar = {"registroInterno.perfil":documentoPorInsertar.registroInterno.perfil};
    db.collection(collection).findOne({"registroInterno.perfil":documentoPorInsertar.registroInterno.perfil}, {_id:1, "registroMovil.hash":1}, function(err, documentoEncontrado) {
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

function validarDocumentoConRegistroArray(collection, parametros, grabarSinValidarExistencia){
    var deferred = Q.defer();
    var buscar;
    if(grabarSinValidarExistencia === true){
         deferred.resolve({grabar:true,documento:parametros});
         return deferred.promise;
    }
    //Valida que el registros tenga presente las keys:
    //index y registros
    //Con este antes de enviar a grabar hace una busqueda del registro, para evitar duplicaciones
    if(parametros.index>=0 && Array.isArray(parametros.registros)){
            //Crear un hash del array registros, para hacerlo unico
            //parametros.hash = parametros.hash; este ya existe 
            //Parametros a buscar
            buscar={index:parametros.index, hash:parametros.hash};
            //si tiene perfil se agrega  a la busqueda
            if(parametros.perfil){
                buscar.perfil = parametros.perfil;
            }
            existenciaDocumentoConRegistrosArray(collection, {buscar:buscar, columnas:{_id:1,registros:1,hash:1}}, parametros.registros). //Primera busqueda, Segunda busqueda y eliminacion del registro en la segunda busqueda
            then(function(r){
                if(r.encontrado === true && r.sincronizar){
                    console.log("Econtrado listo para actualizar", collection);
                    parametros.sincronizar = r.sincronizar;
                    parametros.sincronizar["codigo"] = new Date().getTime();
                }
                deferred.resolve({grabar:true,documento:parametros,encontrado:r.encontrado, sincronizado:r.sincronizar?true:false});
            },function(x){
                deferred.reject(x);
            });
    }else{
        //Valida si el registro tiene un key registroInterno y registroInterno.perfil con el objetivo de buscarlo
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
            if(!parametros.index && Array.isArray(parametros.registros)){
                deferred.resolve({grabar:false, mensaje:"Contiene registros pero no contiene el index"});
            }else{
                 deferred.resolve({grabar:true,documento:parametros});
            }
           
        }


    }
    return deferred.promise;
}

ClienteMongoDb.prototype.grabar = function (collection, parametros, grabarSinValidarExistencia) {
    var deferred = Q.defer();
   
    grabarQ(collection, parametros, grabarSinValidarExistencia).then(function(r){
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
ClienteMongoDb.prototype.grabarRegistroIndividual = function (collection, parametros) {
    var deferred = Q.defer();
	var claveacc = parametros.claveacceso;
	var importeTotal = parametros.importeTotal;
	delete parametros.claveacceso;
    db.collection(collection).insertOne(parametros, function(err, docs) {
                  if(err){
					var arrayDocumentos = "";
					console.log("ruc y doc ",(claveacc.substring(10,23)+"."+claveacc.substring(8,10)));
					switch(claveacc.substring(10,23)+"."+claveacc.substring(8,10)){
						case '0990018707001.01':
							console.log("entro................");
							db.collection(collection).updateOne(
								 {identificacion:parametros.identificacion},
								 //{$push:{"documentosRecibidosEcuaquimica":{empresa:"0990018707001",codDoc:"01",fechaemision:claveacc.substring(0,8),claveacceso:claveacc}}}, function(err1, results) {
								 {$push:{"documentosRecibidos.0990018707001.04":{fechaemision:claveacc.substring(0,8),claveacceso:claveacc}}}, function(err1, results) {
								 if(err1){
									console.log("Error 1",err1)
								 }
								 deferred.resolve({estado:true,docs:docs});
							});
						break;
						case '0990018707001.04':
							db.collection(collection).updateOne(
								 {identificacion:parametros.identificacion},
								 {$push:{"documentosRecibidos.0990018707001.04":{fechaemision:claveacc.substring(0,8),claveacceso:claveacc}}}, function(err1, results) {
									 if(err1){
									console.log("Error 1",err1)
								 }
								 deferred.resolve({estado:true,docs:docs});
							});
						break;
						case '0990018707001.05':
							db.collection(collection).updateOne(
								 {identificacion:parametros.identificacion},
								 {$push:{"documentosRecibidos.0990018707001.05":{fechaemision:claveacc.substring(0,8),claveacceso:claveacc}}}, function(err1, results) {
									 if(err1){
									console.log("Error 1",err1)
								 }
								 deferred.resolve({estado:true,docs:docs});
							});
						break;
						case '0990018707001.06':
							db.collection(collection).updateOne(
								 {identificacion:parametros.identificacion},
								 {$push:{"documentosRecibidos.0990018707001.06":{fechaemision:claveacc.substring(0,8),claveacceso:claveacc}}}, function(err1, results) {
									 if(err1){
									console.log("Error 1",err1)
								 }
								 deferred.resolve({estado:true,docs:docs});
							});
						break;
						case '0990018707001.07':
							db.collection(collection).updateOne(
								 {identificacion:parametros.identificacion},
								 {$push:{"documentosRecibidos.0990018707001.07":{fechaemision:claveacc.substring(0,8),claveacceso:claveacc}}}, function(err1, results) {
									 if(err1){
									console.log("Error 1",err1)
								 }
								 deferred.resolve({estado:true,docs:docs});
							});
						break;
						
						
						
						case '0991076409001.01':
							db.collection(collection).updateOne(
								 {identificacion:parametros.identificacion},
								 {$push:{"documentosRecibidos.0991076409001.01":{fechaemision:claveacc.substring(0,8),claveacceso:claveacc}}}, function(err1, results) {
									 if(err1){
									console.log("Error 1",err1)
								 }
								 deferred.resolve({estado:true,docs:docs});
							});
						break;
						case '0991076409001.04':
							db.collection(collection).updateOne(
								 {identificacion:parametros.identificacion},
								 {$push:{"documentosRecibidos.0991076409001.04":{fechaemision:claveacc.substring(0,8),claveacceso:claveacc}}}, function(err1, results) {
								 if(err1){
									console.log("Error 1",err1)
								 }
								 deferred.resolve({estado:true,docs:docs});
							});
						break;
						case '0991076409001.05':
							db.collection(collection).updateOne(
								 {identificacion:parametros.identificacion},
								 {$push:{"documentosRecibidos.0991076409001.05":{fechaemision:claveacc.substring(0,8),claveacceso:claveacc}}}, function(err1, results) {
								 if(err1){
									console.log("Error 1",err1)
								 }
								 deferred.resolve({estado:true,docs:docs});
							});
						break;
						case '0991076409001.06':
							db.collection(collection).updateOne(
								 {identificacion:parametros.identificacion},
								 {$push:{"documentosRecibidos.0991076409001.06":{fechaemision:claveacc.substring(0,8),claveacceso:claveacc}}}, function(err1, results) {
								 if(err1){
									console.log("Error 1",err1)
								 }
								 deferred.resolve({estado:true,docs:docs});
							});
						break;
						case '0991076409001.07':
							db.collection(collection).updateOne(
								 {identificacion:parametros.identificacion},
								 {$push:{"documentosRecibidos.0991076409001.07":{fechaemision:claveacc.substring(0,8),claveacceso:claveacc}}}, function(err1, results) {
								 if(err1){
									console.log("Error 1",err1)
								 }
								 deferred.resolve({estado:true,docs:docs});
							});
						break;
						
						
						case '0991076395001.01':
							db.collection(collection).updateOne(
								 {identificacion:parametros.identificacion},
								 {$push:{"documentosRecibidos.0991076395001.01":{fechaemision:claveacc.substring(0,8),claveacceso:claveacc}}}, function(err1, results) {
									 if(err1){
									console.log("Error 1",err1)
								 }
								 deferred.resolve({estado:true,docs:docs});
							});
						break;
						case '0991076395001.04':
							db.collection(collection).updateOne(
								 {identificacion:parametros.identificacion},
								 {$push:{"documentosRecibidos.0991076395001.04":{fechaemision:claveacc.substring(0,8),claveacceso:claveacc}}}, function(err1, results) {
								 if(err1){
									console.log("Error 1",err1)
								 }
								 deferred.resolve({estado:true,docs:docs});
							});
						break;
						case '0991076395001.05':
							db.collection(collection).updateOne(
								 {identificacion:parametros.identificacion},
								 {$push:{"documentosRecibidos.0991076395001.05":{fechaemision:claveacc.substring(0,8),claveacceso:claveacc}}}, function(err1, results) {
									 if(err1){
									console.log("Error 1",err1)
								 }
								 deferred.resolve({estado:true,docs:docs});
							});
						break;
						case '0991076395001.06':
							db.collection(collection).updateOne(
								 {identificacion:parametros.identificacion},
								 {$push:{"documentosRecibidos.0991076395001.06":{fechaemision:claveacc.substring(0,8),claveacceso:claveacc}}}, function(err1, results) {
								 if(err1){
									console.log("Error 1",err1)
								 }
								 deferred.resolve({estado:true,docs:docs});
							});
						break;
						case '0991076395001.07':
							db.collection(collection).updateOne(
								 {identificacion:parametros.identificacion},
								 {$push:{"documentosRecibidos.0991076395001.07":{fechaemision:claveacc.substring(0,8),claveacceso:claveacc}}}, function(err1, results) {
								 if(err1){
									console.log("Error 1",err1)
								 }
								 deferred.resolve({estado:true,docs:docs});
							});
						break;
						
						
						
						case '0992448334001.01':
							db.collection(collection).updateOne(
								 {identificacion:parametros.identificacion},
								 {$push:{"documentosRecibidos.0992448334001.01":{fechaemision:claveacc.substring(0,8),claveacceso:claveacc}}}, function(err1, results) {
								 if(err1){
									console.log("Error 1",err1)
								 }
								 deferred.resolve({estado:true,docs:docs});
							});
						break;
						case '0992448334001.04':
							db.collection(collection).updateOne(
								 {identificacion:parametros.identificacion},
								 {$push:{"documentosRecibidos.0992448334001.04":{fechaemision:claveacc.substring(0,8),claveacceso:claveacc}}}, function(err1, results) {
									 if(err1){
									console.log("Error 1",err1)
								 }
								 deferred.resolve({estado:true,docs:docs});
							});
						break;
						case '0992448334001.05':
							db.collection(collection).updateOne(
								 {identificacion:parametros.identificacion},
								 {$push:{"documentosRecibidos.0992448334001.05":{fechaemision:claveacc.substring(0,8),claveacceso:claveacc}}}, function(err1, results) {
									 if(err1){
									console.log("Error 1",err1)
								 }
								 deferred.resolve({estado:true,docs:docs});
							});
						break;
						case '0992448334001.06':
							db.collection(collection).updateOne(
								 {identificacion:parametros.identificacion},
								 {$push:{"documentosRecibidos.0992448334001.06":{fechaemision:claveacc.substring(0,8),claveacceso:claveacc}}}, function(err1, results) {
									 if(err1){
									console.log("Error 1",err1)
								 }
								 deferred.resolve({estado:true,docs:docs});
							});
						break;
						case '0992448334001.07':
							db.collection(collection).updateOne(
								 {identificacion:parametros.identificacion},
								 {$push:{"documentosRecibidos.0992448334001.07":{fechaemision:claveacc.substring(0,8),claveacceso:claveacc}}}, function(err1, results) {
										 if(err1){
									console.log("Error 1",err1)
								 }
								 deferred.resolve({estado:true,docs:docs});
							});
						break;
						
						
						case '0990018901001.01':
							db.collection(collection).updateOne(
								 {identificacion:parametros.identificacion},
								 {$push:{"documentosRecibidos.0990018901001.01":{fechaemision:claveacc.substring(0,8),claveacceso:claveacc}}}, function(err1, results) {
									 if(err1){
									console.log("Error 1",err1)
								 }
								 deferred.resolve({estado:true,docs:docs});
							});
						break;
						case '0990018901001.04':
							db.collection(collection).updateOne(
								 {identificacion:parametros.identificacion},
								 {$push:{"documentosRecibidos.0990018901001.04":{fechaemision:claveacc.substring(0,8),claveacceso:claveacc}}}, function(err1, results) {
									 if(err1){
									console.log("Error 1",err1)
								 }
								 deferred.resolve({estado:true,docs:docs});
							});
						break;
						case '0990018901001.05':
							db.collection(collection).updateOne(
								 {identificacion:parametros.identificacion},
								 {$push:{"documentosRecibidos.0990018901001.05":{fechaemision:claveacc.substring(0,8),claveacceso:claveacc}}}, function(err1, results) {
								 if(err1){
									console.log("Error 1",err1)
								 }
								 deferred.resolve({estado:true,docs:docs});
							});
						break;
						case '0990018901001.06':
							db.collection(collection).updateOne(
								 {identificacion:parametros.identificacion},
								 {$push:{"documentosRecibidos.0990018901001.06":{fechaemision:claveacc.substring(0,8),claveacceso:claveacc}}}, function(err1, results) {
									 if(err1){
									console.log("Error 1",err1)
								 }
								 deferred.resolve({estado:true,docs:docs});
							});
						break;
						case '0990018901001.07':
							db.collection(collection).updateOne(
								 {identificacion:parametros.identificacion},
								 {$push:{"documentosRecibidos.0990018901001.07":{fechaemision:claveacc.substring(0,8),claveacceso:claveacc}}}, function(err1, results) {
								 if(err1){
									console.log("Error 1",err1)
								 }
								 deferred.resolve({estado:true,docs:docs});
							});
						break;
						
						
						case '0990018677001.01':
							db.collection(collection).updateOne(
								 {identificacion:parametros.identificacion},
								 {$push:{"documentosRecibidos.0990018677001.01":{fechaemision:claveacc.substring(0,8),claveacceso:claveacc}}}, function(err1, results) {
								 if(err1){
									console.log("Error 1",err1)
								 }
								 deferred.resolve({estado:true,docs:docs});
							});
						break;
						case '0990018677001.04':
							db.collection(collection).updateOne(
								 {identificacion:parametros.identificacion},
								 {$push:{"documentosRecibidos.0990018677001.04":{fechaemision:claveacc.substring(0,8),claveacceso:claveacc}}}, function(err1, results) {
									 if(err1){
									console.log("Error 1",err1)
								 }
								 deferred.resolve({estado:true,docs:docs});
							});
						break;
						case '0990018677001.05':
							db.collection(collection).updateOne(
								 {identificacion:parametros.identificacion},
								 {$push:{"documentosRecibidos.0990018677001.05":{fechaemision:claveacc.substring(0,8),claveacceso:claveacc}}}, function(err1, results) {
									 if(err1){
									console.log("Error 1",err1)
								 }
								 deferred.resolve({estado:true,docs:docs});
							});
						break;
						case '0990018677001.06':
							db.collection(collection).updateOne(
								 {identificacion:parametros.identificacion},
								 {$push:{"documentosRecibidos.0990018677001.06":{fechaemision:claveacc.substring(0,8),claveacceso:claveacc}}}, function(err1, results) {

								 deferred.resolve({estado:true,docs:docs});
							});
						break;
						case '0990018677001.07':
							db.collection(collection).updateOne(
								 {identificacion:parametros.identificacion},
								 {$push:{"documentosRecibidos.0990018677001.07":{fechaemision:claveacc.substring(0,8),claveacceso:claveacc}}}, function(err1, results) {
								 if(err1){
									console.log("Error 1",err1)
								 }
								 deferred.resolve({estado:true,docs:docs});
							});
						break;
						
						
						case '0992667753001.01':
							db.collection(collection).updateOne(
								 {identificacion:parametros.identificacion},
								 {$push:{"documentosRecibidos.0992667753001.01":{fechaemision:claveacc.substring(0,8),claveacceso:claveacc}}}, function(err1, results) {
									 if(err1){
									console.log("Error 1",err1)
								 }
								 deferred.resolve({estado:true,docs:docs});
							});
						break;
						case '0992667753001.04':
							db.collection(collection).updateOne(
								 {identificacion:parametros.identificacion},
								 {$push:{"documentosRecibidos.0992667753001.04":{fechaemision:claveacc.substring(0,8),claveacceso:claveacc}}}, function(err1, results) {
									 if(err1){
									console.log("Error 1",err1)
								 }
								 deferred.resolve({estado:true,docs:docs});
							});
						break;
						case '0992667753001.05':
							db.collection(collection).updateOne(
								 {identificacion:parametros.identificacion},
								 {$push:{"documentosRecibidos.0992667753001.05":{fechaemision:claveacc.substring(0,8),claveacceso:claveacc}}}, function(err1, results) {
											 if(err1){
									console.log("Error 1",err1)
								 }
								 deferred.resolve({estado:true,docs:docs});
							});
						break;
						case '0992667753001.06':
							db.collection(collection).updateOne(
								 {identificacion:parametros.identificacion},
								 {$push:{"documentosRecibidos.0992667753001.06":{fechaemision:claveacc.substring(0,8),claveacceso:claveacc}}}, function(err1, results) {
									 if(err1){
									console.log("Error 1",err1)
								 }
								 deferred.resolve({estado:true,docs:docs});
							});
						break;
						case '0992667753001.07':
							db.collection(collection).updateOne(
								 {identificacion:parametros.identificacion},
								 {$push:{"documentosRecibidos.0992667753001.07":{fechaemision:claveacc.substring(0,8),claveacceso:claveacc}}}, function(err1, results) {
									 if(err1){
									console.log("Error 1",err1)
								 }
								 deferred.resolve({estado:true,docs:docs});
							});
						break;
						
						
						case '0992237600001.01':
							db.collection(collection).updateOne(
								 {identificacion:parametros.identificacion},
								 {$push:{"documentosRecibidos.0992237600001.01":{fechaemision:claveacc.substring(0,8),claveacceso:claveacc}}}, function(err1, results) {
									 if(err1){
									console.log("Error 1",err1)
								 }
								 deferred.resolve({estado:true,docs:docs});
							});
						break;
						case '0992237600001.04':
							db.collection(collection).updateOne(
								 {identificacion:parametros.identificacion},
								 {$push:{"documentosRecibidos.0992237600001.04":{fechaemision:claveacc.substring(0,8),claveacceso:claveacc}}}, function(err1, results) {
								 if(err1){
									console.log("Error 1",err1)
								 }
								 deferred.resolve({estado:true,docs:docs});
							});
						break;
						case '0992237600001.05':
							db.collection(collection).updateOne(
								 {identificacion:parametros.identificacion},
								 {$push:{"documentosRecibidos.0992237600001.05":{fechaemision:claveacc.substring(0,8),claveacceso:claveacc}}}, function(err1, results) {
									 if(err1){
									console.log("Error 1",err1)
								 }
								 deferred.resolve({estado:true,docs:docs});
							});
						break;
						case '0992237600001.06':
							db.collection(collection).updateOne(
								 {identificacion:parametros.identificacion},
								 {$push:{"documentosRecibidos.0992237600001.06":{fechaemision:claveacc.substring(0,8),claveacceso:claveacc}}}, function(err1, results) {
								 if(err1){
									console.log("Error 1",err1)
								 }
								 deferred.resolve({estado:true,docs:docs});
							});
						break;
						case '0992237600001.07':
							db.collection(collection).updateOne(
								 {identificacion:parametros.identificacion},
								 {$push:{"documentosRecibidos.0992237600001.07":{fechaemision:claveacc.substring(0,8),claveacceso:claveacc}}}, function(err1, results) {
									 if(err1){
									console.log("Error 1",err1)
								 }
								 deferred.resolve({estado:true,docs:docs});
							});
						break;
						
						
						case '0992637846001.01':
							db.collection(collection).updateOne(
								 {identificacion:parametros.identificacion},
								 {$push:{"documentosRecibidos.0992637846001.01":{fechaemision:claveacc.substring(0,8),claveacceso:claveacc}}}, function(err1, results) {
										 if(err1){
									console.log("Error 1",err1)
								 }
								 deferred.resolve({estado:true,docs:docs});
							});
						break;
						case '0992637846001.04':
							db.collection(collection).updateOne(
								 {identificacion:parametros.identificacion},
								 {$push:{"documentosRecibidos.0992637846001.04":{fechaemision:claveacc.substring(0,8),claveacceso:claveacc}}}, function(err1, results) {
								 if(err1){
									console.log("Error 1",err1)
								 }
								 deferred.resolve({estado:true,docs:docs});
							});
						break;
						case '0992637846001.05':
							db.collection(collection).updateOne(
								 {identificacion:parametros.identificacion},
								 {$push:{"documentosRecibidos.0992637846001.05":{fechaemision:claveacc.substring(0,8),claveacceso:claveacc}}}, function(err1, results) {
									 if(err1){
									console.log("Error 1",err1)
								 }
								 deferred.resolve({estado:true,docs:docs});
							});
						break;
						case '0992637846001.06':
							db.collection(collection).updateOne(
								 {identificacion:parametros.identificacion},
								 {$push:{"documentosRecibidos.0992637846001.06":{fechaemision:claveacc.substring(0,8),claveacceso:claveacc}}}, function(err1, results) {
									 if(err1){
									console.log("Error 1",err1)
								 }
								 deferred.resolve({estado:true,docs:docs});
							});
						break;
						case '0992637846001.07':
							db.collection(collection).updateOne(
								 {identificacion:parametros.identificacion},
								 {$push:{"documentosRecibidos.0992637846001.07":{fechaemision:claveacc.substring(0,8),claveacceso:claveacc}}}, function(err1, results) {
								 if(err1){
									console.log("Error 1",err1)
								 }
								 deferred.resolve({estado:true,docs:docs});
							});
						break;
						
						
					}
                     console.log(err);
					 var ddd = {}
					 ddd["documentosRecibidos"] = {};
					 ddd["documentosRecibidos"][claveacc.substring(10,23)]= {};
					 ddd["documentosRecibidos"][claveacc.substring(10,23)][claveacc.substring(8,10)] = {};
					 ddd["documentosRecibidos"][claveacc.substring(10,23)][claveacc.substring(8,10)][claveacc.substring(0,8)] = {claveacceso:claveacc};
					 
					 
				 }
				 deferred.resolve({estado:true,docs:docs});
     });
     return deferred.promise;
};
ClienteMongoDb.prototype.grabarRegistroGrupo = function (collection, parametros) {
    var deferred = Q.defer();
    db.collection(collection).insert(parametros, function(err, docs) {
                  if(err){
					 console.log("Error ",err);
                     console.log(err);
                 }
				 deferred.resolve({estado:true,docs:docs});
     });
     return deferred.promise;
};
ClienteMongoDb.prototype.grabarErroresMobiles = function (error) {
   var deferred = Q.defer();
    db.collection(collectionErroresAlGrabar).insertOne(error, function(err, docs) {
            deferred.resolve();
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
ClienteMongoDb.prototype.grabarRegistro = function (collection, documento) {
    var deferred = Q.defer();
      if(!documento.fechaDocumento){
        documento.fechaDocumento = new Date();
      }
      db.collection(collection).insertOne(documento, function(err, docs) {
          if(err){
            deferred.reject(err);
         }else {
             deferred.resolve(true);
         }
       });
     return deferred.promise;
};

ClienteMongoDb.prototype.grabarRegistrosDesdeMovil = function (collection, documento, resultado) {
    var deferred = Q.defer();
      if(!documento.fechaDocumento){
        documento.fechaDocumento = new Date();
      }
      if(documento.registroMovil){
          var dupiclado = JSON.parse(JSON.stringify(documento.registroMovil));
          delete dupiclado.id;
          documento.hash = hash({a:dupiclado, c:documento.empresa, dispositivo:documento.registroMovil.dispositivo});
     }
      db.collection(collection).insertOne(documento, function(err, docs) {
          if(err){
             grabarErrores({fecha:new Date(), metodo:"grabarRegistrosDesdeMovil", error:err, documento:documento});
             if(err.message  && err.message.indexOf("duplicate key")){
                 deferred.resolve({duplicado:true,mensaje:"Registro duplicado"});
             }else{
                 deferred.reject(err);
             }
         }else {
             deferred.resolve({estado:true, hash : documento.hash});
         }
       });
     return deferred.promise;
};



function grabarQ(collection, parametros, grabarSinValidarExistencia) {
    var deferred = Q.defer();
      if(!parametros.fechaColeccion){
        parametros.fechaColeccion = new Date();
      }
      validarDocumentoConRegistroArray(collection, parametros, grabarSinValidarExistencia).
          then(function(resultado){
              if(resultado && resultado.grabar === true ){
                  db.collection(collection).insertOne(resultado.documento, function(err, docs) {
                    if(err){
                        console.log(err);
                        deferred.reject({error:true,mensaje:err});
                     }else{
                         // console.log("grabarQ", collection,grabarSinValidarExistencia);
                          deferred.resolve({estado:true,docs:docs,resultado:resultado});
                     }
                   });
              }else{
                  console.log(resultado);
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
        deferred.reject("No se grabaron todos los registros",x);
    },function(x){
        deferred.notify(x);
    });
    return deferred.promise;
};
ClienteMongoDb.prototype.modificar = function (collection, busqueda, actualizar, callback) {
    db.collection(collection).updateOne(
             busqueda,
             actualizar, function(err, results) {
           if(err){
                console.log("error ",err, "usqueda",busqueda, actualizar);
            }
             callback(results);
        });


};

ClienteMongoDb.prototype.modificarOinsertar = function (collection, busqueda, actualizar, callback) {

         db.collection(collection).updateOne(
             busqueda,
             actualizar,{ upsert: true }, function(err, results) {
            if(err){
                console.log("error ",err, "usqueda",busqueda, actualizar);
            }

             callback(results);
        });



};



ClienteMongoDb.prototype.dropCollection = function (collection, callback) {
       db.collection(collection).remove({},function(err, results) {
           callback(results);
        });
};
ClienteMongoDb.prototype.dropCollectionElemento = function (collection, parametro, callback) {
       db.collection(collection).remove(parametro,function(err, results) {
           callback(results);
        });
};

ClienteMongoDb.prototype.getTotalRegistrosPorPerfiles = function (collections, parametros) {
    var deferred = Q.defer();
    var colecciones = [];
    for(var i=0;i<collections.length;i++){
         if(!collections[i].espejo && collections[i].coleccion && collections[i].tabla){
             colecciones.push(getTotalRegistrosPorPerfil(collections[i].coleccion, collections[i].tabla, collections[i].diccionario ? {}:parametros));
         }
    }
    /* collections.forEach(function(col){
        

    });*/
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
                  var dd={};
                 dd["SELECT COUNT(*) as total FROM "+tabla] = 0;
                 deferred.resolve(dd);
                 console.log("collection error en ",collection);
                console.log("tabla error en ",tabla);
                console.log("parametros error en ",parametros);
               // deferred.reject({colecion:collection, mensaje:"No se econtraron registros relacionados",parametros:parametros});
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
