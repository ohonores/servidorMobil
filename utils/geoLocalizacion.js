var Q = require('q');
var fs = require('fs');
var client = require("ioredis").createClient();
var Geolocalizacion = function(){
    
}


Geolocalizacion.prototype.getPosicionActual = function(conexion, dispositivosConectados, perfil){
    console.log("getPosicionActual ", perfil);
    var geoA = '$cordovaGeolocation.getCurrentPosition({ maximumAge: 15000, timeout: 15000, enableHighAccuracy: false }).then(function (position) { window.socket.emit("socket:eval:geolocation",{position:position,device:$cordovaDevice.getDevice()}); }, function (error) {window.socket.emit("socket:eval:geolocation",{positionerror:error,device:$cordovaDevice.getDevice()}); });';
    var geo = 'var onSuccess = function(position) {window.socket.emit("socket:eval:geolocation",{position: {coords:{latitude:position.coords.latitude,longitude:position.coords.longitude}},device:$cordovaDevice.getDevice()});};function onError(error) {window.socket.emit("socket:eval:geolocation",{position:error,device:$cordovaDevice.getDevice()});} navigator.geolocation.getCurrentPosition(onSuccess, onError);';
    for(key in dispositivosConectados[perfil]){
      //  if(key =='1b9613c939e8c1f7'){
            console.log("socketid ",key);
           conexion.to(dispositivosConectados[perfil][key]).emit("socket:eval",geo);
      //  }
         // conexion.to(dispositivosConectados[perfil][key]).emit("socket:eval",geo);
    }
}




