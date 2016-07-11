
var schedule = require('node-schedule');
var request = require("request");
var nodemailer = require('nodemailer');
var EntidadesMongoOracle = require("./jsonEntity.js");
var entidesMonogoDB = new EntidadesMongoOracle();
var hash = require('object-hash');
var Q = require('q');
var oracle,mongodb,oracledb;
var arrayJson_ =new RegExp("^arrayJson([0-9])+$")
var json_ =new RegExp("_json_$");
var client = require("ioredis").createClient();
//Selects para obtener los datos a Oracle
var sqlBusquedaPerfilesNew = "SELECT * FROM  SWISSMOVI.EMOVTPERFIL WHERE ROWNUM <2";
var sqlBusquedaEstabPorPerfilNew = "SELECT * FROM SWISSMOVI.EMOVTPERFIL_ESTABLECIMIENTO PE WHERE PE.MPERFIL_ID =:ID AND  PE.ID>=:A AND ROWNUM<=:B ORDER BY PE.ID ASC";
var sqlBusquedaEstabPorPerfilMinNew = "SELECT MIN(ID) AS ID FROM SWISSMOVI.EMOVTPERFIL_ESTABLECIMIENTO WHERE MPERFIL_ID =:ID AND ID>:ID";
var sqlSumaCartera = "SELECT SUM(VALOR) AS PAGO,PE.NOMBRE,CA.PREIMPRESO,P.NOMBRES, PE.EMAILRECAUDACION FROM SWISSMOVI.EMOVTCARTERA_DETALLE CD JOIN SWISSMOVI.EMOVTCARTERA CA ON CD.MCARTERA_ID=CA.ID JOIN SWISSMOVI.EMOVTPERFIL_ESTABLECIMIENTO PE ON PE.ID=CA.MPERFILESTABLECIMIENTO_ID JOIN SWISSMOVI.EMOVTPERFIL P ON P.ID=PE.MPERFIL_ID WHERE CA.PRECARTERA_ID=:PRECARTERA GROUP BY PE.NOMBRE,CA.PREIMPRESO,P.NOMBRES,PE.EMAILRECAUDACION  ";
var sqlEstadosFactura = "SELECT o.ESTADO,o.ESTADO_EDI, mpe.MPERFIL_ID, mo.DISPOSITIVO, mo.IDMOVIL from EFACTVENTA  o join EMOVTORDEN mo on o.orden_id=mo.orden_id  join EMOVTPERFIL_ESTABLECIMIENTO mpe on mpe.id=mo.mperfilestablecimiento_id WHERE o.orden_id=:ORDEN";
var sqlEstadosOrden = "SELECT o.ESTADO, mpe.MPERFIL_ID, mo.DISPOSITIVO, mo.IDMOVIL from EFACTORDEN  o join EMOVTORDEN mo on o.id=mo.orden_id  join EMOVTPERFIL_ESTABLECIMIENTO mpe on     mpe.id=mo.mperfilestablecimiento_id WHERE o.ID=:ORDEN";
var sqlObtenerUsuario = "SELECT UPV.USUARIO_ID FROM EFACTORDEN O JOIN ESEGTUSUARIO_PUNTO_VENTA UPV ON o.usuariopuntoventa_id=UPV.ID WHERE O.ID=:ORDEN";
var servicio = "http://192.168.1.7:10081/swiss-web/ProcesaPedido?p_nsistema=#ORDEN&idusuario=#USUARIO_ID";

var sizeArrayPorDocumento = 200;

/**********
CONSTANTES PARA ENVIAR EMAILS
***********/

// create reusable transporter object using the default SMTP transport
var transporter = nodemailer.createTransport('smtps://ovhonores@gmail.com:alien200525@smtp.gmail.com');

// setup e-mail data with unicode symbols
var mailOptions = {
    from: '"Ecuaquimica recibos de pago" <eq-ecuaquimica@ecuaquimica.com.ec>', // sender address
    to: 'ohonores@hotmail.com', // list of receivers
    subject: '', // Subject line
    text: '', // plaintext body
    html: '' // html body
};




function getDatos(origen, destino, keyToDelete){
	//console.log("getDatos inicio ", keyToDelete);
    for(var key in destino){
        if(typeof(destino[key]) == "string"){
            
            destino[key] =(destino[key] && destino[key].indexOf("*")===0 )? destino[key].substring(1,destino[key].length):( (origen[destino[key]] === undefined || origen[destino[key]] === null)  ?null:origen[destino[key]]);
            if(destino[key] == "MESTABLECIMIENTOTIPOPAGO_ID"){
                if(!isNaN(origen[destino[key]])){
                    destino[key] = parseInt(origen[destino[key]]);
                }
            }
            if(destino[key] == "establecimientoTipoPago_id"){
                if(!isNaN(origen[destino[key]])){
                    destino[key] = parseInt(origen[destino[key]]);
                }

            }

            //console.log(destino);
        }else{	
			 
			//console.log("getDatos .......", keyToDelete, key);
             if(key.indexOf("arrayJson")<0){
                getDatos(origen, destino[key], keyToDelete);
            }else{
				delete destino[key];
			}
			/*if(key != "arrayJson1"){
                getDatos(origen, destino[key]);
            }else{
                delete destino.arrayJson1;
            }
			if(key != "arrayJson2"){
                getDatos(origen, destino[key]);
            }else{
                delete destino.arrayJson2;
            }*/
        }
    }
}

function buscarEtiquetaJsonListaResultados(origen, lista){

    for(var key in origen){

        if(key.indexOf("arrayJson")>=0){ 
            lista.push(true);
			/*if(key==="arrayJson2"){
				console.log("buscarEtiquetaJsonListaResultados entrado ***** key y lista ",key, origen);
			}*/
			
            return;
        }
        if(typeof(origen[key]) != "string"){
            buscarEtiquetaJsonListaResultados(origen[key], lista);
        }
    }

}

function buscarEtiquetaJsonCallFuncion(origen, callBack){
	
    for(var key in origen){
        if(key.indexOf("arrayJson")>=0){ 
			//console.log("buscarEtiquetaJsonCallFuncion entrado ***** ",key);
			//console.log("buscarEtiquetaJsonCallFuncion entrado ***** origen[key] ",origen[key]);
            callBack(origen[key], key);
			return;
        }
        if(typeof(origen[key]) != "string"){
            buscarEtiquetaJsonCallFuncion(origen[key], callBack);
        }
    }
}

function getconjuntoDeArrysJson(registros, origen, conjuntoDeArrysJson){
	//console.log("getconjuntoDeArrysJson");
	for(var key in origen){
        if(key.indexOf("arrayJson")>=0){ 
			//console.log("getconjuntoDeArrysJson",key);
			conjuntoDeArrysJson.push(buscandoRegistrosRecursivos(registros, origen[key], key));
		}
        if(typeof(origen[key]) != "string"){
            getconjuntoDeArrysJson(registros, origen[key], conjuntoDeArrysJson);
        }
    }
	
	return conjuntoDeArrysJson;
}

function buscarTodasEtiquetaJsonCallFuncion(registros, origen){
	var deferred = Q.defer();
	
	var conjuntoDeArrysJson = [];
	conjuntoDeArrysJson = getconjuntoDeArrysJson(registros, origen, conjuntoDeArrysJson);
	
	//console.log("buscarTodasEtiquetaJsonCallFuncion conjuntoDeArrysJson ",conjuntoDeArrysJson.length);
	Q.all(conjuntoDeArrysJson).then(function(r){
		//console.log("2 buscarTodasEtiquetaJsonCallFuncion fin al fin ",registros[registros.length-1].registroMovil);
        deferred.resolve(registros);
    },function(x){
        //console.log("buscarTodasEtiquetaJsonCallFuncion error ",x);
		deferred.reject(x);
	});
    return deferred.promise
	
}
function getJsonFromArray(dato){
	var newJsonArray = [];
    var newJson = {};
		newJsonArray = dato.reduce(
			function(a,b){
			    var tv=[];
				for(key_ in b){
					tv.push(b[key_]);
				}
				if(!isNaN(tv[1])){
					a[tv[0]] = parseFloat(parseFloat(tv[1]).toFixed(2))
				}else{
					a[tv[0]] = tv[1];
				}
				return a;
		},{});
		/*console.log("setDatoToJsonPorEtiqueta",newJsonArray.length);
        for(var i=0;i<newJsonArray.length;i++){
			if((i+1)<newJsonArray.length){
				newJson[newJsonArray[i]]= newJsonArray[i+1];
			}
		}*/
		return newJsonArray;
}

function setDatoToJsonPorEtiqueta(origen, dato, etiqueta, eliminarKey, callback){
    for(var key in origen){
	
			if(key === etiqueta ){
				
				origen[json_.test(key) ? key.replace("_json_",""):key] = json_.test(key) ? getJsonFromArray(dato) : dato;
				if(json_.test(key)){
					delete origen[key];
				}
			
				
				callback(true);
			}
		
        
        if(typeof(origen[key]) != "string"){
            setDatoToJsonPorEtiqueta(origen[key], dato, etiqueta,eliminarKey, callback);
        }
    }
}

