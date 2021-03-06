var email = require('../utils/email.js');
var jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens
var tokens = require('../seguridad/tokens.js'); // get our config file
var mensajes = require('../utils/mensajesLabels.js');
var client = require("ioredis").createClient();
// Part of https://github.com/chris-rock/node-crypto-examples
// Nodejs encryption with CTR

var crypto = require('crypto'),
    algorithm = 'aes-256-ctr',
    password = '12999999393IEWKDUFDHJU434-.?';

function encrypt(text){
  var cipher = crypto.createCipher(algorithm,password)
  var crypted = cipher.update(text,'utf8','hex')
  crypted += cipher.final('hex');
  return crypted;
}

function decrypt(text){
  var decipher = crypto.createDecipher(algorithm,password)
  var dec = decipher.update(text,'hex','utf8')
  dec += decipher.final('utf8');
  return dec;
}
function decryptMD5(text){
  var decipher = crypto.createDecipher("md5","dd")
  var dec = decipher.update(text,'hex','utf8')
  dec += decipher.final('utf8');
  return dec;
}

/**************
Logger
********************/
var bunyan = require('bunyan');
var log = bunyan.createLogger({
    name: 'ediwebpage',
    serializers: {
      req: bunyan.stdSerializers.req,
      res: bunyan.stdSerializers.res
    }
});

var SeguridadEDC = function () {
    
};



SeguridadEDC.prototype.encriptar = function(texto){
	return encrypt(texto);
};



SeguridadEDC.prototype.getClient = function(){
	return client;
};

SeguridadEDC.prototype.desencriptar = function(texto){
	return decrypt(texto);
};

// verifica si el usuario se encuentra autentificado
SeguridadEDC.prototype.isUserAutenficado = function(req, res, next) {
 //Si lo esta permite el siguiente evento
    if (req.isAuthenticated())
        return next();

    //Si no esta lo envia a la pagina principal
    res.render('movimientos/iniciarSesion.html',{mensajeExtra:"..."});
    //res.redirect('/');
}


SeguridadEDC.prototype.supportCrossOriginScript = function(req, res, next) {

    res.status(200);
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Cache-Control, Pragma, Origin, Authorization, Content-Type,content-Type, accept, X-Requested-With");
    res.header("Access-Control-Allow-Methods","POST, GET, OPTIONS, DELETE, PUT, HEAD");
	res.header("Access-Control-Request-Method","POST, GET, OPTIONS, DELETE, PUT, HEAD");
	res.header("Access-Control-Request-Headers","content-Type, accept");
	next();
}
var datosInjections = ['select','1=1','delete','update','where','values','=','>','<','!=','drop table','drop database','drop ',' drop ',' drop',';'];
SeguridadEDC.prototype.verficarInjections = function (req, res, next){
   var aceptar  = true;

    for(keyjson in req.params){
		var dato = req.params[keyjson] + ''.toLowerCase().replace(/'/g, '').replace(/"/g, '')
		for(index in datosInjections){
			if(dato.indexOf(datosInjections[index])>=0){
                aceptar = false;
                var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
                var subject = "SE INTENTO HACER UNA INJECTION A LA EMPRESA #EMPRESA"
                var mensaje =   "<p style='font: 16px Arial, Helvetica'>Estimado administrador<br><br><br>"+
                                "El usuario #usuario con perfi #perfil realizo una peticion <span style='color:red;font-weight:bold'> #peticion </span> que fue clasifcada como una INJECTION por los siguientes parametros <span style='color:red;font-weight:bold'>#parametros</span><br><br><br>"+
                                "Por favor tomar en cuenta que el conjunto de palabras reservadas "+JSON.stringify(datosInjections)+", que fueron tomadas en cuenta para la clasificacion.<br><br>"+
                                "Fecha "+new Date()+"<br><br><br>"+
                                "sessionID "+req.sessionID+" en el servidor redis, puede ver el origen <br><br><br>"+
                                "Saludos<br><br><br>"+
                                "SwisSEdi<br><br></p>";
                mensaje = mensaje.replace("#usuario",req.user.username).replace("#perfil",req.user.perfil).replace("#peticion",req.originalUrl).replace("#parametros",JSON.stringify(req.params));
                email.enviarEmail(req.user.empresa.split(",")[0], mensaje, subject, function(res){

                });

			}
		}
	}

    if(aceptar){
        next();
    }else{
        req.logout();

        res.render('movimientos/iniciarSesion.html',{mensajeExtra:"Encontramos paramentros no permitdos, por tal motivo se ha cerrado su sesión"});
    }

}




SeguridadEDC.prototype.validarIdentificacion = function(req, res, next) {
    if(req.params &&  !isNaN(req.params.identificacion) && !isNaN(req.params.empresa) && req.params.uidd && req.params.uidd.length>10){
        next();
    }else {
        res.send(mensajes.errorIdentificacion.identificacion);
    }
}
SeguridadEDC.prototype.validarIndex = function(req, res, next) {
    if(req.params &&  !isNaN(req.params.index)){
        next();
    }else {
        res.status(403);
        res.send(mensajes.errorIdentificacion.perfil);
    }
}
SeguridadEDC.prototype.validarTokenCors = function(req, callback) {

}
SeguridadEDC.prototype.validarToken = function(req, res, next) {

  console.log("validarToken *********************************");
    //Extrae el token de la cabecera
 //console.log(req);
 var token = req.get("x-access-token");
 console.log("validarToken *********************************TOKEN ",token);

    //Valida que exista el toen

 if (token) {
   // Or using a promise if the last argument isn't a function
    client.get(token).then(function (result) {
      if(result){
          req.datosperfil = JSON.parse(result).datosperfil;
          console.log(req.datosperfil);
          next();
      }else{
          req.datosperfil={};
          next();
          //console.log("validarToken ***********no tiene**********************TOKEN ",token);
          //return res.json({ estado: false, message: mensajes.errorToken.token });
      }
    });
   
  }else {
      console.log("Error al leer la pgina ",token?token:"No tiene token");
    // if there is no token
    // return an error
    return res.status(403).send({
        estado: false,
        notoken:true,
        message: mensajes.errorToken.notoken
    });

  }
}
module.exports = new SeguridadEDC();
