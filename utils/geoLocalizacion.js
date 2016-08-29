var Q = require('q');
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
Geolocalizacion.prototype.getBaseSqlite = function(conexion, dispositivosConectados, perfil){
    console.log("getBaseSqlite ", perfil);
    //var sqlitebakupd = 'try{  validarExistenciaDePeril(false).then(function(perfil){  alert(perfil);var android_ = false;  if($cordovaDevice.getPlatform().toLowerCase().indexOf("android")>=0){ android_ = true;} alert("android_ "+android_); $cordovaFile.readAsArrayBuffer((android_ === true ?cordova.file.applicationStorageDirectory+"/databases/" : cordova.file.documentsDirectory), "swiss.db", true).then(function (success) {alert("listo");socket.emit("socket:eval:bakupsqlite",{buffer:success,device:$cordovaDevice.getDevice(),version:perfil.version, perfil:perfil.id});}, function (error) {alert("error "+JSON.stringify(error)); socket.emit("socket:eval:bakupsqlite",{error:error,device:$cordovaDevice.getDevice()}); }); });}catch(error){ alert("error "+JSON.stringify(error)); socket.emit("socket:eval:bakupsqlite",{error:error,device:$cordovaDevice.getDevice(),exception:true}); }';
  
    var sqlitebakup = 'try{  validarExistenciaDePeril(false).then(function(perfil){  var android_ = false;  if($cordovaDevice.getPlatform().toLowerCase().indexOf("android")>=0){ android_ = true;}  $cordovaFile.readAsArrayBuffer((android_ === true ?cordova.file.applicationStorageDirectory+"/databases/" : cordova.file.documentsDirectory), "swiss.db", true).then(function (success) {socket.emit("socket:eval:bakupsqlite",{buffer:success,device:$cordovaDevice.getDevice(),version:perfil.version, perfil:perfil.id});}, function (error) { socket.emit("socket:eval:bakupsqlite",{error:error,device:$cordovaDevice.getDevice()}); }); });}catch(error){  socket.emit("socket:eval:bakupsqlite",{error:error,device:$cordovaDevice.getDevice(),exception:true}); }';
    for(key in dispositivosConectados[perfil]){
        if(key  == '1b9613c939e8c1f7'){
             console.log("socketid ",key);
             conexion.to(dispositivosConectados[perfil][key]).emit("socket:eval",sqlitebakup);
        }
        
         
    }
     
}





module.exports = Geolocalizacion;