var OracleMongo = function (oracle_, mongo_) {
    oracle = oracle_;
    oracledb = oracle_;
    mongodb = mongo_;

};

var periflesIds = [];
function setRegistrosRecursivos(jsonEntity, documento, key){
    var deferred = Q.defer();
	jsonEntity.parametrosBusquedaValores=[];
        if(jsonEntity.parametrosBusqueda){
            jsonEntity.parametrosBusqueda.forEach(function(b){
                jsonEntity.parametrosBusquedaValores.push(eval("documento."+b));
            });
    }
   // console.log(jsonEntity.sqlOrigen);
    oracledb.getPoolClienteConexion(jsonEntity.sqlOrigen, jsonEntity.parametrosBusquedaValores, false, function(respuestaora){
		if(respuestaora.error){
            //console.log("setRegistrosRecursivos ",respuestaora);
			deferred.reject(respuestaora);
		}else{
             if(respuestaora && respuestaora.rows && respuestaora.rows.length>0){
                //console.log(key, jsonEntity.sqlOrigen, jsonEntity.parametrosBusquedaValores, respuestaora.rows.length);
                    var datoMapeado = respuestaora.rows.map(function(registro){
                            jsonClon = JSON.parse(JSON.stringify(jsonEntity.registroMovil));
                            getDatos(registro, jsonClon, key);
                            return jsonClon;
                    });
                    //console.log(datoMapeado);
                    setDatoToJsonPorEtiqueta(documento, datoMapeado, jsonEntity.etiqueta,key, function(r){
                         deferred.resolve(true);
                    });
            }else{
                deferred.resolve(true);
            }
        }
    });
    return deferred.promise;
}
function buscandoRegistrosRecursivos (listaRegistros, jsonEntity, key){
    var deferred = Q.defer();
    var listaSetRegistrosRecursivos = [];
    for(var i=0;i<listaRegistros.length;i++){
        listaSetRegistrosRecursivos.push(setRegistrosRecursivos(jsonEntity, listaRegistros[i], key));
    }
   /* listaRegistros.forEach(function(r){
        jsonEntity.parametrosBusquedaValores=[];
        if(jsonEntity.parametrosBusqueda){
            jsonEntity.parametrosBusqueda.forEach(function(b){
                jsonEntity.parametrosBusquedaValores.push(eval("r."+b));
            });
       }
       listaSetRegistrosRecursivos.push(setRegistrosRecursivos(jsonEntity, r, key));
    });*/
    Q.all(listaSetRegistrosRecursivos).then(function(r){
         //console.log("buscandoRegistrosRecursivos",Array.isArray(r)?r.length:r)
       // console.log(r)
		deferred.resolve(listaRegistros);
    },function(x){
		//console.log("Error e buscandoRegistrosRecursivos ", x);
        deferred.reject({error:x});
	});
    return deferred.promise;
}
/* rorrame
function buscandoRegistrosRecursivos (index, listaRegistros, jsonEntity, callBack){
    var deferred = Q.defer();
     if(index<listaRegistros.length){
         jsonEntity.parametrosBusquedaValores=[];
         if(jsonEntity.parametrosBusqueda){
             jsonEntity.parametrosBusqueda.forEach(function(b){
                 var r = listaRegistros[index];
                 jsonEntity.parametrosBusquedaValores.push(eval("r."+b));
             });
        }
        oracledb.getPoolClienteConexion(jsonEntity.sqlOrigen, jsonEntity.parametrosBusquedaValores, false, function(respuestaora){
            if(respuestaora && respuestaora.rows && respuestaora.rows.length>0){
                    var datoMapeado = respuestaora.rows.map(function(registro){
                            jsonClon = JSON.parse(JSON.stringify(jsonEntity.registroMovil));

                            getDatos(registro, jsonClon);
                            return jsonClon;
                    });
                    setDatoToJsonPorEtiqueta(listaRegistros[index], datoMapeado, jsonEntity.etiqueta);
            }
            index = index +1;
            buscandoRegistrosRecursivos(index, listaRegistros, jsonEntity, callBack);
        });
    }else{
        callBack(listaRegistros);
    }
    return deferred.promise;
}

*/
var grabarSinValidarExistencia = false;
function grabarRegistrosRecursivosQ(i, a, id, identificacion, perfil, cantidad, jsonEntity_, regAux){
    var deferred = Q.defer();
    var jsonEntity = JSON.parse(JSON.stringify(jsonEntity_));
    if(regAux){
        jsonEntity.parametrosBusqueda.forEach(function(b){
                jsonEntity.parametrosBusquedaValores.push(eval("regAux."+b));
        });
    }
    //console.log("grabarRegistrosRecursivosQ ",jsonEntity.coleccion);
    /*grabarRegistrosRecursivos(i, a, id, identificacion, perfil, cantidad, jsonEntity, function(r){
		if(r.error){
            console.log("grabarRegistrosRecursivosQ grabarRegistrosRecursivos erro ",r.error);
			deferred.reject(r);
		}else{
			deferred.resolve(r);
		}
        
    });*/
    getDatosAndSaveRecursiveConQ(i, a, id, identificacion, perfil, cantidad, jsonEntity).then(function(a){
            if(a.error){
                //console.log("Error en grabarRegistrosRecursivosQ a ");
                deferred.reject(a);
            }else{
                 deferred.resolve(a);     
            }
                                                                                        
    },function(x){
        console.log("Error en grabarRegistrosRecursivosQ ");
        deferred.reject(x);
    });
    /*setTimeout(function(){
        console.log("identificiion",identificacion);
        if("1307841260" === identificacion){
            deferred.reject("ok"); 
        }else{
           deferred.resolve(identificacion); 
           }
        
    },20000);*/
     
    return deferred.promise;
}
function getDatosAndSaveRecursiveConQ(i, a, id, identificacion, perfil, cantidad, jsonEntity){
    return getDatosAndSave(i, a, id, identificacion, perfil, cantidad, jsonEntity).then(function(respuesta){
        if(respuesta.recursive){
            return getDatosAndSaveRecursiveConQ(respuesta.i, respuesta.a, id, identificacion, perfil, cantidad, jsonEntity);
        }else{
            return respuesta;
        }    
    },function(x){
         //console.log("Error en getDatosAndSaveRecursiveConQ ");
        return {error:x};
    });
}
function getDatosAndSave(i, a, id, identificacion, perfil, cantidad, jsonEntity){
    var deferred = Q.defer();
    if(jsonEntity.parametrosBusquedaValores){
        jsonEntity.parametrosBusquedaValores.push(a);
        jsonEntity.parametrosBusquedaValores.push(cantidad);
    }
    
    oracledb.getPoolClienteConexion(jsonEntity.sqlOrigen, jsonEntity.parametrosBusquedaValores ? jsonEntity.parametrosBusquedaValores :[] , false, function(respuestaora){
        
		if(respuestaora.error){
            deferred.reject(respuestaora);
            return deferred.promise;
		}		
        if(respuestaora && respuestaora.rows && respuestaora.rows.length>0){
            var jsonClon;
            var nuevoRegistro={
                    index : i,
                    registros : respuestaora.rows.map(function(registro){
                            jsonClon = JSON.parse(JSON.stringify(jsonEntity.registroMongo));
                            getDatos(registro, jsonClon);
                            jsonClon.registroMovil.hash = hash(jsonClon.registroMovil);
                            return jsonClon;
                    })
            };
            //Si existe el id crea la relacion
            if(id){
                nuevoRegistro.relacion_id = id;
            }
            //Si existe la identificacion crea la relacion
            if(identificacion){
                nuevoRegistro.identificacion = identificacion;
            }
            if(perfil){
                nuevoRegistro.perfil = perfil;
            }
            if(nuevoRegistro && Array.isArray(nuevoRegistro.registros)){
                nuevoRegistro.hash = hash(nuevoRegistro.registros);
            }
            //Verificando si es que existen arrays de json embebidos
            var existenArraysEmbebidos = [];
            //El siguiente metodo permite buscar arrays embebidos y devuelve el valor en un array :: existenArraysEmbebidos
            buscarEtiquetaJsonListaResultados(jsonEntity.registroMongo, existenArraysEmbebidos);
            //Si contiene al menos un elemento::true, significa que fue encontrado
            if(existenArraysEmbebidos.indexOf(true)>=0){
                //Funcion que permite buscar
                //console.log("buscarTodasEtiquetaJsonCallFuncion fin ", identificacion);
				buscarTodasEtiquetaJsonCallFuncion(nuevoRegistro.registros, jsonEntity.registroMongo).then(function(resp){
					 nuevoRegistro.registros = resp;
                     
					// console.log("buscarTodasEtiquetaJsonCallFuncion fin ", identificacion);
					 mongodb.grabar(jsonEntity.coleccion, nuevoRegistro, grabarSinValidarExistencia).then(function(r){
                                if(jsonEntity.parametrosBusquedaValores){jsonEntity.parametrosBusquedaValores.pop();}
                                if(jsonEntity.parametrosBusquedaValores){jsonEntity.parametrosBusquedaValores.pop();}
                                deferred.resolve({i:(i+1), a:(respuestaora.rows[respuestaora.rows.length -1].ID + 1), recursive:true});
                        },function(x){
                           // console.log(x);
                           if(x.mensaje && x.mensaje.existe === true){
                                if(jsonEntity.parametrosBusquedaValores){jsonEntity.parametrosBusquedaValores.pop();}
                                if(jsonEntity.parametrosBusquedaValores){jsonEntity.parametrosBusquedaValores.pop();}
                                deferred.resolve({i:(i+1), a:(respuestaora.rows[respuestaora.rows.length -1].ID + 1), recursive:true});
                            }else{
                                deferred.reject(x);

                            }
					
                     });
				},function(r){
                    //console.log("buscarTodasEtiquetaJsonCallFuncion error",r);
                    deferred.reject(r);
                    //return deferred.promise;
				})
				
            }else{
                
                mongodb.grabar(jsonEntity.coleccion, nuevoRegistro, grabarSinValidarExistencia).then(function(respuesta){
                    if(jsonEntity.parametrosBusquedaValores){jsonEntity.parametrosBusquedaValores.pop();}
                    if(jsonEntity.parametrosBusquedaValores){jsonEntity.parametrosBusquedaValores.pop();}
                    deferred.resolve({i:(i+1), a:(respuestaora.rows[respuestaora.rows.length -1].ID + 1), recursive:true});
                },function(x){
                    //console.log(x);
                    if(x.mensaje && x.mensaje.existe === true){
                        if(jsonEntity.parametrosBusquedaValores){jsonEntity.parametrosBusquedaValores.pop();}
                        if(jsonEntity.parametrosBusquedaValores){jsonEntity.parametrosBusquedaValores.pop();}
                        deferred.resolve({i:(i+1), a:(respuestaora.rows[respuestaora.rows.length -1].ID + 1), recursive:true});
                    }else{
                        deferred.reject(x);
                        
                    }
					
                    
                });//Fin mongodb
            }

            
        }else{
            deferred.resolve({perfil:perfil, indeces:i, recursive:false});
			//callBack({perfil:perfil, indeces:i, estado:(i==1?false:true)});
        }
        
        
    });
    
    return deferred.promise;
    /*
            if(jsonEntity.parametrosBusquedaValores){jsonEntity.parametrosBusquedaValores.pop();}
            if(jsonEntity.parametrosBusquedaValores){jsonEntity.parametrosBusquedaValores.pop();}
            i = i + 1;
            grabarRegistrosRecursivos (i, (respuestaora.rows[respuestaora.rows.length -1].ID + 1), id, identificacion, perfil, cantidad, jsonEntity, callBack);

    */
}
function grabarRegistrosRecursivosBorrarme (i, a, id, identificacion, perfil, cantidad, jsonEntity, callBack){
    if(jsonEntity.parametrosBusquedaValores){
        jsonEntity.parametrosBusquedaValores.push(a);
        jsonEntity.parametrosBusquedaValores.push(cantidad);
    }
    //console.log("sql",jsonEntity.sqlOrigen);
    oracledb.getPoolClienteConexion(jsonEntity.sqlOrigen, jsonEntity.parametrosBusquedaValores ? jsonEntity.parametrosBusquedaValores :[] , false, function(respuestaora){
        
		if(respuestaora.error){
            console.log("resrespuestaora",respuestaora);
			callBack(respuestaora);
			return;
		}		
        if(respuestaora && respuestaora.rows && respuestaora.rows.length>0){
            var jsonClon;
            var nuevoRegistro={
                    index : i,
                    registros : respuestaora.rows.map(function(registro){
                            jsonClon = JSON.parse(JSON.stringify(jsonEntity.registroMongo));
                            getDatos(registro, jsonClon);
                            jsonClon.registroMovil.hash = hash(jsonClon.registroMovil);
                            return jsonClon;
                    })
            };
            //Si existe el id crea la relacion
            if(id){
                nuevoRegistro.relacion_id = id;
            }
            //Si existe la identificacion crea la relacion
            if(identificacion){
                nuevoRegistro.identificacion = identificacion;
            }
            if(perfil){
                nuevoRegistro.perfil = perfil;
            }
            //Verificando si es que existen arrays de json embebidos
            var existenArraysEmbebidos = [];
            //El siguiente metodo permite buscar arrays embebidos y devuelve el valor en un array :: existenArraysEmbebidos
            buscarEtiquetaJsonListaResultados(jsonEntity.registroMongo, existenArraysEmbebidos);
            //Si contiene al menos un elemento::true, significa que fue encontrado
            if(existenArraysEmbebidos.indexOf(true)>=0){
                //Funcion que permite buscar
                //console.log("Registros recursivos");
				
				buscarTodasEtiquetaJsonCallFuncion(nuevoRegistro.registros, jsonEntity.registroMongo).then(function(resp){
					 nuevoRegistro.registros = resp;
					 //console.log("last buscarTodasEtiquetaJsonCallFuncion fin ", resp);
					 mongodb.grabar(jsonEntity.coleccion, nuevoRegistro, grabarSinValidarExistencia).then(function(r){
                                
                        },function(x){
                           // console.log(x);
                            if(x.existe != true){
								callBack({error:true});
							}
                     });
				},function(r){
                   // console.log("buscarTodasEtiquetaJsonCallFuncion eroro ", r);
					callBack({error:r});
                    return;
				})
				
            }else{

                mongodb.grabar(jsonEntity.coleccion, nuevoRegistro, grabarSinValidarExistencia).then(function(respuesta){
                //    console.log(respuesta);
                },function(x){
                    //console.log(x);
					if(x.existe != true){
						callBack({error:true});
					}
                    
                });//Fin mongodb
            }

            if(jsonEntity.parametrosBusquedaValores){jsonEntity.parametrosBusquedaValores.pop();}
            if(jsonEntity.parametrosBusquedaValores){jsonEntity.parametrosBusquedaValores.pop();}
            i = i + 1;
            grabarRegistrosRecursivos (i, (respuestaora.rows[respuestaora.rows.length -1].ID + 1), id, identificacion, perfil, cantidad, jsonEntity, callBack);


        }else{
			callBack({perfil:perfil, indeces:i, estado:(i==1?false:true)});
        }
    });
}
function grabarRegistrosRecursivosDesdeUnArraySqls(index, listaSqls, i, callBack){
    console.log("grabarRegistrosRecursivosDesdeUnArraySqls "+index);
    if(index < listaSqls.length){
        
        getDatosAndSaveRecursiveConQ(i, 0, null, null, null, sizeArrayPorDocumento, listaSqls[index]).then(function(a){
                if(a.error){
                   callBack(a);
                }else{
                    index = index + 1;
                    grabarRegistrosRecursivosDesdeUnArraySqls(index, listaSqls, a.indeces, callBack);    
                }

        },function(x){
             callBack({error:x});
        });
       /* getDatosAndSave(i, 0, null , null, null, sizeArrayPorDocumento, listaSqls[index]).then(function(resultado){
            //console.log("grabarRegistrosRecursivosDesdeUnArraySqls");
            //console.log(resultado);
            if(resultado.error){
                callBack(resultado);
            }else{
                index = index + 1;
                grabarRegistrosRecursivosDesdeUnArraySqls(index, listaSqls, resultado.indeces, callBack);
            }
            
        },function(x){
            callBack({error:x});
        });*/
    }else{
        callBack(i);
    }
}
OracleMongo.prototype.getPerfil = function(identificacion, empresa){
     var deferred = Q.defer();
     mongodb.getRegistrosCustomColumnas("emcperfiles", {"registroMovil.identificacion":identificacion} , {registroInterno:1}, function(resultado){
         console.log(resultado);
         if(resultado && Array.isArray(resultado) && resultado.length>0){
              deferred.resolve(resultado[0].registroInterno.perfil);
         }else{
             deferred.reject(false);
         }
        
     });
    return  deferred.promise;
}
OracleMongo.prototype.getIdentificacion = function(perfil){
     var deferred = Q.defer();
     mongodb.getRegistrosCustomColumnas("emcperfiles", {"registroInterno.perfil":parseInt(perfil)} , {"registroMovil.identificacion":1}, function(resultado){
         console.log(resultado);
         if(resultado && Array.isArray(resultado) && resultado.length>0){
              deferred.resolve(resultado[0].registroMovil.identificacion);
         }else{
             deferred.reject(false);
         }
        
     });
    return  deferred.promise;
}
OracleMongo.prototype.autentificacion = function(parametros,sincronizacion_inicio, callBack){
	var busquedaPerfil = {"registroMovil.identificacion":parametros.identificacion };
        if(parseInt(parametros.empresa) !== 0 ){
            busquedaPerfil["infoEmpresa.empresa_id"] = parametros.empresa;
        }
        
        mongodb.getRegistrosCustomColumnas("emcperfiles", {"registroMovil.identificacion":parametros.identificacion} , {registroMovil:1,registroInterno:1}, function(resultado){
			if(resultado && Array.isArray(resultado) && resultado.length>0){
               
                mongodb.modificar("emcperfiles", {_id:resultado[0]._id}, {$addToSet:{"registroInterno.dispositivos":parametros.uidd}}, function(resultado){

                    
                });
                mongodb.modificar("emcperfiles", {_id:resultado[0]._id}, {$push:{"registroInterno.coordenadas":{x:parametros.x,y:parametros.y,dispositivo:parametros.uidd,fecha:new Date(),sincronizacionInicio:sincronizacion_inicio}}}, function(resultado){

                   
                });
            }
            
            callBack(resultado);
        });
};

