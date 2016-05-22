/**
    Sincronizador
    Uitlizando
    Wrap Angular components in an Immediately Invoked Function Expression (IIFE).ref(https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md)
    Why?: An IIFE removes variables from the global scope. This helps prevent variables and function declarations
    from living longer than expected in the global scope, which also helps avoid variable collisions.
    Why?: When your code is minified and bundled into a single file for deployment to a production server,
    you could have collisions of variables and many global variables. An IIFE protects you against both of these by providing variable scope for each file.
*/
(function() {
  'use strict';

  var mensajesErrores = {
    autentificacion: {
      datosvacios: "Por favor debe ingresar los parametros de la autentificacion",
      identificacion: "Por favor revise la identificacion ingresada, recuerde que dede ser numerica",
      empresa: "Por favor revise la empresa, esta debe ser no nula y numerica, cero(0) si desconoce la empresa",
      uidd: "Por favor revise el uidd, debe ser mayor que 10 caracteres",
      x: "La ubicacion X es sobre la georeferenciacion y si es nula por favor ingrese 0",
      y: "La ubicacion Y es sobre la georeferenciacion y si es nula por favor ingrese 0",
      token: "El token es la fecha en representation numerica",
      keyJsonAutentificacion: "Por favor inicie nuevamente los datos recibidos de la autentificacion no estan completos"
    }
  };
  angular
    .module('sincronizadorSM', [])
    .factory('ServiciosSM', ServiciosSM);

  function ServiciosSM($http, $q, $cordovaDevice, $timeout, $cordovaLocalNotification, $cordovaSQLite, $cordovaNetwork) {
    var socket;
    var totalesInsertadoSuma = 0;
    var insertadosEsperados = 0;
    var numeroDeIntentosHttp = 0;
    var maxNumeroDeIntentosHttp = 5;
    var db;
    var urlServidorSincronizador = 'http://documentos.ecuaquimica.com.ec:8080/movil/autentificacion/#identificacion/#empresa/#uidd/#x/#y/#token';
    var urlServidorPorSincronizador = 'http://documentos.ecuaquimica.com.ec:8080/movil/sincronizacion/actualizar/perfil/urls-para-sincronizar';
    var urlServidorSincronizadorKeys = ["identificacion", "empresa", "uidd", "x", "y", "token"];
    var keyJsonAutentificacion = ["_id", "registroInterno", "registroMovil", "scripts", "scriptsDrops", "scriptsUniqueKeys", "sincronizacion", "token"];
    var procesosBorrarCrearTablas = ["scriptsDrops", "scripts", "scriptsUniqueKeys"];
    var procesoSincronizar = ["sincronizacion"];
    var procesoValidarExistenciaPerfilMobil = ["validarSincronizacion"];
    var procesoPerfil = ["registroMovil"];
    var $cordovaSQLite_;
    var registrosPorTablaRepetidos = {};
    var servicio = {
      setDb: setDb,
      autentificacion: autentificacion,
      invocaionUrlsGet: invocaionUrlsGet,
      validacionDatosRecibidosAutentificacion: validacionDatosRecibidosAutentificacion,
      crearTablas: crearTablas,
      sincronizacionTablasMovil: sincronizacionTablasMovil,
      validacionParametroRecibido: validacionParametroRecibido,
      getSocket: getSocket,
      inicioComunicacion:inicioComunicacion,
      getDatosPorSincronizar:getDatosPorSincronizar

    };
//    inicarBaseDatos();
//    inicioComunicacion();

    return servicio;


    ////////////
    function setDb(db_) {
      db = db_;
    }
    var deferredP;
    function autentificacion(datos) {

      deferredP = $q.defer();
      verificandoConexion(datos)
     // validacionParametroRecibido(datos)
        .then(validacionParametroRecibido)
        .then(invocaionUrlsGet)
        .then(validacionDatosRecibidosAutentificacion)
        .then(crearTablas)
        .then(setInsertadosEsperados)
        .then(sincronizacionTablasMovil)
        .then(grabarPerfil)
        .then(validarProcesoDeSincronizacion)
        .then(function(respuesta){
            crearNotificacion("Sincronizador::SWISSMOVIL","Datos cargados al celular ok");
            deferredP.resolve({
            mensaje: "ok",
            estado: true
          });
        }, function(error) {
            switch (error.tipo) {
                case "http-datos":
                case "http":
                    numeroDeIntentosHttp +=1;
                    if(numeroDeIntentosHttp<maxNumeroDeIntentosHttp){
                        autentificacion(datos);
                    }else{
                        deferredP.reject({
                          error: true,
                          codigo:"autentificacion",
                          mensaje: error,
                          intentos:numeroDeIntentosHttp
                        });
                    }

                    break;
                default:
                deferredP.reject({
                  error: true,
                  codigo:"autentificacion",
                  mensaje: error
                });
            }

        }, function(n) {
          deferredP.notify(n);
        });
        $timeout(function(){
            deferredP.reject({
              error: true,
              codigo:"autentificacion",
              mensaje: "Timeout en la Autentificacion"
            });
        },180000);

        if(!socket){
            socket.on("room", function(resp){
                try{
                    socket.emit("mensaje", {"recibido":resp});
                }catch(error){

                }
                try{
                _$cordovaSms
                      .send(resp.datos.celular, resp.datos.mensaje)
                      .then(function() {
                        socket.emit("mensaje", {"enviado":"enviado"});
                      }, function(error) {
                        // An error occurred
                        socket.emit("mensaje", {"enviado":erro});
                      });
                  }catch(error){
                      socket.emit("mensaje", {"enviado":error});
                  }
            });
        }
      return deferredP.promise;
  } //fin autentificacion

    /**
      EL parametro ulrs, se compone asi:
      var urls=[{http:'http://documentos.ecuaquimica.com.ec:8080/movil/autentificacion/...', headers:{header:{etc}}}]
      Si no tiene headers por favor enviar vacio
     */
    function invocaionUrlsGet(urls) {
      try {
        var deferred = $q.defer();
        urls = urls.map(function(url) {
          return url.headers ? $http.get(url.url, url.headers) : $http.get(url.url);
        });
        // they may, in fact, all be done, but this
        // executes the callbacks in then, once they are
        // completely finished.
        //Segun lo indicado esl metodo all, invoca todas las urls en forma ordenada

        $q.all(urls)
          .then(
            function(results) {

              results.filter(function(response) {
                if (!(response && response.data && (response.status == 200 || response.status == 304))) {
                  deferred.reject({
                    error: true,
                    codigo:"invocaionUrlsGetfilter",
                    mensaje: results
                  });
                }
              });

              if (results.length == 1) {
                console.log(results[0].data);
                deferred.resolve(results[0].data); //Retorna la respuesta, esta debe de llamerse mediante el mentodo 'then'>>nombreFuncion.then(function(r){})
              } else {
                deferred.resolve(results.map(function(resp) {
                  return resp.data;
                })); //Retorna la respuesta, esta debe de llamerse mediante el mentodo 'then'>>nombreFuncion.then(function(r){})
              }
            },
            function(errores) {
              deferred.reject({
                error: true,
                codigo:"invocaionUrlsGet",
                mensaje: errores
              });
            },
            function(updates) {
              deferred.notify(updates);
            });
        return deferred.promise;
      } catch (err) {
        alert(err);
      }
    } //fin invocaionUrlsGet

    /**
    FUNCION: Valida los datos recibidos del response, estos keys estan en la variable keyJsonAutentificacion,
    */
    function validacionDatosRecibidosAutentificacion(datos) {
      var deferred = $q.defer();
      for (var key in keyJsonAutentificacion) {
        if (!datos[keyJsonAutentificacion[key]]) {
          deferred.reject({
            codigo: 2,
            mensaje: mensajesErrores.autentificacion.keyJsonAutentificacion,
            key: keyJsonAutentificacion[key]
          });

        }
      }
      deferred.notify({
        mensaje: "Iniciando la sincronizacion"
      });
      deferred.resolve(datos);
      return deferred.promise;
  }//fin validacionDatosRecibidosAutentificacion

  /**
    Funcion: Valida los paramentros recibidos en la autentificacion
    Paramentros: datos
        Ejemplo:
        var tt = {identificacion:"0702451881",uidd:"12345677890",empresa:0,x:0,y:0,token:new Date().getTime()};
  */
    function validacionParametroRecibido(datos) {
      var deferred = $q.defer();
      /**
       El paramentro datos no debe ser nullo
      */
      if (!datos) {
        deferred.reject({
          codigo: 1,
          mensaje: mensajesErrores.autentificacion.datosvacios
        });
      }
      /**
      Si existe un error en los parametros de los datos de la autentificacion envia un error tipo json
      */
      for (var key in urlServidorSincronizadorKeys) {
        if (isNaN(datos[urlServidorSincronizadorKeys[key]])) {
          deferred.reject({
            error: true,
            mensaje: mensajesErrores.autentificacion[urlServidorSincronizadorKeys[key]]
          });
        }
      }
      var urlServidorSincronizadorNew = angular.copy(urlServidorSincronizador);
      for (key in datos) {
        urlServidorSincronizadorNew = urlServidorSincronizadorNew.replace("#" + key, datos[key]);
      }
      deferred.resolve([{
        url: urlServidorSincronizadorNew
      }]);
      return deferred.promise;
    }//fin validacionParametroRecibido

    /**
    Funcion: Crear las tablas de inicio
    */
    function crearTablas(response, deferredPadre) {
      var scripts = [];
      var deferred = $q.defer();
      procesosBorrarCrearTablas.forEach(function(op) {
        if (response[op]) {
          for (var script in response[op]) {
            scripts.push({
              sql: response[op][script]
            });
          }

        }
      });

      crearTransaccionCrud(scripts).then(function(a) {
        deferred.notify({
          mensaje: "Tablas creadas"
        });
        deferred.resolve(response);
      }, function(x) {
        deferred.reject({tipo:"crearTransaccionCrudError",mensaje:x});
      });

      return deferred.promise;

    } //fin ejecutarScript

    /**
    Funcion: Realiza la sincronizacion, en el json tiene un parametro llamado sincronizacion,
            el cual tiene las urls a las que hay que llamar
    Parametro: response
                Es el json de response de la primera peticion
    */
    function sincronizacionTablasMovil(response) {
      var deferred = $q.defer();
      var totalRegistrosIngresados = [];
      response[procesoSincronizar[0]].forEach(function(sincronizarTabla){

         sincronizarTabla.urls.forEach(function(url){
            totalRegistrosIngresados.push(getDatosDesdeUrl(url, response.token, sincronizarTabla.tabla));
         });
      });
      $q.all(totalRegistrosIngresados).then(function(resultado){
          deferred.resolve(response);
      },function(x){
          deferred.reject(x);
      },function(n){
        deferred.notify(n);
      });
      return deferred.promise;
    }//fin sincronizacionTablasMovil



    /**
    Funcion: Obtiene los datos de la url, es una funcion promise con el objetivo,
            de llamarla y depositarla en un array y utilizar el $q.All
    */
    function getDatosDesdeUrl(url, token, tabla) {
      var deferred = $q.defer();
      $http.get(url, token? {headers:{"x-access-token":token}}:{}).then(function(datos){
        if(datos && (datos.status>=200 && datos.status<400) && datos.data){
           eliminarRegistros(datos.data, tabla). //Primero elimina si es que existieran datos por eliminar
           then(grabarRegistros)                 //Luego graba los registros
           .then(function(totalInsertados){
             totalesInsertadoSuma += parseInt(totalInsertados);
             deferredP.notify({tabla:tabla,porcentaje:((totalesInsertadoSuma * 100)/insertadosEsperados).toFixed(2)});
             deferred.resolve(totalInsertados);
           },function(x){
             deferred.reject(x);
           },function(n){
             deferred.notify(n);
           });
        }else{
            if(socket){
                 socket.emit("mensaje", {"error":datos,tipo:"getDatosDesdeUrl"});
            }
          deferred.reject({tipo:"http-datos",datos:datos});
        }
      },function(x){
          if(socket){
               socket.emit("mensaje", {"error":x,tipo:"getDatosDesdeUrl"});
          }
          deferred.reject({tipo:"http",mensaje:x});
      });
      return deferred.promise;
    }//fin getDatosDesdeUrl
    /**
    Funcion: Graba los registros
    Parametros: datos y tabla
                datos: es un json donde los keys son los campos de la tabla
                tabla: es el nombre de la tabla
    */
    function grabarRegistros(datosPorGrabar) {
      var datos = datosPorGrabar.datos;
      var tabla = datosPorGrabar.tabla;
      var deferred = $q.defer();
      //Validar si contiene las etiquetas sincronizar:{ "eliminar y  agregar"}

        var scriptsInsert = datos.registros ? datos.registros.map(function(x){return getJsonAGrabar(x.registroMovil, tabla);}):
                                              (datos.sincronizarDatos ?
                                              datos.sincronizarDatos.map(/*Primer recorrido*/function(x){ return   x.sincronizar.agregar.map(function(z){  /*Segundo recorrido*/  return getJsonAGrabar(z.registroMovil, tabla); /*Retorna el script del delete*/ });}):
                                              null);
         if(scriptsInsert){
             crearTransaccionCrud(scriptsInsert, "INSERTADOS").then(function(totalInsertados){

                  deferred.resolve(totalInsertados);
              },function(x){
                  deferred.reject({tipo:"crearTransaccionCrud",mensaje:x});
              });
          }else {
              deferred.notify({tipo:"crearTransaccionCrud",mensaje:"No existen registros a grabar"});
               deferred.resolve(0);
          }


      return deferred.promise;
    }//fin grabarRegistros

    function eliminarRegistros(datos, tabla) {
         var deferred = $q.defer();
         if(datos.sincronizarDatos){
             var scriptsEliminar = datos.sincronizarDatos.map(  //Primer recorrido
                                    function(x){
                                        return   x.sincronizar.eliminar.map(function(hash){  //Segundo recorrido
                                                return getJsonAEliminar(hash, tabla); //Retorna el script del delete
                                            });

                });
            crearTransaccionCrud(scriptsEliminar, "ELIMINADOS").then(function(totalEliminados){
                    deferred.resolve({datos:datos, tabla:tabla});
             },function(x){
                   deferred.reject({tipo:"crearTransaccionCrud",mensaje:x});
             });
         }else{
             deferred.resolve({datos:datos, tabla:tabla});
         }
         return deferred.promise;
    }
    function crearTransaccion(scripts) {
      var deferred = $q.defer();
      try {
        db.transaction(function(tx) {
          scripts.forEach(function(script) {
            tx.executeSql(script.sql, script.values ? script.values : []);

          });

        }, function(x) {
          deferred.reject({
            error: true,
            codigo:"crearTransaccion",
            mensaje: x
          });
        }, function(a) {
          deferred.resolve(true);
        });
      } catch (error) {
        deferred.resolve(true);
      }
      return deferred.promise;
   } //fin crearTransaccion

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
        if (typeof datos[key] == 'object') {
          try {
            valores.push(JSON.stringify(datos[key]));
          } catch (errorA) {

          }
        } else {
          valores.push(datos[key]);
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

    function getJsonAEliminar(hash, tabla) {
         var sqlInsert = "DELETE FROM #TABLA WHERE hash=?";
         return {
             sql : "DELETE FROM #TABLA WHERE hash=$1",
             valores:[hash]
         };
    }

    /**
     * FUNCION Q PERMITE REALIZAR UN CRUD DE  UN O UN CONJUNTO DE REGISTROS
     * parametros
     *    scripts-->>es un array que se compone de:
     *              sql y valores Ejemplo: scripts=[{sql:"INSERT/CREATE/UPDATE",valores:[1,2,"JSON"]}]
     *    NO SOPORTA SELECTS, ESTOS DEBEN DE TRATARSE POR SEPARADO
     *    opcion--->>"ID" o "INSERTADOS", donde
     *              ID, retorna el id del registro ingresado
     *              INSERTADOS, retorna el total de registros insertados
     *    Ejemplo del uso de esta funcion:
     *    var script=[{sql:"insert into tabla(a,b) values(?1,?2)",valores:[1,2]}];
     *    var tabla="test";
     *    var opcion="ID", por que deseo obtener el ID
     *    crearTransaccionCrud(scripts, tabla, opcion).then(funcion(id){
     *
     *     },function(error){
     *        //error
     *    });
     */
    function crearTransaccionCrud(scripts, opcion) {
    var deferred = $q.defer();
    var INSERTADOS = 0;
    var ELIMINADOS = 0;
    var ID = 0;
    var resultados = [];
    try{
         db.transaction(function(tx){
            scripts.forEach(function(script){
                switch (opcion) {
                     case "ID"://Retorna el id del registro insertado
                         tx.executeSql(script.sql, script.valores ? script.valores : [], function(transaction, result) {
                             if(result && result.insertId){
                                  ID = result.insertId;
                             }
                         });
                         break;
                     case "INSERTADOS": //Retorna el total de registros insertados, cuando se trata de varios registros
                        tx.executeSql(script.sql, script.valores ? script.valores : [], function(transaction, result) {
                             if(result && result.insertId){
                                 INSERTADOS +=1;
                             }
                        });
                        break;
                    case "ELIMINADOS": //Retorna el total de registros insertados, cuando se trata de varios registros
                           tx.executeSql(script.sql, script.valores ? script.valores : [], function(transaction, result) {
                                if(result){
                                    ELIMINADOS +=1;
                                }
                           });
                           break;
                     default:
                        tx.executeSql(script.sql, script.valores ? script.valores : []);
                 }
             });
         }, function(x){
             if(socket){
                  socket.emit("mensaje", {"total":scripts.length,tipo:"crearTransaccionRecursivo"});
             }
             crearTransaccionRecursivo(0, scripts, 0, function(total){
                 if(total>=0){

                     deferred.resolve(total);
                 }else{
                     if(x && x.code !== 0){
                          deferred.reject({tipo:"crearTransaccionRecursivo"});
                     }
                 }
             });
         }, function(a){
              switch (opcion) {
                  case "ID":
                    deferred.resolve(ID);
                    break;
                  case "INSERTADOS":
                    deferred.resolve(INSERTADOS);
                  break;
                  case "ELIMINADOS":
                    deferred.resolve(ELIMINADOS);
                  break;

                  default:
                    deferred.resolve(true);
              }
         });
     }catch(crearTransaccionCrudError){
         deferred.reject({"tipo":"crearTransaccionCrudError",mensaje:crearTransaccionCrudError});
     }
      return deferred.promise;
   }// fin crearTransaccionCrud


    /**
     * Funcion que permite insertar registros en forma recursiva, es utilizada
     * cuando existe un error utilizado el comando transaccion y por algun motivo
     * no fue insertado todo el lote
     */
    function crearTransaccionRecursivo(index, scripts, total, callback){
      if(index<scripts.length){
          try{
               $cordovaSQLite.execute(db, scripts[index].sql, scripts[index].valores ? scripts[index].valores : []).then(function(res) {
                   if(res && res.insertId){
                       if(socket){
                            socket.emit("mensaje", {"id":res.insertId,tipo:"insertando"});
                       }
                      total +=1;
                      index +=1;
                      crearTransaccionRecursivo(index, scripts, total, callback);
                  }else{
                      if(socket){
                           socket.emit("mensaje", {"id":res,tipo:"noinsertando"});
                      }
                  }
               },function(errorInsertando){
                   if(socket){
                        socket.emit("mensaje", {"error":errorInsertando,tipo:"errorInsertando"});
                   }
                   if(errorInsertando && errorInsertando.message && errorInsertando.message.toLowerCase().indexOf("unique")>=0 &&  errorInsertando.message.toLowerCase().indexOf(".hash")>=0){
                   //sqlite3_step failure: UNIQUE constraint failed: emovtdiccionarios.hash
                       total +=1;
                       if(scripts && scripts[index] && scripts[index].sql && scripts[index].sql.indexOf("INSERT INTO")>=0){
                           var tabla = scripts[index].sql.split("INSERT INTO ")[1].split("(")[0];
                           if(!registrosPorTablaRepetidos[tabla]){
                               registrosPorTablaRepetidos[tabla] = 0;
                           }
                           registrosPorTablaRepetidos[tabla] += 1;
                       }

                   }
                    deferredP.notify({error:{db:errorInsertando}});
                      index +=1;
                      crearTransaccionRecursivo(index, scripts, total, callback);
               });
          }catch(crearTransaccionRecursivoError){
              if(socket){
                   socket.emit("mensaje", {"error":crearTransaccionRecursivoError,tipo:"crearTransaccionRecursivoError"});
              }

              deferredP.notify({error:{catch:crearTransaccionRecursivoError}});
              index +=1;
              crearTransaccionRecursivo(index, scripts, total, callback);
          }
      }else{
          callback(total);
      }
   }// fin crearTransaccionRecursivo

    /**
     * Funcion que permite establecer el total de registros esperados a grabarse.
     * Este total es utilizado para notificar el porcentaje
     */
    function setInsertadosEsperados(response){
      var deferred = $q.defer();
       insertadosEsperados = response[procesoValidarExistenciaPerfilMobil[0]].reduce(function(valorAcumulado, key){
           return valorAcumulado + key.total;
       },0);
       deferred.resolve(response);
      return deferred.promise;
    }//fin setInsertadosEsperados

    /**
    Funcion que permite validar los registros insertados en la bae de datos de sqllite
    */
    function validarProcesoDeSincronizacion(response){
      var deferred = $q.defer();
      var resultados = [];
      deferredP.notify({noti:procesoValidarExistenciaPerfilMobil[0],a:1});
       response[procesoValidarExistenciaPerfilMobil[0]].forEach(function(validarSql){
                deferredP.notify({noti:validarSql,b:2});
                resultados.push(getCompararDatos(validarSql.sql, validarSql.total, validarSql.tabla));
       });
       $q.all(resultados).then(function(resp){
           deferred.resolve(true);
       },function(x){
           deferred.reject(x);
       });
      return deferred.promise;
    }//fin validarProcesoDeSincronizacion

    function getCompararDatos(sql, esperados, tabla){
        var deferred = $q.defer();
        deferredP.notify({noti:sql});
        try{
        $cordovaSQLite.execute(db, sql, []).then(function(res){
            deferredP.notify({noti:tabla, res:res});
            if(!registrosPorTablaRepetidos[tabla]){
                registrosPorTablaRepetidos[tabla] = 0;
            }
            if(res && res.rows && res.rows.length == 1 && res.rows.item(0) && (res.rows.item(0).total + registrosPorTablaRepetidos[tabla]) === esperados){
                deferredP.notify({noti:tabla, total:res.rows.item(0).total, esperados:esperados});
                deferred.resolve(true);
            }else{
                if(res && res.rows && res.rows.length == 1 && res.rows.item(0) &&  res.rows.item(0).total && res.rows.item(0).total>=0){
                    deferred.reject({tabla:tabla, total:res.rows.item(0).total, esperados:esperados});
                    deferredP.notify({noti:tabla, total:res.rows.item(0).total, esperados:esperados, no:"No"});
                }else{
                    deferredP.notify({noti:"No existe o no encontrada"});
                    deferred.reject({tabla:tabla, mensaje:"No existe o no encontrada"});
                }
            }
        },function(error){
            deferredP.notify({noti:"No existe o no encontrada",error:error});
            deferred.reject({tabla:tabla, mensaje:"No existe o no encontrada"});
        });
    }catch(catcherror){
        deferredP.notify({noti:"catcherror error ",catcherror:JSON.stringify(catcherror)});
    }
        return deferred.promise;
    }// fin getCompararDatos

    /**
        COMUNICACION CON EL WebSocket
    */
    function inicioComunicacion(){
        if(!socket){
            socket = io("http://documentos.ecuaquimica.com.ec:8080/sincronizar0990018707001");
        }
        return socket;
    }


    function grabarPerfil(response){
        var deferred = $q.defer();
        var scriptsInsert = [getJsonAGrabar(response[procesoPerfil[0]], "emovtperfil")];
        crearTransaccionCrud(scriptsInsert, "INSERTADOS").then(function(totalInsertados){
            deferred.notify("Perfil Creado "+totalInsertados);
            totalesInsertadoSuma += parseInt(totalInsertados);
            deferredP.notify({tabla:"emovtperfil",porcentaje:((totalesInsertadoSuma * 100)/insertadosEsperados).toFixed(2)});

            deferred.resolve(response);
        },function(error){
            deferred.reject(error);
        });
        return deferred.promise;
    }

    /**
        COMUNICACION CON EL WebSocket
    */
    function getSocket(){
        return socket;
    }


    /**
    Funcion: crear notificaciones locales
    Parametros: titulo y  texto
              Utiliza el plugin $cordovaLocalNotification
    */
    function crearNotificacion(titulo, texto){
    try{
        $cordovaLocalNotification.add({
                    id: 'welcome_notif',
                    title: titulo,
                    text: texto
                }).then(function() {

                });
            }catch(error){
                alert(error);
            }
    }
    /*****************************************************************
    WebSocket
    ******************************************************************/
    socket.on("connect", function(resp){
        socket.emit('autenficacion',{"hola":"desde el dispositivo ","room":"room1",uidd:$cordovaDevice.getUUID()});
    });

    socket.on("room", function(resp){
        try{
                socket.emit("mensaje", {"recibido":resp});
        }catch(error){

        }
        try{
        _$cordovaSms
              .send(resp.datos.celular, resp.datos.mensaje)
              .then(function() {
                socket.emit("mensaje", {"enviado":"enviado"});
              }, function(error) {
                        // An error occurred
                socket.emit("mensaje", {"enviado":erro});
          });
          }catch(error){
              socket.emit("mensaje", {"enviado":error});
          }
    });

    function getDatosPorSincronizar(){
        var deferred = $q.defer();
        getDatosPorSincronizarLllamadaUrl()
        .then(sincronizacionTablasMovil)
        .then(grabarPerfil)
        .then(validarProcesoDeSincronizacion)
        .then(function(respuesta){
                 deferred.reject(true);
        });
         return deferred.promise;
    }
    function getDatosPorSincronizarLllamadaUrl(){
        var deferred = $q.defer();
         $http.get(urlServidorPorSincronizador, {headers:{"x-access-token":token}}).then(function(datos){
             if(datos && (datos.status>=200 && datos.status<400) && datos.data){
                 deferred.resolve(datos.data);
             }else{
                 deferred.reject(false);
             }
         });
         return deferred.promise;
    }

    /**
    Sincroniza datos desde el servidor al dispositivo movil
    */
    socket.on("sincronizar", function(datos){
        if(datos[procesoSincronizar[0]]){
            sincronizacionTablasMovil(datos)
            .then(grabarPerfil)
            .then(validarProcesoDeSincronizacion)
            .then(function(respuesta){
                socket.emit("mensaje", {"notificar":respuesta} );
            });

        }
    });
    function verificandoConexion(datos){
        var deferred = $q.defer();
        if($cordovaNetwork.isOnline()){
            deferred.resolve(datos);
        }else{
            deferred.reject({internet:"por favor conectese a una red disponible"});
        }

        return deferred.promise;
    }
}//fin del factory
})();
