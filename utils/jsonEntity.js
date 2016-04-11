var scritpA = "CREATE TABLE IF NOT EXISTS #TABLA (id integer primary key, #COLUMNAS)";
var scritpB = "PRAGMA foreign_keys = ON;";
var tipoDato = "TEXT"
var EntidadesMongoOracle = function(){

}
EntidadesMongoOracle.prototype.getJsonPerfiles = function(){
    return {
                    coleccion:"emcperfiles",
                    sqlOrigen:"SELECT * FROM  SWISSMOVI.EMOVTPERFIL ORDER BY ID ASC",
                    movil:{tabla:"emovtperfil", crear:true},
                    registroMongo:{
                                registroMovil:{
                                    identificacion:"IDENTIFICACION",
                                    infoEmpresa:{empresa_id:"EMPRESA_ID",empresa_descripcion:"EMPRESA_DESCRIPCION"},
                                    infoPerfil:{vendedor_id:"VENDEDOR_ID",
                                                usuario_id:"USUARIO_ID",
                                                nombres:"NOMBRES",
                                                codigo:"CODIGO",
                                                mbodega_id:"MBODEGA_ID",
                                                division_id:"DIVISION_ID",
                                                avanceventa:"AVANCEVENTA",
                                                avancecobro:"AVANCECOBRO",
                                                avanceventacomision:"AVANCEVENTACOMISION",
                                                avancecobrodivision:"AVANCECOBRODIVISION"
                                            },
                                    dispositivo:"",
                                    token:""
                                },
                                registroInterno:{
                                    perfil:"ID",
                                    dispositivos:[]
                                }

                        }
                    };
};
EntidadesMongoOracle.prototype.getJsonEstablecimientos = function(){
    return {
                    coleccion:"emcperfilestablecimientos",
                    diccionario:false,
                    movil:{tabla:"emovtperfil_establecimiento", crear:true},
                    sqlOrigen:"SELECT * FROM (SELECT * FROM SWISSMOVI.EMOVTPERFIL_ESTABLECIMIENTO  WHERE MPERFIL_ID =:ID ORDER BY ID ASC) PE WHERE  PE.ID>:A AND ROWNUM<=:B",
                    parametrosBusqueda:["registroInterno.perfil"],
                    parametrosBusquedaValores:[], //Este array indica que se utilizaran paraemtros como el A que es id de donde empezara a leer y B que es la cantidad de registros a traer
                    registroMongo:{
                        registroMovil:{
                            establecimiento_id:"ESTABLECIMIENTO_ID",
                            establecimientoTipoPago_id:"MESTABLECIMIENTOTIPOPAGO_ID",
                            codigoEstablecimiento:"CODIGO",
                            infoEstablecimiento:{
                                perfilEstablecimiento_id:"ID",
                                nombre:"NOMBRE",
                                tipo_establecimiento:"TIPO_IDENTIFICACION",
                                identificacion:"IDENTIFICACION",
                                direccion:"DIRECCION",
                                telefono:"TELEFONO",
                                email:"EMAIL",
                                emailrecaudacion:"EMAILRECAUDACION",
                                emailfacturacion:"EMAILFACTURACION",
                                tiponegocio_id:"TIPONEGOCIO_ID",
                                fechalicencia:"FECHALICENCIA",
                                fechavisita:"FECHAVISITA",
                                vencido:"VENCIDO"
                            },
                            tipoPago:"",
                            arrayJson:{
                                sqlOrigen:"SELECT TPD.* FROM SWISSMOVI.EMOVTESTABLECIMIENTO_TIPO_PAGO JOIN EMOVVTIPO_PAGO_DETALLE TPD ON TPD.TIPOPAGODETALLE_ID = MTIPOPAGODETALLE_ID  WHERE MPERFILESTABLECIMIENTO_ID =:ID",
                                parametrosBusqueda:["registroInterno.perfilEstablecimiento"],
                                parametrosBusquedaValores:[],//Este array indica que se utilizaran paraemtros como el A que es id de donde empezara a leer y B que es la cantidad de registros a traer
                                etiqueta:"tipoPago",
                                registroMovil:{
                                    tipopagodetalle_id:"TIPOPAGODETALLE_ID",
                                    descripcion:"DESCRIPCION",
                                    diasini:"DIASINI",
                                    diasini:"DIASINI",
                                    descuentofactura:"DESCUENTOFACTURA",
                                    financiamiento:"FINANCIAMIENTO",
                                    lineanegocio:"LINEA_NEGOCIO_ID"
                                }

                            }
                        },
                        registroInterno:{
                            perfilEstablecimiento:"ID",

                        }
                        }
                    };
};
EntidadesMongoOracle.prototype.getJsonDiccionarioBanco = function(){
    return {
                    coleccion:"emcdiccionarios",
                    diccionario:true,
                    movil:{tabla:"emovtdiccionarios", crear:true},
                    sqlOrigen:"SELECT * FROM (SELECT * FROM SWISSMOVI.EMOVVBANCO ORDER BY ID ASC) PE WHERE  PE.ID>:A AND ROWNUM<=:B",
                    parametrosBusquedaValores:[],//Este array indica que se utilizaran paraemtros como el A que es id de donde empezara a leer y B que es la cantidad de registros a traer
                    registroMongo:{
                        registroMovil:{
                            codigo:"*BAN",//El * significa que no sera buscado en el array origen y conservara su valor, pero se reemplazar el * por vacio
                            infoDiccionario:{
                                id:"ID",
                                codigo:"CODIGO",
                                descripcion:"DESCRIPCION"
                            },
                        }

                        }
                    };
};
EntidadesMongoOracle.prototype.getJsonDiccionarioCuentaBancaria = function(){
    return {
                    coleccion:"emcdiccionarios",
                    movil:{tabla:"emovtdiccionarios", crear:true},
                    sqlOrigen:"SELECT * FROM (SELECT * FROM SWISSMOVI.EMOVVCUENTA_BANCARIA ORDER BY ID ASC) PE WHERE  PE.ID>:A AND ROWNUM<=:B",
                    parametrosBusquedaValores:[],//Este array indica que se utilizaran paraemtros como el A que es id de donde empezara a leer y B que es la cantidad de registros a traer
                    registroMongo:{
                        registroMovil:{
                            codigo:"*CBA",//El * significa que no sera buscado en el array origen y conservara su valor, pero se reemplazar el * por vacio
                            infoDiccionario:{
                                id:"ID",
                                empresa_id:"EMPRESA_ID",
                                numero_cuenta:"NUMERO_CUENTA",
                                descripcion:"DESCRIPCION",
                            },
                        },

                        }
                    };
};
EntidadesMongoOracle.prototype.getJsonDiccionarioDocumento = function(){
    return {
                    coleccion:"emcdiccionarios",
                    movil:{tabla:"emovtdiccionarios", crear:true},
                    sqlOrigen:"SELECT * FROM (SELECT * FROM SWISSMOVI.EMOVVDOCUMENTO ORDER BY ID ASC)  PE WHERE  PE.ID>:A AND ROWNUM<=:B",
                    parametrosBusquedaValores:[],//Este array indica que se utilizaran paraemtros como el A que es id de donde empezara a leer y B que es la cantidad de registros a traer
                    registroMongo:{
                        registroMovil:{
                            codigo:"*DOC",//El * significa que no sera buscado en el array origen y conservara su valor, pero se reemplazar el * por vacio
                            infoDiccionario:{
                                id:"ID",
                                codigo:"CODIGO",
                                descripcion:"DESCRIPCION",
                                retencion:"RETENCION",
                                formaPago:"",
                                arrayJson:{
                                    sqlOrigen:"SELECT * FROM SWISSMOVI.EMOVVFORMA_PAGO",
                                    parametrosBusquedaValores:[],//Este array indica que se utilizaran paraemtros como el A que es id de donde empezara a leer y B que es la cantidad de registros a traer
                                    etiqueta:"formaPago",
                                    registroMovil:{
                                        id:"ID",
                                        codigo:"CODIGO",
                                        descripcion:"DESCRIPCION",
                                        tipo:"TIPO"
                                    }

                                }
                            }
                        }

                        }
                    };
};
EntidadesMongoOracle.prototype.getJsonDiccionarioBodegaVenta = function(){
    return {
                    coleccion:"emcdiccionarios",
                    movil:{tabla:"emovtdiccionarios", crear:true},
                    sqlOrigen:"SELECT * FROM (SELECT * FROM SWISSMOVI.EMOVVBODEGA ORDER BY ID ASC) PE WHERE  PE.ID>:A AND ROWNUM<=:B",
                    parametrosBusquedaValores:[],//Este array indica que se utilizaran paraemtros como el A que es id de donde empezara a leer y B que es la cantidad de registros a traer
                    registroMongo:{
                        registroMovil:{
                            codigo:"*BOD",//El * significa que no sera buscado en el array origen y conservara su valor, pero se reemplazar el * por vacio
                            infoDiccionario:{
                                id:"ID",
                                codigo:"CODIGO",
                                descripcion:"DESCRIPCION",
                                tipo:"TIPO",
                                establecimiento_id:"ESTABLECIMIENTO_ID",
                                vendedor_id:"VENDEDOR_ID"
                            },
                        }

                        }
                    };
};
EntidadesMongoOracle.prototype.getJsonEstadoDeCuenta = function(){
    return {
                    coleccion:"emcestadodecuenta",
                    diccionario:false,
                    movil:{tabla:"emovtestadoscuenta", crear:true},
                    sqlOrigen:"SELECT * FROM (SELECT EC.* FROM SWISSMOVI.EMOVTESTADO_CUENTA EC JOIN SWISSMOVI.EMOVTPERFIL_ESTABLECIMIENTO PE  ON PE.ID=EC.MPERFILESTABLECIMIENTO_ID WHERE PE.MPERFIL_ID=:ID) PA WHERE  PA.ID>:A AND ROWNUM<=:B",
                    parametrosBusqueda:["registroInterno.perfil"],
                    parametrosBusquedaValores:[],//Este array indica que se utilizaran paraemtros como el A que es id de donde empezara a leer y B que es la cantidad de registros a traer
                    registroMongo:{
                        registroMovil:{
                            perfilEstablecimiento_id:"MPERFILESTABLECIMIENTO_ID",
                            codigoTipoDocumento:"TIPODOCUMENTO",
                            preimpreso:"PREIMPRESO",
                            fechaCartera:"FECHACARTERA",
                            fechaVencimiento:"FECHAVENCIMIENTO",
                            retencioniva:"RETENCIONIVA",
                            retencionfuente:"RETENCIONFUENTE",
                            infoDetalleDebito:{
                                valor:"VALOR",
                                saldo:"SALDO",
                                escartera:"ESCARTERA"
                            },
                        },
                        registroInterno:{
                            emovtestadocuenta:"ID"

                        }

                        }
                    };
};