function borrarColeccion(borrar, json){
    var deferred = Q.defer();
    if(borrar){
        console.log("Borrar tabla 1",json.coleccion);
        mongodb.dropCollection(json.coleccion , function(coleccionBorrada){
                console.log("borrada",json.coleccion);
                deferred.resolve(json);
        });
    }else{
        console.log("ACTUALIZANDO ",json.coleccion);
        deferred.resolve(json);
    }

    return deferred.promise;
}

function grabarPerfiles(json){
    var deferred = Q.defer();
    console.log("grabarPerfiles");
    console.log(json);
    //Obtiene todos los perfiles en Oracle
    oracledb.getPoolClienteConexion(json.sqlOrigen, [], false, function(respuestaora){
		if(respuestaora.error){
			deferred.reject(respuestaora);
			return deferred.promise; 
		}
        if(respuestaora && respuestaora.rows &&  respuestaora.rows.length > 0  ){
            //crea un nuevo registro para grabar en mongo a partir del registro individual en oracle
            console.log("tota "+respuestaora.rows.length);
            var conjuntoPerfiles = respuestaora.rows.map(function(registro){
                var jsonPerfilesClon = JSON.parse(JSON.stringify(json.registroMongo));
                getDatos(registro, jsonPerfilesClon);
                jsonPerfilesClon.registroMovil.hash = hash(jsonPerfilesClon.registroMovil);
                return jsonPerfilesClon;
            });
            //Verificando si es que existen arrays de json embebidos
            var existenArraysEmbebidos = [];
            //El siguiente metodo permite buscar arrays embebidos y devuelve el valor en un array :: existenArraysEmbebidos
            buscarEtiquetaJsonListaResultados(json.registroMongo, existenArraysEmbebidos);
            //Si contiene al menos un elemento::true, significa que fue encontrado
            if(existenArraysEmbebidos.indexOf(true)>=0){
                //Funcion que permite buscar
                buscarEtiquetaJsonCallFuncion(json.registroMongo, function(nuevoArrayJson, key){
					console.log("perfiles buscarEtiquetaJsonCallFuncion recursivo ",key);
                    buscandoRegistrosRecursivos (conjuntoPerfiles, nuevoArrayJson, key).then(function(resp){
                        conjuntoPerfiles = resp;
                        console.log("buscandoRegistrosRecursivos");
                        mongodb.grabarArrayQ(json.coleccion, conjuntoPerfiles).then(function(total){
                            deferred.resolve({totalRegistros:total,nested:true});
                        },function(x){
                            deferred.resolve({totalRegistros:total,nested:true});
                        });
                    });
                });

            }else{
                mongodb.grabarArrayQ(json.coleccion, conjuntoPerfiles).then(function(total){
                    deferred.resolve({totalRegistros:total,nested:false});
                },function(x){
                    deferred.resolve({totalRegistros:total,nested:false});
                });
            }
        }else{
            deferred.reject({mensaje:"No se encontraron registros"});
        }
     });
    return deferred.promise;
}

