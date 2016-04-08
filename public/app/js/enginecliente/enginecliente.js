
var socket;

 $('#mensajeChat').keypress(function(event) {
	 alert('Entered');
        if (event.keyCode == 13) {
           
        }
 });
	
	
function asistenteVirtualActualizar(datos, tipo){
var scope = angular.element(
    document.
    getElementById("resetearPassword")).
    scope();
    scope.$apply(function () {
		switch(tipo){
		case 1:
			scope.formDatosVirtual.respuesta = datos;
			scope.formDatosVirtual.formularioAprocesarD = false;
			scope.formDatosVirtual.ingresarclave=false;
			break;
		case 2:
			scope.formDatosVirtual.cambiarClaveD = true;
			scope.formDatosVirtual.formularioAprocesarD = false;
			scope.formDatosVirtual.ingresarclave=true;
			scope.enviarDatos();
		break;
		case 3:
			scope.formDatosVirtual.cambiarClaveD = false;
			scope.formDatosVirtual.formularioAprocesarD = false;
			scope.formDatosVirtual.ingresarclave=false;
			scope.enviarDatos();
		break;
		case 4:
			scope.formDatosVirtual.formularioA=true;
			scope.formDatosVirtual.formularioB=false;
			scope.formDatosVirtual.formularioC=false;
			scope.formDatosVirtual.formularioD=false;
			scope.formDatosVirtual.formDatosVirtual={};
			scope.formDatosVirtual.ingresarclave=false;
			scope.enviarDatos();
		break;
		case 5:
			scope.formDatosVirtual.respuesta=null;
			scope.formDatosVirtual.ingresarclave=false;
		break;
		case 6:
			scope.formDatosVirtual.ingresarclave=false;
		break;
		
		case 7:
			scope.formDatosVirtual=datos;
		break;
		case 8:
			scope.setUsuariosAsistenteVirtualConectados(datos);
		break;
		case 9:
		
			scope.notificarClienteMensajeQueHaRecibido(datos);
			
		break;
		case 10:
			if(scope.historialMensajesNotifiacionesWS.length>10){
				scope.historialMensajesNotifiacionesWS = [];
				scope.historialMensajesNotifiacionesWS.push(datos);
				return;
			}
			var index = -1;
			for(var i=0;i<scope.historialMensajesNotifiacionesWS.length;i++){
				if(scope.historialMensajesNotifiacionesWS[i].comprobante === datos.comprobante){
					index = i;
					break;
				}
				
			}
			if(index>=0){
				scope.historialMensajesNotifiacionesWS.splice(index,1);
			}
			scope.historialMensajesNotifiacionesWS.push(datos);
			
			
			
		break;
		case 11:

			scope.current_fecha[datos.tipo]={hora:datos.hora, total:datos.total,bloqueados:datos.bloqueados};
		break;
		case 12:
			scope.respuestaConexionSri[datos.tipo] = datos.data;
		break;
		case 13:
			scope.current_fecha = {};
			scope.respuestaConexionSri = {};
		break;
		
		case 14:
			notificarComplex("El serividor se est&#225; respondiendo, espere unos segundos por favor y refresque la p&#225;gina","warning",40,function(){window.location.href='/';});
		break;
		case 16:

        	scope.blockprocesar = true;
        	scope.acccion_a_procesar = datos.mensaje.split('+').join(' ');// = datos.mensaje;
        	if(scope.historialMensajesNotifiacionesWS.length >10){
        		scope.historialMensajesNotifiacionesWS =[];
        	}
        	scope.historialMensajesNotifiacionesWS.push(datos.mensaje.split('+').join(' '));

             setTimeout(function() {
                    var div2 = window.document.getElementById("mensajesClienteA");
                    div2.scrollTop = div2.scrollHeight - div2.clientHeight;
             },1000);
        	setTimeout(function() {
            	scope.blockprocesar = false;
            	scope.acccion_a_procesar="";
            },10000);



       	break;
       	case 17:
             scope.blockprocesarLista = false;
             scope.acccion_a_procesar_lista =[];
         break;
        case 18:
        	if(datos.tipo && scope.cod_robot_en_uso[datos.tipo].length>12){scope.cod_robot_en_uso[datos.tipo] = [];}
         	scope.cod_robot_en_uso[datos.tipo].push(datos.mensaje)
         break;
        }
    });
}

