/* Copyright (c) 2015, Oracle and/or its affiliates. All rights reserved. */

/******************************************************************************
 *
 * You may not use the identified files except in compliance with the Apache
 * License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * NAME
 *   webapp.js
 *
 * DESCRIPTION
 *   Shows a web based query using connections from connection pool.
 *
 *   This displays a table of employees in the specified department.
 *
 *   The script creates an HTTP server listening on port 7000 and
 *   accepts a URL parameter for the department ID, for example:
 *   http://localhost:7000/90
 *
 *   Uses Oracle's sample HR schema.  Scripts to create the HR schema
 *   can be found at: https://github.com/oracle/db-sample-schemas
 *
 *****************************************************************************/
var oracledb = require('oracledb');
oracledb.connectionClass = 'SWISSSMART';
//oracledb.fetchAsString = [ oracledb.NUMBER ];
oracledb.stmtCacheSize = 40;
var EntidadesMongoOracle = require("../utils/jsonEntity.js");
var entidesMonogoDB = new EntidadesMongoOracle();
var Q = require('q');
oracledb.outFormat = oracledb.OBJECT;
var conexion;
var poolConexion;
var ClienteOracle = function () {this.init();};

ClienteOracle.prototype.init = function () {
 		oracledb.createPool (
          {
            user          : "swissmovi",
            password      : "swissmovi",
            connectString : "swiss01",
            queueRequests : true,  // default is true
            _enableStats  : true,   // default is false
            poolMax       : 120, // maximum size of the pool
            poolMin       : 5, // let the pool shrink completely
            poolIncrement : 2, // only grow the pool by one connection at a time
            poolTimeout   : 0  // never terminate idle connections
          },
          function(err, pool)
          {
              
            if (err) {
              console.error("ERROR AL LLAMAR AL POOL createPool() callback: " + err.message);
              return;
            }
            pool._logStats();
            poolConexion = pool;
             pool.getConnection (
                      function(err, connection)
                      {
                        if (err) {
                          handleError(response, "getConnection() failed ", err);
                          return;
                        }
                      console.log("Conectado a Oracle, entregando variable conexion");
                      conexion = connection;
             });

          });
 };

ClienteOracle.prototype.llamarProcedimiento = function (nombre, parametros, resultado) {
 		poolConexion.getConnection (
                              function(err, connection)
                              {

                                if (err) {
                                    console.log("Error",err, sql);
    							     resultado(err);
                                    return;
                                }
                                var iniciarProcedimiento =  "BEGIN :nombre; END;".replace(":nombre",nombre)
                                  /**
                                  Verificar parametros de salida
                                  
                                  */
                                  for(key in parametros){
                                        if(parametros[key] === "out"){
                                            parametros[key]={dir:oracledb.BIND_OUT, type:oracledb.STRING, maxSize:500}
                                        }
                                      
                                  }
                                 
                                 connection.execute(iniciarProcedimiento,parametros, function(err, result) {
                                     
                                     connection.release( function(err) { });
                                     
                                     if(err){
                                        console.log("Error::llamarProcedimiento  ",nombre,err);
                                         resultado(err);
                                     }else{
                                        resultado(result);
                                     }

                                 });
                              });
}



ClienteOracle.prototype.getPoolClienteConexion = function (sql, parametros, grabar, resultado) {
    var padre =this;
       
 		poolConexion.getConnection (
                              function(err, connection)
                              {
                                if (err) {
                                    //console.log("Error poolConexion.getConnection ",err,"Sql",sql);
                                    clearTimeout(noConexion);
                                    //[Error: NJS-040: connection request timeout]
                                    if(err && err.toString().indexOf("NJS-040: connection request timeout")>=0){
                                        try{
                                           poolConexion.close(function(error){
                                               console.log(error);
                                           }); 
                                        }catch(error){
                                            console.log();
                                        }
                                        
                                        console.log("iniciando la conexion pool con la base");
                                        padre.init();
                                    }
                                    resultado({error:err});
                                    
                                    return;
                                }
                                console.log("********getPoolClienteConexion*****************");
                                console.log(sql);
                                console.log(parametros);
                                console.log(grabar);
                                console.log("********getPoolClienteConexion*****************");
							    connection.execute(sql, parametros, grabar ? { autoCommit: true}:{maxRows:10000}, function(err, result) {
                             				// return the client to the connection pool for other requests to reuse
                             				if(err) {
                                                console.log("Error connection.execute", err, sql, parametros);
                								connection.release(function(err) {});
                                                clearTimeout(noConexion);
                                                 if(err && err.toString().indexOf("NJS-040: connection request timeout")>=0){
                                                     try{
                                                       poolConexion.close(function(error){
                                                           console.log(error);
                                                       }); 
                                                    }catch(error){
                                                        console.log();
                                                    }
                                                    console.log("iniciando la conexion pool con la base");
                                                    this.init();
                                                }
												resultado({error:err});
                                                return;
                             				}else{
                             				    /* Release the connection back to the connection pool */
                                                connection.release( function(err) { });
                                                clearTimeout(noConexion);
                                                resultado(result);
                                                
                             				
                                            }
                             });
                                  
                            var noConexion= setTimeout(function(){
                                if(connection){
                                    connection.release( function(err){});
                                }   
                                
                                 try{
                                        poolConexion.close(function(error){
                                          console.log(error);
                                         }); 
                                                    }catch(error){
                                                        console.log();
                                                    }
                                console.log("iniciando la conexion pool con la base",oracledb);
                                padre.init();
                                resultado({error:"Time out conexion"});
                                return;                       
                            },120000);
         });
};