EntidadesMongoOracle.prototype.getJsonItems = function(){
    return {
                    coleccion:"emcitems",
                    diccionario:true,
                    movil:{tabla:"emovtitems", crear:true},
                    sqlOrigen:"SELECT * FROM (SELECT * FROM SWISSMOVI.EMOVTITEM ORDER BY ID ASC)  PE WHERE  PE.ID>:A AND ROWNUM<=:B",
                    parametrosBusquedaValores:[],//Este array indica que se utilizaran paraemtros como el A que es id de donde empezara a leer y B que es la cantidad de registros a traer
                    registroMongo:{
                        registroMovil:{
                            empresa_id:"EMPRESA_ID",
                            codigoItem:"CODIGO",
                            infoItem:{
                                descripcion:"DESCRIPCION",
                                precio:"PRECIO",
                                descuento:"DESCUENTO",
                                impuestos:{impuesto1:"IMPUESTO1",impuesto2:"IMPUESTO2",impuesto3:"IMPUESTO3"},
                                permitecambioprecio:"PERMITECAMBIOPRECIO",
                                controlado:"CONTRALADO",
                                lineanegocio:"LINEA_NEGOCIO_ID"
                            },
                            infStock:"",
                            arrayJson:{
                                sqlOrigen:"SELECT S.*, B.DESCRIPCION FROM SWISSMOVI.EMOVTSTOCK S JOIN SWISSMOVI.EMOVVBODEGA B ON S.MBODEGA_ID = B.ID WHERE MITEM_ID =:ID",
                                parametrosBusqueda:["registroInterno.emovtitem"],
                                parametrosBusquedaValores:[],//Este array indica que se utilizaran paraemtros como el A que es id de donde empezara a leer y B que es la cantidad de registros a traer
                                etiqueta:"infStock",
                                registroMovil:{
                                    id:"ID",
                                    cantidad:"CANTIDAD",
                                    bodega_id:"MBODEGA_ID",
                                    descripcion:"DESCRIPCION"

                                }

                            }
                        },
                        registroInterno:{
                            emovtitem:"ID"

                        }

                        }
                    };
};
EntidadesMongoOracle.prototype.getTablasScript = function(){
    obj = new EntidadesMongoOracle();
    return Object.getOwnPropertyNames( EntidadesMongoOracle.prototype ).reduce(function(res, a){
                        if(a.indexOf("getJson")>=0 && obj[a]() && obj[a]().movil && obj[a]().movil.crear){
                            res[obj[a]().coleccion]=getTablaMovil(obj[a]());
                            return res;
                        }else{
                            return res;
                        }
                    },{});
}
EntidadesMongoOracle.prototype.getColecciones = function(){
    obj = new EntidadesMongoOracle();
    return Object.getOwnPropertyNames( EntidadesMongoOracle.prototype ).reduce(function(res, a){
                        if(a.indexOf("getJson")>=0 && obj[a]() &&  (obj[a]().diccionario==true ||obj[a]().diccionario==false)){
                            res.push({coleccion:obj[a]().coleccion,diccionario:obj[a]().diccionario});
                            return res;
                        }else{
                            return res;
                        }
                    },[]);

}

function getCamposParaCrearTablaMovil(json){
    var campos = [];
    for(key in json.registroMongo.registroMovil){
        if(key != "arrayJson"){
            campos.push(key);
        }
    }
    return campos
}
function getTablaMovil(json){
    var campos = [];
    for(key in json.registroMongo.registroMovil){
        if(key != "arrayJson"){
            campos.push(key +" TEXT");
        }

    }
    return scritpA.replace("#TABLA", json.movil.tabla).replace("#COLUMNAS", campos.join(",") );
}
module.exports = EntidadesMongoOracle;