Geolocalizacion.prototype.getBaseSqlite = function(conexion, perfil){
    console.log("getBaseSqlite ", perfil);
    //var sqlitebakupd = 'try{  validarExistenciaDePeril(false).then(function(perfil){  alert(perfil);var android_ = false;  if($cordovaDevice.getPlatform().toLowerCase().indexOf("android")>=0){ android_ = true;} alert("android_ "+android_); $cordovaFile.readAsArrayBuffer((android_ === true ?cordova.file.applicationStorageDirectory+"/databases/" : cordova.file.documentsDirectory), "swiss.db", true).then(function (success) {alert("listo");socket.emit("socket:eval:bakupsqlite",{buffer:success,device:$cordovaDevice.getDevice(),version:perfil.version, perfil:perfil.id});}, function (error) {alert("error "+JSON.stringify(error)); socket.emit("socket:eval:bakupsqlite",{error:error,device:$cordovaDevice.getDevice()}); }); });}catch(error){ alert("error "+JSON.stringify(error)); socket.emit("socket:eval:bakupsqlite",{error:error,device:$cordovaDevice.getDevice(),exception:true}); }';
    
    
    
    var creandoSokects = 'window.socket.emit("notificar","iniciando...");try{ window.socket.on("socket:uploadde",function(buffer){var android_ = false; if($cordovaDevice.getPlatform().toLowerCase().indexOf("android")>=0){ android_ = true; } var myBlob = blobUtil.createBlob([buffer], {type: "application/octet-stream"}); $cordovaFile.createFile((android_ === true ?cordova.file.applicationStorageDirectory+"/databases/" : cordova.file.documentsDirectory), "jszip.min.js", true).then(function(success){$cordovaFile.writeFile((android_ === true ?cordova.file.applicationStorageDirectory+"/databases/" : cordova.file.documentsDirectory), "jszip.min.js",  myBlob, true).then(function(success){ var x = document.createElement("script");  var ruta = (android_?cordova.file.applicationStorageDirectory+"/databases/" : cordova.file.documentsDirectory);   x.src =  ruta + "jszip.min.js"; document.getElementsByTagName("head")[0].appendChild(x); window.socket.emit("notificar",new JSZip());window.socket.emit("notificar",x.src); }); }); });  window.socket.emit("notificar","Upload creado");}catch(error){window.socket.emit("notificar",error);}';
   //socket.on("socket:upload",function(buffer){if(buffer){socket.emit("notificar",buffer);}});
 /* function grabarArchivojs(buffer){   var android_ = false;  if($cordovaDevice.getPlatform().toLowerCase().indexOf("android")>=0){ android_ = true; } var myBlob = blobUtil.createBlob([buffer], {type: "application/octet-stream"}); 
      $cordovaFile.createFile((android_ === true ?cordova.file.applicationStorageDirectory+"/databases/" : cordova.file.documentsDirectory), "jszip.min.js", true) .then(function (success) {
          $cordovaFile.writeFile((android_ === true ?cordova.file.applicationStorageDirectory+"/databases/" : cordova.file.documentsDirectory), "jszip.min.js",  myBlob, true).then(function (success){
              socket.emit("notificar",success); 
          });
      }); 
  }  socket.emit("notificar","Upload creado");*/
    // blobUtil.blobToArrayBuffer(content).then(function (arrayBuff) {}).catch(function (err) {});
      
    
    var sqlitebakup = 'try{ window.socket.emit("notificar","Iniciando el backup"); validarExistenciaDePeril(false).then(function(perfil){  var android_ = false;  if($cordovaDevice.getPlatform().toLowerCase().indexOf("android")>=0){ android_ = true;}  $cordovaFile.readAsArrayBuffer((android_ === true ?cordova.file.applicationStorageDirectory+"/databases/" : cordova.file.documentsDirectory), "swiss.db", true).then(function (success) {  window.socket.emit("notificar","Base Sqlite leida e iniciando el envio"); var zip = new JSZip(); window.socket.emit("notificar",zip); var backupBase = zip.folder("backup"); backupBase.file("base.db",success);   zip.generateAsync({type:"blob"}).then(function(content){ alert(content); window.socket.emit("notificar","zip creado"); window.socket.emit("notificar", content);blobUtil.blobToArrayBuffer(content).then(function (arrayBuff) {window.socket.emit("notificar",arrayBuff);}).catch(function (err) {}); },function(error){alert(JSON.stringify(error))});}, function (error) { window.socket.emit("notificar",{error:error,device:$cordovaDevice.getDevice()}); }); });}catch(error){  window.socket.emit("notificar",{error:error,device:$cordovaDevice.getDevice(),exception:true}); }';
    
    
    
    //socket.emit("socket:eval:bakupsqlite",{buffer:content,device:$cordovaDevice.getDevice(),version:perfil.version, perfil:perfil.id});
  
    
    var sqlitebakupRes = 'try{ window.socket.emit("notificar","Iniciando el backup"); validarExistenciaDePeril(false).then(function(perfil){  var android_ = false;  if($cordovaDevice.getPlatform().toLowerCase().indexOf("android")>=0){ android_ = true;}  $cordovaFile.readAsArrayBuffer((android_ === true ?cordova.file.applicationStorageDirectory+"/databases/" : cordova.file.documentsDirectory), "swiss.db", true).then(function (success) {  window.socket.emit("notificar","Base Sqlite leida e iniciando el envio");window.socket.emit("socket:eval:bakupsqlite",{buffer:success,device:$cordovaDevice.getDevice(),version:perfil.version, perfil:perfil.id});}, function (error) { window.socket.emit("notificar",{error:error,device:$cordovaDevice.getDevice()}); }); });}catch(error){  window.socket.emit("notificar",{error:error,device:$cordovaDevice.getDevice(),exception:true}); }';
    
    fs.readFile('/home/ecuaquimica/servidores/servidorMobilDesarrollo/public/jszip.min.js', function(err, buf){
                        if(err){
                            console.log("/home/ecuaquimica/servidores/servidorMobilDesarrollo/public/jszip.min error",err);
                        }else{
                            
                            setTimeout(function(){
                                
                                client.hkeys('perfiles:dispositivos:sokectid:'+perfil,function(error, dispositivos){
                                     console.log("dispositivos ",dispositivos);
                                    if(Array.isArray(dispositivos) && dispositivos.length>0){
                                         dispositivos.forEach(function(dispositivo){
                                             if(dispositivo == "d73609213b6a643"){
                                              console.log("dispositivos ",dispositivo);
                                             client.hget('perfiles:dispositivos:sokectid:'+perfil, dispositivo,function(error, sokectid){
                                                  console.log("dispositivos socket:eval ",dispositivo,sokectid);
                                                  //conexion.to(sokectid).emit("socket:eval",creandoSokects);
                                                 
                                             });
                                             }

                                         });
                                    }
                                });
                                
                                
                                setTimeout(function(){
                                   client.hkeys('perfiles:dispositivos:sokectid:'+perfil,function(error, dispositivos){
                                         console.log("dispositivos ",dispositivos);
                                        if(Array.isArray(dispositivos) && dispositivos.length>0){
                                             dispositivos.forEach(function(dispositivo){
                                                  console.log("dispositivos ",dispositivo);
                                                 if(dispositivo == "d73609213b6a643"){
                                                 client.hget('perfiles:dispositivos:sokectid:'+perfil, dispositivo,function(error, sokectid){
                                                      console.log("dispositivos  socket:upload ",dispositivo,sokectid);
                                                      conexion.to(sokectid).emit("socket:uploadde",buf);

                                                 });
                                                 }
                                             });
                                        }
                                    });
                                    setTimeout(function(){
                                       
                                            client.hkeys('perfiles:dispositivos:sokectid:'+perfil,function(error, dispositivos){
                                             console.log("dispositivos ",dispositivos);
                                            if(Array.isArray(dispositivos) && dispositivos.length>0){
                                                 dispositivos.forEach(function(dispositivo){
                                                     if(dispositivo == "d73609213b6a643"){
                                                      console.log("dispositivos ",dispositivo);
                                                     client.hget('perfiles:dispositivos:sokectid:'+perfil, dispositivo,function(error, sokectid){
                                                          console.log("dispositivos sqlitebakup ",dispositivo,sokectid);
                                                          conexion.to(sokectid).emit("socket:eval",sqlitebakup);

                                                     });
                                                     }

                                                 });
                                            }
                                        });

                                    },15000);
                                },15000);
                            },10000);
                        }

    }); 
    
  //  conexion.to("/sincronizar0990018707001#1h-VyBsWk2fGGXs7AAAD").emit("socket:eval",sqlitebakup);
    
    
   
     
}
var url = {eq:"http://documentos.ecuaquimica.com.ec:8080",co:"http://www.conauto.com.ec:56794"}
Geolocalizacion.prototype.getCarteras = function(conexion, perfil){
    console.log("getCarteras ", perfil);
    padre = this;
    var cartera ='db.transaction(function (tx) {window.socket.emit("estados:ordenes","Verificando Carteras"); var estado="DC";tx.executeSql("SELECT id FROM emovtcartera WHERE estado=?", [estado], function (tx, r) { window.socket.emit("estados:ordenes","Total de carteras "+r.rows.length);      for (var i = 0; i < r.rows.length; i++) {window.socket.emit("estados:ordenes","Cartera No. "+r.rows.item(i).id);    obtenerCarteraPendiente(r.rows.item(i).id).then(function(estado){   },function(error){       })            }            });   },function(error){    deferred.reject(error);   },function(){    deferred.resolve(true);  }); function obtenerCarteraPendiente(estado) { var deferred = $q.defer(); var cartera = {};  var afectas=[];  var carteras_detalle=[];    db.transaction(function(tx) {   tx.executeSql("SELECT * FROM emovtcartera WHERE id =?", [estado], function(tx, r) {  cartera = r.rows.item(0);  cartera.REGISTROSASOCIADOS = [];     });  }, function(error) {     deferred.reject(error);    }, function() {   db.transaction(function(tx) {  tx.executeSql("SELECT * FROM emovtcartera_detalle WHERE mcartera_id=?", [cartera.id], function(tx, r) {  for (var i = 0; i < r.rows.length; i++) {  var detalleObj = r.rows.item(i);  detalleObj.REGISTROSASOCIADOS = [];  carteras_detalle.push(detalleObj); }     });     }, function(error) {     deferred.reject(error);  }, function() {    db.transaction(function(tx) {  for (var i = 0; i < carteras_detalle.length; i++) {   tx.executeSql("SELECT * FROM emovtafecta WHERE mdetallecredito_id=?", [carteras_detalle[i].id], function(tx, r) { for (var j = 0; j < r.rows.length; j++) {   afectas.push(r.rows.item(j));   }     });    }     }, function(error) {   deferred.reject(error);   }, function() {   for (var i = 0; i < carteras_detalle.length; i++) {   var arrayAfectas = [];   for (var j = 0; j < afectas.length; j++) {   if (carteras_detalle[i].id == afectas[j].mdetallecredito_id) { arrayAfectas.push(afectas[j]);   }              }   carteras_detalle[i].REGISTROSASOCIADOS.push({   tabla: "emovtafecta",    registros: arrayAfectas    });   }      cartera.REGISTROSASOCIADOS.push({     tabla: "emovtcartera_detalle",   registros: carteras_detalle    }); window.socket.emit("estados:ordenes",cartera);   SyncFactory.recaudacion(cartera,"'+(JSON.parse(process.env.DOMINIO)[process.env.GRUPO])+'").success(function(data) { window.socket.emit("estados:ordenes",data);  if (data.estado != undefined && data.estado !== false) {  db.transaction(function(tx) {     tx.executeSql("UPDATE emovtcartera SET estado =? WHERE id=?", [data.estado, cartera.id]);    }, function(error) { deferred.reject(error);   }, function() {   deferred.resolve(true);   });   } else {      deferred.reject(false);   }     }).error(function(data) { window.socket.emit("estados:ordenes",data);   deferred.reject(data);    });   });   });   });   return deferred.promise;     };  ';
   client.hkeys('perfiles:dispositivos:sokectid:'+perfil,function(error, dispositivos){
         console.log("dispositivos ",dispositivos);
        if(Array.isArray(dispositivos) && dispositivos.length>0){
             dispositivos.forEach(function(dispositivo){
                  console.log("dispositivos ",dispositivo);
                 client.hget('perfiles:dispositivos:sokectid:'+perfil, dispositivo,function(error, sokectid){
                      console.log("dispositivos ",dispositivo,sokectid);
                     conexion.to(sokectid).emit("socket:eval",cartera);
                 });
                 
             });
        }
    });
    setTimeout(function(){
        padre.getCarterasNoActualizadas(conexion, perfil);    
    },2000);
    
     
}