ClienteOracle.prototype.getPoolClienteConexionQ = function (sql, parametros, grabar) {
       var deferred = Q.defer();
       
 		poolConexion.getConnection (
                              function(err, connection)
                              {
                                if (err) {
                                    //console.log("Error poolConexion.getConnection ",err,"Sql",sql);
                                    clearTimeout(noConexion);
                                    deferred.reject(err);                      
                                   
                                }else{
                                    connection.execute(sql, parametros, grabar ? { autoCommit: true}:{maxRows:10000}, function(err, result) {
                                                // return the client to the connection pool for other requests to reuse
                                                if(err) {
                                                    console.log("Error connection.execute", err, sql, parametros);
                                                    connection.release(function(err){ });
                                                    clearTimeout(noConexion);
                                                    deferred.reject(err); 
                                                }else{
                                                    /* Release the connection back to the connection pool */
                                                    connection.release( function(err) { });
                                                    clearTimeout(noConexion);
                                                     deferred.resolve(result)

                                                }
                                    });
                                }
                                var noConexion= setTimeout(function(){
                                    if(connection){
                                        connection.release( function(err){});
                                    } 
                                   deferred.reject("Time Out 120000");                      
                                },120000);
         });
    return deferred.promise;
};


function getConexion(datos, tabla) {
     var deferred = Q.defer();
    poolConexion.getConnection (function(err, connection) {
                              if(err){
                                  deferred.reject(err);
                              }else{
                                   deferred.resolve({conexion:connection, datos:datos, tabla:tabla});
                              }
                          }
                      );
    return deferred.promise;
}
function enviarConnectionAlPool(x) {
     var deferred = Q.defer();
     if(x.excepcion && !x.excepcion.estado && x.conexion){
         x.conexion.rollback(function(err){
             console.log("enviarConnectionAlPool and rollback done ");
             if(err){
                  console.log("enviarConnectionAlPool and rollback error ",err);
                 deferred.reject(false);
             }
            x.conexion.release(function(err){
                if (err) {
                    console.log(" enviarConnectionAlPool and connection.release error ",err);
                    deferred.reject(err);
                }else{
                    console.log(" enviarConnectionAlPool and connection.release ok ");
                    deferred.resolve(true);
                }
            });
        });
    }else{
        deferred.resolve(true);
    }
   return deferred.promise;
}
function commitTransaccion(connection) {
     var deferred = Q.defer();
     connection.commit(function(err){
         console.log("commitTransaccion done ");
         if(err){
              console.log("commitTransaccion error ",err);
             deferred.reject(false);
         }else{
             connection.release(function(err){
                            if (err) {
                                  console.log(" connection.release error ",err);
                                deferred.reject(err);
                            }else{
                                 console.log(" connectio ok ");
                               // deferred.resolve(true);
                            }
            });
            deferred.resolve(true);
         }
     });
     return deferred.promise;
}
 function getPoolClienteConexionCommit(connection, sql, parametros,commit, resultado) {
    connection.execute(sql, parametros, { autoCommit: commit}, function(err, result) {
        console.log(err);
        console.log(result);
            // return the client to the connection pool for other requests to reuse
                if(err) {
                    console.log("Error");
                    console.log(err);
                    connection.release(
                        function(err){
                            if (err) {
                                console.log(err);
                                resultado(err);
                                return;
                            }
                    });
                    resultado({estado:true, error:err,result:result, mensaje:"Este error esta al ejecutar la sentencia enviada a oracle conexion-oracle.js(getPoolClienteConexionCommit)"});
                    return;
                }else{
                    resultado(result);
                }
        });

 }

 ClienteOracle.prototype.getClienteConexion = function (sql, parametros, resultado) {
     if(!conexion){
         getPoolClienteConexion(sql, parametros, function(res){
             resultado(res);
        return;
        });
    }
    conexion.execute(sql, parametros,{maxRows:1000}, function(err, result) {
        if(err) {
            conexion.release(
                function(err){
                    if(err) {
                        console.log(err);
                        resultado(err);
                        return;
                    }
            });
        }else{
            /* Release the connection back to the connection pool */
            conexion.release(
                function(err){
                    if (err) {
                        console.log(err);
                        resultado(err);
                        return;
                    }
            });
            //Enviando los resultados
            resultado(result);
            return;
        }
    });
  };

  function getScriptInsert(datos, tabla, secuencia){
      var columnas = [];
      var sqlInsert = "INSERT INTO #TALBA(ID,#COLUMNAS) VALUES(#SECUENCIAORACLE.nextval,#VALORES) RETURNING ID INTO :IDVALOR";
      var valores = [];
      var valoresJson = {};
      var valoresIndices = [];
      var indice = 1;
      //Se hace un recorrido al json para obtener las columnas y valores
      for(var key in datos){

          if(key.toLowerCase().indexOf("fecha")>=0 && datos[key]){
              if(isNaN(datos[key])){
                  valores.push("Entro ************* en fecha es nan");
                  valoresJson[key] = new Date(datos[key]);
              }else{

                  valores.push("Entro ************* en fecha no es nan");
                  valoresJson[key] = new Date(parseInt(datos[key]));
              }
              valores.push("fecha ",valoresJson[key], datos[key])
          }else{
               valores.push("Entro ************* no fecha");
              valoresJson[key] = datos[key];
          }

          valoresIndices.push(":"+key);
          columnas.push(key.toUpperCase());
          indice ++;
      }
      return { sqlInsert :sqlInsert.replace("#TALBA",tabla).replace("#COLUMNAS",columnas.join(",")).replace("#VALORES",valoresIndices.join(",")).replace("#SECUENCIAORACLE", secuencia), valoresJson:valoresJson};
}
ClienteOracle.prototype.grabarNestedJson  = function(datos, tabla){
     var deferred = Q.defer();
     var padre = this;
      getConexion(datos, tabla).             //Se obitene una session debido a que es una comit de una transaccion y esta solo acepta commit de una misma connection
     then(grabarMovilJson).                 //Graba los registros en forma recursiva
     then(commitTransaccion).               //Hace commit y envia la conexion a la pool
     then(function(r){
         deferred.resolve(true);            //Envia el resultado de la respuesta
     },function(x){
         enviarConnectionAlPool(x).//Envia la conexion al pool si existieran problemas
         then(function(c) {
             delete x.conexion;
             deferred.reject(x);            //Envia el error, is llegara a suceder
         },function(d){
             delete x.conexion;
             deferred.reject(x);            //Envia el error, is llegara a suceder
         });

    });
    return deferred.promise;

};
function validarRepetidosMovilJson(parametrosJson){
    var deferred = Q.defer();
    var datos = parametrosJson.datos;
    var tabla = parametrosJson.tabla;
    var conexion = parametrosJson.conexion;
    getPoolClienteConexionCommit(conexion, "SELECT ESTADO FROM #TABLA WHERE PREIMPRESO".replace("#TABLA",tabla), scriptInsert.valoresJson, false, function(resultado){

    });
    return deferred.promise;
}
function grabarMovilJson(parametrosJson){
      console.log("entro grabarMovilJson");
      var datos = parametrosJson.datos;
      var tabla = parametrosJson.tabla;
      var conexion = parametrosJson.conexion;
      var errores = parametrosJson.errores;
      //.log("grabarJson entro",parametrosJson);
      var deferred = Q.defer();
      datos.idmovil = datos.id;
      delete datos.id;
      if(errores){
          console.log("grabarMovilJson oracle ", errores);
          deferred.reject({mensaje:errores, conexion:conexion});
         return deferred.promise;
      }
     var d = datos.preimpreso;
    var indeceEmimisor = process.env.GRUPO == "2" ? 1 :2;
    var indeceSecuencial = process.env.GRUPO == "2" ? 2 :3;
    var dd=(d && (!d.split("-")[indeceEmimisor] || d.split("-")[indeceEmimisor] == "null" || d.split("-")[indeceEmimisor] == "undefined" ));
    
    if( d && dd && tabla.indexOf("emovtcartera")>=0){ //SOLO CATERARA
         console.log("d oracle no se grabara ", d);
         deferred.reject({mensaje:"EL preimpreso contiene null", conexion:conexion});
         return deferred.promise;
    }
     var secuencia = entidesMonogoDB.getSecuenciaOracle(tabla);
     if( tabla.indexOf("emovtorden")>=0){ //SOLO CATERARA
        console.log("grabarMovilJson",secuencia, tabla);
     }
      //Verificando si el registro a grabar tiene hijos o registros asociados
      secuencia = secuencia.secuencia;
      var REGISTROSASOCIADOS = [];

      if((Array.isArray(datos.REGISTROSASOCIADOS) && datos.REGISTROSASOCIADOS.length>0)){
            REGISTROSASOCIADOS = datos.REGISTROSASOCIADOS;
      }
      delete datos.REGISTROSASOCIADOS;
      delete datos.registrosasociados;
   	  var scriptInsert = getScriptInsert(datos, tabla, secuencia);
     scriptInsert.valoresJson.IDVALOR={type:oracledb.NUMBER,dir:oracledb.BIND_OUT};
    if( tabla.indexOf("emovtorden")>=0){ //SOLO CATERARA
        console.log("grabarMovilJson",scriptInsert.sqlInsert, scriptInsert.valoresJson);
    }
      getPoolClienteConexionCommit(conexion, scriptInsert.sqlInsert, scriptInsert.valoresJson, false, function(resultado){
                if(resultado  && resultado.rowsAffected >= 1 && resultado.outBinds && resultado.outBinds.IDVALOR[0]){
                    if(REGISTROSASOCIADOS.length === 0){
                        deferred.resolve(conexion);
                    }else{
                        grabarTablasAsociadas(conexion, tabla, REGISTROSASOCIADOS, resultado).then(function(r){
                            deferred.resolve(conexion);
                        },function(x){
                            deferred.reject(x);
                        });
                    }
  				}else{
                    if(resultado.code && resultado.code ==="23505"){
  						deferred.reject({mensaje:"REGISTRO NO GRABADO POR QUE YA SE ENCUENTRA GRABADO", excepcion:resultado, conexion:conexion});
  					}else{
  						deferred.reject({mensaje:"REGISTRO NO GRABADO", excepcion:resultado,conexion:conexion});
  					}
  				}
  			});//FIN getPoolClienteConexion
            return deferred.promise;
 }
 ClienteOracle.prototype.grabarJson = function(datos, tabla){
         var deferred = Q.defer();
         delete datos.id;
         if(!tabla){
             deferred.reject({mensaje:"La tabla no existe"});
            return deferred.promise;
         }
         var secuencia = entidesMonogoDB.getSecuenciaOracle(tabla);

         //Verificando si el registro a grabar tiene hijos o registros asociados
         secuencia = secuencia.secuencia;
         var padre = this;
         var scriptInsert = getScriptInsert(datos, tabla, secuencia);
         scriptInsert.valoresJson.IDVALOR={type:oracledb.NUMBER,dir:oracledb.BIND_OUT};
         padre.getPoolClienteConexion(scriptInsert.sqlInsert, scriptInsert.valoresJson, true, function(resultado){
                   if(resultado  && resultado.rowsAffected >= 1 && resultado.outBinds && resultado.outBinds.IDVALOR[0]){
                        deferred.resolve(true);
                   }else{
                       deferred.reject(false);
                   }
        });
};
function grabarTablasAsociadas(conexion, tabla, REGISTROSASOCIADOS, resultado){
    var deferred = Q.defer();
    var grupoRegistrosAsociadosPorTabla = [];
    REGISTROSASOCIADOS.forEach(function(r){
        var referenciaCampoFk = entidesMonogoDB.getReferenciaFkOracle(tabla, r.tabla);
        if(referenciaCampoFk.campofk){
            var foreign_keys={};
            foreign_keys[referenciaCampoFk.campofk] = resultado.outBinds.IDVALOR[0];
            grupoRegistrosAsociadosPorTabla.push(grabarRegistrosRecursivosOracle(conexion, r.tabla, r.registros, foreign_keys));
        }else{
            grupoRegistrosAsociadosPorTabla.push(grabarRegistrosRecursivosOracle(conexion, r.tabla, r.registros, null));
        }
    });
    Q.all(grupoRegistrosAsociadosPorTabla).then(function(){
        deferred.resolve(true);
    },function(x){
        console.log("Error en grabarTablasAsociadas ******* ",x);
        deferred.reject(x);
    });

     return deferred.promise;

}
function grabarRegistrosRecursivosOracle(conexion, tabla, datos, foreign_keys){
    var deferred = Q.defer();
    var registrosPorGrabar = [];
    var errores = "";
    datos.forEach(function(dato){
        if(foreign_keys){
            for(var key in foreign_keys ){
                 delete dato[key];
                 delete dato[key.toLowerCase()];
                 dato[key] = foreign_keys[key];
            }
        }else{
            errores = "No se econtro una relacion con la tabla  " + tabla;
        }
        registrosPorGrabar.push(grabarMovilJson({conexion:conexion, tabla:tabla, datos:dato, errores:errores}));
    });
    Q.all(registrosPorGrabar).then(function(r){
        deferred.resolve(true);
    },function(x){
        deferred.reject(x);
    });
    return deferred.promise;
}
module.exports = new ClienteOracle();