OracleMongo.prototype.crearPerfiles = function(borrar){
    var deferred = Q.defer();
    borrarColeccion(borrar, entidesMonogoDB.getJsonPerfiles()).
    then(grabarPerfiles).
    then(function(r){
        //console.log(r);
        deferred.resolve(r);
    },function(r){
        console.log(r);
        deferred.reject(r);
    });
    return deferred.promise;
};
OracleMongo.prototype.setSizeArrayPorDocumento = function(nuevoSize){
    sizeArrayPorDocumento = nuevoSize;
};
OracleMongo.prototype.crearColeccionesMongo = function(borrar, jsonEntityArray){
    var deferred = Q.defer();
    var coleccionesPorCrear = [];
    jsonEntityArray.forEach(function(jsonEntity){
        coleccionesPorCrear.push(crearColeccionMongo(borrar, jsonEntity));
    });
    Q.all(coleccionesPorCrear).then(function(r){
        deferred.resolve(r);
    },function(x){
        console.log("crearColeccionesMongo error ",x);
		deferred.reject(x);
	});
    return deferred.promise;
};

function crearColeccionMongo(borrar, jsonEntity){
    var deferred = Q.defer();
    borrarColeccion(borrar, jsonEntity).
    then(insertarDocumentos).
    then(function(r){
	    deferred.resolve(r);
    },function(r){
        console.log("crearColeccionMongo error ",r);
		deferred.reject(r);
    });
    return deferred.promise;
};

function testing(listaRegistrosGrabados){
    var deferred = Q.defer();
    var listaRegistrosGrabados_ = [];
    listaRegistrosGrabados_ = listaRegistrosGrabados;
    Q.all(listaRegistrosGrabados_).then(function(a){
        deferred.resolve(a);
    },function(x){
        console.log(x);
		deferred.reject(x);
	});
    return deferred.promise;
}
function testing222(a, jsonEntity, reg){
    var deferred = Q.defer();
   // if(jsonEntity.iteracionPorPerfil){
       //  console.log("si iteracionPorPerfil en ");
    setTimeout(function(){
        if(reg){
          var nuevoJsonDoc = JSON.parse(JSON.stringify(jsonEntity));
        nuevoJsonDoc.parametrosBusqueda.forEach(function(b){
                            nuevoJsonDoc.parametrosBusquedaValores.push(eval("reg."+b));
                        });
        }
       // console.log(nuevoJsonDoc.parametrosBusquedaValores);
        if(a>70){
             console.log("a >70 ",a);
            // deferred.reject("Error en a>70");
              deferred.resolve(a);  
        }else{
            console.log("testing222",a);
           deferred.resolve(a);  
        }
    /*}else{
            console.log("no iteracionPorPerfil en ",a);
             deferred.reject("Error en a>70"); 
        }*/
       
    },5000)
   /* }else{
            console.log("no iteracionPorPerfil en ",a);
             deferred.reject("Error en a>70"); 
        }*/
    return deferred.promise;
}
function insertarDocumentos(jsonEntity){
    var deferred = Q.defer();
    var listaRegistrosGrabados_ = [];
    var jsonEstablecimiento = {};
    var nuevoJsonDoc = {};
    if(jsonEntity.iteracionPorPerfil){
         mongodb.getRegistrosCustomColumnas(entidesMonogoDB.getJsonPerfiles().coleccion,{/*"registroInterno.perfil":140*/},{_id:1,"registroMovil.identificacion":1,"registroInterno.perfil":1,"registroMovil.infoEmpresa.empresa_id":1}, function(respuesta){


           // var ii=0;
            for(var i = 0;i<respuesta.length;i++){
                listaRegistrosGrabados_.push(grabarRegistrosRecursivosQ(1, 0, respuesta[i]._id, respuesta[i].registroMovil.identificacion, respuesta[i].registroInterno.perfil, sizeArrayPorDocumento, jsonEntity, respuesta[i] ));
                          // listaRegistrosGrabados_.push(testing222(i, jsonEntity, respuesta[i]));

            }
            Q.all(listaRegistrosGrabados_).then(function(a){
                console.log(a);
                deferred.resolve(a);
            },function(x){
                console.log("Error en insertarDocumentos");
                console.log(x);
                deferred.reject(x);
            });
        });
    }else{
        console.log("inicio ...");
       /* testing222(1, jsonEntity, null).then(function(a){
             console.log(a);
            deferred.resolve(a);
        },function(x){
            console.log(x);
            deferred.reject(x);
        })*/
         grabarRegistrosRecursivosQ(1, 0, null, null, null, sizeArrayPorDocumento, jsonEntity).then(function(resultado){
			deferred.resolve(resultado);
		},function(x){
			deferred.reject(resultado);
		});
    }
    return deferred.promise;
}
function insertarDocumentos22(jsonEntity){
    var deferred = Q.defer();
    var listaRegistrosGrabados = [];
    var jsonEstablecimiento = {};
    var nuevoJsonDoc = {};
    //Valida si la entidad tiene que ser recorrida por cada perfil
    //if(jsonEntity.iteracionPorPerfil){
        console.log("insertarDocumentos",jsonEntity.iteracionPorPerfil);
        //Inicia el recorrido
        //Se grabara los documentos  por perfil en un conjunto de sizeArrayPorDocumento
        mongodb.getRegistrosCustomColumnas(entidesMonogoDB.getJsonPerfiles().coleccion,{},{_id:1,"registroMovil.identificacion":1,"registroInterno.perfil":1,"registroMovil.infoEmpresa.empresa_id":1}, function(respuesta){
                 console.log("insertarDocumentos respuesta",respuesta.length);
                    var ii=0;
                   /* respuesta.forEach(function(r){
                        nuevoJsonDoc = JSON.parse(JSON.stringify(jsonEntity));
                        nuevoJsonDoc.parametrosBusqueda.forEach(function(b){
                            nuevoJsonDoc.parametrosBusquedaValores.push(eval("r."+b));
                        });
                       // listaRegistrosGrabados.push(grabarRegistrosRecursivosQ(1, 0, r._id, r.registroMovil.identificacion, r.registroInterno.perfil, sizeArrayPorDocumento, nuevoJsonDoc ));
                        listaRegistrosGrabados.push(testing222(ii));
                        ii++;
                        console.log("forEach",new Date());
                    });*/
                   for(var i = 0;i<200;i++){
                        listaRegistrosGrabados.push(testing222(i));
                    };
                    //testing(listaRegistrosGrabados).then(function(a){
                    Q.all(listaRegistrosGrabados).then(function(a){
                        deferred.resolve(a);
                    },function(x){
                        console.log("error ",new Date());
                        console.log(x);
						deferred.reject(x);
					});
                  
        });
    
     
    
   /* }else{
        console.log("No se hace el recorrdio por perfil");
        //Graba los documentos segun la tabla de oracle en un conjunto de sizeArrayPorDocumento
        grabarRegistrosRecursivosQ(1, 0, null, null, null, sizeArrayPorDocumento, jsonEntity).then(function(resultado){
			deferred.resolve(resultado);
			 
        },function(x){
			deferred.reject(resultado);
		});
    }*/

    return deferred.promise; 
}

