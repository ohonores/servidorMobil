angular.module('electronicos.controllers', ['ngSanitize'])

.controller('EmpresasCrtl',["$scope",'empresasFactory', function($scope,empresasFactory) {
  console.log("EmpresasCrtl")
  $scope.empresasCache = [];
  empresasFactory.getAllEmpresas(false).then(function(res){
      //console.log(res)
      switch (res.status) {
        case 200:
              $scope.empresasCache = res.data;
          break;
        default:
            console.log("No hay conexion");
      }


  });

}])
.controller('LoginCtrl',['$scope','$window','$http','loginFactory', function($scope, $window, $http, loginFactory){
    $scope.imagenResetFormulario = function(){
      $scope.imagenCaptcha = "/sesion-usuario/imagen/"+Math.floor((Math.random() * 100) + 1);
      console.log("$scope.imagenCaptchaA");
      console.log($scope.imagenCaptcha);
    }
    $scope.deliberatelyTrustDangerousSnippet = function(dato) {

      return $window.unescape("\u003cp\u003e\u0026nbsp;\u003c/p\u003e\n\u003ch3\u003e1. Aceptaci\u0026oacute;n y conocimiento de los T\u0026eacute;rminos y Condiciones.\u003c/h3\u003e\n\u003cp\u003eLos T\u0026eacute;rminos y Condiciones son de car\u0026aacute;cter obligatorio y vinculante, que aplica a las actividades que se realicen dentro del Sitio Web. Para efecto del presente T\u0026eacute;rminos y Condiciones, se entiende por \u0026ldquo;Usuarios\" a todas las personas naturales o jur\u0026iacute;dicas que adquieran productos o servicios con SWISSYSTEM, el mismo que puede ser de forma individual o corporativa .\u003c/p\u003e\n\u003cp\u003eEl Usuario acepta que es el \u0026uacute;nico responsable de dar un correcto uso de su usuario y contrase\u0026ntilde;a, que registr\u0026oacute; dentro del sitio web para acceder a su informaci\u0026oacute;n personal en el medio digital.\u0026nbsp;\u003c/p\u003e\n\u003cp\u003eSe autoriza a SWISSYSTEM que haga uso de los datos facilitados por el \u0026ldquo;Usuario\u0026rdquo; en los diferentes servicios que el portal ofrece. \u0026nbsp;\u003c/p\u003e\n\u003cp\u003eEl \u0026ldquo;Usuario\u0026rdquo; al usar el sitio web, declara que conoce y acepta estos t\u0026eacute;rminos y condiciones. Si el \u0026ldquo;Usuario\u0026rdquo; no est\u0026aacute; de acuerdo con los t\u0026eacute;rminos y condiciones deber\u0026aacute; abstenerse de utilizar el sitio web y los servicios y/o productos que se est\u0026aacute;n ofreciendo.\u0026nbsp;\u003c/p\u003e\n\u003cp\u003e\u0026nbsp;\u003c/p\u003e\n\u003ch3\u003e2. Conocimiento y aceptaci\u0026oacute;n de los siguientes puntos referentes a Facturaci\u0026oacute;n Electr\u0026oacute;nica.\u003c/h3\u003e\n\u003cul\u003e\n\u003cli\u003e\n\u003cp\u003eEl Usuario autoriza a SWISSYSTEM a suspender la emisi\u0026oacute;n y el envi\u0026oacute; de la factura f\u0026iacute;sica.\u003c/p\u003e\n\u003c/li\u003e\n\u003cli\u003e\n\u003cp\u003eEl Usuario autoriza a SWISSYSTEM, a la emisi\u0026oacute;n mensual de la factura electr\u0026oacute;nica  en este portal.\u003c/p\u003e\n\u003c/li\u003e\n\u003cli\u003e\n\u003cp\u003eEl Usuario acepta que tiene la obligaci\u0026oacute;n de ingresar al sitio web,para actualizar sus datos personales y correo electr\u0026oacute;nico para el envi\u0026oacute; de la factura electr\u0026oacute;nica.\u003c/p\u003e\n\u003c/li\u003e\n\u003cli\u003e\n\u003cp\u003eSe desliga a SWISSYSTEM de cualquier responsabilidad en el caso que el \u0026ldquo;Usuario\u0026rdquo; \u0026nbsp;no pueda recibir la notificaci\u0026oacute;n de la Factura Electr\u0026oacute;nica, por haber registrado una cuenta de correo electr\u0026oacute;nico incompleta, confusa o con errores de digitaci\u0026oacute;n.\u003c/p\u003e\n\u003c/li\u003e\n\u003cli\u003e\n\u003cp\u003eAcepta que SWISSYSTEM le ha informado que todas sus facturas electr\u0026oacute;nicas ser\u0026aacute;n enviadas en formato XML, HTML o PDF al correo electr\u0026oacute;nico que registr\u0026oacute; al momento de suscribirse en la facturaci\u0026oacute;n electr\u0026oacute;nica.\u003c/p\u003e\n\u003c/li\u003e\n\u003cli\u003e\n\u003cp\u003eDeclara que tiene conocimiento, que para visualizar su factura electr\u0026oacute;nica lo debe hacer desde el sitio web, en el \u0026nbsp;bot\u0026oacute;n de servicios dentro del men\u0026uacute; superior, de forma r\u0026aacute;pida y sencilla.\u003c/p\u003e\n\u003c/li\u003e\n\u003cli\u003e\n\u003cp\u003eEl \u0026ldquo;usuario\u0026rdquo; tiene conocimiento que la factura electr\u0026oacute;nica impresa no tiene ning\u0026uacute;n valor tributario. \u0026nbsp;\u003c/p\u003e\n\u003c/li\u003e\n\u003cli\u003e\n\u003cp\u003eSi usted necesita presentar sus facturas al SRI, deber\u0026aacute; ingresar el archivo XML, en el portal que el SRI le proporcionar\u0026aacute;.\u003c/p\u003e\n\u003c/li\u003e\n\u003cli\u003e\n\u003cp\u003eLos Usuarios acceder\u0026aacute;n a su Factura Electr\u0026oacute;nica mediante su n\u0026uacute;mero de c\u0026eacute;dula y su contrase\u0026ntilde;a personal. En caso de que el usuario olvide su contrase\u0026ntilde;a deber\u0026aacute; ponerse en contacto con SWISSYSTEM. Registro de Usuario.\u003c/h3\u003e\n\u003cp\u003eEl Usuario podr\u0026aacute; navegar libremente por el sitio web, pero deber\u0026aacute; estar registrados para poder realizar alguna de las siguientes actividades: visualizaci\u0026oacute;n en l\u0026iacute;nea de sus facturas, acceder a los formularios en l\u0026iacute;nea, chats en l\u0026iacute;nea, entre otros servicios.\u003c/p\u003e");
    };
    /***********************
			FORMULARIO
			LOGIN
		************************/
		$scope.formDatos = {};
    $scope.formDatosVirtual={};
		$scope.procesarForm = function () {
			if($scope.formDatosVirtual && $scope.formDatosVirtual.password){
				$scope.formDatosVirtual.password = $scope.formDatosVirtual.password.trim();
			}
			$scope.formDatos = {condic:$scope.formDatosVirtual.condic,username:$scope.formDatosVirtual.username,password:$scope.formDatosVirtual.password};
			$scope.formDatosVirtual.formularioAprocesar = true;
			if($scope.formDatos.condic === true){

				var res = loginFactory.login($scope.formDatos);
				res.success(function(data, status, headers, config) {
					if(data && data.login === true){

						$scope.formDatosVirtual = {};
						$window.notificar("Usuario ha ingresado al sistema con éxito","success",$window.socket);
						$window.location.href='/ver/movimientos';

					}else{

						$window.notificar("Clave o password no aceptados.","error",$window.socket);

					}

					$scope.formDatosVirtual.formularioAprocesar = false;
				});
				res.error(function(data, status, headers, config) {
            switch (status) {
              case 200:
                  $window.notificar("Usuario o Password incorrecto","error",$window.socket);
                break;
              case 500:
              case 404:
                  $window.notificar("El servidor no está respondiendo por favor inténtelo en un unos minutos","error",$window.socket);
                break;

              default:

            }

					$scope.formDatosVirtual.formularioAprocesar = false;
				});
			}else{
				//$window.notificar("Debe aceptar los T&eacute;rminos y Condiciones","error");
				$window.notificar("Debe aceptar los T&eacute;rminos y Condiciones","error",$window.socket);
				$scope.formDatosVirtual.formularioAprocesar = false;
			}

		}

}])
