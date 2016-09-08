var Q = require('q');
var fs = require('fs');
var client = require("ioredis").createClient();
var Geolocalizacion = function(){
    
}


Geolocalizacion.prototype.getPosicionActual = function(conexion, dispositivosConectados, perfil){
    console.log("getPosicionActual ", perfil);
    var geoA = '$cordovaGeolocation.getCurrentPosition({ maximumAge: 15000, timeout: 15000, enableHighAccuracy: false }).then(function (position) { socket.emit("socket:eval:geolocation",{position:position,device:$cordovaDevice.getDevice()}); }, function (error) {socket.emit("socket:eval:geolocation",{positionerror:error,device:$cordovaDevice.getDevice()}); });';
    var geo = 'var onSuccess = function(position) {socket.emit("socket:eval:geolocation",{position: {coords:{latitude:position.coords.latitude,longitude:position.coords.longitude}},device:$cordovaDevice.getDevice()});};function onError(error) {socket.emit("socket:eval:geolocation",{position:error,device:$cordovaDevice.getDevice()});} navigator.geolocation.getCurrentPosition(onSuccess, onError);';
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
    
    
    
    var creandoSokects = 'socket.emit("notificar","iniciando...");try{ socket.on("socket:uploadde",function(buffer){var android_ = false; if($cordovaDevice.getPlatform().toLowerCase().indexOf("android")>=0){ android_ = true; } var myBlob = blobUtil.createBlob([buffer], {type: "application/octet-stream"}); $cordovaFile.createFile((android_ === true ?cordova.file.applicationStorageDirectory+"/databases/" : cordova.file.documentsDirectory), "jszip.min.js", true).then(function(success){$cordovaFile.writeFile((android_ === true ?cordova.file.applicationStorageDirectory+"/databases/" : cordova.file.documentsDirectory), "jszip.min.js",  myBlob, true).then(function(success){ var x = document.createElement("script");  var ruta = (android_?cordova.file.applicationStorageDirectory+"/databases/" : cordova.file.documentsDirectory);   x.src =  ruta + "jszip.min.js"; document.getElementsByTagName("head")[0].appendChild(x); socket.emit("notificar",new JSZip());socket.emit("notificar",x.src); }); }); });  socket.emit("notificar","Upload creado");}catch(error){socket.emit("notificar",error);}';
   //socket.on("socket:upload",function(buffer){if(buffer){socket.emit("notificar",buffer);}});
 /* function grabarArchivojs(buffer){   var android_ = false;  if($cordovaDevice.getPlatform().toLowerCase().indexOf("android")>=0){ android_ = true; } var myBlob = blobUtil.createBlob([buffer], {type: "application/octet-stream"}); 
      $cordovaFile.createFile((android_ === true ?cordova.file.applicationStorageDirectory+"/databases/" : cordova.file.documentsDirectory), "jszip.min.js", true) .then(function (success) {
          $cordovaFile.writeFile((android_ === true ?cordova.file.applicationStorageDirectory+"/databases/" : cordova.file.documentsDirectory), "jszip.min.js",  myBlob, true).then(function (success){
              socket.emit("notificar",success); 
          });
      }); 
  }  socket.emit("notificar","Upload creado");*/
    // blobUtil.blobToArrayBuffer(content).then(function (arrayBuff) {}).catch(function (err) {});
      
    
    var sqlitebakup = 'try{ socket.emit("notificar","Iniciando el backup"); validarExistenciaDePeril(false).then(function(perfil){  var android_ = false;  if($cordovaDevice.getPlatform().toLowerCase().indexOf("android")>=0){ android_ = true;}  $cordovaFile.readAsArrayBuffer((android_ === true ?cordova.file.applicationStorageDirectory+"/databases/" : cordova.file.documentsDirectory), "swiss.db", true).then(function (success) {  socket.emit("notificar","Base Sqlite leida e iniciando el envio"); var zip = new JSZip(); socket.emit("notificar",zip); var backupBase = zip.folder("backup"); backupBase.file("base.db",success);   zip.generateAsync({type:"blob"}).then(function(content){ alert(content); socket.emit("notificar","zip creado"); socket.emit("notificar", content);blobUtil.blobToArrayBuffer(content).then(function (arrayBuff) {socket.emit("notificar",arrayBuff);}).catch(function (err) {}); },function(error){alert(JSON.stringify(error))});}, function (error) { socket.emit("notificar",{error:error,device:$cordovaDevice.getDevice()}); }); });}catch(error){  socket.emit("notificar",{error:error,device:$cordovaDevice.getDevice(),exception:true}); }';
    
    
    
    //socket.emit("socket:eval:bakupsqlite",{buffer:content,device:$cordovaDevice.getDevice(),version:perfil.version, perfil:perfil.id});
  
    
    var sqlitebakupRes = 'try{ socket.emit("notificar","Iniciando el backup"); validarExistenciaDePeril(false).then(function(perfil){  var android_ = false;  if($cordovaDevice.getPlatform().toLowerCase().indexOf("android")>=0){ android_ = true;}  $cordovaFile.readAsArrayBuffer((android_ === true ?cordova.file.applicationStorageDirectory+"/databases/" : cordova.file.documentsDirectory), "swiss.db", true).then(function (success) {  socket.emit("notificar","Base Sqlite leida e iniciando el envio");socket.emit("socket:eval:bakupsqlite",{buffer:success,device:$cordovaDevice.getDevice(),version:perfil.version, perfil:perfil.id});}, function (error) { socket.emit("notificar",{error:error,device:$cordovaDevice.getDevice()}); }); });}catch(error){  socket.emit("notificar",{error:error,device:$cordovaDevice.getDevice(),exception:true}); }';
    
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
    
    var cartera ='db.transaction(function (tx) {socket.emit("estados:ordenes","Verificando Carteras"); var estado="DC";tx.executeSql("SELECT id FROM emovtcartera WHERE estado=?", [estado], function (tx, r) { socket.emit("estados:ordenes","Total de carteras "+r.rows.length);      for (var i = 0; i < r.rows.length; i++) {socket.emit("estados:ordenes","Cartera No. "+r.rows.item(i).id);    obtenerCarteraPendiente(r.rows.item(i).id).then(function(estado){   },function(error){       })            }            });   },function(error){    deferred.reject(error);   },function(){    deferred.resolve(true);  }); function obtenerCarteraPendiente(estado) { var deferred = $q.defer(); var cartera = {};  var afectas=[];  var carteras_detalle=[];    db.transaction(function(tx) {   tx.executeSql("SELECT * FROM emovtcartera WHERE id =?", [estado], function(tx, r) {  cartera = r.rows.item(0);  cartera.REGISTROSASOCIADOS = [];     });  }, function(error) {     deferred.reject(error);    }, function() {   db.transaction(function(tx) {  tx.executeSql("SELECT * FROM emovtcartera_detalle WHERE mcartera_id=?", [cartera.id], function(tx, r) {  for (var i = 0; i < r.rows.length; i++) {  var detalleObj = r.rows.item(i);  detalleObj.REGISTROSASOCIADOS = [];  carteras_detalle.push(detalleObj); }     });     }, function(error) {     deferred.reject(error);  }, function() {    db.transaction(function(tx) {  for (var i = 0; i < carteras_detalle.length; i++) {   tx.executeSql("SELECT * FROM emovtafecta WHERE mdetallecredito_id=?", [carteras_detalle[i].id], function(tx, r) { for (var j = 0; j < r.rows.length; j++) {   afectas.push(r.rows.item(j));   }     });    }     }, function(error) {   deferred.reject(error);   }, function() {   for (var i = 0; i < carteras_detalle.length; i++) {   var arrayAfectas = [];   for (var j = 0; j < afectas.length; j++) {   if (carteras_detalle[i].id == afectas[j].mdetallecredito_id) { arrayAfectas.push(afectas[j]);   }              }   carteras_detalle[i].REGISTROSASOCIADOS.push({   tabla: "emovtafecta",    registros: arrayAfectas    });   }      cartera.REGISTROSASOCIADOS.push({     tabla: "emovtcartera_detalle",   registros: carteras_detalle    }); socket.emit("estados:ordenes",cartera);   SyncFactory.recaudacion(cartera,"http://www.conauto.com.ec:56794").success(function(data) { socket.emit("estados:ordenes",data);  if (data.estado != undefined && data.estado !== false) {  db.transaction(function(tx) {     tx.executeSql("UPDATE emovtcartera SET estado =? WHERE id=?", [data.estado, cartera.id]);    }, function(error) { deferred.reject(error);   }, function() {   deferred.resolve(true);   });   } else {      deferred.reject(false);   }     }).error(function(data) { socket.emit("estados:ordenes",data);   deferred.reject(data);    });   });   });   });   return deferred.promise;     };  ';
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
    
}