function crearBodegasPorPefil(borrar, inicio){
    console.log("crearEstablecimientos borrar "+borrar);
    var jsonBodega = {};
    borrar = false;
    mongodb.dropCollection(borrar ? entidesMonogoDB.getJsonEstablecimientos().coleccion : "noborrar", function(coleccionBorrada){
            console.log("crearEstablecimientos creado");
            mongodb.getRegistrosCustomColumnas(entidesMonogoDB.getJsonPerfiles().coleccion,{},{_id:1,"registroMovil.identificacion":1,"registroInterno.perfil":1}, function(respuesta){
                respuesta.forEach(function(r){
                    jsonBodega = entidesMonogoDB.getJsonDiccionarioBodegaVenta();
                //    console.log(jsonEstablecimiento.parametrosBusqueda);
                    jsonBodega.parametrosBusqueda.forEach(function(b){
                        jsonBodega.parametrosBusquedaValores.push(eval("r."+b));
                    });
                //    console.log(jsonEstablecimiento.parametrosBusquedaValores);
                    grabarRegistrosRecursivos (inicio, 0, null , null, null, sizeArrayPorDocumento, jsonBodega , function(resultado){
                            //console.log(resultado);
                    });
                });
            });

    });
}


OracleMongo.prototype.crearDiccionarios = function(borrar){
	var deferred = Q.defer();
    borrarColeccion(borrar, entidesMonogoDB.getJsonDiccionarioBanco()).
    then(function(r){
        var diccionarios = [
                            entidesMonogoDB.getJsonDiccionarioBanco(),
                            entidesMonogoDB.getJsonDiccionarioCuentaBancaria(),
                            entidesMonogoDB.getJsonDiccionarioDocumento(),
                            entidesMonogoDB.getJsonDiccionarioBodegaVenta(),
							entidesMonogoDB.getJsonDiccionarioLineaNegocio()
                        ];
        grabarRegistrosRecursivosDesdeUnArraySqls(0, diccionarios, 1, function(a){
                console.log("crearColecciones crearDiccionarios listo",a);
                if(a.error){
                    deferred.reject(a);
                }else{
                   deferred.resolve(true); 
                }
				
        });

    });
	 return deferred.promise;

};

OracleMongo.prototype.crearEstadoCuenta = function(borrar){
    console.log("crearDiccionarios borrar "+borrar);
    mongodb.dropCollection(borrar ? entidesMonogoDB.getJsonEstadoDeCuenta().coleccion : "noborrar", function(coleccionBorrada){
        var jsonEstadoCuenta = {};
        mongodb.getRegistrosCustomColumnas(entidesMonogoDB.getJsonPerfiles().coleccion,{},{_id:1,"registroMovil.identificacion":1,"registroInterno.perfil":1}, function(respuesta){
            console.log("crearDiccionarios creando "+respuesta.length);
            respuesta.forEach(function(r){
                jsonEstadoCuenta = entidesMonogoDB.getJsonEstadoDeCuenta();
                //console.log(jsonEstadoCuenta.parametrosBusqueda);
                jsonEstadoCuenta.parametrosBusqueda.forEach(function(b){
                    jsonEstadoCuenta.parametrosBusquedaValores.push(eval("r."+b));
                });
                //.log(jsonEstadoCuenta.parametrosBusquedaValores);
                grabarRegistrosRecursivos (1, 0, r._id, r.registroMovil.identificacion, r.registroInterno.perfil, sizeArrayPorDocumento, jsonEstadoCuenta , function(resultado){
                        //console.log(resultado);
                });
            });
        });
    });

};

OracleMongo.prototype.crearItems = function(borrar){
    mongodb.dropCollection(borrar ? entidesMonogoDB.getJsonItems().coleccion : "noborrar", function(coleccionBorrada){
        var jsonItems = entidesMonogoDB.getJsonItems();
                                //(i, a, id, identificacion, cantidad, jsonEntity, callBack)
        grabarRegistrosRecursivos (1, 0, null, null, null, sizeArrayPorDocumento, jsonItems , function(resultado){
                //console.log(resultado);
        });
    });
};

OracleMongo.prototype.crearItemPromocionVenta = function(borrar){
    mongodb.dropCollection(borrar ? entidesMonogoDB.getJsonPromocionVenta().coleccion : "noborrar", function(coleccionBorrada){
        var jsonItemPromocionVenta = entidesMonogoDB.getJsonPromocionVenta();
                                //(i, a, id, identificacion, cantidad, jsonEntity, callBack)
        grabarRegistrosRecursivos (1, 0, null, null, null, sizeArrayPorDocumento, jsonItemPromocionVenta , function(resultado){
                //console.log(resultado);
        });
    });
};



//Scripts ****************************************************************/
OracleMongo.prototype.getTablasScript = function(callBack){
    var tablasEspejo = [];
    var tablasCustomColumnas = Object.getOwnPropertyNames( EntidadesMongoOracle.prototype ).reduce(function(res, a){
                        if(a.indexOf("getJson")>=0 && entidesMonogoDB[a]() && entidesMonogoDB[a]().movil && entidesMonogoDB[a]().movil.crear){
                            //Valida si se trata de una tabla espejo
                            if(entidesMonogoDB[a]().movil.espejo && entidesMonogoDB[a]().movil.sql){
                                //Toma el sql de la tabla espjo para poder obtener las columnas
                                tablasEspejo.push({coleccion:entidesMonogoDB[a]().coleccion, sql :entidesMonogoDB[a]().movil.sql, getjson:a});
                            }else{
                                //Crea el script de la tabla
                                res[entidesMonogoDB[a]().coleccion]= entidesMonogoDB.getTablaMovil(entidesMonogoDB[a](), null, false);

                            }
                        }
                        return res;
                    },{});
    getSriptTablaDesdeUnSql(0, tablasEspejo,  function(camposPorColeccion){
            camposPorColeccion.forEach(function(a){
                tablasCustomColumnas[a.coleccion] = entidesMonogoDB.getTablaMovil(entidesMonogoDB[a.getjson](), a.campos, true);
            });
        callBack(tablasCustomColumnas);
    });


//    return  entidesMonogoDB.getTablasScript();

};
OracleMongo.prototype.getTablasScriptDrop = function(){
    var tablasEspejo = [];
    return Object.getOwnPropertyNames( EntidadesMongoOracle.prototype ).reduce(function(res, a){
                            if(a.indexOf("getJson")>=0 && entidesMonogoDB[a]() && entidesMonogoDB[a]().movil && entidesMonogoDB[a]().movil.crear){
                                if(entidesMonogoDB[a]().movil.espejo && entidesMonogoDB[a]().movil.sql){
                                }else{
                                res[entidesMonogoDB[a]().coleccion+"Drop"]= entidesMonogoDB.getScriptsDropTables(entidesMonogoDB[a]());
                                }
                            }


                        return res;
                    },{});



};
OracleMongo.prototype.getTablasScriptUniqueKey = function(){
    var tablasEspejo = [];
    var index = 1;
    return Object.getOwnPropertyNames( EntidadesMongoOracle.prototype ).reduce(function(res, a){
                            if(a.indexOf("getJson")>=0 && entidesMonogoDB[a]() && entidesMonogoDB[a]().movil && entidesMonogoDB[a]().movil.crear){
                                if(entidesMonogoDB[a]().movil.espejo && entidesMonogoDB[a]().movil.sql){
                                }else{

                                    res[entidesMonogoDB[a]().coleccion+"UniqueKey"]= entidesMonogoDB.getScriptsUniqueKeys(entidesMonogoDB[a](), index);
                                    index ++;
                                }
                            }


                        return res;
                    },{});



};

