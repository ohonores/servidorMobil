// app/rutas.js
var fs = require('fs');

// load all the things we need
// Passport soporta varios tipo de login, en este caso se utiliza el passport-local
var LocalStrategy;
var UAParser = require('ua-parser-js');
var request = require("request");
var fechaUtils =  require("../utils/fechaUtils.js");
var UbicacionIp = require('../utils/ubicacion.js');

var parser = new UAParser();
var agentOptions_;
var log; //Variable usuarda para los logos
var mensajesLabels;
/*
    Esta funcion permite la comunicacion con el WebService para realizar la autenficacion
*/
var validarUsuarioImpl = function(codigo, clave, hostSwissEdi, callback){

  try{
    //Se crea una Variable header, para enviar al WebService en java
  	var header={
  	'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  	'Accept-Encoding':'gzip, deflate, sdch',
  	'Accept-Language':'es-ES,es;q=0.8,en;q=0.6',
  	'Cache-Control':'max-age=0',
  	'Connection':'keep-alive',
  	'Cookie':'JSESSIONID=B2D4124FF866E5F4C6033A63D07B545D',
  	'Host':'localhost',
  	'User-Agent':'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36'
  	}
	 request({
				uri: "https://"+hostSwissEdi+"/obteneSesionUsuarioMB?"+fechaUtils.getParametroCodigo()+"="+codigo+"&"+fechaUtils.getParametroClave()+"="+clave+"&"+fechaUtils.getParametroCondiciiones()+"=true",//?pagina=resultado&opcion=1&texto="+ruc,
				method: "POST",
				headers: header,
				timeout : 20000, //Maximo espera 10 segundos por peticion,
				agentOptions: agentOptions_
			}, function(error, response, body) {
                respuesta = mensajesLabels.errorIngreso001.ingreso;
                if (!error && response.statusCode == 200) {
                    var respuesta = "";
					try{
                        log.info({usuario:codigo,clave:clave, body:JSON.parse(body)});
                        respuesta = JSON.parse(body);
					}catch(error){
                        log.info({usuario:codigo,clave:clave, error:error});
					}
					callback(null, respuesta);
                } else {
                    log.info({usuario:codigo,clave:clave, error:error});
                    callback(error,null);
			    }
			})


   }catch(error){
       log.info({usuario:codigo,clave:clave, error:error});
   }
}





consultarEmpresasPorIdentificacionPersonaLogin = function(identificacion, edi, postgres, respuesta){
var criterios = [identificacion]


	if(identificacion == '1714784251'){
		respuesta(1);
	}else{
		var sqlTotal = "SELECT e.id as empresaid FROM  swissedi.eeditempresa e join swissedi.eeditempresa_persona ep on ep.empresa_id=e.id where  ep.codigo=$1::varchar order by e.id desc limit 1 ";
		postgres.getPoolClienteConexion(sqlTotal, criterios, function(resultado){

				if(resultado){
					respuesta(resultado.rows[0].empresaid);
				}else{
					respuesta.json(-1);

				}
		});
	}

}


module.exports = function(passport, hostSwissEdi, postgres, LocalStrategy_,agentOptions__, log_, mensajesLabels_) {
    log = log_;
    mensajesLabels = mensajesLabels_;
	LocalStrategy = LocalStrategy_;
	agentOptions_ = agentOptions__;
	// =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {

	    console.log(user);
       if(user && user.id){
			done(null, user);
		  }else{
			done(null, null);
		}
    });

    // used to deserialize the user
    passport.deserializeUser(function(user, done) {
       done(null, user);
    });



    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use(new LocalStrategy({passReqToCallback: true},function(req,username, password, done) { // callback with email and password from our form

		validarUsuarioImpl(username,password,hostSwissEdi, function(error, respuesta){
			if(error){
				console.log('login error 001')
				console.log(error)
				if(error.code == 'ECONNREFUSED'){

					console.log(mensajesLabels.errorServidorWS);
				}
				return done(null, false, {mensaje: 'Por favor intentelo mas tarde error:001'});
			}else{

				if(!respuesta){
					return done(null, false, {mensaje: 'No existe conexion con el serivdor, intentelo mas tarde'});
				}
				if(respuesta.login){

					var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
					/*
						Obteniendo el perfil del usuario.
					*/
					if(!respuesta.perfil){
						respuesta.perfil='edi';
					}
					switch(respuesta.perfil){
						case 'usuario':
							postgres.buscarUsuarioJson(respuesta.usuario, function(resultado){

								if(resultado != false){
									respuesta.infoadicional = {};
									respuesta.infoadicional.empresas = resultado.empresas;
									respuesta.infoadicional.documentos = resultado.documentos;
									user = { username: respuesta.usuario, edi:respuesta.edi, perfil:respuesta.perfil,empresa:respuesta.empresa, id:respuesta.usuario, fechaInicio:new Date(),ipAddress:ip, persona:respuesta.persona, identificacion:respuesta.identificacion,infoadicional:respuesta.infoadicional};
									/*************
										Grabar bitacora del usuario
									**************/

									UbicacionIp.getUbicacionIp(req.header('x-forwarded-for') || req.connection.remoteAddress, function(ubicacion){

									    postgres.buscarIngresosBitacoraUsuario(req.sessionID,function(respuesta_a){

											if(respuesta_a === false){
												postgres.grabarBitacoraUsuario(respuesta.empresa,req.sessionID,respuesta.usuario,req.session.browser,req.header('x-forwarded-for') || req.connection.remoteAddress, ubicacion, function(resultado){console.log('Bitacora id '+resultado)});
											}else{
												if(respuesta_a.fechaingreso){
													postgres.actualizarIngresosBitacoraUsuario(req.sessionID,respuesta_a,function(respuestaA){console.log(respuestaA)});
												}
											}
										});

									});




									return done(null, user);
								}
							});
						break;
						case 'edi':
						case 'root':
						case 'admin':
							user = { username: respuesta.usuario, edi:respuesta.edi, perfil:respuesta.perfil,empresa:respuesta.empresa, id:respuesta.usuario, fechaInicio:new Date(),ipAddress:ip, persona:respuesta.persona, identificacion:respuesta.identificacion,infoadicional:respuesta.infoadicional};
							if(respuesta.perfil === 'admin'){
								user.eliminarregistros = true;
							}
									/*************
										Grabar bitacora del usuario
									**************/
									var ua = req.headers['user-agent'];     // user-agent header from an HTTP request
									//
									UbicacionIp.getUbicacionIp(req.header('x-forwarded-for') || req.connection.remoteAddress, function(ubicacion){

									    postgres.buscarIngresosBitacoraUsuario(req.sessionID,function(respuesta_a){

											if(respuesta_a === false){
												postgres.grabarBitacoraUsuario(respuesta.empresa,req.sessionID,respuesta.usuario,parser.setUA(ua).getResult(),req.header('x-forwarded-for') || req.connection.remoteAddress, ubicacion, function(resultado){console.log('Bitacora id '+resultado)});
											}else{
												if(respuesta_a.fechaingreso){
													postgres.actualizarIngresosBitacoraUsuario(req.sessionID,respuesta_a,function(respuestaA){console.log(respuestaA)});
												}
											}
										});

									});
							//console.log(req)	;
							//console.log(req.sessionID)
							return done(null, user);
						break;
					}





				}else{
					//console.log(respuesta)
					return done(null, false, {mensaje: 'Usuario o password no aceptado'});
				}

			}
		});
    }));




};
