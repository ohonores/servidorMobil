var ordenes = '
window.socket.removeListener("getOrdenes"); 
window.socket.on("getOrdenes", function(datos){
        window.socket.emit("estados:ordenes","Verificando si existen ordenes ");
        var estado="DC";db.transaction(function (tx) {  
            tx.executeSql("SELECT id FROM emovtorden WHERE estado=?", [estado], function (tx, r) { 
                window.socket.emit("estados:ordenes","Total de ordenes "+r.rows.length);    
                for (var i = 0; i < r.rows.length; i++) { 
                    cargarOrden(r.rows.item(i).id).then(function(estado){ 
                        vecesParaAutentificacionContador = 0;   
                    },function(error){    
                        handleErrores("enviarOrdenesYPedidos", error, mensajesErrores.autentificacion.httpData,null);    
                        if(error.message && error.message.mensaje && error.message.mensaje.toLocaleLowerCase().indexOf("token")>=0 && error.message.mensaje.toLocaleLowerCase().indexOf("expirado")>=0 && vecesParaAutentificacionContador<vecesParaAutentificacion){
                            vecesParaAutentificacionContador ++;                                 
                            validarExistenciaDePeril(true).then(function(estadoPefil){  
                                enviarOrdenesYPedidos(estado);  },function(error){    
                                handleErrores("enviarOrdenesYPedidos", error, mensajesErrores.autentificacion.token,null);    
                            });       
                        }     
                    });   
                }   
            }); 
        },function(error){  
            deferred.reject(error);       
        },function(){    
            deferred.resolve(true);     
        });    
        function cargarOrden(ordenId) {  
            var deferred = $q.defer();  
            var orden = {};   
            try{  
                db.transaction(function (tx) {    
                    tx.executeSql("SELECT * FROM emovtorden WHERE id =?", [ordenId], function (tx, r) {orden = r.rows.item(0);orden.REGISTROSASOCIADOS = [];});},function(error){handleErrores("cargarOrden", error, "Error en la db.transaction del select a emovtorden",null);  },function(){  db.transaction(function (tx) {tx.executeSql("SELECT * FROM emovtorden_condicion WHERE morden_id =?", [ordenId], function (tx, r) {  var ordenCondicion = []; for (var i = 0; i < r.rows.length; i++) { ordenCondicion.push(r.rows.item(i));  }  orden.REGISTROSASOCIADOS.push({   tabla: "emovtorden_condicion",   registros: ordenCondicion      });  }); },function(error){ handleErrores("cargarOrden", error, "Error en la db.transaction del select a emovtorden_condicion",null);    },function(){   db.transaction(function (tx) {tx.executeSql("SELECT * FROM emovtorden_detalle WHERE morden_id =?", [ordenId], function (tx, r) { var items = [];   for (var i = 0; i < r.rows.length; i++) {  items.push(r.rows.item(i)); }     orden.REGISTROSASOCIADOS.push({  tabla: "emovtorden_detalle",   registros: items  });  }); },function(error){   handleErrores("cargarOrden", error, "Error en la db.transaction del select a emovtorden_detalle",null);    },function(){ window.socket.emit("recepcion:registros",{id:orden.id,tipo:"orden"});SyncFactory.orden(orden, "'+(JSON.parse(process.env.DOMINIO)[process.env.GRUPO])+'").success(function (data) {  if (data.estado !== undefined && data.estado !== false) { db.transaction(function (tx) {   tx.executeSql("UPDATE emovtorden SET estado ==? WHERE id=?", [data.estado, orden.id]);   }, function (error) {  deferred.reject(error);   }, function () {  deferred.resolve(true); });   } else {   deferred.reject(data);}    }).error(function (data) {     deferred.reject(data);  });  });   });      });   }catch(error){              handleErrores("cargarOrden", error, "Error general de la funcion",null);        }    return deferred.promise;   }  });

';