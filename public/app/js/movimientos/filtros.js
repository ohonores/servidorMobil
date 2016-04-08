angular.module('movimientos.filtros', ['ngSanitize'])

/************************
    FILTRAR TIPO DE DOCUMENTOS POR ID
*************************/
.filter('checkTipoDoc', function($window) {
    return function(input) {

        switch(input){
            case '0':
                return "Un solo email";
            case '1':
                return "Factura";
            case '2':
                return "Nota Cr\u00E9dito";
            case '3':
                return "Nota D\u00E9bito";
            case '4':
                return "Guia Remisi\u00F3n";
            case '5':
                return "Comp. Retenci\u00F3n";
        }


    return input;
    };
})
//TIPO DE DOCUMENTOS
.filter('chequearTipoDocMiddleware', function($window) {
          return function(input) {
              switch(input){
                  case "01": return 'FC';
                  case "04": return 'NC';
                  case "05": return 'ND';
                  case "06": return 'GR';
                  case "07": return 'CR';
                  default: return 'DESCONOCIDO '+input;
              }
              return input ? '\u2713' : '\u2718';
          };
})
 /************************
    FILTRAR TIPO DE ESTADO
*************************/
.filter('checkEstado', function() {
    return function(estado, control) {
        if(!control){
            return estado
        }
        for(var i=0;i<control.estados.length;i++){
            if(control.estados[i] && control.estados[i].codigo == estado ){
                return control.estados[i].detalle;
            }
        }
        return estado;
    };
})
.directive('ngEnter', function () {
    return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
            if(event.which === 13) {
                scope.$apply(function (){
                    scope.$eval(attrs.ngEnter);
                });

                event.preventDefault();
            }
        });
    };
});
