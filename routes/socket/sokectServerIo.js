var io = require('socket.io');
/****Cuando es local por favor se debe comentar*/
var oracledb = require('../../conexiones-basededatos/conexion-oracle.js');
var mongodb = require('../../conexiones-basededatos/conexion-mongodb.js');
//var sqllite = require('./conexiones-basededatos/conexion-sqllite.js');
var OracleMongo = require('../../utils/OracleMongo.js');
var oracleMongo =  new OracleMongo(oracledb, mongodb);
var conexiones = [];
var perfilesConectados = [];
var dispositivosConectados = {};
var socket;
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
    empresas.forEach(function(empresa){
        console.log(empresa);
        conexiones[empresa.ruc] = io
        .of('/sincronizar'+empresa.ruc)         //CREANDO NAMESPACES
        .on('connection', function(socket){     //CONEXION CON LOS NAMESPACES
                console.log("Conectado ",new Date());
                    try{
                        console.log(socket.handshake.headers['x-forwarded-for'] || socket.handshake.address.address);
                        
                    }catch(error){
                        console.log(error);
                    }
                
                    try{
                         console.log("Object.keys(io.engine.clients)");
                        console.log(Object.keys(io.engine));
                        
                    }catch(error){
                        console.log(error);
                    }
            try{
                console.log(socket.rooms);
            }catch(error){
                console.log(error);
            }
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
                        socket.leave(socket.room);
                        //Eliminando la referencia
                        if(dispositivosConectados[socket.room] && dispositivosConectados[socket.uidd]){
                           delete dispositivosConectados[socket.room][datos.uidd];
                        }
                        
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
