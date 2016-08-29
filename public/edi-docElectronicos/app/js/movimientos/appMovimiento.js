
angular.module('uiRouterDocElectronicosMovimiento', [
  'ui.router',
  'ngAnimate',
  'uiRouterDocElectronicos.services',
  'movimientos.controllers',
  'movimientos.filtros',
  'ui.mask',
  'ngDialog'
])
.run(
  [          '$rootScope', '$state', '$stateParams',
    function ($rootScope,   $state,   $stateParams) {

    // It's very handy to add references to $state and $stateParams to the $rootScope
    // so that you can access them from any scope within your applications.For example,
    // <li ng-class="{ active: $state.includes('contacts.list') }"> will set the <li>
    // to active whenever 'contacts.list' or one of its decendents is active.
    $rootScope.$state = $state;
    $rootScope.$stateParams = $stateParams;
    }
  ]
)
.service('authInterceptorA', function($q, $timeout, $window) {
    var service = this;

    service.responseError = function(response) {
		console.log("response.status",response.status);
        switch (response.status) {
            case 500:
                window.document.write(response.data);
                break;
            case 401:
                window.document.write(response.data);
                break;
            case -1:
                //window.location = "/login";
                new PNotify({
                    title: 'CONEXIÓN CON EL SERVIDOR',
                    text: 'Lo sentimos nuestro servidor se inciara en en unos segundos ...',
                    type: 'error',
                    buttons: {
                              closer: true,
                              sticker: false
                          },
                });
                $timeout(function(){$window.location.reload();}, 5000);
                break;
            default:

        }
        if (response.status == 401){
            //window.location = "/login";
			window.document.write(response.data);
        }
        if (response.status == -1){
            //window.location = "/login";
            new PNotify({
                title: 'CONEXIÓN CON EL SERVIDOR',
                text: 'Lo sentimos nuestro servidor se inciara en en unos segundos ...',
                type: 'error',
                buttons: {
                          closer: true,
                          sticker: false
                      },
            });
            $timeout(function(){$window.location.reload();}, 5000);

			//window.document.write("<htmt><head><title>SwisSEdi::No existe conexión con el serviidor</title></head><body><center><h1>Lo sentimos nuestro servidor se inciara en en unos segundos ...</h1><center></body></html>");
        }
        return $q.reject(response);
    };
})

.config(
  [          '$stateProvider', '$urlRouterProvider','$urlMatcherFactoryProvider','$httpProvider',
    function ($stateProvider,   $urlRouterProvider, $urlMatcherFactoryProvider, $httpProvider) {
            $httpProvider.interceptors.push('authInterceptorA');
            PNotify.prototype.options.styling = "bootstrap3";
            console.log("$window.usuario");
            console.log(window.usuario);
      /////////////////////////////
      // Redirects and Otherwise //
      /////////////////////////////
      var currentEmpresa = 1;
      if(window.localStorage.getItem('__edi_current_empresa')){
          currentEmpresa = JSON.parse(window.localStorage.getItem('__edi_current_empresa')).nombre;
      }else{
          currentEmpresa = (window.usuario.empresa + "").split(",")[0];
      }
      // Use $urlRouterProvider to configure any redirects (when) and invalid urls (otherwise).
      $urlRouterProvider
      // If the url is ever invalid, e.g. '/asdf', then redirect to '/' aka the home state
      .otherwise('/menu/documentos/'+currentEmpresa);
      //////////////////////////
      // State Configurations //
      //////////////////////////
      // Use $stateProvider to configure your states.
      $stateProvider
              //////////
              // MENU //
              //////////
              .state("menu", {

                // Use a url of "/" to set a state as the "index".
                url: "/menu",

                // Example of an inline template string. By default, templates
                // will populate the ui-view within the parent state's template.
                // For top level states, like this one, the parent template is
                // the index.html file. So this template will be inserted into the
                // ui-view within index.html.
              /*  template: '<p class="lead">Welcome to the UI-Router Demo</p>' +
                  '<p>Use the menu above to navigate. ' +
                  'Pay attention to the <code>$state</code> and <code>$stateParams</code> values below.</p>' +
                  '<p>Click these links<a href="#/c?id=1">Alice</a> or ' +
                  '<a href="#/user/42">Bob</a>to see a url redirect in action.</p>',
                    */
                    abstract:true,
                    views: {'':
                              {
                                templateUrl:'/edi-docElectronicos/templates/movimiento/menu.html',
                                controller:"RegistrosCrtl",
                                controllerAs: 'rc'
                              },

                  },

              })
              .state("menu.documentos", {
                  url: "/documentos/:empresa_id",

                    views: {'':
                              {
                                templateUrl:'/edi-docElectronicos/templates/movimiento/menuDocumentos.html',
                               // controller:"MenuCrtl"
                              },

                  },

               })
               .state("menu.registros", {
                   url: "/registros",

                     views: {
                            '':
                               {
                                 templateUrl:'/edi-docElectronicos/templates/movimiento/registrosPorDocumento.html',
                                 //controller:"RegistrosCrtl",
                                 //controllerAs: 'rc'
                               },
                            'dialogos':
                                {
                                  templateUrl: '/edi-docElectronicos/templates/movimiento/dialogos.html',
                                   //controller:"RegistrosCrtl"
                                }


                   },

               });


    }
  ]
);
