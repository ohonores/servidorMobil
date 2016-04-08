var email = require('../utils/email.js');


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

var SeguridadEDC = function () {};



SeguridadEDC.prototype.encriptar = function(texto){
	return encrypt(texto);
};


SeguridadEDC.prototype.desencriptar = function(texto){
	return decrypt(texto);
};

// verifica si el usuario se encuentra autentificado
SeguridadEDC.prototype.isUserAutenficado = function(req, res, next) {

    console.log("SeguridadEDC.prototype.isUserAutenficado");
    console.log(req.user);
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
   console.log(req.originalUrl)
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

SeguridadEDC.prototype.validarPerfil = function(req, res, next) {
    log.info(req.user);
    log.info(req.params.perfil);
    if(req.user.perfil == req.params.perfil){
        next();
    }else {

        res.send(false);
    }
}
module.exports = new SeguridadEDC();