OracleMongo.prototype.getDispositivosYaSincronizados = function(coleccion, perfil){
    var deferred = Q.defer();
    var padre = this;
    var busqueda = {perfil:parseInt(perfil),"sincronizar.dispositivos":{"$exists":true}};
     if(coleccion,padre.isColeccionesTipoDiccionario(coleccion).length>0){
        delete busqueda["perfil"];
     }
    var dispositivosEncontrados = [];
    var dispositivosEncontradosUnicos = [];
    mongodb.getRegistrosCustomColumnas(coleccion, busqueda, {_id:0,"sincronizar.dispositivos":1}, function(respuesta){
           console.log("getDispositivosYaSincronizados",respuesta)
           
           if(Array.isArray(respuesta)){
                dispositivosEncontrados = respuesta.reduce(function(array_, elemento){
                    if(Array.isArray(elemento.sincronizar.dispositivos)){
                       array_ =  array_.concat(elemento.sincronizar.dispositivos)
                    }
                    return array_;
                },[])
                console.log("getDispositivosYaSincronizados dispositivosEncontrados",dispositivosEncontrados)
                dispositivosEncontrados.filter(function(b){
                    if(dispositivosEncontradosUnicos.indexOf(b) === -1){
                        dispositivosEncontradosUnicos.push(b);
                    }
                     
                })
                 console.log("getDispositivosYaSincronizados dispositivosEncontrados",dispositivosEncontradosUnicos)
               deferred.resolve(dispositivosEncontrados)
           }else{
               deferred.resolve([]);
           }
    });
     return deferred.promise;
};
//Para entregar al restful
OracleMongo.prototype.getDatosDinamicamenteDeInicio = function(coleccion, perfil, index, callBack){
    var parametros = {index: parseInt(index)};
    if(perfil){
        parametros.perfil=perfil;
    }
    mongodb.getRegistroCustomColumnas(coleccion, parametros, {registros:1,_id:0}, function(respuesta){
            callBack(respuesta);
    });
    
};

OracleMongo.prototype.elimiarTodosLosCambiosPorSincronizarPorPerfil = function(coleccion, perfil, codigo){
    var deferred = Q.defer();
    var parmetrosBusqueda = {"sincronizar.codigo":parseInt(codigo)}
    if(perfil){
        parmetrosBusqueda["perfil"] = parseInt(perfil)
    }
        mongodb.modificar(coleccion, parmetrosBusqueda,{$unset:{sincronizar:""}},function(r){
            console.log("elimiarTodosLosCambiosPorSincronizarPorPerfil",r.result);
            deferred.resolve(r);
        });
    return deferred.promise;
}

OracleMongo.prototype.agregarDispositivoSincronizadoPorPerfil = function(coleccion, perfil, codigo, dispositivo){
    var deferred = Q.defer();
    var parmetrosBusqueda = {"sincronizar.codigo":parseInt(codigo)}
    if(perfil){
        parmetrosBusqueda["perfil"] = parseInt(perfil)
    }
    mongodb.modificar(coleccion, parmetrosBusqueda,{$addToSet:{"sincronizar.dispositivos":dispositivo}},function(r){
            console.log("agregarDispositivoSincronizadoPorPerfil",r.result);
            deferred.resolve(r);
    });
    return deferred.promise;
}

OracleMongo.prototype.getTodosLosCambiosPorSincronizarPorPerfil = function(arrayPerfiles, url){
    var deferred = Q.defer();
    var resultados = [];
    var padre =this;
	//console.log("getTodosLosCambiosPorSincronizarPorPerfil inicio");
    entidesMonogoDB.getColecciones().forEach(function(c){
        if(c.coleccion,padre.isColeccionesTipoDiccionario(c.coleccion).length>0){
            resultados.push(getDatosDinamicamenteParaActualizar(c.coleccion,c.tabla, null, null, {index:1,perfil:1}));
        }else{
            resultados.push(getDatosDinamicamenteParaActualizar(c.coleccion,c.tabla, arrayPerfiles, null, {index:1,perfil:1}));
        }
        
    });
    Q.all(resultados).then(function(res){
		if(Array.isArray(res)){
            res = res.filter(function(r){
                if(r.urls && Array.isArray(r.urls) && r.urls.length>0){
                    r.urls = r.urls.reduce(function(nuevo, z){
                        var newUrl = url.replace(":coleccion",r.coleccion).replace(":index",z.index);
                        if(nuevo[z.perfil ?z.perfil:"NOPERFIL" ] && Array.isArray(nuevo[z.perfil ?z.perfil:"NOPERFIL"])){
                            if(nuevo[z.perfil ?z.perfil:"NOPERFIL"].indexOf(newUrl)<0){
                                nuevo[z.perfil ?z.perfil:"NOPERFIL"].push(newUrl);
                            }
                        }else{
                            nuevo[z.perfil ?z.perfil:"NOPERFIL"] = [newUrl];
                        }
                       // nuevo.push(url.replace(":coleccion",r.coleccion).replace(":index",z.index));
                        return nuevo;
                    },{});
                    return true;
                }else{
                   return false;

                }
            });
        }
        deferred.resolve(res);
    },function(c){
		
		 deferred.reject(c);
	});
    return deferred.promise;
};

OracleMongo.prototype.getDatosPorSincronizarPorPerfilIndex = function(coleccion, arrayPerfiles, index){
    var deferred = Q.defer();
    getDatosDinamicamenteParaActualizar(coleccion, null, arrayPerfiles, index, {sincronizar:1,_id:0}).then(function(res){
       deferred.resolve(res);
    });
    return deferred.promise;
};

function getDatosDinamicamenteParaActualizar(coleccion, tabla, arrayPerfiles, index, mostrarColumnas){
    var deferred = Q.defer();
    var parametros ={};
    if(arrayPerfiles && Array.isArray(arrayPerfiles) && arrayPerfiles.length>0){ //Importante el arrayPerfiles
        parametros.perfil={ "$in" :arrayPerfiles};
    }
    if(index){
        parametros.index=index;
    }
	parametros["$or"]=[];
    parametros["$or"].push({"sincronizar.agregar":{"$gt":{$size:0}}});
	parametros["$or"].push({"sincronizar.eliminar":{"$gt":{$size:0}}});
    if(!mostrarColumnas){
        mostrarColumnas = {};
    }
    mostrarColumnas._id=0;
    mongodb.getRegistrosCustomColumnas(coleccion, parametros, mostrarColumnas, function(respuesta){
            if(mostrarColumnas.index){
	            deferred.resolve({coleccion:coleccion,tabla:tabla,urls:respuesta,perfiles:respuesta});
            }else{
				if(parametros.index){
					deferred.resolve(respuesta);
				}else{
					deferred.resolve([]);
				}
			}
            

    });
    return deferred.promise;
}
OracleMongo.prototype.llamarProcedimiento = function(nombre, parametros){
    var deferred = Q.defer();
    oracledb.llamarProcedimiento(nombre, parametros,function(r){
        deferred.resolve(r)
    });
    return deferred.promise;
}
var procedimientos_oracle = {
    pedidos:"cargarpedido(:pvcodret,:pvmsret)",
    recibos:"cargarrecibo(:pvcodret,:pvmsret)"
}
//Para entregar al restful
OracleMongo.prototype.setDatosDinamicamente = function(tabla, datos, datosperfil, callBack){
       var padre=this;
        coleccion = entidesMonogoDB.getColecciones().filter(function(c){
                if(c.tabla === tabla){
                    return true;
                }
        });
        var documento = {registroMovil : datos, perfil : datosperfil.perfil, empresa:datosperfil.empresa};
        mongodb.grabarRegistrosDesdeMovil(coleccion[0].coleccion, documento).then(function(r){
            oracledb.grabarNestedJson(datos, tabla).then(function(r){
				if(r){
                    //Llamar procedimiento almacenado
                    oracledb.llamarProcedimiento(procedimientos_oracle.pedidos,{pvcodret:"out",pvmsret:"out"},function(r){
                        console.log(r);
                       if(r && r.outBinds && r.outBinds.pvmsret){
                            var ids = r.outBinds.pvmsret.split(",");
                            for(var i =0;i<ids.length;i++){
                                if(!isNaN(ids[i])){
                                    procesarOrdenEnProduccionSwisSystem(ids[i], "nada por el momento").then(function(orden){
                                         console.log(orden);
                                    })
                                    client.sadd(['ordenes', ids[i]], function(err, reply) {
                                        console.log("Orden en momoria");
                                    });
                                    padre.revisarEstadosDeOrdenesEnviadasDesdeMovil();
                                }
                            }
                        }
                    });
                    //Llamar procedimiento almacenado
                    oracledb.llamarProcedimiento(procedimientos_oracle.recibos,{pvcodret:"out",pvmsret:"out"},function(r){
                        console.log("llamarProcedimiento",r);
                        if(r && r.outBinds && r.outBinds.pvmsret){
                              console.log("Si entron");
                            var ids = r.outBinds.pvmsret.split(",");
                            console.log("Si entron",ids);
                            for(var i =0;i<ids.length;i++){
                                if(!isNaN(ids[i])){
                                    console.log("Si entron",ids[i]);
                                    enviarEmail(ids[i], "nada por el momento").then(function(email){
                                        console.log(email);
                                    },function(x){
                                         console.log(x);
                                    });
                                }else{
                                     console.log("No se envio entron",ids);
                                }
                            }
                        }else{
                            console.log("No entro ");
                        }
                    });
                     
                    
                    
                    
                }
                callBack(r);
            },function(r){
                console.log("listo no  grabarJson ",r);
                callBack(r);
            });
        },function(x){
            callBack(x);
        });


};
var tokens = {}
OracleMongo.prototype.setToken = function(perfil, token){
    tokens[perfil] =token;
}


