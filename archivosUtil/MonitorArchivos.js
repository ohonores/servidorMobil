var StringDecoder = require('string_decoder').StringDecoder;
var fs = require('fs');
var MonitorArchivos = function () {};

/*
Monitoriar archivos
**/
var archivosMonitoriados = [];
var docsTablasTransitoEmpresas = []; //{empresa:1,registrosPorEmpresa:docsTablasTransito}
var docsTablasTransitoWService = []; //{empresa:1,registrosPorEmpresa:docsTablasTransito}
var conexiones;
MonitorArchivos.prototype.instanciarVariables = function(docsTablasTransitoEmpresas_, docsTablasTransitoWService_,archivosMonitoriados_, conexiones_){
 docsTablasTransitoEmpresas = docsTablasTransitoEmpresas_;
 docsTablasTransitoWService = docsTablasTransitoWService_;
 archivosMonitoriados = archivosMonitoriados_;
 conexiones =conexiones_;
}

MonitorArchivos.prototype.grabarLogsObserver = function(ruta_archivo, mensaje){

	 process.nextTick(function(){
			
			var log = fs.createWriteStream(ruta_archivo, {'flags': 'a'});
			// use {'flags': 'a'} to append and {'flags': 'w'} to erase and write a new file
			log.end('\n'+JSON.stringify(mensaje));
			//callback("ok");
	});
}
MonitorArchivos.prototype.grabarLogsObserver2 = function(ruta_archivo, mensaje){

	 process.nextTick(function(){

			var log = fs.createWriteStream(ruta_archivo, {'flags': 'a'});
			// use {'flags': 'a'} to append and {'flags': 'w'} to erase and write a new file
			log.end(mensaje);
			//callback("ok");
	});
}

MonitorArchivos.prototype.grabarNuevoArchivo = function(ruta_archivo, mensaje){
	process.nextTick(function(){
		var registros = fs.writeFile(ruta_archivo, JSON.stringify(mensaje), function(error){
			if(error){
				console.log(error);
			}else{
				console.log('Grabado');
			}
		});
	});
}


