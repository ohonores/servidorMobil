
angular.module('movimientos.controllers', ['ngSanitize'])

.controller('EmpresasCrtl',["$scope", '$rootScope', 'empresasFactory', 'loginFactory', 'currentUsuarioMV', "$window",'clienteProveedorFactory','$http', 'menusDcoumentosEstados', function($scope, $rootScope, empresasFactory, loginFactory, currentUsuarioMV, $window, clienteProveedorFactory,$http,menusDcoumentosEstados) {
    
    
    
    
      $scope.empresasCache = [];
      empresasFactory.getAllEmpresas(false).then(function(res){
          switch (res.status) {
            case 200:
                  $scope.empresasCache = res.data.filter(function(e){
                      if(currentUsuarioMV.empresa.split(",").indexOf(e.id)>=0 )
                          return true;
                      });
                  if($window.localStorage.getItem('__edi_current_empresa')){

                      $rootScope.empresa = JSON.parse($window.localStorage.getItem('__edi_current_empresa'));
                  }else{
                      $scope.empresasCache[0].nombre = $scope.empresasCache[0].descripcion.replace(/ /g,'-');
                      $rootScope.empresa = $scope.empresasCache[0];
                  }


              break;
            default:
                console.log("No hay conexion");
          }
      });

      $scope.procesarLogout = function () {
             loginFactory.logout();
      };

      $rootScope.currentUsuario = currentUsuarioMV;
      $scope.setCurrentEmpresa = function(valor){
          valor.nombre = valor.descripcion.replace(/ /g,'-');
          $rootScope.empresa = valor;
          $window.localStorage.setItem('__edi_current_empresa', JSON.stringify(valor));

      };

      clienteProveedorFactory.getClienteProveedor($scope.currentUsuario.persona).then(function(datos){

          switch (datos.status) {
              case 200:
                     $rootScope.cliente = datos.data;
                break;
              default:
                  console.log("No hay conexion");
          }

      });


      /*
 			Regenerar el ride
 		*/
 	$scope.regenerarPdf = function(empresa_id,id,estado){
 			var referencia="/ver/robots-ws/"+empresa_id+"/1/CR/"+id+"/"+estado;
 			$http.get(referencia).success(function(data){

 					if(data && (data.trim().indexOf('ok')>=0)){
                        new PNotify({
                            title: 'CREAR RIDE',
                            text: 'Solicitud procesada. Por favor para confirmar hacer click sobre Pdf.',
                            buttons: {
                                      closer: true,
                                      sticker: false
                                  },
                            type:"success"
                        });

 					}else{
                        new PNotify({
                            title: 'CREAR RIDE',
                            text: data,
                            buttons: {
                                      closer: true,
                                      sticker: false
                                  },
                            type: 'danger'
                        });
 					}
 			});
 	};
}])
.controller('RegistrosCrtl',["$scope",'$rootScope', "$state", "$http", '$window','tablaRegistrosFactory','$filter','menusDcoumentosEstados', 'formatDateFactory', function($scope, $rootScope, $state, $http, $window, tablaRegistrosFactory, $filter, menusDcoumentosEstados, formatDateFactory) {
    
    /****************************************************
    Seccion menu 
    ****************************************************/
     menusDcoumentosEstados.getMenus(function(res){
        $scope.menus = res;
    });
    if(!$scope.columnasTablaMovNC){
        tablaRegistrosFactory.getColumnas(function(estado, datos){
            $scope.columnasTablaMovNC = estado ? datos : [];
        });
    }

    menusDcoumentosEstados.getDocumentos(function(res){
        $scope.documentos = res;
    });



    $scope.fmostrartabla = function(valor,id, index, menumobil){
        console.log(valor);
        console.log(id);
        console.log(index);
        if(!$rootScope.busqueda){
            $rootScope.busqueda = {};
        }
        $rootScope.busqueda.tipodoc=id;
        $window.localStorage.setItem('__edi_current_documento', id);
      
    };
    
    /****************************************************
    Fin Seccion menu 
    ****************************************************/
    
    console.log("RegistrosCrtl entro");

    var _registroCrtl = this;
    _registroCrtl.movimientos = [];
    _registroCrtl.paginacionAvanzar = [];
    _registroCrtl.registrosPorPagina = 10;
    _registroCrtl.movimientoId = 0;
    _registroCrtl.movimientoReferencia = {};
    _registroCrtl.activadoDatePicker = false;
    
    
    
    
    $http.get("/ver/consultar/movimientos-redis/1").success(function(data){
        console.log("data");
            console.log(data);
             _registroCrtl.movimientos = data.registros;
    });
    
    
    _registroCrtl.notificarBarra = function(estado, mensaje){
        $rootScope.blockprocesar = estado;
        $rootScope.acccion_a_procesar = mensaje;
    };

    var ttd=true;
    _registroCrtl.getRegistros = function(iPaginacion, prev){
        if(ttd){
            return;
        }
        
        if($rootScope.busqueda && $rootScope.busqueda.tipodoc && $rootScope.empresa && $rootScope.empresa.id){
            menusDcoumentosEstados.getEstados($rootScope.empresa.id, $rootScope.busqueda.tipodoc, function(res){
             _registroCrtl.estados = res;
           });
       }else{
          if( $window.localStorage.getItem('__edi_current_documento') && $window.localStorage.getItem('__edi_current_empresa')){
              if(!$rootScope.busqueda){
                  $rootScope.busqueda = {};
              }
              $rootScope.busqueda.tipodoc = $window.localStorage.getItem('__edi_current_documento');
              $rootScope.empresa = JSON.parse($window.localStorage.getItem('__edi_current_empresa'));
              menusDcoumentosEstados.getEstados($rootScope.empresa.id, $rootScope.busqueda.tipodoc, function(res){
               _registroCrtl.estados = res;
             });
          }
       }
      
       _registroCrtl.activarDatePicker = function(a){
            if(_registroCrtl.activadoDatePicker){
                return;
            }
            $window.$('#ffin').datepicker({
    				format: 'dd/mm/yyyy'
    		}).on('changeDate', function(ev) {
                $window.$('#ffin').datepicker('hide');
                if(ev.date){
                    if(!$rootScope.busqueda){
                        $rootScope.busqueda = {};
                    }
                    $rootScope.busqueda.ffin = $filter('date')(ev.date, 'dd/MM/yyyy');
                    $rootScope.busqueda.ffinNew = ev.date.getTime();
                    console.log($rootScope.busqueda.ffin);
                }else{
                    if(!$rootScope.busqueda){
                        $rootScope.busqueda = {};
                    }
                    $rootScope.busqueda.ffinNew = null;
                }


            });
            $window.$('#finicio').datepicker({
    				format: 'dd/mm/yyyy'
    		}).on('changeDate', function(ev) {
                $window.$('#finicio').datepicker('hide');
                if(ev.date){
                    if(!$rootScope.busqueda){
                        $rootScope.busqueda = {};
                    }
                    $rootScope.busqueda.finicio = $filter('date')(ev.date, 'dd/MM/yyyy');
                    $rootScope.busqueda.finicioNew = ev.date.getTime();
                    console.log($rootScope.busqueda.finicio);
                }else{
                    if(!$rootScope.busqueda){
                        $rootScope.busqueda = {};
                    }
                    $rootScope.busqueda.finicioNew = null;
                }
            });
            if(a){
                $window.$('#finicio').datepicker('show');
            }else{
                $window.$('#ffin').datepicker('show');
            }
            _registroCrtl.activadoDatePicker = true;
        };


    _registroCrtl.notificarBarra(true, "Consultando registros..");
        /*
		* Validando la fecha
		*/
	if($rootScope.busqueda && $rootScope.busqueda.finicio && !formatDateFactory.formatDateV2($rootScope.busqueda.finicio) ){
            new PNotify({
                            title: 'FECHA DE INICIO EN LA BUSQUEDA',
                            text: 'Error en la fecha de inicio, por favor revise la fecha ingresada dd/mm/yyyy.',
                            buttons: {
                                      closer: true,
                                      sticker: false
                                  },
                            type:"danger"
                        });
			_registroCrtl.notificarBarra(false, "");
			return;
		}
        if($rootScope.busqueda && !$rootScope.busqueda.finicio ){
                $rootScope.busqueda.finicioNew = null;
                
        }
         if($rootScope.busqueda && !$rootScope.busqueda.ffin ){
                $rootScope.busqueda.ffinNew = null;
             
        }

		if($rootScope.busqueda && $rootScope.busqueda.ffin && !formatDateFactory.formatDateV2($rootScope.busqueda.ffin) ){
            //$window.notificar("Error en la fecha fin, por favor revise la fecha ingresada dd/mm/yyyy","error");
             new PNotify({
                            title: 'FECHA FIN EN LA BUSQUEDA',
                            text: 'Error en la fecha de inicio, por favor revise la fecha ingresada dd/mm/yyyy.',
                            buttons: {
                                      closer: true,
                                      sticker: false
                                  },
                            type:"danger"
                        });
           
			_registroCrtl.notificarBarra(false, "");
		          return;
		}
        if($rootScope.busqueda && $rootScope.busqueda.ffin && formatDateFactory.formatDateV2($rootScope.busqueda.ffin) ){
                //$rootScope.busqueda.ffinNew = new Date($rootScope.busqueda.ffin).getTime();
            console.log(formatDateFactory.formatDateV2($rootScope.busqueda.ffin));
                console.log($rootScope.busqueda.ffinNew);
                if(!($rootScope.busqueda.ffinNew>=$rootScope.busqueda.finicioNew)){
                    new PNotify({
                            title: 'FECHA FIN MENOR QUE LA FECHA DE INICIO',
                            text: 'Error en la fecha fin, por favor revise la fecha ingresada dd/mm/yyyy.',
                            buttons: {
                                      closer: true,
                                      sticker: false
                                  },
                            type:"danger"
                        });
                   _registroCrtl.notificarBarra(false, "");
                    return;
                }
        }
        if(($rootScope.busqueda && $rootScope.busqueda.ffin && !$rootScope.busqueda.finicio) || ($rootScope.busqueda && $rootScope.busqueda.finicio && !$rootScope.busqueda.ffin)  ){
               new PNotify({
                            title: 'FECHAS',
                            text: 'Las fechas no serán tomadas en cuenta, recuerde que se dede ingresar las dos fechas.',
                            buttons: {
                                      closer: true,
                                      sticker: false
                                  },
                            type:"warning"
                        });
           
        }


        if(iPaginacion && !prev && _registroCrtl.movimientos.length == _registroCrtl.registrosPorPagina){
            _registroCrtl.paginacionAvanzar.push(_registroCrtl.movimientos[_registroCrtl.movimientos.length - 1].id);
        }
        if(iPaginacion && prev && _registroCrtl.movimientos.length>=1){
            _registroCrtl.paginacionAvanzar.pop();
        }
        console.log($rootScope.busqueda);
        var url = '/ver/consultar/documentos/:empresaid/:personaid/:coddoc/:limite/paginacion/:id/fecha/:inicio/:fin/registroid/:registroid/:estado'.
                    replace(":empresaid",$rootScope.empresa?$rootScope.empresa.id:0).
                    replace(":personaid", $rootScope.cliente &&  $rootScope.cliente.id ? $rootScope.cliente.id : 0 ).
                    replace(":coddoc",$rootScope.busqueda && $rootScope.busqueda.tipodoc? $rootScope.busqueda.tipodoc:0).

                    replace(":limite",_registroCrtl.registrosPorPagina).
                    replace(":id",(iPaginacion && _registroCrtl.paginacionAvanzar.length>=1) ? _registroCrtl.paginacionAvanzar[_registroCrtl.paginacionAvanzar.length - 1]:0).
                    replace(":inicio",$rootScope.busqueda && $rootScope.busqueda.finicioNew?$rootScope.busqueda.finicioNew:"0" ).
                    replace(":fin",$rootScope.busqueda && $rootScope.busqueda.ffinNew?$rootScope.busqueda.ffinNew:"0" ).
                    replace(":registroid", _registroCrtl.movimientoId).
                    replace(":estado", $rootScope.busqueda && $rootScope.busqueda.estado ? $rootScope.busqueda.estado:0);



        _registroCrtl.totalRegistrosEncontradosBABC = [];
        $http.get(url).success(function(data){
            _registroCrtl.movimientos = data.resultados;
            _registroCrtl.totalRegistrosEncontradosBA = data.total;
            _registroCrtl.totalRegistrosEncontradosBABC = [];
            _registroCrtl.totalRegistrosEncontradosBABC.push(_registroCrtl.totalRegistrosEncontradosBA);
            _registroCrtl.notificarBarra(false, "");
            if(Array.isArray(_registroCrtl.movimientos) && _registroCrtl.movimientos.length === 0){

                new PNotify({
                    title: 'REGISTROS NO ENCONTRADOS',
                    text: 'No se encontraron registros con los parametros ingresados.',

                       buttons: {
                              closer: true,
                              sticker: false
                          },
                });

            }
        });

        setTimeout(function() {
                _registroCrtl.notificarBarra(false, "");
        },60000);
    };
    _registroCrtl.getRegistros();
    _registroCrtl.mostrarMensajeprefetch = false;
    _registroCrtl.iniciadoTypehead = false;
    _registroCrtl.iniciarTypehead = function(){
         if(_registroCrtl.iniciadoTypehead){
            return;
        }else{
            _registroCrtl.iniciadoTypehead = true;
        }
        console.log("iniciarTypehead");
        var clienteProveedor = new Bloodhound({
            limit: 80,
            datumTokenizer: function(d) {
                return Bloodhound.tokenizers.whitespace(d.query);
            },
            queryTokenizer: Bloodhound.tokenizers.whitespace,
            remote:'consultar/clientes/criterio/%QUERY'
        });
        clienteProveedor.initialize();

        var clienteProveedor_listo =  clienteProveedor.initialize();
        $window.$("#prefetch-clientes-input").blur(function(){
            _registroCrtle.checkCliente();
        });
        $window.$('#prefetch-clientes .typeahead').typeahead({
          hint : true,
          highlight: true,
          minLength: 3,}, {

          name: 'clienteProveedor',
          displayKey: 'razonsocial',
          source: clienteProveedor.ttAdapter(),
          templates: {
            empty: [
              '<div class="empty-message">',
              'Lo sentimos pero no se encontraron registros',
              '</div>'
            ].join('\n')

          }

        }).on('typeahead:selected', function(obj, selected, name) {

        	if(selected.query !='NO SE ENCONTRARON REGISTROS'){
                $rootScope.cliente = selected;
                _registroCrtl.getRegistros();
            }else{
                $rootScope.cliente = {};
            }
         });

    };
    //Typehead par documentos edi-docElectronicos
    _registroCrtl.typeheadDocumentos = false;
    _registroCrtl.iniciarTypeheadDocumentos = function(empresa, tipdoc){
        if(_registroCrtl.typeheadDocumentos){
            return;
        }else{
            _registroCrtl.typeheadDocumentos = true;
        }
        var typeaheadDocElect = new Bloodhound({
            limit: 80,
            datumTokenizer: function(d) {
                return Bloodhound.tokenizers.whitespace(d.query);
            },
            queryTokenizer: Bloodhound.tokenizers.whitespace,
            remote:'/ver/consultar/documentos/criterio/'+empresa+'/'+tipdoc+'/%QUERY'
        });
        typeaheadDocElect.initialize();

        $window.$("#prefetch-documentos5-input").blur(function(){
            _registroCrtl.checkDocumento();
        });
        $window.$('#prefetch-documentos5 .typeahead').typeahead({
          hint : true,
          highlight: true,
          minLength: 3,}, {
          name: 'typeaheadDocElect',
          displayKey: 'preimpreso',
          source: typeaheadDocElect.ttAdapter(),
          templates: {
            empty: [
              '<div class="empty-message">',
              'Lo sentimos pero no se encontraron registros',
              '</div>'
            ].join('\n')

          }
        }).on('typeahead:selected', function(obj, selected, name) {
        	if(selected.query !='NO SE ENCONTRARON REGISTROS'){
                _registroCrtl.movimientoId = selected.id;
                _registroCrtl.getRegistros();
            }else{
                _registroCrtl.movimientoId = 0;
            }
         });
         $window.$("#prefetch-documentos5-input").focus();
    };
    //_registroCrtl.iniciarTypehead();
    _registroCrtl.checkCliente = function(){
            if(!$window.$("#prefetch-clientes-input").val()){
				$rootScope.cliente = {};
			}
            _registroCrtl.getRegistros();
            _registroCrtl.mostrarMensajeprefetch = false;
	};
    _registroCrtl.checkDocumento = function(){
            if(!$window.$("#prefetch-documentos5-input").val()){
				_registroCrtl.movimientoId = 0;
			}
            _registroCrtl.getRegistros();
            _registroCrtl.mostrarMensajeprefetch = false;
	};
    _registroCrtl.setEstadoMovmiento =function(estado){
        if(!$rootScope.busqueda){
            $rootScope.busqueda = {};
        }
        $rootScope.busqueda.estado = estado;
        _registroCrtl.getRegistros();
    };

   _registroCrtl.getMovimientoBitacora = function(movimiento){
			_registroCrtl.movimientoReferencia = movimiento;
			$http.get('/ver/consultar/movimientos-bitacora/'+movimiento.id).success(function(data){
				_registroCrtl.movimientobitacorascope = data;
			});

    };
    /*************UNSCAPEHTML*****************/
    _registroCrtl.deliberatelyTrustDangerousSnippet = function(dato) {
        try{
		       if(dato){
					return $window.unescape(dato);
			   }

        }catch(error){
				console.log(error);
		}
		return dato;
    };
    /*************UNSCAPEHTML*****************/
    _registroCrtl.grabarColumnasEnFavoritos = function() {
        console.log("grabarColumnasEnFavoritos ... ");
        $window.localStorage.setItem('__columnas__data_'+$window.usuario.id, JSON.stringify($scope.columnasTablaMovNC));
        console.log($window.localStorage.getItem('__columnas__data_'+$window.usuario.id));
         new PNotify({
                    title: 'COLUMNAS AGREGADAS A FAVORITOS',
                    text: 'La columnas que activó se mostrarán en su próxima visita.',

                    buttons: {
                          closer: true,
                          sticker: false
                     },
                    type:"info"
        });
    }
}])
.controller('MenuCrtl',["$scope", "$rootScope", "$state", "$http", 'menusDcoumentosEstados', 'tablaRegistrosFactory','$stateParams', '$window',  function($scope, $rootScope, $state, $http, menusDcoumentosEstados, tablaRegistrosFactory, $stateParams,$window) {
    console.log($stateParams);
    menusDcoumentosEstados.getMenus(function(res){
        $scope.menus = res;
    });
    if(!$scope.columnasTablaMovNC){
        tablaRegistrosFactory.getColumnas(function(estado, datos){
            $scope.columnasTablaMovNC = estado ? datos : [];
        });
    }

    menusDcoumentosEstados.getDocumentos(function(res){
        $scope.documentos = res;
    });



    $scope.fmostrartabla = function(valor,id, index, menumobil){
        console.log(valor);
        console.log(id);
        console.log(index);
        if(!$rootScope.busqueda){
            $rootScope.busqueda = {};
        }
        $rootScope.busqueda.tipodoc=id;
        $window.localStorage.setItem('__edi_current_documento', id);
      
    };
}]);

/*
$scope.f_setColumnasActivasSize786x991=function(tipo){

    for(var i=0;i<$scope.columnasTablaMovNC.length;i++){
        switch(tipo){
            case 1:
                if($scope.columnasTablaMovNCInit.indexOf(i)>=0){
                    $scope.columnasTablaMovNC[i].estado=true;
                }else{
                    $scope.columnasTablaMovNC[i].estado=false;
                }
            break;
            case 2:
                if($scope.columnasTablaMovNCActivasAdmin.indexOf(i)>=0){
                    $scope.columnasTablaMovNC[i].estado=true;
                }else{
                    $scope.columnasTablaMovNC[i].estado=false;
                }
            break;
            case 3:
                if($scope.columnasTablaMovNCActivasMobil.indexOf(i)>=0){
                    $scope.columnasTablaMovNC[i].estado=true;
                }else{
                    $scope.columnasTablaMovNC[i].estado=false;
                }
            break;
            case 21:
                if($scope.columnasTablaMovNCActivas.indexOf(i)>=0){
                    $scope.columnasTablaMovNC[i].estado=true;
                }else{
                    $scope.columnasTablaMovNC[i].estado=false;
                }
            break;
            case 3:
            break;
        }

    }
}
*/