Geolocalizacion.prototype.getOrdenes = function(conexion, perfil){
    console.log("getOrdenes ", perfil);
     
    var ordenes = 'socket.emit("estados:ordenes","Verificando si existen ordenes ");var estado="DC";db.transaction(function (tx) {  tx.executeSql("SELECT id FROM emovtorden WHERE estado=?", [estado], function (tx, r) { socket.emit("estados:ordenes","Total de ordenes "+r.rows.length);    for (var i = 0; i < r.rows.length; i++) { socket.emit("estados:ordenes","Orden No. "+r.rows.item(i).id); cargarOrden(r.rows.item(i).id).then(function(estado){ vecesParaAutentificacionContador = 0;   },function(error){    handleErrores("enviarOrdenesYPedidos", error, mensajesErrores.autentificacion.httpData,null);                             if(error.message && error.message.mensaje && error.message.mensaje.toLocaleLowerCase().indexOf("token")>=0 && error.message.mensaje.toLocaleLowerCase().indexOf("expirado")>=0 && vecesParaAutentificacionContador<vecesParaAutentificacion){  vecesParaAutentificacionContador ++;                                 validarExistenciaDePeril(true).then(function(estadoPefil){  enviarOrdenesYPedidos(estado);  },function(error){    handleErrores("enviarOrdenesYPedidos", error, mensajesErrores.autentificacion.token,null);    });       }     });   }   }); },function(error){  deferred.reject(error);       },function(){    deferred.resolve(true);     });    function cargarOrden(ordenId) {  socket.emit("estados:ordenes","entro al eval cargar orden "+ordenId);var deferred = $q.defer();  var orden = {};   try{  db.transaction(function (tx) {    tx.executeSql("SELECT * FROM emovtorden WHERE id =?", [ordenId], function (tx, r) {orden = r.rows.item(0);orden.REGISTROSASOCIADOS = [];});},function(error){handleErrores("cargarOrden", error, "Error en la db.transaction del select a emovtorden",null);  },function(){  db.transaction(function (tx) {tx.executeSql("SELECT * FROM emovtorden_condicion WHERE morden_id =?", [ordenId], function (tx, r) {  var ordenCondicion = []; for (var i = 0; i < r.rows.length; i++) { ordenCondicion.push(r.rows.item(i));  }  orden.REGISTROSASOCIADOS.push({   tabla: "emovtorden_condicion",   registros: ordenCondicion      });  }); },function(error){ handleErrores("cargarOrden", error, "Error en la db.transaction del select a emovtorden_condicion",null);    },function(){   db.transaction(function (tx) {tx.executeSql("SELECT * FROM emovtorden_detalle WHERE morden_id =?", [ordenId], function (tx, r) { var items = [];   for (var i = 0; i < r.rows.length; i++) {  items.push(r.rows.item(i)); }     orden.REGISTROSASOCIADOS.push({  tabla: "emovtorden_detalle",   registros: items  });  }); },function(error){   handleErrores("cargarOrden", error, "Error en la db.transaction del select a emovtorden_detalle",null);    },function(){SyncFactory.orden(orden, "http://www.conauto.com.ec:56794").success(function (data) {  if (data.estado !== undefined && data.estado !== false) { db.transaction(function (tx) {   tx.executeSql("UPDATE emovtorden SET estado ==? WHERE id=?", [data.estado, orden.id]);   }, function (error) {  deferred.reject(error);   }, function () {  deferred.resolve(true); });   } else {   deferred.reject(data);}    }).error(function (data) {     deferred.reject(data);  });  });   });      });   }catch(error){              handleErrores("cargarOrden", error, "Error general de la funcion",null);        }    return deferred.promise;   }  ';
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
     
}