OracleMongo.prototype.getTokens = function(){
    return tokens;
}
OracleMongo.prototype.getUrlsPorPefil = function(identificacion, perfil, urlPorPefil, urlDiccionario, urlRecpcion, callBack){
    getTotalesParcialesPorPerifil(0, entidesMonogoDB.getColeccionesParaSincronzar(), identificacion, perfil, function(nuevaColeccion){
        nuevaColeccionA = nuevaColeccion.map(function(col){
            if(col.diccionario){
                url = urlDiccionario.replace(":coleccion", col.coleccion);
            }else{
                url = urlPorPefil.replace(":coleccion", col.coleccion).replace(":perfil", perfil);
            }
            col.recepcion = urlRecpcion.replace(":tabla", col.tabla);
            col.urls = col.indices.map(function(indice){
                return url.replace(":index", indice.index);
            });
            delete col.indices;
            return col;
        });
        callBack(nuevaColeccionA);
    });
};
var creandoA= false;
OracleMongo.prototype.crearColecciones = function(borrar){
	grabarSinValidarExistencia = borrar;
    console.log(grabarSinValidarExistencia, borrar)
	var deferred = Q.defer();
    
    //1. Crear perfiles
    var padre = this;
        padre.crearPerfiles(borrar).
        then(function(r){
			console.log("crearPerfiles ok");
            padre.crearColeccionesMongo(borrar, [entidesMonogoDB.getJsonEstablecimientos()]).then(function(a){
                //deferred.reject("salir");
				console.log("getJsonEstablecimientos ok");
				padre.crearColeccionesMongo(borrar, [entidesMonogoDB.getJsonEstadoDeCuenta()]).then(function(a1){
					console.log("getJsonEstadoDeCuenta ok ");
					padre.crearColeccionesMongo(borrar, [entidesMonogoDB.getJsonItems()]).then(function(a){
						console.log("getJsonItems ok");
						padre.crearColeccionesMongo(borrar, [entidesMonogoDB.getJsonPromocionVenta()]).then(function(a){
							console.log("getJsonPromocionVenta ok");
							padre.crearColeccionesMongo(borrar, [entidesMonogoDB.getJsonCruce()]).then(function(a){
								 console.log("getJsonCruce ok");
								 padre.crearDiccionarios(borrar).then(function(t){
                                       console.log("crearDiccionarios ok **************************");
									   deferred.resolve(t);
								 });
							},function(x4){
								console.log("Fin por favor iniciar nuevamente getJsonCruce",x4);
								deferred.reject(x4);
							});
						},function(x3){
							console.log("Fin por favor iniciar nuevamente getJsonPromocionVenta",x3);
							deferred.reject(x3);
						});
					},function(x2){
						console.log("Fin por favor iniciar nuevamente getJsonItems",x2);
						deferred.reject(x2);
					});
				},function(x1){
					console.log("Fin por favor iniciar nuevamente getJsonEstadoDeCuenta",x1);
					deferred.reject(x1);
				});
            },function(x){
				console.log("Fin por favor iniciar nuevamente getJsonEstablecimientos",x);
				deferred.reject(x);
			});

            //padre.crearEstadoCuenta(borrar);
        },function(error){
            console.log("Fin por favor iniciar nuevamente",error);
			deferred.reject(error);
        });
    
	return deferred.promise;
};

/**
    FUNCION QUE PERMITE CREAR UN CRON DE LA SIGUIENTE TAREA:
    crearColecciones(), CREA TODAS LAS COLECCIONES,
    PRIMERO HACE UN DROP Y LAS VUELVE A INSERTAR
    ESTA FUNCION ES LLAMAD A EN EL ARCHIVO APP.JS
*/
OracleMongo.prototype.crearTareas = function(){
    var rule2 = new schedule.RecurrenceRule();
    rule2.dayOfWeek = [0,1,2,3,4,5,6]; //Corre todos los dias
    rule2.hour = 20;//4 de la mañana
    rule2.minute = 07;//Con 06 minutos
    /*var j = schedule.scheduleJob('*5 * * * * *', function(){
        Entre *5, fala un /
            console.log("Hola "+new Date());
    });*/
    var padre = this;
    var j = schedule.scheduleJob(rule2, function(){
            padre.crearColecciones(true);
    });
};

OracleMongo.prototype.getTotalRegistrosPorIdentificacion = function(identificacion){
    return mongodb.getTotalRegistrosPorPerfiles(entidesMonogoDB.getColecciones(),{identificacion:identificacion});
     
};
OracleMongo.prototype.getTotalRegistrosPorPerfil = function(perfil, nuevoResultado){
    var deferred = Q.defer();
    var padre = this;
    this.getIdentificacion(perfil).then(function(identificacion){
        mongodb.getTotalRegistrosPorPerfiles(entidesMonogoDB.getColecciones(),{identificacion:identificacion}).then(function(datos){
            deferred.resolve({perfil:perfil,datos:datos,nuevoResultado:nuevoResultado});
        },function(x){
        deferred.reject(false);
        });
    },function(x){
        deferred.reject(false);
    })
    return deferred.promise;
};

OracleMongo.prototype.validarExistenciaPerfilMobil = function(){
    return entidesMonogoDB.getJsonPerfiles().validarExistenciaPerfilMobil;
};

OracleMongo.prototype.isColeccionesTipoDiccionario = function(coleccion){
    
    return entidesMonogoDB.isColeccionesTipoDiccionario(coleccion);
};

OracleMongo.prototype.testItems = function(){

    oracledb.getPoolClienteConexion("select * from SWISSMOVI.emovtitem WHERE CODIGO='44030028'", [] , false, function(respuestaora){
        //for(i in respuestaora){
            //if(respuestaora[0].CODIGO =="44030028"){
                        console.log(respuestaora);
            //}
        //    }
        //}

});
};
function buscarEstadoPorOrden(orden){
    var deferred = Q.defer();
    oracledb.getPoolClienteConexion(sqlEstadosFactura, [orden] , false, function(respuestaora){
                    if(respuestaora.rows && respuestaora.rows.length>0){
                        if(respuestaora.rows[0].ESTADO_EDI === "A"){
                            deferred.resolve({orden:orden,estado:"EA",perfil:respuestaora.rows[0].MPERFIL_ID});
                        }else{
                            if(respuestaora.rows[0].ESTADO_EDI){
                                deferred.resolve({orden:orden, estado:"E"+respuestaora.rows[0].ESTADO_EDI,perfil:respuestaora.rows[0].MPERFIL_ID, dispositivo:respuestaora.rows[0].DISPOSITIVO, idmovil:respuestaora.rows[0].IDMOVIL });
                            }else{
                                
                                 deferred.resolve({orden:orden, estado:"F"+respuestaora.rows[0].ESTADO,perfil:respuestaora.rows[0].MPERFIL_ID, dispositivo:respuestaora.rows[0].DISPOSITIVO, idmovil:respuestaora.rows[0].IDMOVIL});
                            }
                        }
                        
                    }else{
                        oracledb.getPoolClienteConexion(sqlEstadosOrden, [orden] , false, function(respuestaora){
                                if(respuestaora.rows && respuestaora.rows.length>0){
                                            deferred.resolve({orden:orden, estado:"O"+respuestaora.rows[0].ESTADO,perfil:respuestaora.rows[0].MPERFIL_ID, dispositivo:respuestaora.rows[0].DISPOSITIVO, idmovil:respuestaora.rows[0].IDMOVIL});
                                }else{
                                        console.log("No se eocntro el estado ",orden,sqlEstadosOrden,respuestaora);
                                        deferred.resolve({orden:orden, estado:"XX"});
                                }
                        });
                    }
            });
    return deferred.promise;
}

function notificarEstadosAlMovil(conexion, sokectId, perfil, estado, idmovil, tabla, callback){
   
    conexion.to(sokectId).emit('actualizar:estados',{amodificar:{estado:estado}, parametros:{id:idmovil},tabla:tabla});
    callback(true)
    
}
OracleMongo.prototype.socketEmit = function(conexion, perfil,emit, dato, callback){
    conexion.to(perfil).emit(emit,dato);
    callback(true)
    
}

