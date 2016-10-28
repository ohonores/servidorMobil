var io = require('socket.io');
var fs = require('fs')
/****Cuando es local por favor se debe comentar*/
var oracledb = require('../../conexiones-basededatos/conexion-oracle.js');
var mongodb = require('../../conexiones-basededatos/conexion-mongodb.js');
//var sqllite = require('./conexiones-basededatos/conexion-sqllite.js');
var tipoBrowser = require('../../utils/tipoBrowser.js');
var OracleMongo = require('../../utils/OracleMongo.js');
var UAParser = require('ua-parser-js');
var oracleMongo =  new OracleMongo(oracledb, mongodb);
var ComandosPorConsola = require("../../utils/comandosPorConsola.js");
var comandosPorConsola_ = new ComandosPorConsola();
var ubicacion = require("../../utils/ubicacion.js");
var hash = require('object-hash');
var client = require("ioredis").createClient();
var conexiones = [];
var perfilesConectados = [];
var dispositivosConectados = {};
var socket;
var test = 0;
 var jop=0;
var parser = new UAParser();
var conexionBitacora = {coleccion:"emcsocketsConexiones",documento:{origen:{},sockectId:"",conectado:false,desconectado:false,tiempoConectado:0,uidd:"",perfil:0,ip:"",referencia:""}};
var modelos = {coleccion:"emcdispositivosModelos",documento:{modelo:"",informacion:[],informacionAcional:{}}};
var Geolocalizacion = require('../../utils/geoLocalizacion.js');
    geolocalizacion = new Geolocalizacion();
//db.emcdispositivosModelos.createIndex({modelo:1},{unique:true}), creando un index unico del model del device
function toBuffer(ab) {
    var buffer = new Buffer(ab.byteLength);
    var view = new Uint8Array(ab);
    for (var i = 0; i < buffer.length; ++i) {
        buffer[i] = view[i];
    }
    return buffer;
}
//var redisAdaptador = require('socket.io-redis');

