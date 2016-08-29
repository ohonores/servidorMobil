angular.module('uiRouterDocElectronicos.services', [

])

	// A RESTful factory para obtener variables a partir del archivo 'menusYestados.json'
	.factory('menusDcoumentosEstados', ['$http', '$window', function ($http, $window) {
	  	var pathMenus = '/ver/menus/:perfil';
		var pathDocumentos = '/ver/documentos/:perfil';
		var pathEstados = '/ver/estados/:empresa/:documento/:perfil';
	    var menusDcoumentosEstados = {};
		menusDcoumentosEstados.getMenus = function(callBack) {
			if($window.usuario && $window.usuario.perfil){
				$http.get(pathMenus.replace(":perfil", $window.usuario.perfil)).then(function (resp) {
					callBack(resp.data);
				});
			}else{
				callBack([]);
			}

	  	};
		menusDcoumentosEstados.getDocumentos = function(callBack) {
			if($window.usuario && $window.usuario.perfil){
				$http.get(pathDocumentos.replace(":perfil",$window.usuario.perfil)).then(function (resp) {
					callBack(resp.data);
				});
			}else{
				callBack([]);
			}

		};
		menusDcoumentosEstados.getEstados = function(empresa, documento, callBack) {
			if($window.usuario && $window.usuario.perfil){
				$http.get(pathEstados.replace(":empresa",empresa).replace(":documento",documento).replace(":perfil",$window.usuario.perfil)).then(function (resp) {
					callBack(resp.data);
				});
			}else{
				callBack([]);
			}

		};

	  	return menusDcoumentosEstados;
	}])

	/*****
	RESTful factory:
	Movmientos
	****************/
	.factory('movimientoFactory', ['$http', 'utils', function ($http, utils) {
		var urlBase = '/movimientos/:prefijo/';
		var movimientoFactory = {};

		movimientoFactory.getMovimientos = function (busqueda, prefijo) {
			return $http.get(urlBase.replace(':prefijo',prefijo) + '/busqueda/' + JSON.stringify(busqueda));
		};

		movimientoFactory.getMovimientoBitacora = function (id, prefijo) {
		   return $http.get(urlBase.replace(':prefijo',prefijo) + '/bitacora/busqueda/' + id);
		};

		movimientoFactory.eliminarMovimiento = function (id, prefijo) {
			 return $http.get(urlBase.replace(':prefijo',prefijo) + '/eliminar/' + id);
		};

		movimientoFactory.editarXmlMovimiento = function (id, prefijo) {
			 return $http.get(urlBase.replace(':prefijo',prefijo) + '/editar/' + id);
		};
		movimientoFactory.bajarRide = function (id, prefijo) {
			 return $http.get(urlBase.replace(':prefijo',prefijo) + '/bajar/ride/' + id);
		};
		movimientoFactory.bajarXmlAutorizado = function (id, prefijo) {
			 return $http.get(urlBase.replace(':prefijo',prefijo) + '/bajar/xml/' + id);
		};

		return movimientoFactory;
	}])
	/*****
	RESTful factory:
	Cliente Proveedor
	****************/
	.factory('clienteProveedorFactory', ['$http', function ($http) {
		var urlBase = '/ver/consultar/cliente-proveedor/id/:prefijo';
		var clienteProveedorFactory = {};
		clienteProveedorFactory.getClienteProveedor = function (id) {

			return $http.get(urlBase.replace(':prefijo',id) );
		};

		//Actualiza email y otros campos
		clienteProveedorFactory.actualizarClienteProveedor = function (datos, prefijo) {
			 return $http.put(urlBase.replace(':prefijo',prefijo) + '/actualizar/', datos);
		};

		return clienteProveedorFactory;
	}])
	.factory('tablaRegistrosFactory', ['$http', '$window', function ($http, $window) {
		var columnas = '/edi-docElectronicos/assets/menusYestados.json';
		var tablaRegistrosFactory = {};
		//Buscamos en el localStorage

        

		tablaRegistrosFactory.getColumnas = function (callBack) {

			if($window.localStorage.getItem('__columnas__data_'+$window.usuario.id)){

					try{
						callBack(true, JSON.parse($window.localStorage.getItem('__columnas__data_'+$window.usuario.id)));
                        return;
					}catch(error){
						$window.localStorage.removeItem('__columnas__data_'+$window.usuario.id);
					}

			}
			$http.get(columnas).then(function(datos){

					switch (datos.status) {
						case 200:
							  /* cols = datos.data.columnasTablaMov.filter(function(c){
                                   console.log(c);
                                   if(c.edi === $window.usuario.edi){
                                       delete c.admin
                                       return c;
                                   }
                               });*/
                            //    $window.localStorage.setItem('__columnas__data_'+$window.usuario.id, JSON.stringify(datos.data.columnasTablaMov));
                            
							   callBack(true, datos.data.columnasTablaMov);
						break;
						default:
							callBack(false);
					}
			});


		};
		return tablaRegistrosFactory;
	}])
	/*****
	RESTful factory:
	Cliente Proveedor
	****************/
	.factory('sriFactory', ['$http', 'utils', function ($http, utils) {
		var urlBase = '/sri-acciones/:prefijo/';
		var sriFactory = {};

		sriFactory.enviarXml = function (id, prefijo) {
			return $http.get(urlBase.replace(':prefijo',prefijo) + '/enviar/' + id);
		};

		//Actualiza email y otros campos
		sriFactory.autorizarXml = function (id, prefijo) {
			 return $http.get(urlBase.replace(':prefijo',prefijo) + '/autorizar/'+ id);
		};

		return sriFactory;
	}])
	/*****
	RESTful factory:
	Cliente Proveedor
	****************/
	.factory('archivoFactory', ['$http', 'utils', function ($http, utils) {
		var urlBase = '/archivos-acciones/:prefijo/';
		var archivoFactory = {};

		archivoFactory.subirArchivo = function (archivo, prefijo) {
			return $http.put(urlBase.replace(':prefijo',prefijo) + '/subir/', archivo);
		};

		//Actualiza email y otros campos
		archivoFactory.bajarArchivo = function (id, prefijo) {
			 return $http.get(urlBase.replace(':prefijo',prefijo) + '/bajar/'+ id);
		};

		//Actualiza email y otros campos
		archivoFactory.eliminarArchivo = function (id, prefijo) {
			 return $http.get(urlBase.replace(':prefijo',prefijo) + '/eliminar/'+ id);
		};

		return archivoFactory;
	}])

	.factory('formatDateFactory',function(){
		var reg = /^(((0[1-9]|[12]\d|3[01])\/(0[13578]|1[02])\/((19|[2-9]\d)\d{2}))|((0[1-9]|[12]\d|30)\/(0[13456789]|1[012])\/((19|[2-9]\d)\d{2}))|((0[1-9]|1\d|2[0-8])\/02\/((19|[2-9]\d)\d{2}))|(29\/02\/((1[6-9]|[2-9]\d)(0[48]|[2468][048]|[13579][26])|((16|[2468][048]|[3579][26])00))))$/g;
        var formatDateFactory  = {};
	    formatDateFactory.formatDateV2 = function(d) {
	    			  if(d instanceof Date){
	    				return true;
	    			  }
	    			  if(d.split('/').length>0){
	    				return true;
	    			  }
	    			  if(d.split('-').length>0){
	    				return true;
	    			  }
	    			  var dd = d.slice(0,2);

	    			  if ( dd.length < 2 ) dd = '0' + dd;
	    			  var mm = d.slice(2,4);
	    			  if ( mm.length < 2 ) mm = '0' + mm;
	    			  var yy = d.slice(4,8);

	    			  if (reg.test(dd+'/'+mm+'/'+yy)) {
	    				return true;
	    			  }else{
	    				return false;
	    			  }


	    	};//fin this.formatDateV2
		return formatDateFactory;
	})
	/***************
		EMPRESAS CACHE
		**************/
	.factory('empresasFactory', ['$http','$window' , function ($http,$window) {
				var urlBase = '/consultar/empresas/1';
				var empresasFactory ={};
				empresasFactory.getAllEmpresas = function (cache) {
					if(cache){
						if($window.localStorage.getItem('__empresas_cache__data')){
							try{
								return JSON.parse($window.localStorage.getItem('__empresas_cache__data')).datums;
							}catch(error){
								console.log(error);
							}

						}
						return [];
					}else{
							$window.localStorage.removeItem('__empresas_cache__data');
							return $http.get(urlBase);
					}

				};
				return empresasFactory;
			}])
		/***************
		LOGIN
		**************/
		.factory('loginFactory', ['$http','$window' , function ($http,$window) {
			var urlLogin = '/login';
			var urlLogout = '/ver/salir';
            var urlRecuperacion = '/reseteo';
			var loginFactory ={};
			loginFactory.login = function (credenciales) {
				return  $http.post(urlLogin, credenciales);
			};
            loginFactory.recuperacion = function (credenciales) {
				return  $http.post(urlRecuperacion, credenciales);
			};
			loginFactory.logout = function () {

				var res = $http.get(urlLogout); //lo borra de la sesion
				 res.success(function(data, status, headers, config) {

					 $window.location.href='/';  //redirige a la pagina principal
				 });
				 res.error(function(data, status, headers, config) {
					 //consolse.log(data); //Error al hacer logout
					 $window.notificar("Por favor int&eacute;ntelo nuevamente","error");
				 });
		 	};
			return loginFactory;
		}])
		.factory('currentUsuarioMV', ['$http','$window' , function ($http,$window) {
			var currentUsuarioMV  = $window.usuario;

			return currentUsuarioMV;
		}])
        .factory('conexionWSocket', ['$http','$window' , function ($http,$window) {
            var socket;
			var conexionWSocket ={
                                    inicio:inicio,
                                    socket:getsocket,
                                    recuperacionClave:recuperacionClave
                                 };
            
          
            return conexionWSocket;
            
            function inicio(ruc){
                if(ruc){
                    //socket = io($window.location.origin+"/ws-"+ruc);
                }else{
                    //socket = io($window.location.origin);
                }
                
                
            }
            function getsocket(){
                return socket;
            }
            
            function recuperacionClave(){
                 socket.emit('autenficacion',{room:"recuperacionClave"});
            }
            socket.on("connect", function(){
               recuperacionClave();
            });
            socket.on("conectado", function(resp){
               console.log(resp);
            });
            
           
		}]);