MonitorArchivos.prototype.unwatch_archivo_function = function(ruta_archivo,parametro, callback){
	 process.nextTick(function(){
		
			if((parametro && parametro.size && parametro.size > 0 && archivosMonitoriados.indexOf(ruta_archivo +'-'+ parametro.size )>=0)
			|| (parametro && parametro.q && archivosMonitoriados.indexOf(ruta_archivo +'-'+ parametro.q )>=0) ){
				var index1 = archivosMonitoriados.indexOf(ruta_archivo +'-'+ parametro.size );
				var index2 = archivosMonitoriados.indexOf(ruta_archivo +'-'+ parametro.q );
				
				fs.unwatchFile(ruta_archivo);
				
				archivosMonitoriados.splice(index1  && index1 >=0 ? index1:index2,1);
				var mensaje = {'condiciones':'unwatch','archivo':ruta_archivo, 'fecha':new Date(), 'estado':'aplicado'};
				grabarLogsObserver('logObs.txt', mensaje);
				conexiones['watchers'].to('watcher').emit('notificar', mensaje);
				
				
				callback('1');
			}else{
				callback('0');
			}
	 });
};
MonitorArchivos.prototype.monitoriar_archivo_function = function(ruta_archivo, parametro, condiciones, callback){
   
	
    process.nextTick(function(){
		 if((parametro && parametro.size && parametro && parametro.size > 0 && archivosMonitoriados.indexOf(ruta_archivo +'-'+ parametro.size )>=0)
			|| (parametro && parametro.q && parametro && parametro.q > 0 && archivosMonitoriados.indexOf(ruta_archivo +'-'+ parametro.q )>=0) ){
			callback('Archivo '+ruta_archivo+' ya se encuentra monitoriado');
			
		}else{
		    if(parametro && parametro.size && parametro && parametro.size > 0){
				archivosMonitoriados.push(ruta_archivo +'-'+ parametro.size);
			}
			if(parametro && parametro.size && parametro && parametro.q){
				archivosMonitoriados.push(ruta_archivo +'-'+ parametro.q);
			}
			
			var dato;
			var decoder = new StringDecoder('utf8');
			fs.watchFile(ruta_archivo, function (curr, prev) {
				
				/*
					Control del tamanio del archivo
					El tamanio debe ser megas
				*/
				if(parametro && parametro.size && ((curr.size/1000)/1000)>=parametro.size){
				
					ejecutar_programa(condiciones, function(val) {
							/*
							notificar que se ha encontrado el parametro en el archivo
							*/
							var mensaje = {'condiciones':condiciones,'archivo':ruta_archivo, 'fecha':new Date(), 'estado':'aplicado'};
							grabarLogsObserver('logObs.txt', mensaje);
							conexiones['watchers'].to('watcher').emit('notificar', mensaje);
						});
					callback('encontrado');
				}else{
				    if(parametro && parametro.q){ //Parametro a buscar si es que existe se los busca
						/*
						Busqueda de una parametro
						*/
						dato = fs.createReadStream(ruta_archivo, {start: prev.size, end: curr.size});
						dato.on('data', function (chunk) {
						
							var str = decoder.write(chunk).split('\n').join('').split(' ').join('');

							if(str.indexOf(parametro.q) >=0){
								ejecutar_programa(condiciones, function(val) {
									/*
									notificar que se ha encontrado el parametro en el archivo
									*/
									var mensaje = {'condiciones':condiciones,'archivo':ruta_archivo, 'fecha':new Date(), 'estado':'aplicado'};
									grabarLogsObserver('logObs.txt', mensaje);
									conexiones['watchers'].to('watcher').emit('notificar',mensaje);
								});
								callback('encontrado');
							}
						  });//fin dato
					  }else{
						callback('parametro no aceptado');
					  }
				}
			});//fin fs.watchFile
		}
    });
};


MonitorArchivos.prototype.monitoriar_archivo_para_notificar_resultados_logs = function(ruta_archivo, parametro, condiciones, callback){
   
	
    process.nextTick(function(){
		 if((parametro && parametro.size && parametro && parametro.size > 0 && archivosMonitoriados.indexOf(ruta_archivo +'-'+ parametro.size )>=0)
			|| (parametro && parametro.q && parametro && parametro.q > 0 && archivosMonitoriados.indexOf(ruta_archivo +'-'+ parametro.q )>=0) ){
			callback('Archivo '+ruta_archivo+' ya se encuentra monitoriado');
			
		}else{
		    if(parametro && parametro.size && parametro && parametro.size > 0){
				archivosMonitoriados.push(ruta_archivo +'-'+ parametro.size);
			}
			if(parametro && parametro.size && parametro && parametro.q){
				archivosMonitoriados.push(ruta_archivo +'-'+ parametro.q);
			}
			
			var dato;
			var decoder = new StringDecoder('utf8');
			fs.watchFile(ruta_archivo, function (curr, prev) {
				
				/*
					Control del tamanio del archivo
					El tamanio debe ser megas
				*/
				
				    if(parametro && parametro.q){ //Parametro a buscar si es que existe se los busca
						/*
						Busqueda de una parametro
						*/
						if( prev.size<curr.size){
						
							dato = fs.createReadStream(ruta_archivo, {start: prev.size, end: curr.size});
							dato.on('data', function (chunk) {
							
								var str = decoder.write(chunk).split('\r').join('').split('\n').join('').split(' ').join('');
								
								if(str.indexOf(parametro.q) >=0){
									var resultados = str.split(parametro.q);
									for(res in resultados){
									    if(resultados[res].split('*').join('')){
											try{
												var dat = JSON.parse(resultados[res].split('*').join(''));
												if(dat.empresa){
													var chartDatos = grabarDatosMonitoreoEnVariablePrincipal(dat);
													dat.chartDatos = chartDatos;
												}
												conexiones['tablastransito'].to('transito').emit('notificar',dat);
												
											}catch(error){
											    console.log('error en monitoriar_archivo_para_notificar_resultados_logs:');
												console.log(error);
											}
										}
										//console.log('-'+resultados[res].split('*').join(''));
									}
									
									callback('encontrado');
								}
							  });//fin dato
						  }
					  }else{
						callback('parametro no aceptado');
					  }
				
			});//fin fs.watchFile
		}
    });
};