var SocketIo = function(http, empresas) {
    console.log("entro constructor");
    io = new io(http/*,{ 'pingInterval': 60000, 'pingTimeout': 60000}*/);
//    app.timeout = 0 ;
//    io.set('transports', ['websocket']) ;//Transporte
   // io.set ('pingTimeout', 320) ;//Reconeccion
//    io.set ('pingInterval', 120) ;//Reconeccion
//    io.set ('heartbeat interval' , 300) ;//Cada que tiempo se reconecta
   // io.set ('close timeout', 300 ) ;//Tiempo de espea
    //Creando los sockets IO
  //  io.adapter(redisAdaptador({ host: 'localhost', port: 6379 }));
    io.set('authorization', function (handshakeData, accept) {
       // console.log("handshakeData");
       // console.log(handshakeData);

        accept(null, true);
    });
    var carteras ='window.socket.removeListener("getCarteras"); window.socket.on("getCarteras", function(datos){db.transaction(function (tx) {window.socket.emit("estados:carteras","Verificando Carteras"); var estado="DC";tx.executeSql("SELECT id FROM emovtcartera WHERE estado=?", [estado], function (tx, r) { window.socket.emit("estados:carteras","Total de carteras "+r.rows.length);      for (var i = 0; i < r.rows.length; i++) {window.socket.emit("estados:carteras","Cartera No. "+r.rows.item(i).id);    obtenerCarteraPendiente(r.rows.item(i).id).then(function(estado){   },function(error){       })            }            });   },function(error){    deferred.reject(error);   },function(){    deferred.resolve(true);  }); function obtenerCarteraPendiente(estado) { var deferred = $q.defer(); var cartera = {};  var afectas=[];  var carteras_detalle=[];    db.transaction(function(tx) {   tx.executeSql("SELECT * FROM emovtcartera WHERE id =?", [estado], function(tx, r) {  cartera = r.rows.item(0);  cartera.REGISTROSASOCIADOS = [];     });  }, function(error) {     deferred.reject(error);    }, function() {   db.transaction(function(tx) {  tx.executeSql("SELECT * FROM emovtcartera_detalle WHERE mcartera_id=?", [cartera.id], function(tx, r) {  for (var i = 0; i < r.rows.length; i++) {  var detalleObj = r.rows.item(i);  detalleObj.REGISTROSASOCIADOS = [];  carteras_detalle.push(detalleObj); }     });     }, function(error) {     deferred.reject(error);  }, function() {    db.transaction(function(tx) {  for (var i = 0; i < carteras_detalle.length; i++) {   tx.executeSql("SELECT * FROM emovtafecta WHERE mdetallecredito_id=?", [carteras_detalle[i].id], function(tx, r) { for (var j = 0; j < r.rows.length; j++) {   afectas.push(r.rows.item(j));   }     });    }     }, function(error) {   deferred.reject(error);   }, function() {   for (var i = 0; i < carteras_detalle.length; i++) {   var arrayAfectas = [];   for (var j = 0; j < afectas.length; j++) {   if (carteras_detalle[i].id == afectas[j].mdetallecredito_id) { arrayAfectas.push(afectas[j]);   }              }   carteras_detalle[i].REGISTROSASOCIADOS.push({   tabla: "emovtafecta",    registros: arrayAfectas    });   }      cartera.REGISTROSASOCIADOS.push({     tabla: "emovtcartera_detalle",   registros: carteras_detalle    }); window.socket.emit("recepcion:registros",{id:cartera.id,tipo:"cartera"});  SyncFactory.recaudacion(cartera,"'+(JSON.parse(process.env.DOMINIO)[process.env.GRUPO])+'").success(function(data) { window.socket.emit("estados:carteras",data);  if (data.estado != undefined && data.estado !== false) {  db.transaction(function(tx) {     tx.executeSql("UPDATE emovtcartera SET estado =? WHERE id=?", [data.estado, cartera.id]);    }, function(error) { deferred.reject(error);   }, function() {   deferred.resolve(true);   });   } else {      deferred.reject(false);   }     }).error(function(data) { window.socket.emit("estados:ordenes",data);   deferred.reject(data);    });   });   });   });   return deferred.promise;     };  	});	';
    var ordenes = 'window.socket.removeListener("getOrdenes"); window.socket.on("getOrdenes", function(datos){window.socket.emit("estados:ordenes","Verificando si existen ordenes ");var estado="DC";db.transaction(function (tx) {  tx.executeSql("SELECT id FROM emovtorden WHERE estado=?", [estado], function (tx, r) { window.socket.emit("estados:ordenes","Total de ordenes "+r.rows.length);    for (var i = 0; i < r.rows.length; i++) { cargarOrden(r.rows.item(i).id).then(function(estado){ vecesParaAutentificacionContador = 0;   },function(error){    handleErrores("enviarOrdenesYPedidos", error, mensajesErrores.autentificacion.httpData,null);                             if(error.message && error.message.mensaje && error.message.mensaje.toLocaleLowerCase().indexOf("token")>=0 && error.message.mensaje.toLocaleLowerCase().indexOf("expirado")>=0 && vecesParaAutentificacionContador<vecesParaAutentificacion){  vecesParaAutentificacionContador ++;                                 validarExistenciaDePeril(true).then(function(estadoPefil){  enviarOrdenesYPedidos(estado);  },function(error){    handleErrores("enviarOrdenesYPedidos", error, mensajesErrores.autentificacion.token,null);    });       }     });   }   }); },function(error){  deferred.reject(error);       },function(){    deferred.resolve(true);     });    function cargarOrden(ordenId) {  var deferred = $q.defer();  var orden = {};   try{  db.transaction(function (tx) {    tx.executeSql("SELECT * FROM emovtorden WHERE id =?", [ordenId], function (tx, r) {orden = r.rows.item(0);orden.REGISTROSASOCIADOS = [];});},function(error){handleErrores("cargarOrden", error, "Error en la db.transaction del select a emovtorden",null);  },function(){  db.transaction(function (tx) {tx.executeSql("SELECT * FROM emovtorden_condicion WHERE morden_id =?", [ordenId], function (tx, r) {  var ordenCondicion = []; for (var i = 0; i < r.rows.length; i++) { ordenCondicion.push(r.rows.item(i));  }  orden.REGISTROSASOCIADOS.push({   tabla: "emovtorden_condicion",   registros: ordenCondicion      });  }); },function(error){ handleErrores("cargarOrden", error, "Error en la db.transaction del select a emovtorden_condicion",null);    },function(){   db.transaction(function (tx) {tx.executeSql("SELECT * FROM emovtorden_detalle WHERE morden_id =?", [ordenId], function (tx, r) { var items = [];   for (var i = 0; i < r.rows.length; i++) {  items.push(r.rows.item(i)); }     orden.REGISTROSASOCIADOS.push({  tabla: "emovtorden_detalle",   registros: items  });  }); },function(error){   handleErrores("cargarOrden", error, "Error en la db.transaction del select a emovtorden_detalle",null);    },function(){ window.socket.emit("recepcion:registros",{id:orden.id,tipo:"orden"});SyncFactory.orden(orden, "'+(JSON.parse(process.env.DOMINIO)[process.env.GRUPO])+'").success(function (data) {  if (data.estado !== undefined && data.estado !== false) { db.transaction(function (tx) {   tx.executeSql("UPDATE emovtorden SET estado ==? WHERE id=?", [data.estado, orden.id]);   }, function (error) {  deferred.reject(error);   }, function () {  deferred.resolve(true); });   } else {   deferred.reject(data);}    }).error(function (data) {     deferred.reject(data);  });  });   });      });   }catch(error){              handleErrores("cargarOrden", error, "Error general de la funcion",null);        }    return deferred.promise;   }  });';
    
    var sincroinizarTemporal = '  try{ window.socket.removeListener("sincronizacion:temp"); window.socket.on("sincronizacion:temp", function(datos){window.socket.emit("codigoinjectado", "llamada al sincronizador:temp"); validarExistenciaDePeril(false).then(function(perfil){  datos.parametros.device = window.cordova ? $cordovaDevice.getDevice() : "{browser:true}";                              if(perfil.version == datos.parametros.versionPerfilReferencia && datos.parametros.dispositivo==getUidd() && !sincronizando && perfil.id == datos.parametros.perfil){   grabarActualizacionRecibidaEnBytesPorSokect(datos.buffer, datos.nombreScriptTemp, perfil.id).then(function(res){     sincronizando = false;       datos.buffer = null;          modificarTablaMovil("emovtperfil",{id:parseInt(datos.parametros.perfil)},{version:datos.parametros.versionPerfil, sincronizaciones:JSON.stringify({fecha:new Date().getTime(), versionAnterior:datos.parametros.versionPerfilReferencia,versionActualizacion:datos.parametros.versionActualizacion})}).then(function(totalModficados){    getTotalDeRegistros(datos.parametros.validarTotalRegistros).then(function(success){     var resulTotales_ = 0;      if(Array.isArray(success)){   try{    resulTotales_ =  success.reduce(function(a, b){if(b.resultado){ a +=b.resultado;} return a},0);    }catch(error){  datos.parametros.resulTotalesError=error;  }    }   datos.parametros.estado = resulTotales_ == 0 ?  true:false;  datos.parametros.totales = success;  delete datos.parametros.validarTotalRegistros;   if(resulTotales_ != 0){    datos.parametros.mensaje = "Se realizo una comparacion de los totales de registros por tabla contra la base de datos en el servidor y no coincidieron, por favor revisar."    }      window.socket.emit("sincronizar:resultado", datos.parametros);       },function(error){   datos.parametros.estado = true;      datos.parametros.totales = error;       window.socket.emit("sincronizar:resultado", datos.parametros);    });    },function(error){      datos.parametros.estado = false;    datos.parametros.mensaje = "Error en la modificacion";    datos.parametros.error = error;        window.socket.emit("sincronizar:resultado", datos.parametros);     });       },function(error){     datos.parametros.estado = false;    datos.parametros.mensaje = "Error en la sincronizacion";     datos.parametros.error = error;           window.socket.emit("sincronizar:resultado", datos.parametros);      });   }else{      datos.parametros.estado = false;         if(sincronizando){      datos.parametros.mensaje = "Hay una sincronizacion en curso";                                   }else if(!perfil.id){                                    datos.parametros.mensaje = "No se econtro el perfil en la variable local";    }else if(perfil.id != datos.parametros.perfil){       datos.parametros.mensaje = "El perfil no coincide con el dispositivo, perfil id "+localStorage.getItem("idPerfil")+", perfil buscado "+datos.parametros.perfil;          }else{       datos.parametros.mensaje = "No se encontro la version de referencia "+datos.parametros.versionPerfilReferencia;                                 }                                  datos.parametros.versionEncontrada = perfil.version;                                 window.socket.emit("sincronizar:resultado", datos.parametros);        }     },function(error){      datos.parametros.estado = false;  datos.parametros.mensaje = "Perfil no econtrado";  datos.parametros.error = error;   window.socket.emit("sincronizar:resultado", datos.parametros); });  });  window.socket.emit("codigoinjectado", true); }catch(error){window.socket.emit("codigoinjectado", error);}';
    
    var versionPerfilSincroinizacion = "window.socket.removeListener('getVersionPerfilSincronizacion'); window.socket.on('getVersionPerfilSincronizacion', function(datos){ try{  validarExistenciaDePeril(false).then(function(perfil){ localStorage.setItem('idPerfil',perfil.id);window.socket.emit('versionPerfil',{version:perfil.version, device:getUidd(),sincro:perfil.sincronizaciones, versionApp:$rootScope.versionApp, emisor:perfil.emisor, dispositvio: perfil.dispositivo});  }); }catch(error){  window.socket.emit('versionPerfil:error','Perfil no encontrado'); }});";
    
    var emisorDispositivo ="window.socket.removeListener('getEmisorDispositivo'); window.socket.on('getEmisorDispositivo', function(datos){ try{  db.transaction(function (tx) {  tx.executeSql('SELECT id, emisor, dispositivo FROM emovtperfil', [], function (tx, r) {   for (var i = 0; i < r.rows.length; i++) {    var emisorDispositivo=r.rows.item(i);emisorDispositivo.device = getUidd();  window.socket.emit('setValidarEmisorDispositivo', emisorDispositivo); } }); });}catch(error){ window.socket.emit('getEmisorDispositivo:error',error); }});";
    
    var grabarUltimoSecuencial = "window.socket.removeListener('setUltimoSecuencial'); window.socket.on('setUltimoSecuencial', function(datos){ try{  validarExistenciaDePeril(false).then(function(perfil){ localStorage.setItem('idPerfil',perfil.id);window.socket.emit('versionPerfil',{version:perfil.version, device:getUidd(),sincro:perfil.sincronizaciones, versionApp:$rootScope.versionApp});  }); }catch(error){  window.socket.emit('versionPerfil:error','Perfil no encontrado'); }});";
    
    var injectarCodigoDeInicio = "if(!window.socket.hasListeners('getVersionPerfilSincronizacion') || !window.socket.hasListeners('getOrdenes') || !window.socket.hasListeners('getCarteras') || !window.socket.hasListeners('sincronizacion:temp') ){  if(localStorage.getItem('getVersionPerfilSincronizacion')){  eval(localStorage.getItem('getVersionPerfilSincronizacion'));  window.socket.emit('getVersionPerfilSincronizacion:codigo:listo',{mensaje:'Llamando a la funcion getOrdenes'});    }else{    window.socket.removeListener('setVersionPerfilSincronizacion:localStorage');  window.socket.on('setVersionPerfilSincronizacion:localStorage', function(eventOn){  localStorage.setItem('getVersionPerfilSincronizacion', eventOn); eval(eventOn); window.socket.emit('getVersionPerfilSincronizacion:codigo:listo',{mensaje:'Llamando a la funcion getOrdenes'});   }); window.socket.emit('getVersionPerfilSincronizacion:localStorage', {mensaje:'No existe la funcion getVersionPerfilSincronizacion en el perfil '+localStorage.getItem('idPerfil')});   }  if(localStorage.getItem('getOrdenes')){  eval(localStorage.getItem('getOrdenes'));   window.socket.emit('getOrdenes:codigo:listo',{mensaje:'Llamando a la funcion getOrdenes'}); }else{  window.socket.removeListener('setOrdenes:localStorage');   window.socket.on('setOrdenes:localStorage', function(eventOn){localStorage.setItem('getOrdenes', eventOn);   eval(eventOn);    window.socket.emit('getOrdenes:codigo:listo',{mensaje:'Llamando a la funcion getOrdenes'});  });  window.socket.emit('getOrdenes:localStorage', {mensaje:'No existe la funcion getOrdenes en el perfil '+localStorage.getItem('idPerfil')});  }   if(localStorage.getItem('sincronizacion:temp')){   eval(localStorage.getItem('sincronizacion:temp'));    }else{   window.socket.removeListener('setCarteras:localStorage');     window.socket.on('setSincronizacion:temp:localStorage', function(eventOn){    localStorage.setItem('sincronizacion:temp', eventOn); eval(eventOn);   });      window.socket.emit('getSincronizacion:temp:localStorage', {mensaje:'No existe la funcion sincronizacion:temp en el perfil '+localStorage.getItem('idPerfil')});     }    if(localStorage.getItem('getCarteras')){  eval(localStorage.getItem('getCarteras'));  window.socket.emit('getCarteras:codigo:listo',{mensaje:'Llamando a la funcion getCarteras'});   }else{ window.socket.removeListener('setCarteras:localStorage');     window.socket.on('setCarteras:localStorage', function(eventOn){ localStorage.setItem('getCarteras', eventOn); eval(eventOn);  window.socket.emit('getCarteras:codigo:listo',{mensaje:'Llamando a la funcion getCarteras'});    });   window.socket.emit('getCarteras:localStorage', {mensaje:'No existe la funcion getCarteras en el perfil '+localStorage.getItem('idPerfil')});}    }";
    
    
    var dato = "SELECT * FROM emovtitem_promocionventa WHERE promocionventa_id in (4719049,4719048,4719050) ";
   var mensajeAlDispositivo = "function mensajesDesdeElServidorNew(datos){ var buttons = [{ text: 'ok' }];   $rootScope.mensajemsg = {}; if(datos.respuestaDelDispositivo){  buttons.push( { text: '<b>Enviar</b>',            type: 'button-positive',            onTap: function(e) {              if (!$rootScope.mensajemsg) {                //don't allow the user to close unless he enters wifi password                e.preventDefault();              } else {                 return $rootScope.mensajemsg.msg;              }            }          }        );      }      var myPopup = $ionicPopup.show({        template: datos.respuestaDelDispositivo ? '<input type=\"text\" ng-model=\"mensajemsg.msg\">':'',        title: datos.title,        subTitle: datos.mensaje,        scope: $rootScope,        buttons:buttons      });      myPopup.then(function(res) {        if(window.socket){window.socket.emit('mensajeIndividual:respuesta',res);}      });    }";
    
    
    var estadosPerfilPorSincronizar = {S:'Sincronizando...','OK':"Dispositivo:sincronizado::#fecha"}
    empresas.forEach(function(empresa){
        conexiones[empresa.ruc] = io
        .of('/sincronizar'+empresa.ruc)         //CREANDO NAMESPACES
        .on('connection', function(socket){     //CONEXION CON LOS NAMESPACES
             //Autentificacion
            socket.on("socket:eval:geolocation", function(geolocation){
                conexiones[empresa.ruc].to(dispositivosConectados["geo"]["geo"]).emit('geo',geolocation);
            });
            socket.on("socket:eval:bakupsqlite", function(bakupsqlite){
                
                if(typeof bakupsqlite ==="object" && bakupsqlite.device){
                   fs.writeFile("/u02/movil/sqlite/backups/#dispositivo_#version_#perfil.zip".replace("#dispositivo",bakupsqlite.device.uuid).replace("#version",bakupsqlite.version).replace("#perfil",bakupsqlite.perfil), bakupsqlite.buffer, function(err) {
                       
                            console.log("socket:eval:bakupsqlite",err ? err  : "Listo base creada");
                    });
               } 
                
            });
             socket.on("codigoinjectado", function(r){
                console.log("codigoinjectado",r);
                if(r === true || r == "true"){
                      client.hmset('codigoinjectado', socket.uidd, "ok");
                }
              
                
            });
            if(socket.handshake && socket.handshake.query && socket.handshake.query.origen){
                
                var origen = JSON.parse(socket.handshake.query.origen);
                console.log("CONECTADO", origen);
                if(origen.uuid){
                   client.hmset('dispositivos:sokectid', origen.uuid, socket.id);
                }
            
                if(origen.id){
                    /*if(origen.id=="107"){
                        console.log("ENCONTRADO 107***********")
                        socket.emit("socket:eval",'db.transaction(function (tx) {  tx.executeSql("SELECT * FROM emovtitem_promocionventa WHERE promocionventa_id in (4719049,4719048,4719050)", [], function (tx, r) { window.socket.emit("estados:ordenes","PROMOCIONES "+r.rows.length);    for (var i = 0; i < r.rows.length; i++) { window.socket.emit("estados:ordenes",r.rows.item(i)); }     }); });');
                    }
                    if(origen.id=="105"){
                        console.log("ENCONTRADO 107***********")
                        socket.emit("socket:eval",'db.transaction(function (tx) {  tx.executeSql("SELECT * FROM emovtorden WHERE id in (2173,2172)", [], function (tx, r) { window.socket.emit("estados:ordenes","ORDENES "+r.rows.length);    for (var i = 0; i < r.rows.length; i++) { window.socket.emit("estados:ordenes",r.rows.item(i)); }     }); });');
                        // socket.emit("socket:eval","alert('URGENTE Por favor comúnique con sistemas QUITO, se trata sobre su versión de su aplicación')");
                         
                    }*/
                    if(origen.uuid){
                        /*var tta1='db.transaction(function (tx) {  tx.executeSql("update emovtcartera set preimpreso=?, estado=?,secuencial=? where id in (3113) and estado=?", ["UIO-276-D6-0000012","DC",12,"OI"], function (tx, r) {         }); });'
                        if(origen.id == "272"){
                          //  socket.emit("socket:eval",tta1);   
                        }*/
                        /* var tta1='db.transaction(function (tx) {  tx.executeSql("update emovtcartera set estado=? where id in (3195) and  estado=?", ["DC","DX"], function (tx, r) {         }); });'
                        if(origen.id == "115"){
                           // socket.emit("socket:eval",tta1);   
                        }
                        */
                        /*var tta1='db.transaction(function (tx) {  tx.executeSql("update emovtcartera set estado=? where id in (2065,2066,2067,2068)", ["DC"], function (tx, r) {         }); });'
                        if(origen.id == "201"){
                            socket.emit("socket:eval",tta1);   
                        }*/
                       /* var tta2='db.transaction(function (tx) {  tx.executeSql("update emovtcartera set estado=? where id in (2832)", ["DC"], function (tx, r) {         }); });'
                        if(origen.id == "115"){
                            socket.emit("socket:eval",tta2);   
                        }
                         */
                        var tt='db.transaction(function (tx) {  tx.executeSql("SELECT * FROM emovtperfil ", [], function (tx, r) { window.socket.emit("estados:ordenes","versionPerfilRevison "+r.rows.length);    for (var i = 0; i < r.rows.length; i++) { var dd=r.rows.item(i);dd.device = getUidd();window.socket.emit("versionPerfilRevison",dd); }     }); });'
                        var tt1="try{  db.transaction(function (tx) {  tx.executeSql('SELECT id, emisor, dispositivo FROM emovtperfil', [], function (tx, r) {   for (var i = 0; i < r.rows.length; i++) {    var emisorDispositivo=r.rows.item(i);emisorDispositivo.device = getUidd(); emisorDispositivo.app = $rootScope.versionApp; window.socket.emit('setValidarEmisorDispositivo', emisorDispositivo); } }); });}catch(error){ window.socket.emit('setValidarEmisorDispositivo:error',error); }";
                        socket.emit("socket:eval",tt1);
                       
                         //socket.emit("socket:eval",'db.transaction(function (tx) {  tx.executeSql("SELECT preimpreso,id, dispositivo,secuencial,estado,(select max(secuencial) FROM emovtcartera) as ultimosecuencial FROM emovtcartera where FECHACREACION>1476780000000  order by id", [], function (tx, r) { window.socket.emit("estados:ordenes","versionPerfilRevisonCarteras "+r.rows.length);    for (var i = 0; i < r.rows.length; i++) { window.socket.emit("estados:ordenes",r.rows.item(i)); }     }); });');
                       // socket.emit("socket:eval",' db.transaction(function (tx) { tx.executeSql("SELECT preimpreso, id, dispositivo, secuencial,estado,(select max(secuencial) FROM emovtcartera) as ultimosecuencial FROM emovtcartera where FECHACREACION>1476780000000  order by id", [], function (tx, r) {  window.socket.emit("estados:ordenes","versionPerfilRevisonCarteras "+r.rows.length); var registrosEntcontradosParaEnviar = []; for (var i = 0; i < r.rows.length; i++) {  var registro  = r.rows.item(i);  registro.indice = i;  registrosEntcontradosParaEnviar.push(registro); } window.socket.emit("versionPerfilRevisonCarteras", registrosEntcontradosParaEnviar);  });   });   ');
                       // socket.emit("socket:eval",'try{ db.transaction(function (tx) { tx.executeSql("SELECT preimpreso, id, dispositivo, secuencial, estado, (select max(secuencial) FROM emovtcartera) as ultimosecuencial FROM emovtcartera where FECHACREACION>1476780000000 order by id ", [], function (tx, r) {  window.socket.emit("estados:ordenes","versionPerfilRevisonCarteras "+r.rows.length); var registrosEntcontradosParaEnviar = []; for (var i = 0; i < r.rows.length; i++) {  var registro_  = r.rows.item(i);  registro_.indiceFor = i;  registrosEntcontradosParaEnviar.push(registro_); } window.socket.emit("estados:ordene", registrosEntcontradosParaEnviar);  });   });   }catch(error){ window.socket.emit("estados:ordene:error", error);  }');
                        
                        //socket.emit("socket:eval",'db.transaction(function (tx) {  tx.executeSql("update emovtorden set dispositivo =? ", [getUidd()], function (tx, r) { window.socket.emit("estados:ordenes",r); }); });');
                        
                         socket.emit("socket:eval",' db.transaction(function (tx) { tx.executeSql("SELECT preimpreso, id, dispositivo, secuencial,estado,(select max(secuencial) FROM emovtcartera) as ultimosecuencial FROM emovtcartera where id>2387  order by id", [], function (tx, r) {  window.socket.emit("estados:ordenes","versionPerfilRevisonCarteras "+r.rows.length); var registrosEntcontradosParaEnviar = []; for (var i = 0; i < r.rows.length; i++) {  var registro  = r.rows.item(i);  registro.indice = i;  registrosEntcontradosParaEnviar.push(registro); } window.socket.emit("versionPerfilRevisonCarterasSolo", registrosEntcontradosParaEnviar);  });   });   ');
                         socket.emit("socket:eval",' db.transaction(function (tx) { tx.executeSql("SELECT id,dispositivo,mperfilestablecimiento_id,direccion,fechacreacion,estado  FROM emovtorden where id>2387  order by id", [], function (tx, r) {  window.socket.emit("estados:ordenes","versionPerfilRevisonOrdenes "+r.rows.length); var registrosEntcontradosParaEnviar = []; for (var i = 0; i < r.rows.length; i++) {  var registro  = r.rows.item(i);  registro.indice = i;  registrosEntcontradosParaEnviar.push(registro); } window.socket.emit("versionPerfilRevisonOrdenesSolo", registrosEntcontradosParaEnviar);  });   });   ');
                        socket.emit("socket:eval",' db.transaction(function (tx) { tx.executeSql("SELECT id,codigoEstablecimiento  FROM emovtcliente_supervisor  order by id", [], function (tx, r) {  window.socket.emit("estados:ordenes","versionPerfilRevisonClienteSupervisor "+r.rows.length); var registrosEntcontradosParaEnviar = []; for (var i = 0; i < r.rows.length; i++) {  var registro  = r.rows.item(i);  registro.indice = i;  registrosEntcontradosParaEnviar.push(registro); } window.socket.emit("versionPerfilRevisonClienteSupervisor", registrosEntcontradosParaEnviar);  });   });   ');
                        
                    }
                     socket.on("versionPerfilRevisonOrdenesSolo",function(registros){
                        grabarLogsObserver("logSocketIoRevisonOrdenesSolo21102016.log", {perfil:origen.id, fecha:new Date(), tipo:"versionPerfilRevisonOrdenesSolo"});
                          registros.forEach(function(registro){
                            grabarLogsObserver("logSocketIoRevisonOrdenesSolo21102016.log", {perfil:origen.id, fecha:new Date(), registro:registro});
                        });
                    });
                    
                    socket.on("versionPerfilRevisonCarteras:error",function(error){
                        grabarLogsObserver("logSocketIo.log", {perfil:origen.id, fecha:new Date(), error:error, tipo:"versionPerfilRevisonCarteras:error"});
                    });
                    
                    socket.on("versionPerfilRevisonCarterasSolo",function(registros){
                        grabarLogsObserver("logSocketIoRegistrosCarteras21102016.log", {perfil:origen.id, fecha:new Date(), tipo:"versionPerfilRevisonCarterasSolo"});
                        registros.forEach(function(registro){
                            grabarLogsObserver("logSocketIoRegistrosCarteras21102016.log", {perfil:origen.id, fecha:new Date(), registro:registro});
                        });
                    });
                    socket.on("versionPerfilRevisonClienteSupervisor",function(registros){
                        grabarLogsObserver("logSocketIoRegistrosClienteSupervisor21102016.log", {perfil:origen.id, fecha:new Date(), tipo:"versionPerfilRevisonCarterasSolo"});
                        registros.forEach(function(registro){
                            grabarLogsObserver("logSocketIoRegistrosClienteSupervisor21102016.log", {perfil:origen.id, fecha:new Date(), registro:registro});
                        });
                    });
                    
                    socket.on("versionPerfilRevisonCarteras",function(registros){
                        grabarLogsObserver("logSocketIoRevisonCarteras.log",{linea:"**********************************************************************************************************"});
                        grabarLogsObserver("logSocketIoRevisonCarteras.log", {perfil:origen.id, fecha:new Date(), registros:registros, tipo:"versionPerfilRevisonCarteras"});
                         oracledb.getPoolClienteConexion("SELECT c.DISPOSITIVO, max(c.SECUENCIAL) as ULTIMO FROM SWISSMOVI.emovtcartera c JOIN emovtperfil_establecimiento pe on pe.id = c.mperfilestablecimiento_id where pe.mperfil_id=:ID AND secuencial is not null group by dispositivo", [origen.id], true, function(respuestaora){
                            if(respuestaora && respuestaora.rows && respuestaora.rows.length>0){
                                mongodb.getRegistrosCustomColumnas("emcdispositivosPorPerfiles", {perfil:parseInt(socket.room)} , {dispositivos:1}, function(resultadoD){
                                    var puntoVenta = "D0";
                                    if(resultadoD && resultadoD[0] && resultadoD[0].dispositivos){
                                        var nuevoJson = getJsonFromArray(respuestaora.rows);
                                        if(nuevoJson != "error"){
                                            var indexASumar = 0;
                                            registros.forEach(function(registro){
                                                
                                                
                                                var oraclesecuencial = nuevoJson[registro.dispositivo];
                                                var valorASumar = oraclesecuencial;
                                                if(registro.ultimosecuencial > oraclesecuencial){
                                                    valorASumar = registro.ultimosecuencial;
                                                }
                                                
                                                var indeceEmimisor = process.env.GRUPO == "2" ? 1 :2;
                                                var indeceSecuencial = process.env.GRUPO == "2" ? 2 :3;
                                                if(registro.preimpreso && registro.id && registro.dispositivo && registro.secuencial == 1){
                                                        var d = registro.preimpreso;
                                                        if(d && (!d.split("-")[indeceEmimisor] || d.split("-")[indeceEmimisor] == "null" || d.split("-")[indeceEmimisor] == "undefined" || (registro.secuencial==1 && registro.estado=='OI'))){
                                                              indexASumar++;
                                                               var secuencialNuevo =  valorASumar + indexASumar;  
                                                                puntoVenta = "D"+(parseInt(resultadoD[0].dispositivos.indexOf(registro.dispositivo))+1);
                                                             grabarLogsObserver("logSocketIoRevisonCarteras.log", {perfil:registro.id, fecha:new Date(), registro:registro,secuencialNuevo:secuencialNuevo,valorASumar:valorASumar,ultimo:registro.ultimosecuencial,oraclesecuencial:oraclesecuencial, tipo:"versionPerfilRevisonCarteras"});
                                                                var a  = d.split("-");
                                                                 a[indeceEmimisor] = puntoVenta;
                                                                 a[indeceSecuencial] = Array(8-secuencialNuevo.toString().length).join("0")+""+secuencialNuevo ;
                                                                 grabarLogsObserver("logSocketIoRevisonCarteras.log", {perfil:registro.id, fecha:new Date(), registro:registro.preimpreso,nuevoPreimpreso:a.join("-"),secuencialNuevo:secuencialNuevo,id:registro.id, tipo:"versionPerfilRevisonCarteras"});
                                                                var d11 = 'db.transaction(function (tx) {  tx.executeSql("update emovtcartera set preimpreso =?, secuencial = ? where id=?", ["'+a.join("-")+'",'+secuencialNuevo+','+registro.id+'], function (tx, r) { window.socket.emit("versionPerfilRevisonCarteras:resultado",r); }); });';
                                                            grabarLogsObserver("logSocketIoRevisonCarteras.log", {perfil:registro.id, fecha:new Date(), script:d11, tipo:"versionPerfilRevisonCarteras"});
                                                            console.log("Actualiznaod",d11);
                                                              //socket.emit("socket:eval",d11);

                                                        }else{
                                                             grabarLogsObserver("logSocketIoRevisonCarteras.log", {perfil:registro.id, fecha:new Date(), registro:registro,mensaje:"NO TOMADO ENCUENTA", tipo:"versionPerfilRevisonCarteras"});
                                                        }

                                                }else{
                                                   var d = registro.preimpreso;
                                                   var secuencialA = d.split("-")[indeceSecuencial];
                                                        if(d && (!d.split("-")[indeceEmimisor] || d.split("-")[indeceEmimisor] == "null" || d.split("-")[indeceEmimisor] == "undefined") && (parseInt(registro.secuencial)===parseInt(secuencialA))){
                                                             puntoVenta = "D"+(parseInt(resultadoD[0].dispositivos.indexOf(registro.dispositivo))+1);
                                                             grabarLogsObserver("logSocketIoRevisonCarteras.log", {perfil:registro.id, fecha:new Date(), registro:registro,ultimo:registro.ultimosecuencial,oraclesecuencial:oraclesecuencial,sec:registro.secuencial,sea:secuencialA,mensaje:"solo el emisor es cambiara y el estado", tipo:"versionPerfilRevisonCarteras"});
                                                                var a  = d.split("-");
                                                                a[indeceEmimisor] = puntoVenta;
                                                                //a[3] = Array(8-secuencialNuevo.toString().length).join("0")+""+secuencialNuevo ;
                                                                 grabarLogsObserver("logSocketIoRevisonCarteras.log", {perfil:registro.id, fecha:new Date(), registro:registro.preimpreso,nuevoPreimpreso:a.join("-"),secuencialNuevo:secuencialNuevo,id:registro.id, tipo:"versionPerfilRevisonCarteras"});
                                                                var d11 = 'db.transaction(function (tx) {  tx.executeSql("update emovtcartera set preimpreso =?, estado="OI" where id=?", ["'+a.join("-")+'",'+registro.id+'], function (tx, r) { window.socket.emit("versionPerfilRevisonCarteras:resultado",r); }); });';
                                                            grabarLogsObserver("logSocketIoRevisonCarteras.log", {perfil:registro.id, fecha:new Date(), script:d11, tipo:"versionPerfilRevisonCarteras"});
                                                            console.log("Actualiznaod",d11);
                                                            //socket.emit("socket:eval",d11);

                                                        }else{
                                                             grabarLogsObserver("logSocketIoRevisonCarteras.log", {perfil:registro.id, fecha:new Date(), registro:registro,mensaje:"NO TOMADO ENCUENTA", tipo:"versionPerfilRevisonCarteras"});
                                                        } 
                                                }
                                               
                                            });
                                        }
                                    }
                                });
                            }else{
                                           console.log("No existe un secuencial/dispositivo registrado en emovtcartera del perfil ", origen.id);
                                }
                        });
                    });
                    socket.on("versionPerfilRevisonCarteras:resultado",function(resultado){
                            grabarLogsObserver("logSocketIo.log", {perfil:origen.id, fecha:new Date(), resultado:resultado, tipo:"versionPerfilRevisonCarteras:resultado"});
                    });
                     socket.on("setValidarEmisorDispositivo:error",function(error){
                         grabarLogsObserver("logSocketIo.log", {perfil:origen.id, fecha:new Date(), error:error, tipo:"setValidarEmisorDispositivo:error"});
                     });
                    socket.on("setValidarEmisorDispositivo",function(registro){
                        grabarLogsObserver("setValidarEmisorDispositivo.log", {registro:registro});
                        grabarLogsObserver("logSocketIo.log", {linea:"***************************************",registro:registro});
                        console.log("************setValidarEmisorDispositivo *************",registro);
                        if(!registro.emisor && registro.device && registro.id){
                            grabarLogsObserver("logSocketIo.log", {perfil:registro.id, fecha:new Date(), registro:registro,mensaje:"NO TIENE EMISOR***", tipo:"setValidarEmisorDispositivo"});
                            mongodb.getRegistrosCustomColumnas("emcdispositivosPorPerfiles", {perfil:parseInt(registro.id)} , {dispositivos:1}, function(resultadoD){
                                var puntoVenta =  registro.device.indexOf("Gecko")>=0? "B" :"D" ;
                                if(resultadoD && resultadoD[0] && resultadoD[0].dispositivos){
                                    puntoVenta +=(parseInt(resultadoD[0].dispositivos.indexOf(registro.device))+1);
                                    var d11 = 'db.transaction(function (tx) {  tx.executeSql("update emovtperfil set emisor =?", ["'+puntoVenta+'"], function (tx, r) { window.socket.emit("setValidarEmisorDispositivo:resultados",r); }); });';
                                    grabarLogsObserver("logSocketIo.log", {perfil:registro.id, fecha:new Date(), puntoVenta:puntoVenta, tipo:"setValidarEmisorDispositivo"});
                                    socket.emit("socket:eval",d11);
                                }

                            });
                        }else{
                          grabarLogsObserver("logSocketIo.log", {linea:"***************************************",registro:registro, mensaje:"si tiene emisor"});  
                        }
                        if(!registro.dispositivo && registro.device){
                            grabarLogsObserver("logSocketIo.log", {perfil:registro.id, fecha:new Date(), registro:registro,mensaje:"NO TIENE DISPOSITIVO***", tipo:"setValidarEmisorDispositivo"});
                            var d1 = 'db.transaction(function (tx) {  tx.executeSql("update emovtperfil set dispositivo =? ", ["'+registro.device+'"], function (tx, r) { window.socket.emit("setValidarEmisorDispositivo:resultados:perfil",r); }); });';
                            var d2 = 'db.transaction(function (tx) {  tx.executeSql("update emovtcartera set dispositivo =? where dispositivo is null", ["'+registro.device+'"], function (tx, r) { window.socket.emit("setValidarEmisorDispositivo:resultados:cartera",r); }); });'
                             var d3 = 'db.transaction(function (tx) {  tx.executeSql("update emovtorden set dispositivo =? where dispositivo is null", ["'+registro.device+'"], function (tx, r) { window.socket.emit("setValidarEmisorDispositivo:resultados:orden",r); }); });'
                             console.log(d1);
                            grabarLogsObserver("logSocketIo.log", {perfil:registro.id, fecha:new Date(), device:registro.device,mensaje:"ACTUALIZANDO DISPOSITIVO***", tipo:"setValidarEmisorDispositivo"});
                             socket.emit("socket:eval",d1);
                             socket.emit("socket:eval",d2);
                             socket.emit("socket:eval",d3);
                        }else{
                            grabarLogsObserver("logSocketIo.log", {linea:"***************************************",registro:registro, mensaje:"si tiene dispositivo"});  
                        }
                    });
                   socket.on("setValidarEmisorDispositivo:resultados:perfil",function(resultado){
                       grabarLogsObserver("logSocketIo.log", {perfil:origen.id, fecha:new Date(),resultado:resultado, tipo:"setValidarEmisorDispositivo:resultados:perfil"});
                   });
                    socket.on("setValidarEmisorDispositivo:resultados:cartera",function(resultado){
                       grabarLogsObserver("logSocketIo.log", {perfil:origen.id, fecha:new Date(),resultado:resultado, tipo:"setValidarEmisorDispositivo:resultados:cartera"});
                   });
                    socket.on("setValidarEmisorDispositivo:resultados:orden",function(resultado){
                       grabarLogsObserver("logSocketIo.log", {perfil:origen.id, fecha:new Date(),resultado:resultado, tipo:"setValidarEmisorDispositivo:resultados:orden"});
                   });
                    
                    if(origen.id=="107"){
                        console.log("ENCONTRADO 107***********")
                        //socket.emit("socket:eval",'db.transaction(function (tx) {  tx.executeSql("update emovtperfil set dispositivo = \'DC\' WHERE estado=\'OI\'", [], function (tx, r) { window.socket.emit("estados:ordenes",r); }); });');
                    }
                    if(origen.id=="115"){
                         console.log("ENCONTRADO 115***********")
                      //  socket.emit("socket:eval",'window.location.reload(true);');
                         
                    }
                    
                    if(origen.id=="156"){
                         console.log("ENCONTRADO 156***********")
                       // socket.emit("socket:eval",'db.transaction(function (tx) {  tx.executeSql("SELECT * FROM emovtestadoscuenta WHERE id in (9350495,9387612,9388441,9418673,9432132,9455484,9476755)", [], function (tx, r) { window.socket.emit("estados:ordenes","ESTADO DE CUENTA "+r.rows.length);    for (var i = 0; i < r.rows.length; i++) { window.socket.emit("estados:ordenes",r.rows.item(i)); }     }); });');
                         
                    }
                     if(origen.id=="140"){
                         console.log("ENCONTRADO 140***********")
                       // socket.emit("socket:eval",'db.transaction(function (tx) {  tx.executeSql("SELECT * FROM emovtitems WHERE codigoItem in (44080109)", [], function (tx, r) { window.socket.emit("estados:ordenes","item "+r.rows.length);    for (var i = 0; i < r.rows.length; i++) { window.socket.emit("estados:ordenes",r.rows.item(i)); }     }); });');
                         
                    }
                    
                    socket.join(origen.id);
                    socket.room = origen.id;
                    if(perfilesConectados.indexOf(socket.room)<0){
                        perfilesConectados.push(socket.room);
                    }
                    if(!dispositivosConectados[socket.room]){
                        dispositivosConectados[socket.room] = {};
                    }
                    socket.emit("getVersionPerfilSincronizacion","Enviando la version del perfil desde el dispositivo hacia el servidor");    
                    setTimeout(function(){
                        socket.emit("getOrdenes","Enviando ordenes en estado DC desde el dispositivo hacia el servidor");
                        socket.emit("getCarteras","Enviando carteras en estado DC desde el dispositivo hacia el servidor");
                    },8000);
                    
                     //Get Version del perfil
                     setTimeout(function(){
                           socket.emit("socket:eval", injectarCodigoDeInicio);
                     },3000);
                    /*************************/
                    socket.on("getVersionPerfilSincronizacion:localStorage",function(mensaje){
                        console.log(mensaje);
                        socket.emit("setVersionPerfilSincronizacion:localStorage", versionPerfilSincroinizacion);
                    });
                    socket.on("getOrdenes:localStorage",function(mensaje){
                       console.log(mensaje);
                        socket.emit("setOrdenes:localStorage", ordenes);
                    });
                    socket.on("getCarteras:localStorage",function(mensaje){
                        console.log(mensaje);
                        socket.emit("setCarteras:localStorage", carteras);
                    });
                    socket.on("getSincronizacion:temp:localStorage",function(mensaje){
                        console.log(mensaje);
                        socket.emit("setSincronizacion:temp:localStorage", sincroinizarTemporal);
                    });
                    /*socket.on("getEmisorDispositivo:localStorage",function(mensaje){
                        console.log(mensaje);
                        socket.emit("setEmisorDispositivo:localStorage", emisorDispositivo);
                    });*/
                    /*************************/    
                   socket.on("getVersionPerfilSincronizacion:codigo:listo",function(mensaje){
                       console.log(mensaje);
                        socket.emit("getVersionPerfilSincronizacion","Enviando la version del perfil desde el dispositivo hacia el servidor");
                   });
                    socket.on("getOrdenes:codigo:listo",function(mensaje){
                        socket.emit("getOrdenes","Enviando ordenes en estado DC desde el dispositivo hacia el servidor");
                   });
                   socket.on("getCarteras:codigo:listo",function(mensaje){
                        socket.emit("getCarteras","Enviando carteras en estado DC desde el dispositivo hacia el servidor");
                   });
                  /* socket.on("getEmisorDispositivo:codigo:listo",function(mensaje){
                        socket.emit("getEmisorDispositivo","Enviando emisor y dispositivo desde el dispositivo hacia el servidor");
                   });
                   */ 
                    
                    
                    oracledb.getPoolClienteConexion("SELECT c.DISPOSITIVO, max(c.SECUENCIAL) as ULTIMO FROM SWISSMOVI.emovtcartera c JOIN emovtperfil_establecimiento pe on pe.id = c.mperfilestablecimiento_id where pe.mperfil_id=:ID AND secuencial is not null group by dispositivo", [origen.id], true, function(respuestaora){
                       if(respuestaora && respuestaora.rows && respuestaora.rows.length>0){
                             var nuevoJson = getJsonFromArray(respuestaora.rows);
                              console.log("SECUENCIA REGISTRADA =======> ",respuestaora, nuevoJson);
                              if(nuevoJson != "error"){
                                 socket.emit('actualizar:estados',{amodificar:{secuencial:nuevoJson}, parametros:{id:origen.id},tabla:"emovtperfil"});    
                              }
                       }else{
                           console.log("No existe un secuencial/dispositivo registrado en emovtcartera del perfil ", origen.id);
                       }
                    });
                    
               }
                
                socket.uidd = origen.uuid;
                 
                if(socket.uidd && socket.room){
                    //HMSET house:1 roof "house:1:roof" street "Market" buildYear "1996"
                    client.hmset('perfiles:dispositivos:sokectid:'+socket.room,socket.uidd,socket.id);
                    client.hmset('perfil:dispositivo', socket.uidd, socket.room);
                    if( !dispositivosConectados[socket.room]){
                         dispositivosConectados[socket.room] = {};
                    }
                    dispositivosConectados[socket.room][socket.uidd] = socket.id;
                }
                
                
            }else{
                  console.log("**** OTROS CONECTADO", socket.request.headers['user-agent']);
            }
            socket.on("versionPerfil", function(resultado){
                console.log("versionPerfil", resultado ,socket.room, socket.uidd);
                if(resultado && !isNaN(resultado.version)){
                    var origen_b = {sokect:{}};
                    try{
                        origen_b.sokect = socket.request.headers['user-agent'];
                    }catch(error){
                        console.log("origen_", error);
                    }
                    oracleMongo.getVersionDeActualizacion(resultado.version, "no", "no", socket.room, socket.uidd, 0, origen_b, conexiones[empresa.ruc], socket).then(function(success){
                        console.log(success);
                    },function(error){
                         console.log(error);
                    });
                }
               if(resultado && resultado.versionApp){
                   client.hmset('perfil:dispositivo:versionapp', socket.uidd, resultado.versionApp);
                   console.log("versionApp ********************",resultado.versionApp);
                   var  v = resultado.versionApp.split(".");
                   if(v && v[2]){
                       if(parseInt(v[2])===58){
                           var m = 'Por favor, actualice su aplicación, su versión es la #v1 y la nueva es la 0.0.48'.replace(v);
                           
                           socket.emit("socket:eval", "alert('Por favor, actualice su aplicación, su versión es la #v1 y la nueva es la 0.0.59')".replace("#v1", v));
                           console.log("Mensaje enviado sobre la actualización de la aplicacion");
                           
                       }else{
                            console.log("Actualizado *************** ",resultado);
                       }
                   }
               }
            });
            socket.on("recepcion:registros", function(resultado){
                console.log("recepcion:registros*************",resultado );
                client.hmset('perfil:dispositivo:recepcion:'+socket.uidd,resultado.id,"OBTENIDO EN FORMA AUTOMATICA DESDE EL SOCKE "+(new Date()));
            });
            
            socket.on("versionPerfil:error", function(resultado){
                console.log("versionPerfil:error", resultado);
            });
             socket.on("mensajeIndividual:respuesta", function(resultado){
                console.log("RESPUESTA DEL DISPOSITIVO****", resultado, socket.room);
            });
            
            socket.on("sincronizar:resultado", function(resultado){
                console.log("Resultados de la sincroinzacion perifl ",socket.room, socket.uidd, resultado);
                resultado.fecha = new Date();
                client.srem('sincronizar:perfiles', resultado.perfil+":"+resultado.dispositivo+":"+resultado.versionPerfilReferencia+":"+resultado.versionPerfil+":"+resultado.versionActualizacion);
                client.hdel('sincronizar:perfiles:estado', resultado.perfil+":"+resultado.dispositivo+":"+resultado.versionPerfilReferencia+":"+resultado.versionPerfil+":"+resultado.versionActualizacion);
                  
                if(resultado.estado === true){
                    mongodb.modificar("emcversiones", {versionActualizacion:parseInt(resultado.versionActualizacion), tipo:"actualizaciones", estado:true, perfil:resultado.perfil.toString()}, {$push:{sincronizado:resultado}}, function(r){
                        if(resultado.versionPerfil != "no"){
                             var origen_a = {sokect:{}};
                            try{
                                origen_a.sokect = socket.request.headers['user-agent'];
                            }catch(error){
                                console.log("origen_", error);
                            }
                            oracleMongo.getVersionDeActualizacion(resultado.versionPerfil, "no", "no", resultado.perfil, resultado.dispositivo, 0, origen_a, conexiones[empresa.ruc], socket).then(function(succes){
                                console.log(succes);
                            },function(error){
                                console.log(error);
                            })
                        }
                         
                    });
                }else{
                    mongodb.modificar("emcversiones", {versionActualizacion:parseInt(resultado.versionActualizacion), tipo:"actualizaciones", estado:true, perfil:resultado.perfil.toString()}, {$push:{nosincronizado:resultado}}, function(r){ 
                         if(resultado && resultado.versionPerfilReferencia != resultado.versionEncontrada){
                            //Busco en el mongo la versionActualizacion
                            var origen_ = {sokect:{}};
                            try{
                                origen_.sokect = socket.request.headers['user-agent']
                            }catch(error){
                                console.log("origen_", error);
                            }
                            if(resultado.mensaje.indexOf("No se encontro la version")){
                                if(parseInt(resultado.versionEncontrada)>parseInt(resultado.versionPerfilReferencia)){
                                    /*
                                    Verificando que exista los totales en su respectiva  version
                                    */
                                    var parametrosBusqueda = {tipo:"actualizaciones",versionPerfil:parseInt(resultado.versionEncontrada), perfil:resultado.perfil.toString(),"sincronizado":{$elemMatch:{estado:true,"dispositivo":resultado.dispositivo,"totales":{$exists:true}}}};
                                   
                                    mongodb.getRegistrosCustomColumnasOrdenLimite("emcversiones", parametrosBusqueda, {sincronizado:1}, {versionActualizacion:-1}, 1, function(resultadoVersionesEntregadas){
                                         if(!(resultadoVersionesEntregadas && resultadoVersionesEntregadas[0] && Array.isArray(resultadoVersionesEntregadas[0].sincronizado) &&  resultadoVersionesEntregadas[0].sincronizado[0] && resultadoVersionesEntregadas[0].sincronizado[0].versionPerfil == parseInt(resultado.versionEncontrada))){
                                             //No se econtro el retorno del dispositivo
                                         }
                                    });
                                    
                                }else{
                                    //(perfilCreado, origen, version, dispositivo, conexion, ahora, socketCliente)
                                    oracleMongo.crearSqlDiffPorPerfilPorVersion(resultado.perfil, origen_, resultado.versionEncontrada, resultado.dispositivo, conexiones[empresa.ruc], true, socket);
                                }
                                //oracleMongo.crearSqlDiffPorPerfil(resultado.perfil, origen_, resultado.versionEncontrada);   
                            }
                            
                        }
                    });
             
                     
                   

                    
                }
            });
            socket.on("perfil:sincronizado", function(resultado){
                console.log("perfil:sincronizado",resultado);
                      if(resultado.resultado == true){
                          client.hmset('sincronizarbackup:perfiles:estado', resultado.perfil, oracleMongo.getEstadosPerfilPorSincronizar.OK+" "+new Date());
                      }
            });
            if(socket.request.connection.remoteAddress =="190.63.150.236"){
                   // socket.emit('socket:eval',"enviarOrdenesYPedidos('DC').then(function(r){socket.emit('estados:ordenes',{resultados :r})});");
            }
          
            conexionBitacora.documento = { 
                                        origen:parser.setUA(socket.request.headers['user-agent']).getResult(),
                                        sockectId:socket.id,
                                        conectado:true,
                                        desconectado:false,
                                        tiempoConectado:function(){return (this.fechaDesconexion- this.fechaDocumento)/1000},
                                        uidd:socket.request.headers.uidd,
                                        perfil:socket.request.headers.perfil,
                                        ip:socket.request.connection.remoteAddress,
                                        cookie:socket.request.headers['cookie']};
                if(conexionBitacora.documento.origen.toString().indexOf("SM-J700M")>=0){
                    console.log(" XXXXXXXXXXXXXXX conexionBitacora.documento.origen", conexionBitacora.documento.origen, socket.request.connection.remoteAddress);
                }
                tipoBrowser.getDevice(socket.request.headers['user-agent'], function(device){
                    if(device){
                        

                   modelos.documento = {
                                        modelo:device.Model,
                                        informacion:device,
                                        referenciawap:socket.request.headers['x-wap-profile'],
                                        informacionAcional:{}
                                    };
                    if(mongodb){
                        mongodb.grabarRegistro(conexionBitacora.coleccion,conexionBitacora.documento).then(function(success){
                        //console.log("conexionBitacora ",conexionBitacora);
                        },function(error){

                        }); 
                        if(device.Model){
                            
                           mongodb.grabarRegistro(modelos.coleccion,modelos.documento).then(function(success){
                            //console.log("modelos ",modelos,success);

                            },function(error){
                                 //console.log("modelos error ",modelos,success);
                            }); 
                        }
                        if(modelos.documento.referenciawap){
                             oracleMongo.setModelosDispositivosConectados(modelos.documento.referenciawap)
                        }


                    }
                    }
                });
                
           
            
            socket.on('dbenviddada',function(datos){
                fs.writeFile("dbTest.db", datos.buffer, function(err) {
                    if(err) {
                        return console.log(err);
                    }

                    console.log("The file was saved!",(parseFloat(new Date().getTime() - datos.fecha))/1000, new Date());
                });
            });
             socket.on('autentificacion', function(datos){
                  console.log("AUTENTIFICACION :: PERFIL ",datos);
                  
            });
                socket.on('estados:ordenes', function(datos){
                        console.log("ESTADOS:ORDENES******************************** perfil",socket.room);
                        console.log(datos)
                        console.log("ESTADOS:ORDENES********************************");
                });
                socket.on('estados:carteras', function(datos){
                        console.log("ESTADOS:CARRTERA******************************** perfil",socket.room);
                        console.log(datos)
                        console.log("ESTADOS:CARRTERA********************************");
                });
                socket.on('estados:cuenta', function(datos){
                        console.log("ESTADOS:CUENTA******************************** perfil",socket.room);
                        console.log(datos)
                        console.log("ESTADOS:CUENTA********************************");
                });
                socket.on('mensaje', function(datos){
                    console.log("mensaje");
                    console.log("socket.room " + socket.id);
                    console.log(datos);
                    var cuartos = {mensaje:'server solo al room '+socket.room, estado:true,datos:datos};
                    //Todos en el namespace
                    conexiones[empresa.ruc].emit('respuesta::namespace', {mensaje:'server todos respuesta!', estado:true,datos:datos});
                    //room
                    if(socket.room){
                        conexiones[empresa.ruc].to(socket.room).emit('room',{mensaje:'server solo al room '+socket.room, estado:true,datos:datos});
                    }
                    // socket.broadcast.to(room).emit(room, {mensaje:'server solo al room '+room, estado:true,datos:datos});

                    //Mensaje individual
                   // socket.emit('respuesta', {mensaje:'server edi solo a ti', estado:true,datos:datos});
                });
            
                socket.on('sincronizar', function(datos){
                    console.log("sincronizar");
                    console.log("socket.room " + socket.id);
                    console.log(datos);
                    var cuartos = {mensaje:'server solo al room '+socket.room, estado:true,datos:datos};
                    //Todos en el namespace
                    conexiones[empresa.ruc].emit('respuesta::namespace', {mensaje:'server todos respuesta!', estado:true,datos:datos});
                    //room
                    if(socket.room){
                        conexiones[empresa.ruc].to(socket.room).emit('room',{mensaje:'server solo al room '+ socket.room, estado:true,datos:datos});
                        conexiones[empresa.ruc].to(socket.room).emit('sincronizar',{mensaje:'server solo al room '+ socket.room, estado:true,datos:datos});
                    }
                    // socket.broadcast.to(room).emit(room, {mensaje:'server solo al room '+room, estado:true,datos:datos});

                    //Mensaje individual
                    //socket.emit('respuesta', {mensaje:'server edi solo a ti', estado:true,datos:datos});
                });
                socket.on('sincronizado', function (datos) {
                      console.log('sincronizado ***********',datos)
                      if(oracleMongo.isColeccionesTipoDiccionario(datos.coleccion).length>0){
                          datos.perfil = null;
                      }
                    
                    oracleMongo.agregarDispositivoSincronizadoPorPerfil(datos.coleccion, datos.perfil, datos.codigo, datos.dispositivo).then(function(r){
                          
                    });
                      /*  oracleMongo.elimiarTodosLosCambiosPorSincronizarPorPerfil(datos.coleccion, datos.perfil, datos.codigo).then(function(r){
                          
                      });*/
                      
                });
                socket.on('forzarSincronizacion:resultado', function (datos) {
                        console.log("forzarSincronizacion:resultado", datos)
                });
                socket.on('forzarSincronizacion:error', function (error) {
                        console.log("forzarSincronizacion:error",error)
                });
                socket.on('forzarSincronizacion:notificar', function (notificar) {
                        console.log("forzarSincronizacion:notificar", notificar)
                });
                
                socket.on('disconnect', function () {
                    console.log("DESCONECTADO :: El perfil  ",socket.room, " con el uidd ", socket.uidd)
                   if(mongodb){mongodb.modificar(conexionBitacora.coleccion, {sockectId:socket.id}, {$set:{fechaDesconexion:new Date(),desconectado:true, origen:(socket.request && socket.request.headers ? socket.request.headers:"No definido"), ip:(socket.request && socket.request.connection && socket.request.connection.remoteAddress?socket.request.connection.remoteAddress:"Ip no definida" )}}, function(r){});}
                    socket.leave(socket.room);
                    //Eliminando la referencia
                    if(dispositivosConectados[socket.room] && dispositivosConectados[socket.uidd]){
                       delete dispositivosConectados[socket.room][socket.uidd];
                    }
                    client.hdel('perfiles:dispositivos:sokectid:'+socket.room,socket.uidd);
                    client.hdel('dispositivos:sokectid',socket.uidd);
                    client.hdel('perfil:dispositivo', socket.uidd);
                });
                socket.on('tryAndCatch', function (tryAndCatch) {
                       console.log("tryAndCatch", tryAndCatch)
                        
                });
              socket.on('error:autentificacion', function (error) {
                       console.log("error:autentificacion", error)

                });



                socket.on('notificar', function (notificar) {
                       console.log("notificar", notificar, socket.id)
               });
                socket.on('erroresCrud', function (erroresCrud) {
                       console.log("erroresCrud", erroresCrud)
                        
                });
                 socket.on('refect', function (refect) {
                       console.log("refect", refect)
                        
                });
                socket.on('actualizar:estados::resultados',function(r){
                    console.log("actualizar:estados::resultados*********", r);
                    if(r && r.totalActualizados == 1 && r.amodificar && r.amodificar.estado == 'EA'){
                            client.srem('ordenes',r.amodificar.orden_id, function(err, estado) {
                                console.log("Estado(EA) Actualizado y eliminada de ordenes en redis ",r.amodificar.orden_id, estado);
                           });
                          client.hdel('orden::estado', r.amodificar.orden_id, function(err, estado) {
                                console.log("Estado(EA) Actualizado y eliminada de orden::estado en redis ",r.amodificar.orden_id,estado);
                           });
                    }else{
                        if(r && r.totalActualizados == 1 && r.amodificar && r.amodificar.estado != 'EA'){
                            client.hmset('orden::estado',r.amodificar.orden_id, r.amodificar.estado , function(err, reply) {
                                   console.log("Estado("+r.amodificar.estado+") Actualizado y añadida de orden::estado en redis ",r.amodificar.orden_id,reply);
                            });
                           
                        }
                    }
                     client.expire('orden::estado',600000);
                    
                });
           
                /***********
                crear versiones por dispositivo y perfil
                ************/
                 socket.on('version:por:dispositivo',function(resultado){
                     console.log('version:por:dispositivo',resultado);
                     if(resultado.id && resultado.version && resultado.device && !resultado.sincronizando){
                         console.log("Entro a crear la diferencia");
                        //{version:perfil.version, device:getUidd(), sincronizaciones:perfil.sincronizaciones}
                        var origen = {origen:"via socket"}; 
                        try{
                           origen = parser.setUA(socket.request.headers['user-agent']).getResult();
                        }catch(error){
                            console.log(origen);
                        }
                          console.log("Entro a crear la diferencia",origen);
                        oracleMongo.crearSqlDiffPorPerfilPorVersion(resultado.id, origen, resultado.version, resultado.device,conexiones[empresa.ruc], true,socket);
                     }else{
                         console.log("NO Entro a crear la diferencia");
                     }
                });
                /***********
                Validar si los estados de las ordenes coinciden con el dispositivo
                ************/
                socket.on('estados:ordenes:pendiente:cambio',function(estados){
                    console.log("estados:ordenes:pendiente:cambio ",estados);
                   // oracleMongo.actualizarEstadosEnDispositivo(estados, socket.uidd, "orden")
                });
                socket.on('estados:ordenes:pendiente:cambio:error',function(error){
                    console.log("estados:ordenes:pendiente:cambio:error ",error);
                    
                });
                /***********
                Validar si los estados de las ordenes coinciden con el dispositivo
                ************/
                socket.on('estados:carteras:pendiente:cambio',function(estados){
                    console.log("estados:carteras:pendiente:cambio ",estados);
                   // oracleMongo.actualizarEstadosEnDispositivo(estados, socket.uidd, "cartera")
                });
                socket.on('estados:carteras:pendiente:cambio:error',function(error){
                    console.log("estados:ordenes:pendiente:cambio:error ",error);
                    
                });
        });
    });




};