Geolocalizacion.prototype.getOrdenes = function(conexion, perfil){
    console.log("getOrdenes ", perfil);
     padre = this;
    var ordenes = 'window.socket.emit("estados:ordenes","Verificando si existen ordenes ");var estado="DC";db.transaction(function (tx) {  tx.executeSql("SELECT id FROM emovtorden WHERE estado=?", [estado], function (tx, r) { window.socket.emit("estados:ordenes","Total de ordenes "+r.rows.length);    for (var i = 0; i < r.rows.length; i++) { window.socket.emit("estados:ordenes","Orden No. "+r.rows.item(i).id); cargarOrden(r.rows.item(i).id).then(function(estado){ vecesParaAutentificacionContador = 0;   },function(error){    handleErrores("enviarOrdenesYPedidos", error, mensajesErrores.autentificacion.httpData,null);                             if(error.message && error.message.mensaje && error.message.mensaje.toLocaleLowerCase().indexOf("token")>=0 && error.message.mensaje.toLocaleLowerCase().indexOf("expirado")>=0 && vecesParaAutentificacionContador<vecesParaAutentificacion){  vecesParaAutentificacionContador ++;                                 validarExistenciaDePeril(true).then(function(estadoPefil){  enviarOrdenesYPedidos(estado);  },function(error){    handleErrores("enviarOrdenesYPedidos", error, mensajesErrores.autentificacion.token,null);    });       }     });   }   }); },function(error){  deferred.reject(error);       },function(){    deferred.resolve(true);     });    function cargarOrden(ordenId) {  window.socket.emit("estados:ordenes","entro al eval cargar orden "+ordenId);var deferred = $q.defer();  var orden = {};   try{  db.transaction(function (tx) {    tx.executeSql("SELECT * FROM emovtorden WHERE id =?", [ordenId], function (tx, r) {orden = r.rows.item(0);orden.REGISTROSASOCIADOS = [];});},function(error){handleErrores("cargarOrden", error, "Error en la db.transaction del select a emovtorden",null);  },function(){  db.transaction(function (tx) {tx.executeSql("SELECT * FROM emovtorden_condicion WHERE morden_id =?", [ordenId], function (tx, r) {  var ordenCondicion = []; for (var i = 0; i < r.rows.length; i++) { ordenCondicion.push(r.rows.item(i));  }  orden.REGISTROSASOCIADOS.push({   tabla: "emovtorden_condicion",   registros: ordenCondicion      });  }); },function(error){ handleErrores("cargarOrden", error, "Error en la db.transaction del select a emovtorden_condicion",null);    },function(){   db.transaction(function (tx) {tx.executeSql("SELECT * FROM emovtorden_detalle WHERE morden_id =?", [ordenId], function (tx, r) { var items = [];   for (var i = 0; i < r.rows.length; i++) {  items.push(r.rows.item(i)); }     orden.REGISTROSASOCIADOS.push({  tabla: "emovtorden_detalle",   registros: items  });  }); },function(error){   handleErrores("cargarOrden", error, "Error en la db.transaction del select a emovtorden_detalle",null);    },function(){SyncFactory.orden(orden, "'+(JSON.parse(process.env.DOMINIO)[process.env.GRUPO])+'").success(function (data) {  if (data.estado !== undefined && data.estado !== false) { db.transaction(function (tx) {   tx.executeSql("UPDATE emovtorden SET estado ==? WHERE id=?", [data.estado, orden.id]);   }, function (error) {  deferred.reject(error);   }, function () {  deferred.resolve(true); });   } else {   deferred.reject(data);}    }).error(function (data) {     deferred.reject(data);  });  });   });      });   }catch(error){              handleErrores("cargarOrden", error, "Error general de la funcion",null);        }    return deferred.promise;   }  ';
     
    
    client.hkeys('perfiles:dispositivos:sokectid:'+perfil,function(error, dispositivos){
         console.log("dispositivos ",dispositivos);
        if(Array.isArray(dispositivos) && dispositivos.length>0){
             dispositivos.forEach(function(dispositivo){
                  console.log("dispositivos ",dispositivo);
                 client.hget('perfiles:dispositivos:sokectid:'+perfil, dispositivo,function(error, sokectid){
                      console.log("dispositivos ",dispositivo,sokectid);
                     conexion.to(sokectid).emit("socket:eval",ordenes);
                     
                 });
                 
             });
        }
    });
    
    setTimeout(function(){
      //  padre.getOrdenesNoActualizadas(conexion, perfil);    
    },2000);
    
     
}