function puts(error, stdout, stderr) { sys.puts(stdout) }
MonitorArchivos.prototype.ejecutar_programa = function(cmd,  callback){
   
    process.nextTick(function(){
		exec(cmd, puts);
		callback('ok');
	});
};



function getDatosClaveAcceso(claveacceso){
   return {'tipodoc':claveacceso.slice(8,10),'ruc':claveacceso.slice(10,23),'documento':claveacceso.slice(24,30)+'-'+claveacceso.slice(30,39)};
	
}


MonitorArchivos.prototype.grabarDatosMonitoreoEnVariablePrincipalWService = function(datos){
	
	
	
	var registrosPorTipo = [];
	var docsTablasTransito = [];
	
    var posNombre = 0;
	switch(datos.nombre){
		case "receptor":
			posEmpresa = 0;
			if(!docsTablasTransitoWService[posNombre]){
	
				docsTablasTransitoWService[posNombre] = {'nombre':'receptor','registrosPorProductor':[]};
		
			}
			break;
		case "enviados":
			posEmpresa = 1;
			if(!docsTablasTransitoWService[posNombre]){
	
				docsTablasTransitoWService[posNombre] = {'nombre':'enviados','registrosPorProductor':[]};
		
			}
			break;
		case "pendientes":
			posEmpresa = 2;
			if(!docsTablasTransitoWService[posNombre]){
	
				docsTablasTransitoWService[posNombre] = {'nombre':'pendientes','registrosPorProductor':[]};
		
			}
			break;
		case "emails":
			posEmpresa = 3;
			if(!docsTablasTransitoWService[posNombre]){
	
				docsTablasTransitoWService[posNombre] = {'nombre':'emails','registrosPorProductor':[]};
		
			}
			break;
		case "nosri":
			posNombre = 4;
			if(!docsTablasTransitoWService[posNombre]){
	
				docsTablasTransitoWService[posNombre] = {'nombre':'nosri','registrosPorProductor':[]};
		
			}
			break;
		
		default:
		posNombre = 0;
			if(!docsTablasTransitoWService[posNombre]){
	
				docsTablasTransitoWService[posNombre] = {'nombre':'todos','registrosPorProductor':[]};
		
			}
			break;
					
	}





	/*
		posicion
		0 . - Todos los documentos;
		1 . - Factura
		2 . - Nota de credito
		3 . - Nota de credito valorizada
		4 . - nota de debito
		5 . - guia de remison
		
	*/
    var tipodoc = 0;
	var d = new Date();
	var fechaJS = d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();
	var encontrado = false;
	var pos = 0;
	switch(getDatosClaveAcceso(datos.claveacceso).tipodoc){
		case "01":
			pos = 1;
		break;
		case "04":
			pos = 2;
			break;
		case "05":
			pos = 3;
			break;
		case "06":
			pos = 4;
			break;
		case "07":
			pos = 5;
			break;
		default:
		break;
	}
	/*
		grabando todos
	*/
	
	docsTablasTransito = docsTablasTransitoWService[posNombre].registrosPorProductor;
	
	if(docsTablasTransito[0]){
				
		if(docsTablasTransito[0].fecha != fechaJS){
			
			//grabar  base de datos
			/*******************
					NUEVO REGISTRO
				********************/
				try{
				var sqlInsert = 'INSERT into swissedi.eeditmonitor (fecha, tipo, json, consumidorproductor) VALUES($1, $2, $3,$4) RETURNING id'; 
				var jsond;
				for(nombre_index in docsTablasTransitoWService){
					if(docsTablasTransitoWService[nombre_index]){
						jsond = {'registro':docsTablasTransitoWService[nombre_index].registrosPorProductor}
						getPoolClienteConexion(sqlInsert,[docsTablasTransito[0].fecha,2,jsond, docsTablasTransitoWService[nombre_index].nombre], function(resultado){
							if(resultado && resultado.rows && resultado.rows[0] && resultado.rows[0].id){
							   docsTablasTransitoWService[nombre_index] = {'nombre':docsTablasTransitoWService[nombre_index].nombre,'registrosPorEmpresa':[]};
							}else{
								console.log('Error al grabar ******** '+new Date());
								
							}
						});
					}
				}
			}catch(error){
				console.log(error);
			}
			docsTablasTransito = [];
			
			//Despues de grabarlo en la base se procede hacer lo mismo con el nuevo registtro
			docsTablasTransito[0] = {'doc':datos.tipodoc,'fecha':fechaJS,'registros':[[fechaJS+' '+datos.hora]]}
			
			
		}else{
			
				docsTablasTransito[0].registros.push([fechaJS+' '+datos.hora,1])
			
		}
				
	}else{
		docsTablasTransito[0] = {'doc':0,'fecha':fechaJS,'registros':[[fechaJS+' '+datos.hora,1]]}
	}
	/*
		Posicion segun el tipo de documento
	*/
	if(docsTablasTransito[pos]){
				
		if(docsTablasTransito[pos].fecha != fechaJS){
			//grabar ver arriba  base de datos
			
		}else{
							
			
				docsTablasTransito[pos].registros.push([fechaJS+' '+datos.hora,1])
			
		}
				
	}else{
		docsTablasTransito[pos] = {'doc':getDatosClaveAcceso(datos.claveacceso).tipodoc,'fecha':fechaJS,'registros':[[fechaJS+' '+datos.hora,1]]}
		
	}
	docsTablasTransitoWService[posNombre].registrosPorProductor = docsTablasTransito;
		
	//grabarNuevoArchivo('c:/tesetingReigstro.txt',docsTablasTransito);
				/*var sqlSelect = 'select json from swissedi.eeditmonitor where id=$1'; 
				
				
				getPoolClienteConexion(sqlSelect,[1], function(resultado){
					if(resultado && resultado.rows && resultado.rows[0] && resultado.rows[0].json){
					   console.log('*****************resultado de la base');
					   console.log(resultado.rows[0].json.registro[0].registros);
					   
					}else{
						console.log('Error al grabar ******** '+new Date());
						
					}
				});
				
				*/
				
			
	return docsTablasTransito;
	
	
}