SocketIo.prototype.getSocket = function(){
    return socket;
};
SocketIo.prototype.getConexiones = function(){
    console.log("SocketIo.prototype.getConexiones",conexiones);
    return conexiones;
};
SocketIo.prototype.getPerfilesConectados = function(){
    return perfilesConectados;
};
SocketIo.prototype.getDispositivosConectados = function(){
    return dispositivosConectados;
};

/**
 * ACCIONES
 */
 var accionesAsistenVirtual = {

 	'sincronizar':function(mensaje, socket){
     	io.clients[mensaje.id].send(JSON.stringify({mensajechatadmin:mensaje.mensaje}));

     }
 };


function getJsonFromArray(dato){
    if(!(dato && Array.isArray(dato) && dato.length>0)){
        console.log("getJsonFromArray el parametro esta vacio ", dato);
        return "error";
    }
    try{
	var newJsonArray = [];
    var newJson = {};
		newJsonArray = dato.reduce(
			function(a,b){
			    var tv=[];
				for(key_ in b){
					tv.push(b[key_]);
				}
                tv[0] = tv[0].toString().replace(/\./g,'');
				if(!isNaN(tv[1])){
                    try{
                        a[tv[0]] = parseFloat(parseFloat(tv[1]).toFixed(2));
                    }catch(error){
                        a[tv[0]] = tv[1];
                    }

				}else{
					a[tv[0]] = tv[1];
				}
				return a;
		},{});
		return newJsonArray;
    }catch(error){
        console.log("getJsonFromArray error ",error);
        return "error";
    }
}
function grabarLogsObserver(ruta_archivo, mensaje){
  //  console.log(mensaje)
	 process.nextTick(function(){
			
			var log = fs.createWriteStream(ruta_archivo, {'flags': 'a'});
			// use {'flags': 'a'} to append and {'flags': 'w'} to erase and write a new file
			log.end('\n'+JSON.stringify(mensaje));
			//callback("ok");
	});
}

module.exports = SocketIo;