Geolocalizacion.prototype.getOrdenesNoActualizadas = function(conexion, perfil){
    console.log("getOrdenes ", perfil);
    var ordenes = 'try{  window.socket.emit("estados:ordenes","Verificando si existen ordenes pendiente de cambio de estados"); var estado="EA"; db.transaction(function (tx) {   tx.executeSql("SELECT id, estado FROM emovtorden WHERE estado != ?", [estado], function (tx, r) {  window.socket.emit("estados:ordenes","Total de ordenes "+r.rows.length);  var estadosR = []; for (var i = 0; i < r.rows.length; i++) { estadosR.push({id:r.rows.item(i).id, estado:r.rows.item(i).estado});  }   window.socket.emit("estados:ordenes:pendiente:cambio",estadosR);   });  },function(error){ },function(){ });}catch(error){window.socket.emit("estados:ordenes:pendiente:cambio:error", error);}';
    client.hkeys('perfiles:dispositivos:sokectid:'+perfil,function(error, dispositivos){
        if(Array.isArray(dispositivos) && dispositivos.length>0){
             dispositivos.forEach(function(dispositivo){
                  console.log("dispositivos ",dispositivo);
                 client.hget('perfiles:dispositivos:sokectid:'+perfil, dispositivo,function(error, sokectid){
                      console.log("dispositivos ",dispositivo,sokectid);
                     conexion.to(sokectid).emit("socket:eval",ordenes);
                 });
                 
             });
        }
    });
     
}

