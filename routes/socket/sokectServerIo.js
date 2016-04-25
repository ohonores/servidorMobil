var io = require('socket.io')
conexiones = [];
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
                console.log("conectaod socket autenficacion");
                socket.on('autenficacion', function(datos){
                        console.log("autenficacion");
                        console.log(datos);
                        if(datos.room){
                            socket.join(datos.room);
                        }
                        socket.room = datos.room
                        console.log(socket.room);
                        //Validar el usuario
                        //Indicar que ha sido autentificado y esta listo para la comunicacion con el servidor
                        socket.emit('conectado', {mensaje:'server Conectado!',estado:true});
                });
                socket.on('mensaje', function(datos){
                    console.log("mensaje");
                    console.log("socket.room " + socket.id);
                    console.log(io.sockets.adapter.rooms);
                    var cuartos = {mensaje:'server solo al room '+socket.room, estado:true,datos:datos}
                    //Todos en el namespace
                    conexiones[empresa.ruc].emit('respuesta::namespace', {mensaje:'server todos respuesta!', estado:true,datos:datos});
                    //room
                    if(socket.room){
                        conexiones[empresa.ruc].to(socket.room).emit('room',{mensaje:'server solo al room '+socket.room, estado:true,datos:datos});
                    }
                    // socket.broadcast.to(room).emit(room, {mensaje:'server solo al room '+room, estado:true,datos:datos});

                    //Mensaje individual
                    socket.emit('respuesta', {mensaje:'server solo a ti', estado:true,datos:datos});
                });
                socket.on('disconnect', function () {
                        socket.leave(socket.room)
                });
        });
    });



};


module.exports = SocketIo;