function iniciarProceso(){
	if(!socket){
		socket = new eio.Socket();
		socket.on('open', function () {
   
  
		socket.on('close', function(){
			asistenteVirtualActualizar(13,"");
			asistenteVirtualActualizar("",14);
			console.log("desconectado");
		});
		socket.on('errors', function(){
			asistenteVirtualActualizar(13,"");
			console.log("desconectado error");
		});
		socket.on('message', function(data){
			asistenteVirtualActualizar(null,6);
			var respuesta = JSON.parse(data);
			if(respuesta.error){
				asistenteVirtualActualizar(null, 3);
				asistenteVirtualActualizar(null, 5);
				//notificar(respuesta.error,"error");
				notificarConEspejo(respuesta.error,"error",socket);
				return;
			}
			if(respuesta.resultado &&  respuesta.resultado != "ok" && respuesta.resultado.razonsocial){
				//console.log(respuesta.resultado);
				asistenteVirtualActualizar(respuesta.resultado,1);
				//notificar("Podr&iacute;a por favor confirmar su datos");
				notificarConEspejo("Podr&iacute;a por favor confirmar su datos","success",socket);
						
			}
			if(respuesta.resultado && respuesta.resultado === "ok"){
				
				//notificar("Datos validados, por favor ingrese su nueva clave");
				notificarConEspejo("Datos validados, por favor ingrese su nueva clave","success",socket);
				asistenteVirtualActualizar(null, 2);
			}
			if(respuesta.resultado && respuesta.resultado && respuesta.resultado.clavecambiada === "ok"){
				//notificar("Clave cambiada exitosamente, por favor ingrese su usuario y nueva clave para ingresar al sistema");
				notificarConEspejo("Clave cambiada exitosamente, por favor ingrese su usuario y nueva clave para ingresar al sistema","success",socket);
				asistenteVirtualActualizar(null, 3);
				asistenteVirtualActualizar(null, 4);
			}
			
			if(respuesta.coordenadas){
				// Rest of the variables...  
				$('#cursor_hand').css({ left: respuesta.coordenadas.x, top: respuesta.coordenadas.y });
				 //$("#"+respuesta.coordenadas.focus).click();
				 //document.getElementById(respuesta.coordenadas.focus).focus();
				 if("bton-ingresoSistema" === respuesta.coordenadas.focus && respuesta.coordenadas.click){
					$("#"+respuesta.coordenadas.focus).click();
				}
			}
			
			if(respuesta.copiadatos){
				asistenteVirtualActualizar(respuesta.copiadatos, 7);
			}
			if(respuesta.notificaciones){
				notificar(respuesta.notificaciones.mensaje ?respuesta.notificaciones.mensaje.replace("_","") : "El servidor no entrego un mensaje de respuesta" ,respuesta.notificaciones.tipo);
				
			}
			
			if(respuesta.mensajeadmin){
				asistenteVirtualActualizar(respuesta.mensajeadmin,8);
				//console.log(respuesta.mensajeadmin);
				asistenteVirtualActualizar(respuesta, 9);
			}
			if(respuesta.mensajechatadmin){
				if(respuesta && respuesta.mensajechatadmin && respuesta.mensajechatadmin.username){
				
				}else{
					//notificar("Asitente :: "+respuesta.mensajechatadmin);
					notificarConEspejo("Asistente :: "+respuesta.mensajechatadmin,"success",socket);
				}
				
				asistenteVirtualActualizar(respuesta, 9);
				
			}
			if(respuesta.mensajejavaws){
			   	switch(respuesta.mensajejavaws.tipo){
			   		case "robots_estados":
						asistenteVirtualActualizar(12,"");
						switch(respuesta.mensajejavaws.robot){
							case "emails":
							case "autorizador":
							case "pendientes":
							case "enviar":
								salesData[1].valor = parseFloat(respuesta.mensajejavaws.suspendio) >0 && parseFloat(respuesta.mensajejavaws.suspendio) === parseFloat(respuesta.mensajejavaws.BLOCKED) ? 0.01:parseFloat(respuesta.mensajejavaws.BLOCKED*10+0.01) ;
								salesData[2].valor = parseFloat(respuesta.mensajejavaws.TIMED_WAITING *10+ 0.01);
								salesData[0].valor = parseFloat(respuesta.mensajejavaws.trabajando*10 + 0.01+(respuesta.mensajejavaws.RUNNABLE*10));
								salesData[3].valor = parseFloat(respuesta.mensajejavaws.suspendio*10 + 0.01);

								asistenteVirtualActualizar({tipo:respuesta.mensajejavaws.robot, hora:respuesta.mensajejavaws.current_hora, total:respuesta.mensajejavaws.alive,bloqueados:respuesta.mensajejavaws["BLOCKED-INDECES"] ? respuesta.mensajejavaws["BLOCKED-INDECES"].split(","):[]},11);

								Donut3D.transition(respuesta.mensajejavaws.robot, randomDataA(), 130, 100, 30, 0.0);
							break;
							case "sensar_email":
							case "sensar_sri":
									if(respuesta.mensajejavaws.code){
										respuesta.mensajejavaws.code = JSON.parse(respuesta.mensajejavaws.code);
									}
									if(respuesta.mensajejavaws.error){
										respuesta.mensajejavaws.error = JSON.parse(respuesta.mensajejavaws.error);
									}
									asistenteVirtualActualizar({tipo:respuesta.mensajejavaws.tipor,data:respuesta.mensajejavaws}, 12);

							break;


						}//Fin switch
					break;
					case "enviaremail":
					case "autorizarxml":
					case "enviarxml":
						var tipoDocs = {"1":"FA","2":"NC","3":"ND","4":"GR","5":"CR"}
						asistenteVirtualActualizar({mensaje:tipoDocs[respuesta.mensajejavaws.documento] +" "+ respuesta.mensajejavaws.comprobante + " "+respuesta.mensajejavaws.estado.split('+').join(' ')}, 16);
						asistenteVirtualActualizar({tipo:respuesta.mensajejavaws.tipo, mensaje:{documento:tipoDocs[respuesta.mensajejavaws.documento], comprobante:respuesta.mensajejavaws.comprobante, hora:respuesta.mensajejavaws.current_hora, id:respuesta.mensajejavaws.indice}},18);
					break;


				}//fin switch
				
				/*	console.log(respuesta.mensajejavaws);
					notificar(respuesta.mensajejavaws.comprobante +( respuesta.mensajejavaws.estado? " > "+respuesta.mensajejavaws.estado.replace(/\+/g," "):""));
					asistenteVirtualActualizar(respuesta.mensajejavaws, 10);
					var latency = new Date - last;
	 
					if (time) time.append(new Date().getTime(), new Date().getTime()+10);
					
				*/	
	 
			}
			
		});
		});
	}
}
var pointer = $('#cursor_hand');
var datosAsistenteVirtual = {};
datosAsistenteVirtual['accion']='enviarCoordenadas';
$(document).mousemove(function(e) {    

   if(socket && (location.pathname.indexOf("movimiento"))<0 ){
		
		datosAsistenteVirtual['coordenadas']={x:e.clientX,y:e.clientY,focus:document.activeElement.id};
		
		try{
			socket.send(JSON.stringify(datosAsistenteVirtual));
			 
		}catch(error){
		}
   }
});


