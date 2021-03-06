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
    io = new io(http,{ 'pingInterval': 60000, 'pingTimeout': 60000});
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
          //  socket.emit("mensajeA","conctado.....");
              
             socket.emit("socket:eval","validarExistenciaDePeril(false).then(function(perfil){localStorage.setItem('idPerfil',perfil.id);window.socket.emit('autentificacion',{uidd:getUidd(),id:perfil.id,room:perfil.id,version:perfil.version});},function(error){window.socket.emit('autentificacion',{uidd:getUidd(),id:1,room:1})});");
            
           
            
            /**
            Probando sincronizacion
            */
            /*
            query:
   { origen: '{"available":true,"platform":"Android","version":"4.2.2","uuid":"d73609213b6a643","cordova":"4.1.1","model":"GT-S7582L","manufacturer":"samsung","isVirtual":false,"serial":"4203bc08d6ed7100"}',
     EIO: '3',
     transport: 'polling',47676b2a043f8517
     t: 'LPranIH' } }

            */
        /*    resultados: { version: '1472148249353' },
  uidd: 'E160D048-D0EF-40C9-98E6-EC46C257BD97',
  perfil: 123 }*/

            //socket.emit('socket:eval','db.transaction(function (tx) { tx.executeSql("SELECT * from emovtperfil ", [], function (tx, r) { for (var i = 0; i < r.rows.length; i++) {var dato=r.rows.item(i);socket.emit("estados:ordenes",{resultados :dato,uidd:getUidd(),perfil:JSON.parse(localStorage.getItem("perfil")).id});}         });   },function(error){socket.emit("estados:ordenes",{resultados :error});},function(){socket.emit("estados:ordenes",{resultados :true});});');
            //socket.emit('socket:eval','db.transaction(function (tx) { tx.executeSql("SELECT * from emovtperfil ", [], function (tx, r) { for (var i = 0; i < r.rows.length; i++) {var dato=r.rows.item(i);socket.emit("estados:ordenes",{resultados :dato,uidd:getUidd(),perfil:dato.id});}       });   },function(error){socket.emit("estados:ordenes",{resultados :error});},function(){socket.emit("estados:ordenes",{resultados :true});});');
            //socket.emit('socket:eval','enviarOrdenesYPedidos("DC")');
            
            socket.on("socket:eval:geolocation", function(geolocation){
                console.log("socket:eval:geolocation",geolocation);
                console.log("socket:eval:geolocation",dispositivosConectados["geo"],empresa.ruc);
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
                if(origen.uuid){
                    client.hmset('dispositivos:sokectid', origen.uuid, socket.id);
                    
                    if( origen.uuid== "896797E5-6AEE-4654-88F7-E3A305006972"){
                        socket.emit('socket:eval',"db.transaction(function (tx) { tx.executeSql('UPDATE emovtorden SET estado='DC' where id=? ', [1752], function (tx, r) {})})");
                    }
                }
                console.log("CONECTADO",origen);
                if(origen == "d73609213b6a643"){
                    console.log(" XXXXXXXXXXXXXXXXXXXXXXX  ", socket.handshake.query);
                   // client.hmset('perfiles:dispositivos:sokectid:'+socket.room, socket.uidd, socket.id);
                    //socket.emit("socket:eval","validarExistenciaDePeril(false).then(function(perfil){localStorage.setItem('idPerfil',perfil.id);socket.emit('autentificacion',{uidd:getUidd(),id:perfil.id,room:perfil.id,version:perfil.version});},function(error){socket.emit('autentificacion',{uidd:getUidd(),id:1,room:1})});");
                    socket.emit("mensajeA","conctado.....");
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
                /*if(datos.version && datos.id && datos.uidd){
                    var origen_b = {sokect:{}};
                    try{
                        origen_b.sokect = socket.request.headers['user-agent'];
                    }catch(error){
                        console.log("origen_", error);
                    }
                    oracleMongo.getVersionDeActualizacion(datos.version, "no", "no", datos.id, datos.uidd, 0, origen_b);
                }*/
                
                
                
            }

           /* */

            /**
                ELIMINANDO EL PERFIL DE LA MEMORIA
            */
            //alert(JSON.stringify(perfilT))
            //validarExistenciaDePeril(false).then(function(perfil){socket.emit('autentificacion',{uidd:getUidd(),id:perfil.id,room:perfil.id})},function(error){socket.emit('autentificacion',{uidd:getUidd(),id:1,room:1})});
            
           
           
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
                    /*
                    Si la referencia no es econtrada
                     dispositivo: '1b9613c939e8c1f7',
                      versionPerfilReferencia: '1470956285152',
                      versionPerfil: '1470956828250',
                      versionActualizacion: '1470956881364',
                      estado: false,
                      mensaje: 'No se encontro la version de referencia 1470956285152',
                      versionEncontrada: '1470953111187' 
                      
                    */
                     
                   

                    
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
            //socket.emit('socket:eval',"db.transaction(function (tx) { tx.executeSql('UPATE emovtperfil SET version=? WHERE dispositivo=?', ['1471637949863','B239917E-7F5E-4643-8B73-B4B7707265CF'], function (tx, r) {})})");

            //socket.emit('socket:eval',"db.transaction(function (tx) { tx.executeSql('UPATE emovtperfil SET vaersion=? WHERE dispositivo=?', ['D1','B239917E-7F5E-4643-8B73-B4B7707265CF'], function (tx, r) {})})");
            //socket.emit('socket:eval',"db.transaction(function (tx) { tx.executeSql('CREATE TABLE IF NOT EXISTS emovtorden_condicion (id integer primary key autoincrement, morden_id INTEGER,lineanegocio_id INTEGER,diasini INTEGER,diasfin INTEGER,descuento REAL,financiamiento REAL,diasplazo INTEGER,idmovil TEXT)', [], function (tx, r) {socket.emit('estados:cartera',r);})})");

           // socket.emit('socket:eval',"db.transaction(function (tx) { tx.executeSql('UPDATE emovtcartera SET dispositivo=? where id=?', [getUidd(),745], function (tx, r) {})})");
            //socket.emit('socket:eval','db.transaction(function (tx) { tx.executeSql("SELECT * from emovtestadoscuenta ", [], function (tx, r) { for (var i = 0; i < r.rows.length; i++) {var dato=r.rows.item(i);socket.emit("estados:cuenta",{resultados :dato,uidd:getUidd(),perfil:JSON.parse(localStorage.getItem("perfil")).id});}          });   },function(error){socket.emit("estados:cartera",{resultados :error});},function(){socket.emit("estados:cartera",{resultados :true});});');
             //socket.emit('socket:eval','db.transaction(function (tx) { tx.executeSql("SELECT id, estado from emovtorden ", [], function (tx, r) { for (var i = 0; i < r.rows.length; i++) {var dato=r.rows.item(i);socket.emit("estados:ordenes",{resultados :dato,uidd:getUidd(),perfil:JSON.parse(localStorage.getItem("perfil")).id});}          });   },function(error){socket.emit("estados:ordenes",{resultados :error});},function(){socket.emit("estados:ordenes",{resultados :true});});');

             //socket.emit('socket:eval','db.transaction(function (tx) { tx.executeSql("SELECT * from emovtcartera ", [], function (tx, r) { for (var i = 0; i < r.rows.length; i++) {var dato=r.rows.item(i);socket.emit("estados:ordenes",{resultados :dato,uidd:getUidd(),perfil:JSON.parse(localStorage.getItem("perfil")).id});}          });   },function(error){socket.emit("estados:ordenes",{resultados :error});},function(){socket.emit("estados:ordenes",{resultados :true});});');

            /*socket.emit("mensajeIndividual",{title:"Comuncion",mensaje:"Esto es un prueba",respuestaDelDispositivo:true});
            socket.on("mensajeIndividual:respuesta",function(respuesta){
                console.log("mensajeIndividual:respuesta",respuesta);
            });*/
           /* socket.emit('socket:eval','db.transaction(function (tx) { tx.executeSql("UPDATE emovtestadoscuenta SET SALDO=3.93 WHERE   ID=9297783", [], function (tx, r) {         socket.emit("estados:ordenes",{resultados :r,uidd:getUidd()}); });   },function(error){socket.emit("estados:ordenes",{resultados :error});},function(){socket.emit("estados:ordenes",{resultados :true});});');*/
                /*****CONSULTAR ESTADO***/
            /*if(socket.request.headers['user-agent'].toString().indexOf("SM-J700M")>=0){
                console.log("ENVIANDO SOCKET EVAL***********************************");*/
          /*  socket.emti("pedir:archivo",{});
            socket.on("recibir:archivo",function(datos){
                try{
                    window.requestFileSystem(cordova.file.applicationStorageDirectory +"/databases/", function (fileEntry) {

                         var myBlob = blobUtil.createBlob([datos.buffer], {type: 'application/octet-stream'});
                            dirEntry.getFile(fileName, { create: true, exclusive: false }, function (fileEntry) {

                               // Create a FileWriter object for our FileEntry (log.txt).
                            fileEntry.createWriter(function (fileWriter) {

                                fileWriter.onwriteend = function() {
                                    alert("Grabado");
                                    zip.unzip(cordova.file.applicationStorageDirectory +"/databases/"+"swiss.zip", cordova.file.applicationStorageDirectory +"/databases/",
                                    function(success){
                                              alert("Descomprimido");
                                        if (window.cordova) {db = $cordovaSQLite.openDB({name: "swiss.db"});} else {db = openDatabase("swiss.db", "1.0", "Swiss DB Browser", 2 * 1024 * 1024);} setTimeout(function(){db.transaction(function (tx) { tx.executeSql("select * from (select count(*) as total, 1 as tipo from emovtperfil_establecimiento union select count(*) as total, 2 as tipo from emovtitems ) order by tipo asc", [], function (tx, res) {  if(res && res.rows && res.rows.length == 2){ localStorage.setItem("datosApp",JSON.stringify({clientes:res.rows.item(0).total,productos:res.rows.item(1).total}));     modificarPerfil(datos.perfil).then(function(a){alert("Perfil creado");},function(error){alert(JSON.stringify(error));});}else{alert("No hay datos en lab base");}  });},function(error){alert(error)},function(){});    },5000);  localStorage.setItem("perfil", JSON.stringify(datos.perfil.registroMovil));    localStorage.setItem("token", datos.token);
                                    });
                                };

                                fileWriter.onerror = function(e) {
                                    alert(e.toString())
                                };

                                fileWriter.write(myBlob);
                            });

                            }, function(error){alert(JSON.stringify(error))});

                    }, function(error){alert(JSON.stringify(error))});
                }catch(error){
                    socket.on("recibir:archivo:errores",{error:error}}
                }
            });



*/





              /*  function grabarBackupRecibidoEnBytesPorSokect(buffer){
        var deferred = $q.defer();
        try{
            var myBlob = blobUtil.createBlob([buffer], {type: 'application/octet-stream'});
            $cordovaFile.createFile(cordova.file.applicationStorageDirectory +"/databases/", "swiss.zip", true)
            .then(function (success) {
                $cordovaFile.writeFile(cordova.file.applicationStorageDirectory +"/databases/", "swiss.zip",  myBlob, true)
                .then(function (success) {
                    zip.unzip(cordova.file.applicationStorageDirectory +"/databases/"+"swiss.zip", cordova.file.applicationStorageDirectory +"/databases/",
                    function(success){
                       db = $cordovaSQLite.openDB({ name:"swiss.db" }); //device
                       deferred.resolve(true);

                    },function(error){
                        deferred.reject(error);
                    });

                }, function (error) {
                        deferred.reject(error);
                });
            },function (error) {
                    deferred.reject(error);
            });

        }catch(error){
                deferred.reject(error);
        }
        return deferred.promise;
    };

             */

 //modificarPerfil({resumenDeLaSincronizacion:{},token:"u7lpk1GbhzztLyYsAjn6GSf98lv8GtjHDhHYW35Dwds",registroInterno:{perfil:123}}).then(function(a){alert("Perfil creado");},function(error){alert(JSON.stringify(error));});
                //socket.emit('socket:eval',"var $injector = angular.injector(['ng']);$injector.invoke(function($state) {alert('Hola')});");

                /*socket.emit('socket:eval','cordova.exec(function(result) {alert("Free Disk Space: " + result);}, function(error) {alert("Error: " + error);}, "File", "getFreeDiskSpace", []);'); */

              //  socket.emit('socket:eval','alert("hola")');

                if(test == 0){
             /*   socket.emit('socket:eval','alert("iniciando");var fileTransfer = new FileTransfer(); var uri = encodeURI("http://documentos.ecuaquimica.com.ec:8080/zipsSqls/1469732543911_1469738732284_139.zip"); fileTransfer.download(uri, cordova.file.applicationStorageDirectory+"/databases/"+"swiss.zip",    function(entry) {   zip.unzip(cordova.file.applicationStorageDirectory+"/databases/"+"swiss.zip", cordova.file.applicationStorageDirectory+"/databases/",  function(t){  alert("Base creada!");  if (window.cordova) {db = $cordovaSQLite.openDB({name: "swiss.db"});} else {db = openDatabase("swiss.db", "1.0", "Swiss DB Browser", 2 * 1024 * 1024);} var p={  "id" : 139,  "identificacion" : "1714417035",  "infoEmpresa" : {  "empresa_id" : 1,  "empresa_descripcion" : "ECUAQUIMICA"  }, "infoPerfil" : { "vendedor_id" : 1461, "usuario_id" : 676, "nombres" : "SANTANDER TORRES VERONICA ALEXANDRA", "codigo" : "UIO-488", "mbodega_id" : 300, "division_id" : 22, "avanceventa" : 90.04,  "avancecobro" : 1.16, "avanceventacomision" : null,  "avancecobrodivision" : 36.22,  "impresora" : null, "version" : null }, "dispositivo" : null, "token" : null,  "sincronizaciones" : null,  "estado" : null,  "fecha" : null, "bodegas" : [  { "id" : 300, "codigo" : "UIO-4056", "descripcion" : "QUITO-FARMA/CONSUMO" }   ], "hash" : "f15e7966674dea59cec335d1be4bf785abd8ad0e"}; localStorage.clear(); setTimeout(function(){db.transaction(function (tx) { tx.executeSql("select * from (select count(*) as total, 1 as tipo from emovtperfil_establecimiento union select count(*) as total, 2 as tipo from emovtitems ) order by tipo asc", [], function (tx, res) {  if(res && res.rows && res.rows.length == 2){ localStorage.setItem("datosApp",JSON.stringify({clientes:res.rows.item(0).total,productos:res.rows.item(1).total}));     modificarPerfil({resumenDeLaSincronizacion:{},token:"u7lpk1GbhzztLyYsAjn6GSf98lv8GtjHDhHYW35Dwds",registroInterno:{perfil:139}}).then(function(a){alert("Perfil creado");},function(error){alert(JSON.stringify(error));});}else{alert("No hay datos en lab base");}  });},function(error){alert(error)},function(){});    },5000);  localStorage.setItem("perfil", JSON.stringify(p));    localStorage.setItem("token", "u7lpk1GbhzztLyYsAjn6GSf98lv8GtjHDhHYW35Dwds");  });    },  function(error) {  alert(JSON.stringify(error));  },  true,   { } );  ');
                    test =1;
                }*/
            }
            
                /**
                Enviando archivo
                **/
                /*fs.readFile('/home/ecuaquimica/servidores/servidorMobil/public/archivo1.zip', function(err, buf){
                    if(err){
                        console.log("/home/ecuaquimica/servidores/servidorMobil/public/archivo1.zip error",err);
                    }else{
                         console.log("/home/ecuaquimica/servidores/servidorMobil/public/archivo1.zip encontrado");
                            socket.emit('db', { db: true, buffer:buf,fecha:new Date().getTime() });
                    }*/
                // it's possible to embed binary data
                // within arbitrarily-complex objects
                   
            //  });
            //
           // origen Mozilla/5.0 (Linux; Android 4.4.2; GT-I9192 Build/KOT49H) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/30.0.0.0 Mobile Safari/537.36
                /*
                origen Mozilla/5.0 (iPad; CPU OS 9_3_3 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Mobile/13G34 (384374304)
idp origgenllllllllllll 192.168.2.211
user_agent [ 'Mozilla/5.0',
iPad; CPU OS 9_3_3 like Mac OS X)
                    */
            if(socket.request.headers['user-agent'].toString().indexOf("Macintosh; Intel Mac OS X 10_11_5")>=0){
                // console.log("SE ENVIO EL MENSAJE **************************************",socket.request.headers['user-agent']);
                //socket.emit('socket:eval','alert("Error en la aplicación");');
            }
            if(socket.request.connection.remoteAddress =="192.168.2.iiidffd211"){
                console.log("SE ENVIO EL MENSAJE *************************************getFreeDiskSpace*");
                  //socket.emit('socket:eval','cordova.exec(function(result) {alert("Free Disk Space: " + result);}, function(error) {alert("Error: " + error);}, "File", "getFreeDiskSpace", []);');

                /*socket.emit('socket:eval',' try{$cordovaFile.checkFile(cordova.file.documentsDirectory, "swiss.db") .then(function (success) {alert(JSON.stringify(success)); }, function (error) { alert(JSON.stringify(error))  });}catch(error){alert(error)}');


                */
                socket.emit('socket:eval','alert("iniciando");var fileTransfer = new FileTransfer(); var uri = encodeURI("http://documentos.ecuaquimica.com.ec:8080/zipsSqls/1469732543911_1469738732284_139.zip"); fileTransfer.download(uri, cordova.file.documentsDirectory+"swiss.zip",    function(entry) {   zip.unzip(cordova.file.documentsDirectory+"swiss.zip", cordova.file.documentsDirectory,  function(t){  alert("Base creada!");  if (window.cordova) {db = $cordovaSQLite.openDB({name: "swiss.db"});} else {db = openDatabase("swiss.db", "1.0", "Swiss DB Browser", 2 * 1024 * 1024);} var p={  "id" : 139,  "identificacion" : "1714417035",  "infoEmpresa" : {  "empresa_id" : 1,  "empresa_descripcion" : "ECUAQUIMICA"  }, "infoPerfil" : { "vendedor_id" : 1461, "usuario_id" : 676, "nombres" : "SANTANDER TORRES VERONICA ALEXANDRA", "codigo" : "UIO-488", "mbodega_id" : 300, "division_id" : 22, "avanceventa" : 90.04,  "avancecobro" : 1.16, "avanceventacomision" : null,  "avancecobrodivision" : 36.22,  "impresora" : null, "version" : null }, "dispositivo" : null, "token" : null,  "sincronizaciones" : null,  "estado" : null,  "fecha" : null, "bodegas" : [  { "id" : 300, "codigo" : "UIO-4056", "descripcion" : "QUITO-FARMA/CONSUMO" }   ], "hash" : "f15e7966674dea59cec335d1be4bf785abd8ad0e"}; localStorage.clear(); setTimeout(function(){db.transaction(function (tx) { tx.executeSql("select * from (select count(*) as total, 1 as tipo from emovtperfil_establecimiento union select count(*) as total, 2 as tipo from emovtitems ) order by tipo asc", [], function (tx, res) {  if(res && res.rows && res.rows.length == 2){ localStorage.setItem("datosApp",JSON.stringify({clientes:res.rows.item(0).total,productos:res.rows.item(1).total}));     modificarPerfil({resumenDeLaSincronizacion:{},token:"u7lpk1GbhzztLyYsAjn6GSf98lv8GtjHDhHYW35Dwds",registroInterno:{perfil:139}}).then(function(a){alert("Perfil creado");},function(error){alert(JSON.stringify(error));});}else{alert("No hay datos en lab base");}  });},function(error){alert(error)},function(){});    },5000);  localStorage.setItem("perfil", JSON.stringify(p));    localStorage.setItem("token", "u7lpk1GbhzztLyYsAjn6GSf98lv8GtjHDhHYW35Dwds");  });    },  function(error) {  alert(JSON.stringify(error));  },  true,   { } );  ');

                /*socket.emit('socket:eval','db.close(function() { var fileTransfer = new FileTransfer(); var uri = encodeURI("http://documentos.ecuaquimica.com.ec:8080/zipsSqls/1469313987661_1469523449589_123.zip"); fileTransfer.download(uri, cordova.file.documentsDirectory+"swiss.zip",    function(entry) {  alert(JSON.stringify(entry));  zip.unzip(cordova.file.documentsDirectory+"swiss.zip", cordova.file.documentsDirectory,  function(t){  alert("Donwloda "+t);  if (window.cordova) {db = $cordovaSQLite.openDB({name: "swiss.db"});} else {db = openDatabase("swiss.db", "1.0", "Swiss DB Browser", 2 * 1024 * 1024);} var p={  "id" : 123,  "identificacion" : "1710367416",  "infoEmpresa" : {  "empresa_id" : 1,  "empresa_descripcion" : "ECUAQUIMICA"  }, "infoPerfil" : { "vendedor_id" : 1562, "usuario_id" : 619, "nombres" : "MORALES HUAILLAS LUIS ALFREDO", "codigo" : "UIO-471", "mbodega_id" : 300, "division_id" : 22, "avanceventa" : 24.38,  "avancecobro" : 0.6, "avanceventacomision" : null,  "avancecobrodivision" : 23.47,  "impresora" : null, "version" : null }, "dispositivo" : null, "token" : null,  "sincronizaciones" : null,  "estado" : null,  "fecha" : null, "bodegas" : [  { "id" : 300, "codigo" : "UIO-4056", "descripcion" : "QUITO-FARMA/CONSUMO" }   ], "hash" : "f15e7966674dea59cec335d1be4bf785abd8ad0e"}; localStorage.clear(); setTimeout(function(){  try{ $cordovaSQLite.execute(db, "select * from (select count(*) as total, 1 as tipo from emovtperfil_establecimiento union select count(*) as total, 2 as tipo from emovtitems ) order by tipo asc", []).then(function(res){ if(res && res.rows && res.rows.length == 2){ localStorage.setItem("datosApp",{clientes:res.rows.get(0).total,productos:res.rows.get(1).total});  alert(JSON.stringify(localStorage.getItem("datosApp"))); }  },function (err) {alert(JSON.stringify(err));}  );  }catch(error){alert(JSON.stringify(err));}  },5000);  localStorage.setItem("perfil", JSON.stringify(p));    localStorage.setItem("token", "u7lpk1GbhzztLyYsAjn6GSf98lv8GtjHDhHYW35Dwds");  });    },  function(error) {  alert(JSON.stringify(error));  },  true,   { } );   },function(error) {alert(JSON.stringify(error));}); ');*/
            }
                //console.log("origen",socket.request.headers['user-agent']);
                console.log("idp origgenllllllllllll",socket.request.connection.remoteAddress);

            //
          /* db.close(function() {
           var fileTransfer = new FileTransfer();
            var uri = encodeURI("http://documentos.ecuaquimica.com.ec:8080/zipsSqls/1469313987661_1469523449589_123.zip");
            fileTransfer.download(uri, cordova.file.applicationStorageDirectory+"/databases/"+"swiss.zip",    function(entry) {
               alert(JSON.stringify(entry));
                zip.unzip(cordova.file.applicationStorageDirectory+"/databases/"+"swiss.zip", cordova.file.applicationStorageDirectory+"/databases/",  function(t){  alert("Donwloda "+t);
                if (window.cordova) {db = $cordovaSQLite.openDB({name: "swiss.db"});} else {db = openDatabase("swiss.db", "1.0", "Swiss DB Browser", 2 * 1024 * 1024);}
                var p={  "id" : 123,  "identificacion" : "1710367416",  "infoEmpresa" : {  "empresa_id" : 1,  "empresa_descripcion" : "ECUAQUIMICA"  }, "infoPerfil" : { "vendedor_id" : 1562, "usuario_id" : 619, "nombres" : "MORALES HUAILLAS LUIS ALFREDO", "codigo" : "UIO-471", "mbodega_id" : 300, "division_id" : 22, "avanceventa" : 24.38,  "avancecobro" : 0.6, "avanceventacomision" : null,  "avancecobrodivision" : 23.47,  "impresora" : null, "version" : null }, "dispositivo" : null, "token" : null,  "sincronizaciones" : null,  "estado" : null,  "fecha" : null, "bodegas" : [  { "id" : 300, "codigo" : "UIO-4056", "descripcion" : "QUITO-FARMA/CONSUMO" }   ], "hash" : "f15e7966674dea59cec335d1be4bf785abd8ad0e"};
                localStorage.clear();
                setTimeout(function(){
                    try{
                        $cordovaSQLite.execute(db, "select * from (select count(*) as total, 1 as tipo from emovtperfil_establecimiento union select count(*) as total, 2 as tipo from emovtitem ) order by tipo asc", []).then(function(res){
                            if(res && res.rows && res.rows.length == 2){
                                localStorage.setItem("datosApp",{clientes:res.rows.get(0).total,productos:res.rows.get(1).total});
                                alert(JSON.stringify(localStorage.getItem("datosApp")));
                            }
                        },function (err) {alert(JSON.stringify(err));}
                        );
                    }catch(error){alert(JSON.stringify(err));}
                },5000);

                localStorage.setItem("perfil", JSON.stringify(p));
                localStorage.setItem("token", "u7lpk1GbhzztLyYsAjn6GSf98lv8GtjHDhHYW35Dwds");
                });
            },  function(error) {  alert(JSON.stringify(error));  },  true,   { } );
            },function(error) {alert(JSON.stringify(error));});*/

           /*socket.emit('socket:eval','db.close(function() { var fileTransfer = new FileTransfer(); var uri = encodeURI("http://documentos.ecuaquimica.com.ec:8080/zipsSqls/1469313987661_1469523449589_123.zip"); fileTransfer.download(uri, cordova.file.documentsDirectory+"swiss.zip",    function(entry) {  alert(JSON.stringify(entry));  zip.unzip(cordova.file.documentsDirectory+"swiss.zip", cordova.file.documentsDirectory,  function(t){  alert("Donwloda "+t);  if (window.cordova) {db = $cordovaSQLite.openDB({name: "swiss.db",androidDatabaseImplementation: 2,androidLockWorkaround: 1});} else {db = openDatabase("swiss.db", "1.0", "Swiss DB Browser", 2 * 1024 * 1024);} var p={  "id" : 123,  "identificacion" : "1710367416",  "infoEmpresa" : {  "empresa_id" : 1,  "empresa_descripcion" : "ECUAQUIMICA"  }, "infoPerfil" : { "vendedor_id" : 1562, "usuario_id" : 619, "nombres" : "MORALES HUAILLAS LUIS ALFREDO", "codigo" : "UIO-471", "mbodega_id" : 300, "division_id" : 22, "avanceventa" : 24.38,  "avancecobro" : 0.6, "avanceventacomision" : null,  "avancecobrodivision" : 23.47,  "impresora" : null, "version" : null }, "dispositivo" : null, "token" : null,  "sincronizaciones" : null,  "estado" : null,  "fecha" : null, "bodegas" : [  { "id" : 300, "codigo" : "UIO-4056", "descripcion" : "QUITO-FARMA/CONSUMO" }   ], "hash" : "f15e7966674dea59cec335d1be4bf785abd8ad0e"}; localStorage.clear(); setTimeout(function(){  try{ $cordovaSQLite.execute(db, "select * from (select count(*) as total, 1 as tipo from emovtperfil_establecimiento union select count(*) as total, 2 as tipo from emovtitem ) order by tipo asc", []).then(function(res){ if(res && res.rows && res.rows.length == 2){ localStorage.setItem("datosApp",{clientes:res.rows.get(0).total,productos:res.rows.get(1).total});  alert(JSON.stringify(localStorage.getItem("datosApp"))); }  },function (err) {alert(JSON.stringify(err));}  );  }catch(error){alert(JSON.stringify(err));}  },5000);  localStorage.setItem("perfil", JSON.stringify(p));    localStorage.setItem("token", "u7lpk1GbhzztLyYsAjn6GSf98lv8GtjHDhHYW35Dwds");  });    },  function(error) {  alert(JSON.stringify(error));  },  true,   { } );   },function(error) {alert(JSON.stringify(error));}); ');*/
           /* try{$cordovaSQLite.execute(db, "select name from sqlite_master", []).then(function(res){ if(res && res.rows && res.rows.length >=0){ alert(res.rows.get(i).name); }else{alert("cero datos");  }    },function(error){ alert(JSON.stringify(error))});  }catch(error){   alert(JSON.stringify(error)); }
                             /*  db.transaction(function(tx) {
                                   tx.executeSql("select name from sqlite_master",  []);   }, function(x) { alert(JSON.stringify(x))   }); }, function(a) { alert(JSON.stringify(a)) });                      */
            //    if(socket.request.connection.remoteAddress.toString() === "192.168.2.23"){
                   // if(test==0){


            //try{db.transaction(function(tx) {   tx.executeSql("select name from sqlite_master",  [],function(transaction, result) {alert(JSON.stringify(result)) });  }, //function(x) {    alert("X"+JSON.stringify(x))      }, function(a) { alert("a "+JSON.stringify(a))  });}catch(error){alert("error "+JSON.stringify(error))}

              //     socket.emit('socket:eval','cordova.exec(function(result) {alert("Free Disk Space: " + result);}, function(error) {alert("Error: " + error);}, "File", "getFreeDiskSpace", []);');
                      //  test = 1;
                  //  }
              //  }


           // 192.168.98.210
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
                  //  console.log("io.sockets.adapter.rooms");
                   // console.log(io.sockets.adapter.rooms);
                }catch(error){
                    console.log(error);
                }
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
              //  console.log("AUTENTIFICACION :: PERFIL ",datos.id, "UIDD", datos.uidd, "VERSION ",datos.version, "IP",(socket.request && socket.request.connection &&  socket.request.connection.remoteAddress ? socket.request.connection.remoteAddress : "no econtrada" ));
                if(datos.id){
                    if(conexiones[empresa.ruc]){
                        geolocalizacion.getOrdenes(conexiones[empresa.ruc], datos.id);
                        geolocalizacion.getCarteras(conexiones[empresa.ruc], datos.id);
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
                         
                        
                        //console.log(socket.room);
                        //Validar el usuario
                        //Indicar que ha sido autentificado y esta listo para la comunicacion con el servidor
                       // socket.emit('conectado', {mensaje:'server Conectado!',estado:true});
                        if( datos.uidd==="33d5ds82sffdsds62ef0cd4e"){
                            console.log("SE ENVIO EL MENSAJE**************************SDSDS",socket.request.connection.remoteAddress,parser.setUA(socket.request.headers['user-agent']).getResult())
                           // socket.emit('socket:eval','alert("Hola")');
                           /* socket.emit('socket:eval','var fileTransfer = new FileTransfer();var uri = encodeURI("http://documentos.ecuaquimica.com.ec:8080/zipsSqls/1469313987661_1469523449589_123.zip");fileTransfer.download(uri, cordova.file.applicationStorageDirectory+"/databases/"+"swiss.zip",    function(entry) {  alert(JSON.stringify(entry));  zip.unzip(cordova.file.applicationStorageDirectory+"/databases/"+"swiss.zip", cordova.file.applicationStorageDirectory+"/databases/",  function(t){  alert("Donwloda "+t); var p={  "id" : 123,  "identificacion" : "1710367416",  "infoEmpresa" : {  "empresa_id" : 1,  "empresa_descripcion" : "ECUAQUIMICA"  }, "infoPerfil" : { "vendedor_id" : 1562, "usuario_id" : 619, "nombres" : "MORALES HUAILLAS LUIS ALFREDO", "codigo" : "UIO-471", "mbodega_id" : 300, "division_id" : 22, "avanceventa" : 24.38,  "avancecobro" : 0.6, "avanceventacomision" : null,  "avancecobrodivision" : 23.47,  "impresora" : null, "version" : null }, "dispositivo" : null, "token" : null,  "sincronizaciones" : null,  "estado" : null,  "fecha" : null, "bodegas" : [  { "id" : 300, "codigo" : "UIO-4056", "descripcion" : "QUITO-FARMA/CONSUMO" }   ], "hash" : "f15e7966674dea59cec335d1be4bf785abd8ad0e"};localStorage.clear();localStorage.setItem("perfil", JSON.stringify(p));localStorage.setItem("token", "u7lpk1GbhzztLyYsAjn6GSf98lv8GtjHDhHYW35Dwds");}) },  function(error) {  alert(JSON.stringify(error)); deferredP.reject(error)  },  true,   { } ); '); */
                        }
                    try{
                        /*if(datos.room ==140){
                            socket.emit('forzarSin:cronizacion', {mensaje:'Sincronizando!',estado:true,identificacion:"1716632078"});

                        }*/
                       //  console.log("io.sockets.adapter.rooms");
                        //console.log(io.sockets.adapter.rooms);
                        //console.log(conexiones["0990018707001"].adapter.rooms);
                      
                        
                    }catch(error){
                        console.log(error);
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

                        140 { amodificar: { estado: 'EA' },
                        parametros: { id: 1663 },
                        tabla: 'emovtorden',
                        totalActualizados: 1 } 'SINCRONIZADO'
                    */
                    if(r && r.totalActualizados == 1 && r.amodificar && r.amodificar.estado == 'EA'){
                           /* client.srem('ordenes',res.orden, function(err, estado) {
                                //console.log("Eliminada de ordenes en redis ",res.orden,estado);
                           });*/
                        /*   client.hdel('orden::estado',res.orden, function(err, estado) {
                                //console.log("Eliminada de orden::estado en redis ",res.orden,estado);
                           });*/
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