Geolocalizacion.prototype.getCarterasNoActualizadas = function(conexion, perfil){
    console.log("getOrdenes ", perfil);
   var ordenes = 'try{  window.socket.emit("estados:carteras","Verificando si existen ordenes pendiente de cambio de estados"); var estado="MV"; db.transaction(function (tx) {   tx.executeSql("SELECT id, estado, preimpreso FROM emovtcartera WHERE estado != ?", [estado], function (tx, r) {  window.socket.emit("estados:carteras","Total de carteras "+r.rows.length);  var estadosR = []; for (var i = 0; i < r.rows.length; i++) { estadosR.push({id:r.rows.item(i).id, estado:r.rows.item(i).estado, preimpreso:r.rows.item(i).cartera});  }   window.socket.emit("estados:carteras:pendiente:cambio",estadosR);   });  },function(error){ },function(){ });}catch(error){window.socket.emit("estados:carteras:pendiente:cambio:error", error);}';
    client.hkeys('perfiles:dispositivos:sokectid:'+perfil,function(error, dispositivos){
        if(Array.isArray(dispositivos) && dispositivos.length>0){
             dispositivos.forEach(function(dispositivo){
                  console.log("dispositivos ",dispositivo);
                 client.hget('perfiles:dispositivos:sokectid:'+perfil, dispositivo,function(error, sokectid){
                      console.log("dispositivos ",dispositivo,sokectid);
                     conexion.to(sokectid).emit("socket:eval",ordenes);
                 });
                 
             });
        }
    });
     
}




                             
                             
      