/*****************
	variavles y metodos para el monitoreo de registros recibidos por minuto
*******************/




grabarDatosMonitoreoEnVariablePrincipal = function(datos){
	var registrosPorEmpresa = [];
	var docsTablasTransito = [];
	/*
		verificando la emrpesa
		docsTablasTransitoEmpresas
		1 ECUAQUIMICA 
		6 SAN CAMILO
		empresas_ = [{'codigo':1,'nombre':'ECUAQUIMICA','clase':'ui-block-a','documentos':this.documentos1,'modulo':'a'},{'codigo':6,'nombre':'SANCAMILO','clase':'ui-block-b','documentos':this.documentos2,'modulo':'a'},{'codigo':102,'nombre':'GALAEX','clase':'ui-block-c','documentos':this.documentos3,'modulo':'a'},{'codigo':103,'nombre':'GALASCUBA','clase':'ui-block-d','documentos':this.documentos4,'modulo':'a'},{'codigo':200,'nombre':'FARMAGRO','clase':'ui-block-a','documentos':this.documentos4,'modulo':'b'},{'codigo':500,'nombre':'CONAUTO','clase':'ui-block-a','documentos':this.documentos4,'modulo':'c'}];
	*/
    var posEmpresa = 0;
	switch(datos.empresa){
		case "1":
			posEmpresa = 0;
			if(!docsTablasTransitoEmpresas[posEmpresa]){
	
				docsTablasTransitoEmpresas[posEmpresa] = {'empresa':'1','registrosPorEmpresa':[]};
		
			}
			break;
		case "6":
			posEmpresa = 1;
			if(!docsTablasTransitoEmpresas[posEmpresa]){
	
				docsTablasTransitoEmpresas[posEmpresa] = {'empresa':'6','registrosPorEmpresa':[]};
		
			}
			break;
		case "102":
			posEmpresa = 2;
			if(!docsTablasTransitoEmpresas[posEmpresa]){
	
				docsTablasTransitoEmpresas[posEmpresa] = {'empresa':'102','registrosPorEmpresa':[]};
		
			}
			break;
		case "103":
			posEmpresa = 3;
			if(!docsTablasTransitoEmpresas[posEmpresa]){
	
				docsTablasTransitoEmpresas[posEmpresa] = {'empresa':'103','registrosPorEmpresa':[]};
		
			}
			break;
		case "200":
			posEmpresa = 4;
			if(!docsTablasTransitoEmpresas[posEmpresa]){
	
				docsTablasTransitoEmpresas[posEmpresa] = {'empresa':'200','registrosPorEmpresa':[]};
		
			}
			break;
		case "500":
			posEmpresa = 5;
			if(!docsTablasTransitoEmpresas[posEmpresa]){
	
				docsTablasTransitoEmpresas[posEmpresa] = {'empresa':'500','registrosPorEmpresa':[]};
		
			}
		break;
		default:
		posEmpresa = 0;
			if(!docsTablasTransitoEmpresas[posEmpresa]){
	
				docsTablasTransitoEmpresas[posEmpresa] = {'empresa':'0','registrosPorEmpresa':[]};
		
			}
			break;
					
	}





	/*
		posicion
		0 . - Todos los documentos;
		1 . - Factura
		2 . - Nota de credito
		3 . - Nota de credito valorizada
		4 . - nota de debito
		5 . - guia de remison
		
	*/
    var tipodoc = 0;
	var d = new Date();
	var fechaJS = d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();
	var encontrado = false;
	var pos = 0;
	switch(datos.tipodoc){
		case "1":
			pos = 1;
		break;
		case "27":
			pos = 2;
			break;
		case "25":
			pos = 3;
			break;
		case "29":
			pos = 4;
			break;
		case "14":
			pos = 5;
			break;
		default:
		break;
	}
	/*
		grabando todos
	*/
	
	docsTablasTransito = docsTablasTransitoEmpresas[posEmpresa].registrosPorEmpresa;
	
	if(docsTablasTransito[0]){
				
		if(docsTablasTransito[0].fecha != fechaJS){
			
			//grabar  base de datos
			/*******************
					NUEVO REGISTRO
				********************/
				try{
				var sqlInsert = 'INSERT into swissedi.eeditmonitor (fecha, tipo, json, empresa_erp) VALUES($1, $2, $3,$4) RETURNING id'; 
				var jsond;
				for(empresa_index in docsTablasTransitoEmpresas){
					if(docsTablasTransitoEmpresas[empresa_index]){
						jsond = {'registro':docsTablasTransitoEmpresas[empresa_index].registrosPorEmpresa}
						getPoolClienteConexion(sqlInsert,[docsTablasTransito[0].fecha, 1,jsond, docsTablasTransitoEmpresas[empresa_index].empresa], function(resultado){
							if(resultado && resultado.rows && resultado.rows[0] && resultado.rows[0].id){
							   console.log('grabado ******** '+new Date());
							   docsTablasTransitoEmpresas[empresa_index] = {'empresa':docsTablasTransitoEmpresas[empresa_index].empresa,'registrosPorEmpresa':[]};
							}else{
								console.log('Error al grabar ******** '+new Date());
								
							}
						});
					}
				}
			}catch(error){
				console.log(error);
			}
			docsTablasTransito = [];
			
			//Despues de grabarlo en la base se procede hacer lo mismo con el nuevo registtro
			docsTablasTransito[0] = {'doc':datos.tipodoc,'fecha':fechaJS,'registros':[[fechaJS+' '+datos.hora.slice(0,5),1]]}
			
			
		}else{
					
			for (dat in docsTablasTransito[0].registros) {
				if(docsTablasTransito[0].registros[dat][0].split(' ')[1] == datos.hora.slice(0,5)){
					docsTablasTransito[0].registros[dat][1] = docsTablasTransito[0].registros[dat][1] + 1; 
					encontrado = true;
					break;
				}
			}
							
			if(encontrado == false){
				docsTablasTransito[0].registros.push([fechaJS+' '+datos.hora.slice(0,5),1])
			}
		}
				
	}else{
		docsTablasTransito[0] = {'doc':0,'fecha':fechaJS,'registros':[[fechaJS+' '+datos.hora.slice(0,5),1]]}
						
	}
	/*
		Posicion segun el tipo de documento
	*/
	if(docsTablasTransito[pos]){
				
		if(docsTablasTransito[pos].fecha != fechaJS){
			
		}else{
			
			for (dat in docsTablasTransito[pos].registros) {
				if(docsTablasTransito[pos].registros[dat][0].split(' ')[1] == datos.hora.slice(0,5)){
					docsTablasTransito[pos].registros[dat][1] = docsTablasTransito[pos].registros[dat][1] + 1; 
					encontrado = true;
					break;
				}
			}
							
			if(encontrado == false){
				docsTablasTransito[pos].registros.push([fechaJS+' '+datos.hora.slice(0,5),1])
			}
		}
				
	}else{
		docsTablasTransito[pos] = {'doc':datos.tipodoc,'fecha':fechaJS,'registros':[[fechaJS+' '+datos.hora.slice(0,5),1]]}
		
	}
	docsTablasTransitoEmpresas[posEmpresa].registrosPorEmpresa = docsTablasTransito;
	
	//grabarNuevoArchivo('c:/tesetingReigstro.txt',docsTablasTransito);
				/*var sqlSelect = 'select json from swissedi.eeditmonitor where id=$1'; 
				
				
				getPoolClienteConexion(sqlSelect,[1], function(resultado){
					if(resultado && resultado.rows && resultado.rows[0] && resultado.rows[0].json){
					   console.log('*****************resultado de la base');
					   console.log(resultado.rows[0].json.registro[0].registros);
					   
					}else{
						console.log('Error al grabar ******** '+new Date());
						
					}
				});
				
				*/
				
				
	return docsTablasTransito;
	
}

MonitorArchivos.prototype.iniciarNotificadorLogsServidor = function(datosjsonObj){
	/*******************
				INICIANDO WATCHER
			********************/
			console.log('******************POR INICIAR '+ datosjsonObj.estado);
			if(datosjsonObj && datosjsonObj.estado === true){
				if((datosjsonObj.parametro && datosjsonObj.parametro.q) || (datosjsonObj.parametro && datosjsonObj.parametro.size) ){
				console.log('****************** entro a iniciarNotificadorLogsServidor  ');
					this.monitoriar_archivo_para_notificar_resultados_logs(datosjsonObj.archivo, datosjsonObj.parametro, datosjsonObj.accion, function(val) {
					 /*
						notificar que se ha encontrado el parametro en el archivo
					 */
						
					});
					console.log('****************** INICIADO');
				}
				
				
			}else{
					
				this.unwatch_archivo_function(datosjsonObj.archivo, datosjsonObj.parametro, function(val) {
					 /*
						notificar que se ha encontrado el parametro en el archivo
					 */
						
				});
			}
}
module.exports = new MonitorArchivos();
