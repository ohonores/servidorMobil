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
            connectString : "swiss01_1_29",
            poolMax       : 100, // maximum size of the pool
            poolMin       : 10, // let the pool shrink completely
            poolIncrement : 20, // only grow the pool by one connection at a time
            poolTimeout   : 0  // never terminate idle connections
          },
          function(err, pool)
          {
            if (err) {
              console.error("createPool() callback: " + err.message);
              return;
            }
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
                                    console.log("Error", sql);
    								console.log(err);
                                    
                                  resultado(err);
                                  return;
                                }
                                var iniciarProcedimiento =  "BEGIN :nombre; END;".replace(":nombre",nombre)
                                 console.log("iniciarProcedimiento", iniciarProcedimiento);
                                  /**
                                  Verificar parametros de salida
                                  
                                  */
                                  for(key in parametros){
                                        if(parametros[key] === "out"){
                                            parametros[key]={dir:oracledb.BIND_OUT, type:oracledb.STRING, maxSize:500}
                                        }
                                      
                                  }
                                  console.log("iniciarProcedimiento", parametros);
                                 connection.execute(iniciarProcedimiento,parametros, function(err, result) {
                                        console.log(err);
                                        console.log(result);
                                        resultado(true);
                                 });
                              });
}

ClienteOracle.prototype.getPoolClienteConexion = function (sql, parametros, grabar, resultado) {
 		poolConexion.getConnection (
                              function(err, connection)
                              {
                                if (err) {
                                  console.log("Error poolConexion.getConnection ",err,"Sql",sql);
                                  resultado({error:err});
                                  return;
                                }
							     connection.execute(sql, parametros, grabar ? { autoCommit: true}:{maxRows:10000}, function(err, result) {
                             				// return the client to the connection pool for other requests to reuse
                             				if(err) {
                                                console.log("Error connection.execute", err);
                								connection.release(
                                                                    function(err)
                                                                    {
                                                                      if (err) {
                                                                        console.log("Error connection.release en error en connection.execute",err);
                                                                        resultado({error:err});
                                                                        return;
                                                                      }

                                                                    });
												                resultado({error:err});
                                                                return;
                             				}else{
                             				    /* Release the connection back to the connection pool */
                                                connection.release(
                                                    function(err)
                                                    {
                                                        if (err) {
                                                            console.log("Error connection.release en despues de connection.execute",err);
                                                            resultado({error:err});
                                                            return;
                                                        }
                                                        resultado(result);
                                                        return;
                                                    });
                             				
                                            }
                             });
         });
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
                                deferred.resolve(true);
                            }
            });
            //deferred.resolve(true);
         }
     });
     return deferred.promise;
}
 function getPoolClienteConexionCommit(connection, sql, parametros,commit, resultado) {
    connection.execute(sql, parametros, { autoCommit: commit}, function(err, result) {
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
                    resultado({estado:true,error:err});
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
          //valores.push(datos[key])
          if(key.toLowerCase().indexOf("fecha")>=0){
              if(isNaN(datos[key])){
                  valoresJson[key] = new Date(datos[key]);
              }else{
                  valoresJson[key] = new Date(parseInt(datos[key]));
              }

          }else{
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
function grabarMovilJson(parametrosJson){

      var datos = parametrosJson.datos;
      var tabla = parametrosJson.tabla;
      var conexion = parametrosJson.conexion;
      var errores = parametrosJson.errores;
      //.log("grabarJson entro",parametrosJson);
      var deferred = Q.defer();
      datos.idmovil = datos.id;
      delete datos.id;
      if(errores){
          deferred.reject({mensaje:errores, conexion:conexion});
         return deferred.promise;
      }
      var secuencia = entidesMonogoDB.getSecuenciaOracle(tabla);

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
         console.log("grabarJson entro");
         var deferred = Q.defer();
         delete datos.id;
         if(!tabla){
             console.log("la tabla no existe");
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