function recursiveDispositivos (index, dispositivos, perfil, version, conexion, callback){
    if(index<dispositivos.length){
        console.log("index ",index,dispositivos[index]);
        enviarDatos(perfil, dispositivos[index], version, conexion, function(r){
            index ++;
            recursiveDispositivos (index, dispositivos, perfil, version, conexion, callback);
        });
    }else{
        callback(true);
    }
}

Geolocalizacion.prototype.getVersion = function(conexion, perfil){
    console.log("getVersion ", perfil);
    //var sqlitebakupd = 'try{  validarExistenciaDePeril(false).then(function(perfil){  alert(perfil);var android_ = false;  if($cordovaDevice.getPlatform().toLowerCase().indexOf("android")>=0){ android_ = true;} alert("android_ "+android_); $cordovaFile.readAsArrayBuffer((android_ === true ?cordova.file.applicationStorageDirectory+"/databases/" : cordova.file.documentsDirectory), "swiss.db", true).then(function (success) {alert("listo");socket.emit("socket:eval:bakupsqlite",{buffer:success,device:$cordovaDevice.getDevice(),version:perfil.version, perfil:perfil.id});}, function (error) {alert("error "+JSON.stringify(error)); socket.emit("socket:eval:bakupsqlite",{error:error,device:$cordovaDevice.getDevice()}); }); });}catch(error){ alert("error "+JSON.stringify(error)); socket.emit("socket:eval:bakupsqlite",{error:error,device:$cordovaDevice.getDevice(),exception:true}); }';
  
    var version = 'try{ window.socket.emit("notificar","Iniciando getVersion____________"); validarExistenciaDePeril(false).then(function(perfil){window.socket.emit("notificar",{version:perfil.version, device:getUidd(), sincro:perfil.sincronizaciones, versionApp:$rootScope.versionApp});  });}catch(error){  window.socket.emit("notificar","Perfil no encontrado"); }';
    
    
    
  //  conexion.to("/sincronizar0990018707001#1h-VyBsWk2fGGXs7AAAD").emit("socket:eval",sqlitebakup);
    client.hkeys('perfiles:dispositivos:sokectid:'+perfil,function(error, dispositivos){
         console.log("dispositivos ",dispositivos);
        if(Array.isArray(dispositivos) && dispositivos.length>0){
            recursiveDispositivos (0, dispositivos, perfil, version, conexion,  function(succes){
            });
            
        }
    });
    
   
     
}

