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
    io.set('authorization', function (handshakeData, accept) {
       // console.log("handshakeData");
       // console.log(handshakeData);

        accept(null, true);
    });
    var estadosPerfilPorSincronizar = {S:'Sincronizando...','OK':"Dispositivo:sincronizado::#fecha"}
    empresas.forEach(function(empresa){
        conexiones[empresa.ruc] = io
        .of('/sincronizar'+empresa.ruc)         //CREANDO NAMESPACES
        .on('connection', function(socket){     //CONEXION CON LOS NAMESPACES
             //Autentificacion
             socket.emit("socket:eval","validarExistenciaDePeril(false).then(function(perfil){localStorage.setItem('idPerfil',perfil.id);window.socket.emit('autentificacion',{uidd:getUidd(),id:perfil.id,room:perfil.id,version:perfil.version});},function(error){window.socket.emit('autentificacion',{uidd:getUidd(),id:1,room:1})});");
            //
            socket.on("socket:eval:geolocation", function(geolocation){
                conexiones[empresa.ruc].to(dispositivosConectados["geo"]["geo"]).emit('geo',geolocation);
            });
            socket.on("socket:eval:bakupsqlite", function(bakupsqlite){
                console.log(bakupsqlite);
                if(typeof bakupsqlite ==="object" && bakupsqlite.device){
                   fs.writeFile("/u02/movil/sqlite/backups/#dispositivo_#version_#perfil.zip".replace("#dispositivo",bakupsqlite.device.uuid).replace("#version",bakupsqlite.version).replace("#perfil",bakupsqlite.perfil), bakupsqlite.buffer, function(err) {
                    console.log("socket:eval:bakupsqlite",err);
                    });
               } 
                
            });
            
            if(socket.handshake && socket.handshake.query && socket.handshake.query.origen){
                
                var origen = JSON.parse(socket.handshake.query.origen);
                console.log("CONECTADO", origen);
                if(origen.uuid){
                    client.hmset('dispositivos:sokectid', origen.uuid, socket.id);
                    
                    if( origen.uuid == "896797E5-6AEE-4654-88F7-E3A305006972"){
                        console.log("ENVIO A SINCRONIZAR A 896797E5-6AEE-4654-88F7-E3A305006972");
                        socket.emit('socket:eval',"db.transaction(function (tx) { tx.executeSql('UPDATE emovtorden SET estado='DC' where id=? ', [1752], function (tx, r) {})});");
                    }
                }
                
                 if(origen.id){
                    if(conexiones[empresa.ruc]){
                        geolocalizacion.getOrdenes(conexiones[empresa.ruc], origen.id);
                        geolocalizacion.getCarteras(conexiones[empresa.ruc], origen.id);
                    }
                    socket.join(origen.id);
                    socket.room = origen.id;
                    if(perfilesConectados.indexOf(socket.room)<0){
                        perfilesConectados.push(socket.room);
                    }
                    if(!dispositivosConectados[socket.room]){
                        dispositivosConectados[socket.room] = {};
                    }
                }
                
                socket.uidd = origen.uuid;
                
                if(socket.uidd){
                    //HMSET house:1 roof "house:1:roof" street "Market" buildYear "1996"
                    client.hmset('perfiles:dispositivos:sokectid:'+socket.room,socket.uidd,socket.id);
                    if( !dispositivosConectados[socket.room]){
                         dispositivosConectados[socket.room] = {};
                    }
                    dispositivosConectados[socket.room][socket.uidd] = socket.id;
                }
            
                
            }
            socket.on("sincronizar:resultado", function(resultado){
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
                            oracleMongo.getVersionDeActualizacion(resultado.versionPerfil, "no", "no", resultado.perfil, resultado.dispositivo, 0, origen_a);
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
                           // oracleMongo.getVersionDeActualizacion(resultado.versionPerfil, "no", "no", resultado.perfil, resultado.dispositivo, 0, origen_);
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
                                    oracleMongo.crearSqlDiffPorPerfilPorVersion(resultado.perfil, origen_, resultado.versionEncontrada, resultado.dispositivo);
                                }
                                //oracleMongo.crearSqlDiffPorPerfil(resultado.perfil, origen_, resultado.versionEncontrada);   
                            }
                            
                          //  oracleMongo.getVersionDeActualizacion(resultado.versionEncontrada, "no", "no", resultado.perfil, resultado.dispositivo, 0, origen_);
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
          
            if(socket.request.headers['user-agent'].toString().indexOf("Macintosh; Intel Mac OS X 10_11_5")>=0){
                // console.log("SE ENVIO EL MENSAJE **************************************",socket.request.headers['user-agent']);
                //socket.emit('socket:eval','alert("Error en la aplicación");');
            }
        
                //console.log("origen",socket.request.headers['user-agent']);
                console.log("idp origgenllllllllllll",socket.request.connection.remoteAddress);

            //
         
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
                
               
            try{
               // console.log(socket.rooms);
            }catch(error){
                console.log(error);
            }
            
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
                    //socket.request.connection &&  socket.request.connection.remoteAddress ? socket.request.connection.remoteAddress : "no econtrada" ;
                    if(datos.id){
                        if(conexiones[empresa.ruc]){
                           //  geolocalizacion.getOrdenes(conexiones[empresa.ruc], datos.id);
                           // geolocalizacion.getCarteras(conexiones[empresa.ruc], datos.id);
                        }
                        socket.join(datos.id);
                        socket.room = datos.id;
                        if(perfilesConectados.indexOf(socket.room)<0){
                            perfilesConectados.push(socket.room);
                        }
                        if(!dispositivosConectados[socket.room]){
                            dispositivosConectados[socket.room] = {};
                        }
                    }
                
                    socket.uidd = datos.uidd;
                    socket.token = datos.token;
                
                    if(socket.uidd){
                        //HMSET house:1 roof "house:1:roof" street "Market" buildYear "1996"
                        client.hmset('perfiles:dispositivos:sokectid:'+socket.room,socket.uidd,socket.id);
                        dispositivosConectados[socket.room][socket.uidd] = socket.id;
                    }
                    if(datos.version && datos.id && datos.uidd){
                        var origen_b = {sokect:{}};
                        try{
                            origen_b.sokect = socket.request.headers['user-agent'];
                        }catch(error){
                            console.log("origen_", error);
                        }
                        oracleMongo.getVersionDeActualizacion(datos.version, "no", "no", datos.id, datos.uidd, 0, origen_b);
                    }
                         
                   
                });
                socket.on('estados:ordenes', function(datos){
                        console.log("ESTADOS:ORDENES******************************** perfil",socket.room);
                        console.log(datos)
                        console.log("ESTADOS:ORDENES********************************");
                });
                socket.on('estados:cartera', function(datos){
                        console.log("ESTADOS:CARRTERA******************************** perfil",socket.room);
                        console.log(datos)
                        console.log("ESTADOS:CARRTERA********************************");
                });
                socket.on('estados:cuenta', function(datos){
                        console.log("ESTADOS:CARRTERA******************************** perfil",socket.room);
                        console.log(datos)
                        console.log("ESTADOS:CARRTERA********************************");
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
                });
                socket.on('tryAndCatch', function (tryAndCatch) {
                       console.log("tryAndCatch", tryAndCatch)
                        
                });
              socket.on('error:autentificacion', function (error) {
                       console.log("error:autentificacion", error)

                });



                socket.on('notificar', function (notificar) {
                       console.log("notificar", notificar)
                        
                });
                socket.on('erroresCrud', function (erroresCrud) {
                       console.log("erroresCrud", erroresCrud)
                        
                });
                 socket.on('refect', function (refect) {
                       console.log("refect", refect)
                        
                });
                socket.on('actualizar:estados::resultados',function(r){
                    console.log(socket.room, r, "SINCRONIZADO");
                    /*56 { amodificar: { estado: 'EA' },
  parametros: { id: 1707 },
  tabla: 'emovtorden',
  totalActualizados: 1 } 'SINCRONIZADO'

                        140 { amodificar: { estado: 'EA' , orden_id},
                        parametros: { id: 1663 },
                        tabla: 'emovtorden',
                        totalActualizados: 1 } 'SINCRONIZADO'
                    */
                    if(r && r.totalActualizados == 1 && r.amodificar && r.amodificar.estado == 'EA'){
                            client.srem('ordenes',r.amodificar.orden_id, function(err, estado) {
                                //console.log("Eliminada de ordenes en redis ",res.orden,estado);
                           });
                          client.hdel('orden::estado', r.amodificar.orden_id, function(err, estado) {
                                //console.log("Eliminada de orden::estado en redis ",res.orden,estado);
                           });
                    }
                    
                    
                });
           
                /***********
                crear versiones por dispositivo y perfil
                ************/
                 socket.on('version:por:dispositivo',function(resultado){
                     console.log('version:por:dispositivo',resultado);
                     if(resultado.id && resultado.version && resultado.device && !resultado.sincronizando){
                        //{version:perfil.version, device:getUidd(), sincronizaciones:perfil.sincronizaciones}
                        var origen = {origen:"via socket"}; 
                        try{
                           origen = parser.setUA(socket.request.headers['user-agent']).getResult();
                        }catch(error){
                            console.log(origen);
                        }
                        oracleMongo.crearSqlDiffPorPerfilPorVersion(resultado.id, origen, resultado.version, resultado.device);
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


module.exports = SocketIo;