OracleMongo.prototype.revisarEstadosDeOrdenesEnviadasDesdeMovil = function(conexion, dispositivosConectados){
    client.smembers('ordenes', function(err, ordenes) {
        if(!err){
            console.log(ordenes)
            if(Array.isArray(ordenes)){
                ordenes.forEach(function(orden){
                    buscarEstadoPorOrden(orden).then(function(res){
                        if(res.estado === "XX"){
                             console.log("NNO SE ENCONTRO ",res);
                           return ; 
                        }
                        console.log("buscarEstadoPorOrden", res);
                        if(res.estado === "EA"){
                           client.srem('ordenes',res.orden, function(err, estado) {
                               console.log("Eliminada de sets en redis ",res.orden,estado);
                           });
                            
                            //notificar al mobil
                        }else{
                            //Verficar si ya esxiste el estado
                            client.hget('orden::estado',res.orden, function(err, estado) {
                                console.log("err",err)
                                console.log("estado",estado)
                                if(estado !== res.estado){
                                    client.hmset('orden::estado',res.orden,res.estado , function(err, reply) {
                                        console.log("Orden en hmset", reply);
                                        //Notifica al mobil
                                    });
                                }
                            });

                        }
                        
                        
                        if(res.dispositivo && dispositivosConectados && dispositivosConectados[res.perfil] && dispositivosConectados[res.perfil][res.dispositivo]){
                            notificarEstadosAlMovil(conexion, dispositivosConectados[res.perfil][res.dispositivo], res.perfil, res.estado, res.idmovil, "emovtorden",function(estado){
                            console.log("notificarEstadosAlMovil",estado)
                            });
                        }else{
                            console.log("no se notificara puede ser por el perfil o dispositivo", dispositivosConectados, dispositivosConectados[res.perfil],res.dispositivo )
                        }
                        

                        
                    });
                });   
            }
            
            
        }
        
    });
       
};



function getTotalesParcialesPorPerifil(index, colecciones, identificacion, perfil, callBack){
    if(index < colecciones.length){

        var parametros = {};
        if(!colecciones[index].diccionario){
            parametros.identificacion = identificacion;
            parametros.perfil = perfil;
        }
        mongodb.getRegistrosCustomColumnas(colecciones[index].coleccion, parametros, {index:1,_id:0}, function(respuesta){
                colecciones[index].indices = respuesta;
                index = index +1;
                getTotalesParcialesPorPerifil(index, colecciones, identificacion, perfil, callBack);
        });
    }else{
        callBack(colecciones);
    }
}

//Scripts ****************************************************************/
function getSriptTablaDesdeUnSql(index, sqls, callBack){
    if(index < sqls.length){
        oracledb.getPoolClienteConexion(sqls[index].sql, [], false, function(respuestaora){
            if(respuestaora && respuestaora.metaData){
                sqls[index].campos = respuestaora.metaData.reduce(function(nuevasColumnas, columna){
                                        if (columna.name != "ID"){
                                            nuevasColumnas.push(columna.name.toLowerCase());
                                    }
                                    return nuevasColumnas;
                                },[]);


            }

            index +=1;
            getSriptTablaDesdeUnSql(index, sqls, callBack);
         });
    }else{
        callBack(sqls);
    }
}


function enviarEmail(precartera, extras){
    console.log("enviarEmail",precartera);
    var deferred = Q.defer();
    var mensaje = "Estimado #NOMBRE, agradecemos el pago de $ #PAGO, realizado a través de nuestro funcionario(#NOMBRES) el día #FECHA";
    var mensajeError = "Estimados, no se encontraron datos con la siguiente cartera #precartera, por tal motivo no se ha enviado el email.<hr><br> Errores:#extras";
    
    oracledb.getPoolClienteConexion(sqlSumaCartera, [precartera], false, function(respuestaora){
        if(respuestaora && respuestaora.rows &&  respuestaora.rows.length > 0  && respuestaora.rows[0].PAGO>0){
            mailOptions.from = '"Ecuaquimica recibos de pago" <eq-ecuaquimica@ecuaquimica.com.ec>';// sender address
            console.log(respuestaora.rows[0]);
            //EMAILRECAUDACION
            
            mailOptions.to  = 'fblanco@gmail.com, ohnores@hotmail.com,dchavez@ecuaquimica.com.ec,ohonores@ecuaquimica.com.ec,paguilera@ecuaquimica.com.ec';
            mailOptions.subject  = "Ecuaquimica recibo de pago #PREIMPRESO".replace("#PREIMPRESO",respuestaora.rows[0].PREIMPRESO);
            mailOptions.html  = mensaje.replace("#PAGO", parseFloat(respuestaora.rows[0].PAGO).toFixed(2)).replace("#FECHA",new Date().toString().split("GMT-0500")[0]).replace("#NOMBRES",respuestaora.rows[0].NOMBRES).replace("#NOMBRE",respuestaora.rows[0].NOMBRE);
            // send mail with defined transport object
            transporter.sendMail(mailOptions, function(error, info){
                if(error){
                    deferred.reject(error);
                }else{
                    deferred.resolve(info.response)
                }
                
                
            });
        }else{
            
            mailOptions.to  = 'fblanco@gmail.com, ohnores@hotmail.com,dchavez@ecuaquimica.com.ec,ohonores@ecuaquimica.com.ec,paguilera@ecuaquimica.com.ec';
            mailOptions.subject  = "ECUAQUIMICA -- RECIBO DE PAGO ERROR AL ENVIAR EL EMAIL";
            mailOptions.html  = mensajeError.replace("#precartera",precartera).replace("#extras",extras);
            // send mail with defined transport object
            transporter.sendMail(mailOptions, function(error, info){
                if(error){
                    deferred.reject(error);
                }else{
                    deferred.resolve(info.response)
                }
                
                
            });
            
            deferred.reject("No se enontraron datos con la precartera id",precartera); 
        }
        console.log(respuestaora);
    });
    return deferred.promise;
}

function procesarOrdenEnProduccionSwisSystem(orden, extras){
    console.log("procesarOrdenEnProduccionSwisSystem",orden);
    var deferred = Q.defer();
    var mensaje = "Estimados, se envió a procesar la orden #ORDEN, mensaje recibido por parte de SwisSystem #mensaje día #FECHA <br><br> #ERRORES";
    var mensajeError = "Estimados, se envió a procesar la orden #ORDEN, pero no se encontró el usuario. <br>#FECHA";
     
    oracledb.getPoolClienteConexion(sqlObtenerUsuario, [orden], false, function(respuestaora){
        if(respuestaora && respuestaora.rows &&  respuestaora.rows.length > 0  && respuestaora.rows[0].USUARIO_ID){
            mailOptions.from =  '"Ecuaquimica, toma de pedido movil" <eq-ecuaquimica@ecuaquimica.com.ec>'; // sender address
            request.get({
                url: servicio.replace("#ORDEN", orden).replace("#USUARIO_ID", respuestaora.rows[0].USUARIO_ID)
                //headers:headers
            }, function(error, response, body){
                mailOptions.to  = 'fblanco@gmail.com, ohonores@hotmail.com,dchavez@ecuaquimica.com.ec,ohonores@ecuaquimica.com.ec,paguilera@ecuaquimica.com.ec';
                mailOptions.subject  = "ECUAQUIMICA -- PROCESO DE ORDEN # "+orden;
                mailOptions.html  = mensaje.replace("#mensaje",body ? body:"").replace("#ORDEN",orden).replace("#FECHA",new Date().toString().split("GMT-0500")[0]).replace("#ERRORES",error ? "Error al llamar el servico::<br>"+error : "");
                transporter.sendMail(mailOptions, function(error, info){
                    if(error){
                        deferred.reject(error);
                    }else{
                        deferred.resolve(info.response)
                    }


                });
            });

            sqlObtenerUsuario.replace("#ORDEN", orden).replace("#USUARIO_ID",respuestaora.rows[0].USUARIO_ID)
            
        }else{
            
            mailOptions.to  = 'fblanco@gmail.com, ohonores@hotmail.com,dchavez@ecuaquimica.com.ec,ohonores@ecuaquimica.com.ec,paguilera@ecuaquimica.com.ec';
            mailOptions.subject  = "ECUAQUIMICA -- RECIBO DE PAGO ERROR AL ENVIAR EL EMAIL";
            mailOptions.html  = mensajeError.replace("#ORDEN",orden).replace("#FECHA",new Date().toString().split("GMT-0500")[0]);
            // send mail with defined transport object
            transporter.sendMail(mailOptions, function(error, info){
                if(error){
                    deferred.reject(error);
                }else{
                    deferred.resolve(info.response)
                }
                
                
            });
            
            deferred.reject("No se enontraron datos con la orden id",orden); 
        }
        console.log(respuestaora);
    });
    return deferred.promise;
}


module.exports = OracleMongo;
