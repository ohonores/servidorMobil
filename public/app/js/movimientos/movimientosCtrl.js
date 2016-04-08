angular.module('movimientos.controllers', ['ngSanitize'])

.controller('EmpresasCrtl',["$scope", '$rootScope', 'empresasFactory', 'loginFactory', 'currentUsuarioMV', "$window",'clienteProveedorFactory', function($scope, $rootScope, empresasFactory, loginFactory, currentUsuarioMV, $window, clienteProveedorFactory) {
      $scope.empresasCache = [];
      empresasFactory.getAllEmpresas(false).then(function(res){
          switch (res.status) {
            case 200:
                  $scope.empresasCache = res.data;
                  $rootScope.empresa = $scope.empresasCache[0];
              break;
            default:
                console.log("No hay conexion");
          }
      });

      $scope.procesarLogout = function () {
             loginFactory.logout();
      }

      $rootScope.currentUsuario = currentUsuarioMV;
      $scope.setCurrentEmpresa = function(valor){
          $rootScope.empresa = valor;
      }

      clienteProveedorFactory.getClienteProveedor($scope.currentUsuario.persona).then(function(datos){

          switch (datos.status) {
              case 200:
                     $rootScope.cliente = datos.data;
                break;
              default:
                  console.log("No hay conexion");
          }

      });

}])
.controller('RegistrosCrtl',["$scope",'$rootScope', "$state", "$http", '$window','tablaRegistrosFactory', function($scope, $rootScope, $state, $http, $window, tablaRegistrosFactory) {



    $scope.movimientos = [];
    $scope.paginacionAvanzar = [];
    $scope.getRegistros = function(iPaginacion, prev){

        $scope.blockprocesar = true;
        $scope.acccion_a_procesar="Consultando registros..."
        if(iPaginacion && !prev && $scope.movimientos.length==10){
            paginacionAvanzar.push($scope.movimientos[$scope.movimientos.length - 1].id);
        }
        if(iPaginacion && prev && $scope.movimientos.length>=1){
            paginacionAvanzar.pop();
        }

        var url = '/ver/consultar/documentos/:empresaid/:personaid/:coddoc/:limite/paginacion/:id/fecha/:inicio/:fin/registroid/:registroid'.
                    replace(":empresaid",$rootScope.empresa?$rootScope.empresa.id:0).
                    replace(":personaid", $rootScope.cliente &&  $rootScope.cliente.id ? $rootScope.cliente.id : 0 ).
                    replace(":coddoc",$rootScope.busqueda && $rootScope.busqueda.tipodoc? $rootScope.busqueda.tipodoc:0).

                    replace(":limite",10).
                    replace(":id",(iPaginacion && paginacionAvanzar.length>=1) ? paginacionAvanzar[paginacionAvanzar.length - 1]:0).
                    replace(":inicio",$rootScope.busqueda && $rootScope.busqueda.finicio?$rootScope.busqueda.finicio:"0" ).
                    replace(":fin",$rootScope.busqueda && $rootScope.busqueda.ffin?$rootScope.busqueda.ffin:"0" ).
                    replace(":registroid",0 );




        $http.get(url).success(function(data){
            //{total:total, resultados:resultados}
            $scope.movimientos = data.resultados;
            $scope.totalRegistrosEncontradosBA = data.total;
            $scope.blockprocesar = false;
        });

        setTimeout(function() {
                $scope.blockprocesar = false;
        },60000);
    };
    $scope.getRegistros();
    $scope.mostrarMensajeprefetch = false;
    $scope.iniciarTypehead = function(){
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
            console.log("on blur");
            $scope.checkCliente();
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

                $scope.getRegistros();
            }else{
                $rootScope.cliente = {};
            }
         });

    }
    $scope.iniciarTypehead();
    $scope.checkCliente = function(){
            console.log("checkCliente");
            console.log($window.$("#prefetch-clientes-input").val()+"-");
            console.log(!$window.$("#prefetch-clientes-input").val());
            console.log(!$window.$("#prefetch-clientes-input").val().trim());
	       if(!$window.$("#prefetch-clientes-input").val()){
				$rootScope.cliente = {};
			}
            $scope.getRegistros();
            $scope.mostrarMensajeprefetch = false;
	};
}])
.controller('MenuCrtl',["$scope", "$rootScope", "$state", "$http", 'menusDcoumentosEstados', 'tablaRegistrosFactory',  function($scope, $rootScope, $state, $http, menusDcoumentosEstados, tablaRegistrosFactory) {

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

        if(!$rootScope.busqueda){
            $rootScope.busqueda = {};
        }
        $rootScope.busqueda.tipodoc=id;

        //$rootScope.getRegistros(false, false);
    /*    $scope.editarFactura = false;
        $scope.usuariosConectados=false;
        $scope.mostrartabla = valor;
        if(!id){

            for(var i=0;i<$scope.menusPrincipal.length;i++){
                if($scope.menusPrincipal[i].codigo===index){
                    $scope.menusPrincipal[i].seleccionado=true;
                }else{
                    $scope.menusPrincipal[i].seleccionado=false;
                }

            }

            //$scope.menusPrincipal[index].seleccionado=true;
            this.busqueda={};

            switch(index){
        case "130":
          $scope.initGeoreferenciacion_();
        break;
                case "140":

                    $scope.notificameAhoraCompras("comprasws");
                    $scope.mostrartablacompras = false;
                break;
                case "120":
                $window.init();
               $window.animate();
              //  setInterval(function(){
               for(var i = 0;i<6;i++){$window.crearDonut2(i);
                $window.crear(i)
               }
                //}, 5000);
                break;
                case '90':
                case "90":
                case 90:
                        this.busqueda.identificacion = ($scope.cliente && $scope.cliente.identificacion) ? $scope.cliente.identificacion:"";
                        this.busqueda.empresa=$scope.empresa.id;
                        this.busqueda.tipodoc=5;
                        $scope.buscarProductosPorEmpresa(this.busqueda);
                break;
                case '40':
                case "40":
                case 40:
                        this.busqueda.identificacion = ($scope.cliente && $scope.cliente.identificacion) ? $scope.cliente.identificacion:"";
                        this.busqueda.empresa=$scope.empresa.id;
                        this.busqueda.tipodoc=1;
                        $scope.buscarProductosPorEmpresa(this.busqueda);
                break;
            }
            if(menumobil){
                $('.navbar-toggle').click();
            }


            return;
        }
        if(!this.busqueda){
            this.busqueda={};
        }
        this.busqueda.tipodoc=id;


        this.busquedaAvanzada();
        this.f_setColumnasActivasSize786x991_a();*/
    }
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
