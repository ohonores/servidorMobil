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
oracledb.outFormat = oracledb.OBJECT;
var conexion;
var poolConexion;
var ClienteOracle = function () {this.init();};

 ClienteOracle.prototype.init = function () {
 		oracledb.createPool (
          {
            user          : "webapp",
            password      : "webapp",
            connectString : "swiss01_1_29",
            poolMax       : 50, // maximum size of the pool
            poolMin       : 0, // let the pool shrink completely
            poolIncrement : 10, // only grow the pool by one connection at a time
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

 ClienteOracle.prototype.getPoolClienteConexion = function (sql, parametros, grabar, resultado) {
 		poolConexion.getConnection (
                              function(err, connection)
                              {

                                if (err) {
                                    console.log("Error");
    								console.log(err);
                                  resultado(err);
                                  return;
                                }
							 connection.execute(sql, parametros, grabar ? { autoCommit: true}:{maxRows:10000}, function(err, result) {
                             				// return the client to the connection pool for other requests to reuse
                                            if(sql.indexOf("SWISSMOVI.EMOVTSTOCK")<0){
                                                console.log(sql);
                                                console.log(parametros);
                                            }

                             				if(err) {
                                                console.log("Error");
                								console.log(err);
                             					connection.release(
                                                                    function(err)
                                                                    {
                                                                      if (err) {
                                                                        console.log(err);
                                                                        resultado(err);
                                                                        return;
                                                                      }

                                                                    });
												                resultado(err);
                                                                return;
                             				}else{
                             				    /* Release the connection back to the connection pool */
                                                connection.release(
                                                              function(err)
                                                              {
                                                                if (err) {
                                                                    console.log(err);
                                                                    resultado(err);
                                                                    return;
                                                                }
                                                                if(result && result.rows){
                                                                                    /*if(sql.indexOf("SWISSMOVI.EMOVTSTOCK")<0){
                                        													console.log("Total encontrados ");
                                        													console.log(result.rows.length);
                                                                                        }*/
                                                                                    }
                                                   					    resultado(result);
                                                                return;
                                                              });

                                                //Enviando los resultados

                             				}
                             });
         });
 };

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
                                                                     function(err)
                                                                     {
                                                                       if (err) {
                                                                         console.log(err);
                                                                         resultado(err);
                                                                         return;
                                                                       }
                                                                     });
                              				}else{
                              				    /* Release the connection back to the connection pool */
                                                 conexion.release(
                                                               function(err)
                                                               {
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

  module.exports = new ClienteOracle();
