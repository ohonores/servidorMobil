var scritpA = "CREATE TABLE IF NOT EXISTS #TABLA (id integer primary key autoincrement, hash TEXT, #COLUMNAS)";
var scritpEspejo = "CREATE TABLE IF NOT EXISTS #TABLA (id integer primary key autoincrement, #COLUMNAS)";
var scritpDropTables = "DROP TABLE IF  EXISTS  #TABLA";
var scritpUniqueKeys = "CREATE UNIQUE INDEX #NOMBRE ON #TABLA(hash)";
var scritpB = "PRAGMA foreign_keys = ON;";
var tipoDato = "TEXT";
var EntidadesMongoOracle = function(){

};
EntidadesMongoOracle.prototype.getScriptA = function(){
    return scritpA;
};
EntidadesMongoOracle.prototype.getScriptB = function(){
    return scritpB;
};
EntidadesMongoOracle.prototype.getJsonPerfiles = function(){
    return {
                    coleccion:"emcperfiles",
                    sqlOrigen:"SELECT * FROM  SWISSMOVI.EMOVTPERFIL ORDER BY ID ASC",
                    validarExistenciaPerfilMobil:"SELECT COUNT(*) as total FROM  emovtperfil",
                    validarTotalesContraOracleMongoDb:"SELECT COUNT(*) as total FROM  SWSISSMOVI.emovtperfil",
                    movil:{tabla:"emovtperfil", crear:true},

                    registroMongo:{
                                registroMovil:{
                                    identificacion:"IDENTIFICACION",
                                    infoEmpresa:{empresa_id:"EMPRESA_ID",empresa_descripcion:"EMPRESA_DESCRIPCION"},
                                    infoPerfil:{
                                                vendedor_id:"VENDEDOR_ID",
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
                                    token:"",
                                    bodegas:"",
                                    arrayJson:{
                                        sqlOrigen:"SELECT B.* FROM SWISSMOVI.EMOVTPERFIL_BODEGA PB JOIN  SWISSMOVI.EMOVVBODEGA B ON B.ID=PB.MBODEGA_ID WHERE PB.MPERFIL_ID=:ID ORDER BY PB.ID ASC",
                                        parametrosBusqueda:["registroInterno.perfil"],
                                        parametrosBusquedaValores:[],//Este array indica que se utilizaran paraemtros como el A que es id de donde empezara a leer y B que es la cantidad de registros a traer
                                        etiqueta:"bodegas",
                                        registroMovil:{
                                            id:"ID",
                                            codigo:"CODIGO",
                                            descripcion:"DESCRIPCION"
                                        }
                                    },
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
                    iteracionPorPerfil:true,
                    movil:{tabla:"emovtperfil_establecimiento", crear:true},
                    sqlOrigen:"SELECT * FROM (SELECT * FROM SWISSMOVI.EMOVTPERFIL_ESTABLECIMIENTO  WHERE MPERFIL_ID =:ID ORDER BY ID ASC) PE WHERE  PE.ID>=:A AND ROWNUM<=:B",

                    parametrosBusqueda:["registroInterno.perfil"],
                    parametrosBusquedaValores:[], //Este array indica que se utilizaran paraemtros como el A que es id de donde empezara a leer y B que es la cantidad de registros a traer
                    registroTipoCamposNumericos:{
                        "ESTABLECIMIENTO_ID":"INTEGER",
                        "ESTABLECIMIENTOTIPOPAGO_ID":"INTEGER"

                    },
                    registroMongo:{
                        registroMovil:{
                            id:"ID",
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
                                    diasfin:"DIASFIN",
                                    descuentofactura:"DESCUENTOFACTURA",
                                    financiamiento:"FINANCIAMIENTO",
                                    lineanegocio:"LINEA_NEGOCIO_ID"
                                }
                            },
                            /*tipoNegocios:{
                                infoNegocio:"",
                                arrayJson:{
                                    sqlOrigen:"SELECT * FROM SWISSMOVI.EMOVTESTABLECIMIENTO_NEGOCIO  WHERE ESTABLECIMIENTO_ID =:ID",
                                    parametrosBusqueda:["registroMovil.establecimiento_id"],
                                    parametrosBusquedaValores:[],//Este array indica que se utilizaran paraemtros como el A que es id de donde empezara a leer y B que es la cantidad de registros a traer
                                    etiqueta:"infoNegocio",
                                    registroMovil:{
                                        tiponegocio_id:"TIPONEGOCIO_ID",
                                        negocio_id:"NEGOCIO_ID"
                                    }
                                }
                            },*/

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
                    sqlOrigen:"SELECT * FROM (SELECT * FROM SWISSMOVI.EMOVVBANCO ORDER BY ID ASC) PE WHERE  PE.ID>=:A AND ROWNUM<=:B",
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
                    sqlOrigen:"SELECT * FROM (SELECT * FROM SWISSMOVI.EMOVVCUENTA_BANCARIA ORDER BY ID ASC) PE WHERE  PE.ID>=:A AND ROWNUM<=:B",
                    parametrosBusquedaValores:[],//Este array indica que se utilizaran paraemtros como el A que es id de donde empezara a leer y B que es la cantidad de registros a traer

                    registroMongo:{
                        registroMovil:{
                            codigo:"*CBA",//El * significa que no sera buscado en el array origen y conservara su valor, pero se reemplazar el * por vacio
                            infoDiccionario:{
                                id:"ID",
                                empresa_id:"EMPRESA_ID",
                                numero_cuenta:"CODIGO",
                                descripcion:"DESCRIPCION",
                                tipocuenta:"TIPOCUENTA"
                            },
                        },

                        }
                    };
};
EntidadesMongoOracle.prototype.getJsonDiccionarioDocumento = function(){
    return {
                    coleccion:"emcdiccionarios",
                    movil:{tabla:"emovtdiccionarios", crear:true},
                    sqlOrigen:"SELECT * FROM (SELECT * FROM SWISSMOVI.EMOVVFORMA_PAGO ORDER BY ID ASC) PE WHERE  PE.ID>=:A AND ROWNUM<=:B",
                    parametrosBusquedaValores:[],//Este array indica que se utilizaran paraemtros como el A que es id de donde empezara a leer y B que es la cantidad de registros a traer
                    registroMongo:{
                        registroMovil:{
                            codigo:"*DOC",//El * significa que no sera buscado en el array origen y conservara su valor, pero se reemplazar el * por vacio
                            infoDiccionario:{
                                id:"ID",
                                codigo:"CODIGO",
                                descripcion:"DESCRIPCION",
                                tipo:"TIPO",
                                formaPago:"",
                                arrayJson:{
                                    sqlOrigen:"SELECT * FROM SWISSMOVI.EMOVVDOCUMENTO  WHERE  MFORMAPAGO_ID=:ID",
                                    parametrosBusqueda:["registroInterno.mformapago_id"],
                                    parametrosBusquedaValores:[],//Este array indica que se utilizaran paraemtros como el A que es id de donde empezara a leer y B que es la cantidad de registros a traer
                                    etiqueta:"formaPago",
                                    registroMovil:{
                                        id:"ID",
                                        codigo:"CODIGO",
                                        descripcion:"DESCRIPCION",
                                        retencion:"RETENCION"
                                    }

                                }
                            }
                        },
                        registroInterno:{
                            mformapago_id:"ID"

                        }

                        }
                    };
};
EntidadesMongoOracle.prototype.getJsonDiccionarioBodegaVenta = function(){
    return {
                    coleccion:"emcdiccionarios",
                    movil:{tabla:"emovtdiccionarios", crear:true},
                    //sqlOrigen:"SELECT distinct ID,CODIGO,DESCRIPCION,TIPOBODEGA,ESTABLECIMIENTO_ID FROM (SELECT B.* FROM SWISSMOVI.EMOVTPERFIL_BODEGA PB JOIN  SWISSMOVI.EMOVVBODEGA B ON B.ID=PB.MBODEGA_ID WHERE PB.MPERFIL_ID=:ID ORDER BY PB.ID ASC) PE WHERE  PE.ID>=:A AND ROWNUM<=:B",
                    sqlOrigen:"SELECT * FROM (SELECT * FROM SWISSMOVI.EMOVVBODEGA  ORDER BY ID ASC) PE WHERE  PE.ID>=:A AND ROWNUM<=:B",
                    parametrosBusquedaValores:[],//Este array indica que se utilizaran paraemtros como el A que es id de donde empezara a leer y B que es la cantidad de registros a traer
                    registroMongo:{
                        registroMovil:{
                            codigo:"*BOD",//El * significa que no sera buscado en el array origen y conservara su valor, pero se reemplazar el * por vacio
                            infoDiccionario:{
                                id:"ID",
                                codigo:"CODIGO",
                                descripcion:"DESCRIPCION",
                                tipo:"TIPOBODEGA",
                                establecimiento_id:"ESTABLECIMIENTO_ID"

                            },
                        }

                        }
                    };
};
EntidadesMongoOracle.prototype.getJsonEstadoDeCuenta = function(){
    return {
                    coleccion:"emcestadodecuenta",
                    diccionario:false,
                    iteracionPorPerfil:true,
                    movil:{tabla:"emovtestadoscuenta", crear:true},
                    sqlOrigen:"SELECT * FROM (SELECT EC.* FROM SWISSMOVI.EMOVTESTADO_CUENTA EC JOIN SWISSMOVI.EMOVTPERFIL_ESTABLECIMIENTO PE  ON PE.ID=EC.MPERFILESTABLECIMIENTO_ID WHERE PE.MPERFIL_ID=:ID ORDER BY EC.ID ASC) PA WHERE  PA.ID>=:A AND ROWNUM<=:B",
                    parametrosBusqueda:["registroInterno.perfil"],
                    parametrosBusquedaValores:[],//Este array indica que se utilizaran paraemtros como el A que es id de donde empezara a leer y B que es la cantidad de registros a traer
                    registroTipoCamposNumericos:{
                        "PERFILESTABLECIMIENTO_ID":"INTEGER",
                        "VALOR":"REAL",
                        "SALDO":"REAL",
                        "RETENCIONIVA":"REAL",
                        "RETENCIONFUENTE":"REAL",
                    },
                    registroMongo:{
                        registroMovil:{
                            perfilEstablecimiento_id:"MPERFILESTABLECIMIENTO_ID",
                            codigoTipoDocumento:"TIPODOCUMENTO",
                            preimpreso:"PREIMPRESO",
                            fechaCartera:"FECHACARTERA",
                            fechaVencimiento:"FECHAVENCIMIENTO",
                            retencioniva:"RETENCIONIVA",
                            retencionfuente:"RETENCIONFUENTE",
                            valor:"VALOR",
                            saldo:"SALDO",
                            escartera:"ESCARTERA"

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
                    sqlOrigen:"SELECT * FROM (SELECT * FROM SWISSMOVI.EMOVTITEM ORDER BY ID ASC)  PE WHERE  PE.ID>=:A AND ROWNUM<=:B",
                    parametrosBusquedaValores:[],//Este array indica que se utilizaran paraemtros como el A que es id de donde empezara a leer y B que es la cantidad de registros a traer
                    registroTipoCamposNumericos:{
                        "PRECIO":"REAL",
                        "DESCUENTO":"INTEGER",
                        "IMPUESTO1":"INTEGER",
                        "IMPUESTO2":"INTEGER",
                        "IMPUESTO3":"INTEGER",
                        "EMPRESA_ID":"INTEGER",
                        "LINEA_NEGOCIO_ID":"INTEGER"
                    },
                    registroMongo:{
                        registroMovil:{
                            id:"ID",
                            empresa_id:"EMPRESA_ID",
                            codigoItem:"CODIGO",
                            infoItem:{
                                descripcion:"DESCRIPCION",
                                precio:"PRECIO",
                                descuento:"DESCUENTO",
                                impuestos:{impuesto1:"IMPUESTO1",impuesto2:"IMPUESTO2",impuesto3:"IMPUESTO3"},
                                permitecambioprecio:"PERMITECAMBIOPRECIO",
                                controlado:"CONTRALADO",
                                linea_negocio_id:"LINEANEGOCIO_ID"
                            },
                            infoStock:"",
                            arrayJson:{
                                sqlOrigen:"SELECT S.*, B.DESCRIPCION,B.CODIGO FROM SWISSMOVI.EMOVTSTOCK S JOIN SWISSMOVI.EMOVVBODEGA B ON S.MBODEGA_ID = B.ID WHERE MITEM_ID =:ID",
                                parametrosBusqueda:["registroInterno.emovtitem"],
                                parametrosBusquedaValores:[],//Este array indica que se utilizaran paraemtros como el A que es id de donde empezara a leer y B que es la cantidad de registros a traer
                                etiqueta:"infoStock",
                                registroMovil:{
                                    id:"ID",
                                    cantidad:"CANTIDAD",
                                    bodega_id:"MBODEGA_ID",
                                    codigo:"CODIGO",
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

EntidadesMongoOracle.prototype.getJsonPromocionVenta = function(){
    return {
                    coleccion:"emocpromocion_venta",
                    diccionario:true,
                    movil:{tabla:"emovtitem_promocionventa", crear:true},
                    sqlOrigen:"SELECT * FROM (SELECT * FROM SWISSMOVI.EMOVTITEM_PROMOCIONVENTA ORDER BY ID ASC)  PE WHERE  PE.ID>=:A AND ROWNUM<=:B",
                    parametrosBusquedaValores:[],//Este array indica que se utilizaran paraemtros como el A que es id de donde empezara a leer y B que es la cantidad de registros a traer
                    registroTipoCamposNumericos:{
                        "ID":"REAL",
                        "ITEM_ID":"INTEGER",
                        "DIAS":"INTEGER",
                        "VENTA":"REAL",
                        "ESTABLECIMIENTO_ID":"INTEGER",
                        "PROMOCIONVENTA_ID":"INTEGER"

                    },
                    registroMongo:{
                        registroMovil:{
                            promocionventa_id:"PROMOCIONVENTA_ID",
                            item_id:"MITEM_ID",
                            dias:"DIAS",
                            venta:"VENTA",
                            establecimiento_id:"ESTABLECIMIENTO_ID",
                            infoPromocion:{
                                descripcion:"DESCRIPCION",
                                descuentoespecial:"DESCUENTOESPECIAL",
                                precioespecial:"PRECIOESPECIAL",
                                descuento:"DESCUENTO",
                                bonifica:"BONIFICA"
                            },
                            infoBonifica:"",
                            arrayJson:{
                                sqlOrigen:"SELECT * FROM SWISSMOVI.EMOVTPROMOCION_BONIFICACION  WHERE MPROMOCIONVENTA_ID =:ID",
                                parametrosBusqueda:["registroInterno.emovtitem_promocionventa"],
                                parametrosBusquedaValores:[],//Este array indica que se utilizaran paraemtros como el A que es id de donde empezara a leer y B que es la cantidad de registros a traer
                                etiqueta:"infoBonifica",
                                registroMovil:{
                                    id:"ID",
                                    mitem_id:"MITEM_ID",
                                    bonificacion:"BONIFICACION",
                                    lineal:"LINEAL"
                                }
                            }
                        },
                        registroInterno:{
                            emovtitem_promocionventa:"ID"

                        }
                    }
                };
};

EntidadesMongoOracle.prototype.getJsonCartera = function(){
    return {
                    coleccion:"emccartera",
                    diccionario:true,
                    sincronizar:false,
                    movil:{tabla:"emovtcartera", crear:true, espejo:true, sql:"SELECT * FROM SWISSMOVI.EMOVTCARTERA where rownum = 1", secuencia:"SWISSMOVI.emovscartera"},
                    referencias:[{tabla:"emovtcartera_detalle",campofk:"MCARTERA_ID"},{tabla:"emovtafecta",campofk:"MCARTERA_ID"}],
                    registroTipoCamposNumericos:{
                        "MPERFILESTABLECIMIENTO_ID":"INTEGER",
                        "PRECARTERA_ID":"INTEGER"

                    },
                    registroMongo:{

                        registroMovil:{

                        }
                    }
                };//FIN DEL JSON
};
EntidadesMongoOracle.prototype.getJsonCarteraDetalle = function(){
    return {
                    coleccion:"emccarteraDetalle",
                    diccionario:true,
                    movil:{tabla:"emovtcartera_detalle", crear:true, espejo:true, sql:"SELECT * FROM SWISSMOVI.EMOVTCARTERA_DETALLE where rownum = 1", secuencia:"SWISSMOVI.emovscartera_detalle"},
                    referencias:[{tabla:"emovtafecta",campofk:"MDETALLECREDITO_ID"}],
                    registroTipoCamposNumericos:{
                        "MFORMAPAGO_ID":"INTEGER",
                        "MDOCUMENTO_ID":"INTEGER",
                        "VALOR":"REAL",
                        "SALDO":"REAL",
                        "MCUENTABANCARIA_ID":"INTEGER",
                        "MBANCO_ID":"INTEGER",
                        "MCARTERA_ID":"INTEGER"

                    },
                    updateOrigen:"",
                    registroMongo:{
                        registroMovil:{

                        }
                    }
                };//FIN DEL JSON
};
EntidadesMongoOracle.prototype.getJsonAfecta = function(){
    return {
                    coleccion:"emcafecta",
                    diccionario:true,
                    sincronizar:false,
                    movil:{tabla:"emovtafecta", crear:true, espejo:true, sql:"SELECT * FROM SWISSMOVI.EMOVTAFECTA where rownum = 1",secuencia:"SWISSMOVI.emovsafecta"},
                    registroTipoCamposNumericos:{
                        "MDETALLECREDITO_ID":"INTEGER",
                        "MDETALLEDEBITO_ID":"INTEGER",
                        "VALOR":"REAL"
                    },
                    updateOrigen:"",
                    registroMongo:{
                        registroMovil:{

                        }
                    }
                };//Fin del json
};

EntidadesMongoOracle.prototype.getJsonOrden = function(){
    return {
                    coleccion:"emcorden",
                    diccionario:true,
                    sincronizar:false,
                    movil:{tabla:"emovtorden", crear:true, espejo:true, sql:"SELECT * FROM SWISSMOVI.EMOVTORDEN where rownum = 1",secuencia:"SWISSMOVI.emovsorden"},
                    referencias:[{tabla:"emovtorden_detalle",campofk:"MORDEN_ID"},{tabla:"emovtorden_condicion",campofk:"MORDEN_ID"}],
                    registroTipoCamposNumericos:{
                        "MPERFILESTABLECIMIENTO_ID":"INTEGER",
                        "MTIPOPAGODETALLE_ID":"INTEGER",
                        "ORDEN_ID":"INTEGER",
                        "MBODEGA_ID":"INTEGER"
                    },
                    updateOrigen:"",
                    registroMongo:{
                        registroMovil:{

                        }
                    }
                };//Fin del json
};
EntidadesMongoOracle.prototype.getJsonOrdenDetalle = function(){
    return {
                    coleccion:"emcordenDetalle",
                    diccionario:true,
                    movil:{tabla:"emovtorden_detalle", crear:true, espejo:true, sql:"SELECT * FROM SWISSMOVI.EMOVTORDEN_DETALLE where rownum = 1",secuencia:"SWISSMOVI.emovsorden_detalle"},
                    registroTipoCamposNumericos:{
                        "MORDEN_ID":"INTEGER",
                        "MITEM_ID":"INTEGER",
                        "MPROMOCIONVENTA_ID":"INTEGER",
                        "PRECIO":"REAL",
                        "PRECIOORIGINAL":"REAL",
                        "IMPUESTO1":"REAL",
                        "IMPUESTO2":"REAL",
                        "IMPUESTO3":"REAL",
                        "DESCUENTO":"REAL",
                        "DESCUENTOORIGINAL":"REAL",
                        "CANTIDAD":"INTEGER",
                        "MPROMOCIONBONIFICACION_ID":"INTEGER"
                    },
                    updateOrigen:"",
                    registroMongo:{
                        registroMovil:{

                        }
                    }
                };//Fin del json
};
EntidadesMongoOracle.prototype.getJsonOrdenCondicion = function(){
    return {
                    coleccion:"emcordencondicion",
                    diccionario:true,
                    movil:{tabla:"emovtorden_condicion", crear:true, espejo:true, sql:"SELECT * FROM SWISSMOVI.EMOVTORDEN_CONDICION where rownum = 1",secuencia:"SWISSMOVI.emovsorden_condicion"},
                    registroTipoCamposNumericos:{
                        "MORDEN_ID":"INTEGER",
                        "LINEANEGOCIO_ID":"INTEGER",
                        "DIASINI":"INTEGER",
                        "DIASFIN":"INTEGER",
                        "DESCUENTO":"REAL",
                        "FINANCIAMIENTO":"REAL",
                        "DIASPLAZO":"INTEGER"

                    },
                    updateOrigen:"",
                    registroMongo:{
                        registroMovil:{

                        }
                    }
                };//Fin del json
};

EntidadesMongoOracle.prototype.getTablasScript = function(){
    /*obj = new EntidadesMongoOracle();
    return Object.getOwnPropertyNames( EntidadesMongoOracle.prototype ).reduce(function(res, a){
                        if(a.indexOf("getJson")>=0 && obj[a]() && obj[a]().movil && obj[a]().movil.crear){

                                res[obj[a]().coleccion]=getTablaMovil(obj[a](), null);


                            return res;
                        }else{
                            return res;
                        }
                    },{});
                    */
};
EntidadesMongoOracle.prototype.getColeccionesParaSincronzar = function(){
    obj = new EntidadesMongoOracle();
    return Object.getOwnPropertyNames( EntidadesMongoOracle.prototype ).reduce(function(res, a){
                        if(a.indexOf("getJson")>=0 && obj[a]() &&  (obj[a]().diccionario===true ||obj[a]().diccionario===false)){
                            if((obj[a]().sincronizar === false)){

                            }else{
                                res.push({coleccion:obj[a]().coleccion,diccionario:obj[a]().diccionario, tabla:obj[a]().movil.tabla, espejo:obj[a]().movil.espejo});
                           }
                            return res;
                        }else{
                            return res;
                        }
                    },[]);

};
EntidadesMongoOracle.prototype.getColecciones = function(){
    obj = new EntidadesMongoOracle();
    return Object.getOwnPropertyNames( EntidadesMongoOracle.prototype ).reduce(function(res, a){
                        if(a.indexOf("getJson")>=0 && obj[a]() &&  (obj[a]().diccionario===true ||obj[a]().diccionario===false)){

                                res.push({coleccion:obj[a]().coleccion,diccionario:obj[a]().diccionario, tabla:obj[a]().movil.tabla, espejo:obj[a]().movil.espejo});

                            return res;
                        }else{
                            return res;
                        }
                    },[]);

};
function getCamposParaCrearTablaMovil(json){
    var campos = [];
    for(var key in json.registroMongo.registroMovil){
        if(key != "arrayJson"){
            campos.push(key);
        }
    }
    return campos;
}
EntidadesMongoOracle.prototype.getTablaMovil = function(json, utilizarEstosCampos, espejo){
    var campos = [];
    var key;
    if(Array.isArray(utilizarEstosCampos) &&  utilizarEstosCampos.length>0){

        for(key in utilizarEstosCampos){
                campos.push(utilizarEstosCampos[key] + (json.registroTipoCamposNumericos && json.registroTipoCamposNumericos[utilizarEstosCampos[key].toUpperCase()] ?" " + json.registroTipoCamposNumericos[utilizarEstosCampos[key].toUpperCase()]:" TEXT"));
        }
    }else{
        for(key in json.registroMongo.registroMovil){
            if(key != "arrayJson" && key != "id"){

                campos.push(key + (json.registroTipoCamposNumericos && json.registroTipoCamposNumericos[key.toUpperCase()] ?" " + json.registroTipoCamposNumericos[key.toUpperCase()]:" TEXT"));
            }
        }
    }
    if(espejo){
        return scritpEspejo.replace(/#TABLA/g, json.movil.tabla).replace("#COLUMNAS", campos.join(",") );
    }else{
        return scritpA.replace(/#TABLA/g, json.movil.tabla).replace("#COLUMNAS", campos.join(",") );
    }

};
EntidadesMongoOracle.prototype.getScriptsDropTables = function(json){
        return scritpDropTables.replace(/#TABLA/g, json.movil.tabla);
};

EntidadesMongoOracle.prototype.getScriptsUniqueKeys = function(json, index){
        return scritpUniqueKeys.replace(/#TABLA/g, json.movil.tabla).replace("#NOMBRE", "UNIQUEHASH"+index);
};


EntidadesMongoOracle.prototype.getSecuenciaOracle = function(tabla){
    entidesMonogoDB = new EntidadesMongoOracle();
    return Object.getOwnPropertyNames( EntidadesMongoOracle.prototype ).reduce(function(res, a){
                        if(a.indexOf("getJson")>=0 && entidesMonogoDB[a]() &&  (entidesMonogoDB[a]().diccionario===true ||entidesMonogoDB[a]().diccionario===false)){
                            if(entidesMonogoDB[a]().movil.espejo && entidesMonogoDB[a]().movil.sql, entidesMonogoDB[a]().movil.tabla===tabla && entidesMonogoDB[a]().movil.secuencia){
                                res.secuencia = entidesMonogoDB[a]().movil.secuencia;
                            }
                        }
                        return res;
                    },{});

};


EntidadesMongoOracle.prototype.getReferenciaFkOracle = function(tablaA, tablaB){
    entidesMonogoDB = new EntidadesMongoOracle();
    return Object.getOwnPropertyNames( EntidadesMongoOracle.prototype ).reduce(function(res, a){
                        if(a.indexOf("getJson")>=0 && entidesMonogoDB[a]() &&  (entidesMonogoDB[a]().diccionario===true ||entidesMonogoDB[a]().diccionario===false)){
                            // console.log(entidesMonogoDB[a]().referencias);
                            if(entidesMonogoDB[a]().movil.espejo && entidesMonogoDB[a]().movil.sql, entidesMonogoDB[a]().movil.tabla===tablaA && entidesMonogoDB[a]().referencias && Array.isArray(entidesMonogoDB[a]().referencias) ){
                            //    console.log("encontrado referencias ");
                            //    console.log(entidesMonogoDB[a]().referencias);
                                entidesMonogoDB[a]().referencias.forEach(function(ref){
                                    if(ref.tabla==tablaB && ref.campofk){
                                        res.campofk = ref.campofk;
                                        return res;
                                    }
                                });
                            }

                        }
                        return res;
                    },{});

};

module.exports = EntidadesMongoOracle;