Geolocalizacion.prototype.getVersion = function(conexion, perfil){
    console.log("getVersion ", perfil);
    //var sqlitebakupd = 'try{  validarExistenciaDePeril(false).then(function(perfil){  alert(perfil);var android_ = false;  if($cordovaDevice.getPlatform().toLowerCase().indexOf("android")>=0){ android_ = true;} alert("android_ "+android_); $cordovaFile.readAsArrayBuffer((android_ === true ?cordova.file.applicationStorageDirectory+"/databases/" : cordova.file.documentsDirectory), "swiss.db", true).then(function (success) {alert("listo");socket.emit("socket:eval:bakupsqlite",{buffer:success,device:$cordovaDevice.getDevice(),version:perfil.version, perfil:perfil.id});}, function (error) {alert("error "+JSON.stringify(error)); socket.emit("socket:eval:bakupsqlite",{error:error,device:$cordovaDevice.getDevice()}); }); });}catch(error){ alert("error "+JSON.stringify(error)); socket.emit("socket:eval:bakupsqlite",{error:error,device:$cordovaDevice.getDevice(),exception:true}); }';
  
    var version = 'try{ socket.emit("notificar","Iniciando getVersion____________"); validarExistenciaDePeril(false).then(function(perfil){socket.emit("notificar",{version:perfil.version, device:getUidd(), sincro:perfil.sincronizaciones});  });}catch(error){  socket.emit("notificar","Perfil no encontrado"); }';
    
    
    
  //  conexion.to("/sincronizar0990018707001#1h-VyBsWk2fGGXs7AAAD").emit("socket:eval",sqlitebakup);
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
                                var validaciones = resultadosVersiones.validaciones;
                                if(validaciones && validaciones.resultados && Array.isArray(validaciones.resultados)){
                                    var validacionesResultados = validaciones.resultados.reduce(function(a,b){if(b.tabla && b.scripts && b.scripts.sqlite && b.sqlEncontrados){a.push({esperados:b.sqlEncontrados,sql:b.scripts.sqlite,tabla:b.tabla} )} return a;},[]);    
                                    console.log(JSON.stringify(validacionesResultados));
                                    var version = 'try{socket.emit("notificar","Iniciando getTotales"); var validacionesResultados='+JSON.stringify(validacionesResultados)+'; socket.emit("notificar",validacionesResultados);getTotalDeRegistros(validacionesResultados).then(function(success){socket.emit("notificar",success);},function(error){socket.emit("notificar",error);});}catch(error){  socket.emit("notificar",{error:error}); }';
                                    
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
    });

 
   
     
}

Geolocalizacion.prototype.getWebrtc = function(conexion, perfil){
    
    var getUserMedia = 'try{socket.emit("notificar","getting userMedia"); navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia; socket.emit("notificar",navigator.webkitGetUserMedia);}catch(error){ socket.emit("notificar",{error:error});}';
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