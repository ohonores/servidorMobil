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
var hash = require('object-hash');
var client = require("ioredis").createClient();
var conexiones = [];
var perfilesConectados = [];
var dispositivosConectados = {};
var socket;
var parser = new UAParser();
var conexionBitacora = {coleccion:"emcsocketsConexiones",documento:{origen:{},sockectId:"",conectado:false,desconectado:false,tiempoConectado:0,uidd:"",perfil:0,ip:"",referencia:""}};
var modelos = {coleccion:"emcdispositivosModelos",documento:{modelo:"",informacion:[],informacionAcional:{}}};
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
    io = new io(http,{ pingTimeout: 60000});
//    app.timeout = 0 ;
//    io.set('transports', ['websocket']) ;//Transporte
    io.set ('pingTimeout', 320) ;//Reconeccion
    io.set ('pingInterval', 120) ;//Reconeccion
    //io.set ('heartbeat interval' , 60) ;//Cada que tiempo se reconecta
    //io.set ('close timeout', 1800 ) ;//Tiempo de espea
    //Creando los sockets IO
    io.set('authorization', function (handshakeData, accept) {
        console.log("handshakeData");
        //console.log(handshakeData);

        accept(null, true);
    });
    empresas.forEach(function(empresa){
        console.log(empresa);
        conexiones[empresa.ruc] = io
        .of('/sincronizar'+empresa.ruc)         //CREANDO NAMESPACES
        .on('connection', function(socket){     //CONEXION CON LOS NAMESPACES
            
                /**
                Enviando archivo
                **/
                fs.readFile('/home/ecuaquimica/servidores/servidorMobil/public/testsqlite2.db', function(err, buf){
                    if(err){
                        console.log("/home/ecuaquimica/servidores/servidorMobil/public/testsqlite2.db error",err);
                    }else{
                         console.log("/home/ecuaquimica/servidores/servidorMobil/public/testsqlite2.db encontrado");
                            socket.emit('db', { db: true, buffer:buf,fecha:new Date().getTime() });
                    }
                // it's possible to embed binary data
                // within arbitrarily-complex objects
                   
              });
                 console.log("origen",socket.request.headers['user-agent']);
            console.log("idp origgen",socket.request.connection.remoteAddress);
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
                    console.log("io.sockets.adapter.rooms");
                    console.log(io.sockets.adapter.rooms);
                }catch(error){
                    console.log(error);
                }
            try{
                console.log(socket.rooms);
            }catch(error){
                console.log(error);
            }
            
            socket.on('dbenviada',function(datos){
                fs.writeFile("dbTest.db", datos.buffer, function(err) {
                    if(err) {
                        return console.log(err);
                    }

                    console.log("The file was saved!",(parseFloat(new Date().getTime() - datos.fecha))/1000, new Date());
                });
            });
                socket.on('autentificacion', function(datos){
                        console.log("autenficacion***************",datos);
                        if(datos.room){
                            socket.join(datos.room);
                        }
                        socket.room = datos.room;
                        socket.uidd = datos.uidd;
                        if(perfilesConectados.indexOf(socket.room)<0){
                            perfilesConectados.push(socket.room);
                        }
                        if(!dispositivosConectados[socket.room]){
                            dispositivosConectados[socket.room] = {};
                        }
                        dispositivosConectados[socket.room][datos.uidd] = socket.id;
                        
                        console.log(socket.room);
                        //Validar el usuario
                        //Indicar que ha sido autentificado y esta listo para la comunicacion con el servidor
                        socket.emit('conectado', {mensaje:'server Conectado!',estado:true});
                    try{
                         console.log("io.sockets.adapter.rooms");
                        console.log(io.sockets.adapter.rooms);
                        console.log(conexiones["0990018707001"].adapter.rooms);
                      
                        
                    }catch(error){
                        console.log(error);
                    }
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
                    socket.emit('respuesta', {mensaje:'server edi solo a ti', estado:true,datos:datos});
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
                    
                   if(mongodb){mongodb.modificar(conexionBitacora.coleccion, {sockectId:socket.id}, {$set:{fechaDesconexion:new Date(),desconectado:true}}, function(r){});}
                    
                     try{
                        console.log("DESCONECTADO header",socket.request.headers);
                        console.log("ip",socket.request.connection.remoteAddress)
                    }catch(error){
                        console.log(error);
                    }
                    console.log("socket.room DESCONECTADO ",socket.room,socket.uidd)
                        socket.leave(socket.room);
                        //Eliminando la referencia
                        if(dispositivosConectados[socket.room] && dispositivosConectados[socket.uidd]){
                           delete dispositivosConectados[socket.room][datos.uidd];
                        }
                        
                });
                socket.on('tryAndCatch', function (tryAndCatch) {
                       console.log("tryAndCatch", tryAndCatch)
                        
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