try{
// chart
//function getId(id){ return document.getElementById(id); }
var smoothie;
var time;
var last;
function render(){
  if (smoothie) smoothie.stop();
 document.getElementById('chart').width =180;
  smoothie = new SmoothieChart();
  smoothie.streamTo(document.getElementById('chart'), 1000);
  time = new TimeSeries();
  smoothie.addTimeSeries(time, {
    strokeStyle: 'rgb(255, 0, 0)',
    fillStyle: 'rgba(255, 0, 0, 0.4)',
    lineWidth: 2
  });
  if (time) time.append(+new Date(), new Date().getTime()+100);
    if (time) time.append(+new Date(), new Date().getTime()+1000);
	

      // Randomly add a data point every 500ms
	  last = new Date();
      var latency = new Date - last;
      setInterval(function() {
        time.append(9000, 1000);
		time.append(100, 1000);
		last= new Date();
      }, 500);
      
     /* function createTimeline() {
        var chart = new SmoothieChart();
        chart.addTimeSeries(random, { strokeStyle: 'rgba(0, 255, 0, 1)', fillStyle: 'rgba(0, 255, 0, 0.2)', lineWidth: 4 });
        chart.streamTo(document.getElementById("chart"), 500);
      }*/
    
}
}catch(err){
}
/*$(document).onclick(function(e) {    

   if(socket){
		
		datosAsistenteVirtual['coordenadas']={x:e.clientX,y:e.clientY,focus:document.activeElement.id,click:true};
		
		try{
			socket.send(JSON.stringify(datosAsistenteVirtual));
			 
		}catch(error){
		}
   }
});
*/