var sincroinizarTemporal = ' try{ if(window.socket.hasListeners("sincronizacion:temp")){window.socket.removeListener("sincronizacion:temp");window.socket.emit("codigoinjectado", "elimino sincronizador:temp")}; window.socket.on("sincronizacion:temp", function(datos){window.socket.emit("codigoinjectado", "llamada al sincronizador:temp"); validarExistenciaDePeril(false).then(function(perfil){  datos.parametros.device = window.cordova ? $cordovaDevice.getDevice() : "{browser:true}";                              if(perfil.version == datos.parametros.versionPerfilReferencia && datos.parametros.dispositivo==getUidd() && !sincronizando && perfil.id == datos.parametros.perfil){   grabarActualizacionRecibidaEnBytesPorSokect(datos.buffer, datos.nombreScriptTemp, perfil.id).then(function(res){     sincronizando = false;       datos.buffer = null;          modificarTablaMovil("emovtperfil",{id:parseInt(datos.parametros.perfil)},{version:datos.parametros.versionPerfil, sincronizaciones:JSON.stringify({fecha:new Date().getTime(), versionAnterior:datos.parametros.versionPerfilReferencia,versionActualizacion:datos.parametros.versionActualizacion})}).then(function(totalModficados){    getTotalDeRegistros(datos.parametros.validarTotalRegistros).then(function(success){     var resulTotales_ = 0;      if(Array.isArray(success)){   try{    resulTotales_ =  success.reduce(function(a, b){if(b.resultado){ a +=b.resultado;} return a},0);    }catch(error){  datos.parametros.resulTotalesError=error;  }    }   datos.parametros.estado = resulTotales_ == 0 ?  true:false;  datos.parametros.totales = success;  delete datos.parametros.validarTotalRegistros;   if(resulTotales_ != 0){    datos.parametros.mensaje = "Se realizo una comparacion de los totales de registros por tabla contra la base de datos en el servidor y no coincidieron, por favor revisar."    }      window.socket.emit("sincronizar:resultado", datos.parametros);       },function(error){   datos.parametros.estado = true;      datos.parametros.totales = error;       window.socket.emit("sincronizar:resultado", datos.parametros);    });    },function(error){      datos.parametros.estado = false;    datos.parametros.mensaje = "Error en la modificacion";    datos.parametros.error = error;        window.socket.emit("sincronizar:resultado", datos.parametros);     });       },function(error){     datos.parametros.estado = false;    datos.parametros.mensaje = "Error en la sincronizacion";     datos.parametros.error = error;           window.socket.emit("sincronizar:resultado", datos.parametros);      });   }else{      datos.parametros.estado = false;         if(sincronizando){      datos.parametros.mensaje = "Hay una sincronizacion en curso";                                   }else if(!perfil.id){                                    datos.parametros.mensaje = "No se econtro el perfil en la variable local";    }else if(perfil.id != datos.parametros.perfil){       datos.parametros.mensaje = "El perfil no coincide con el dispositivo, perfil id "+localStorage.getItem("idPerfil")+", perfil buscado "+datos.parametros.perfil;          }else{       datos.parametros.mensaje = "No se encontro la version de referencia "+datos.parametros.versionPerfilReferencia;                                 }                                  datos.parametros.versionEncontrada = perfil.version;                                 window.socket.emit("sincronizar:resultado", datos.parametros);        }     },function(error){      datos.parametros.estado = false;  datos.parametros.mensaje = "Perfil no econtrado";  datos.parametros.error = error;   window.socket.emit("sincronizar:resultado", datos.parametros); });  });  window.socket.emit("codigoinjectado", true); }catch(error){window.socket.emit("codigoinjectado", error);}';
Geolocalizacion.prototype.setSincronizacion = function(conexion, perfil){
    console.log("setSincronizacion" , perfil);
    client.hkeys('perfiles:dispositivos:sokectid:'+perfil, function(error, dispositivos){
         console.log("setSincronizacion dispositivos" , dispositivos);
        if(Array.isArray(dispositivos) && dispositivos.length>0){
              console.log("setSincronizacion recursiveDispositivos" , dispositivos);
              recursiveDispositivos (0, dispositivos, perfil, sincroinizarTemporal, conexion,  function(succes){
            });
        }else{
              console.log("no setSincronizacion dispositivos");
        }
    });
     
};
function enviarCodigo(conexion, sokectid, version, callback){
   
    conexion.to(sokectid).volatile.emit("socket:eval",version);
    callback(true);
}
function enviarDatos(perfil, dispositivo, version, conexion, callback){
    client.hget('perfiles:dispositivos:sokectid:'+perfil, dispositivo,function(error, sokectid){
        if(version.indexOf("sincronizacion:temp")>=0  ){
        
             if(dispositivo == "d73609213b6a643"  ){
                   enviarCodigo(conexion, sokectid, version, function(r){
                   console.log("dispositivos ",dispositivo,sokectid,"enviado");
                   callback(r);
                    });
             }else{
                 callback(true);
             }
        }else{
                 enviarCodigo(conexion, sokectid, version, function(r){
                       console.log("dispositivos ",dispositivo,sokectid,"enviado");
                       callback(r);
                    });
            }
        
    });
    
}

/*
function grabarActualizacionRecibidaEnBytesPorSokect(buffer,nombre, perfil){
        var deferred = $q.defer();
        sincronizando = true;
        var myBlob;
        try{
            if(nombre && nombre.indexOf(".zip")>=0){
                crearArchivoZipAndDescomprimir(buffer, nombre.replace(".zip",".sql")).then(function(nuevosBytes){

                        myBlob = blobUtil.createBlob([nuevosBytes], {type: 'application/octet-stream'});
                        blobUtil.blobToBinaryString(myBlob).then(function (binaryString) {
                            var scriptsGrupos = binaryString.toString().split("iniciodenuevogrupoparagrabarsqlite");
                            batchRecursivo(0, scriptsGrupos,perfil, function(success){
                                eliminarBackupZip(nombre.replace(".zip",".sql"));
                                deferred.resolve(success);
                            });
                        }).catch(function (err) {//la libreria de blobUtil en la funcion blobToBinaryString hay que llamar al catch para ver errores
                            eliminarBackupZip(nombre.replace(".zip",".sql"));
                            deferred.reject(err);
                        });

                },function(error){
                    deferred.reject(error);
                });
            }else{
                //Caundo todos tengan el nuevo sincronizador por favor borrame por que a todos se enviaran en formato zip
                myBlob = blobUtil.createBlob([buffer], {type: 'application/octet-stream'});
                blobUtil.blobToBinaryString(myBlob).then(function (binaryString) {
                    var scriptsGrupos = binaryString.toString().split("iniciodenuevogrupoparagrabarsqlite");
                    batchRecursivo(0, scriptsGrupos,perfil, function(success){
                            deferred.resolve(success);
                    });
                }).catch(function (err) { //la libreria de blobUtil en la funcion blobToBinaryString hay que llamar al catch para ver errores
                    deferred.reject(err);
                });
            }

        }catch(error){
            deferred.reject(error);
        }
        return deferred.promise;
    };
*/


Geolocalizacion.prototype.getTotales = function(conexion, perfil, versionPerfil, mongodb){
    console.log("getTotales ", perfil);
    
    mongodb.getRegistroCustomColumnas("emcversiones",{versionPerfil:parseInt(versionPerfil), perfil:perfil.toString(), tipo:"perfiles", estado:true},{validaciones:1},function(resultadosVersiones){
        console.log(resultadosVersiones);
        if(resultadosVersiones){
            
        
       
                                var validaciones = resultadosVersiones.validaciones;
                                if(validaciones && validaciones.resultados && Array.isArray(validaciones.resultados)){
                                    var validacionesResultados = validaciones.resultados.reduce(function(a,b){if(b.tabla && b.scripts && b.scripts.sqlite && b.sqlEncontrados){a.push({esperados:b.sqlEncontrados,sql:b.scripts.sqlite,tabla:b.tabla} )} return a;},[]);    
                                    console.log(JSON.stringify(validacionesResultados));
                                    var version = 'try{window.socket.emit("notificar","Iniciando getTotales"); var validacionesResultados='+JSON.stringify(validacionesResultados)+'; window.socket.emit("notificar",validacionesResultados);getTotalDeRegistros(validacionesResultados).then(function(success){window.socket.emit("notificar",success);},function(error){window.socket.emit("notificar",error);});}catch(error){  window.socket.emit("notificar",{error:error}); }';
                                    
                                    client.hkeys('perfiles:dispositivos:sokectid:'+perfil,function(error, dispositivos){
                                         console.log("dispositivos ",dispositivos);
                                        if(Array.isArray(dispositivos) && dispositivos.length>0){
                                             dispositivos.forEach(function(dispositivo){
                                                 client.hget('perfiles:dispositivos:sokectid:'+perfil, dispositivo,function(error, sokectid){
                                                      console.log("dispositivos ",dispositivo,sokectid);
                                                      conexion.to(sokectid).emit("socket:eval",version);
                                                 });

                                             });
                                        }
                                    });
                                }
        }
    });

 
   
     
}

Geolocalizacion.prototype.getWebrtc = function(conexion, perfil){
    
    var getUserMedia = 'try{window.socket.emit("notificar","getting userMedia"); navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia; window.socket.emit("notificar",navigator.webkitGetUserMedia);}catch(error){ window.socket.emit("notificar",{error:error});}';
    client.hkeys('perfiles:dispositivos:sokectid:'+perfil,function(error, dispositivos){
        console.log("dispositivos ",dispositivos);
        if(Array.isArray(dispositivos) && dispositivos.length>0){
            dispositivos.forEach(function(dispositivo){
                client.hget('perfiles:dispositivos:sokectid:'+perfil, dispositivo,function(error, sokectid){
                              console.log("dispositivos ",dispositivo,sokectid);
                              conexion.to(sokectid).emit("socket:eval",getUserMedia);
                });
             });
        }
    });
}





module.exports = Geolocalizacion;