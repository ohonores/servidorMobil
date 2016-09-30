/***************
OOOOOOOJOOOOOOOO VERIFICAR LA URL DEL PERFIL
****************/

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

EntidadesMongoOracle.prototype.getStripValidacionUsuarioOracle = function(){
    return "SELECT CLAVE from ecortpersona p JOIN ecortempresa_persona ep ON p.id=ep.persona_id JOIN esegtusuario u ON u.empresapersona_id=ep.id where identificacion=:IDENTIFICACION";
};



EntidadesMongoOracle.prototype.getJsonPerfiles = function(){
    return {
                    coleccion:"emcperfiles",
                    tipoPerfil:true,
                    sqlOrigen:"SELECT * FROM  SWISSMOVI.EMOVTPERFIL WHERE ID=:PERFIL ORDER BY ID ASC",
                    validarExistenciaPerfilMobil:"SELECT COUNT(*) as total FROM  emovtperfil",
                    validarTotalesContraOracleMongoDb:"SELECT COUNT(*) as total FROM  SWSISSMOVI.emovtperfil",
                    movil:{tabla:"emovtperfil", crear:true},
                    registroMongo:{
                                registroMovil:{
                                    id:"ID",
                                    identificacion:"IDENTIFICACION",
                                    infoEmpresa:{empresa_id:"EMPRESA_ID",empresa_descripcion:"EMPRESA_DESCRIPCION"},
                                    emisor:"",
                                    infoPerfil:{
                                                vendedor_id:"VENDEDOR_ID",
                                                usuario_id:"USUARIO_ID",
                                                nombres:"NOMBRES",
                                                codigo:"CODIGO",
                                                mbodega_id:"MBODEGA_ID",
                                                division_id:"DIVISION_ID",
                                                avanceventa:"AVANCEVENTA",
                                                avancecobro:"AVANCECOBRO",
                                                avanceventadivision:"AVANCEVENTADIVISION",
                                                avancecobrodivision:"AVANCECOBRODIVISION",
                                                impresora:"IMPRESORA",


                                            },
                                    version:"",
                                    dispositivo:"",
                                    token:"",
                                    sincronizaciones:"",
                                    estado:"",
                                    fecha:"",
                                    bodegas:"",
                                    cambiaprecio:"",
                                    url:"http://documentos.ecuaquimica.com:8080",
                                    arrayJson1:{
                                        sqlOrigen:"SELECT B.* FROM SWISSMOVI.EMOVTPERFIL_BODEGA PB JOIN  SWISSMOVI.EMOVVBODEGA B ON B.ID=PB.MBODEGA_ID WHERE PB.MPERFIL_ID=:ID ORDER BY B.ID ASC",
                                        parametrosBusqueda:["registroInterno.perfil"],
                                        parametrosBusquedaValores:[],//Este array indica que se utilizaran paraemtros como el A que es id de donde empezara a leer y B que es la cantidad de registros a traer
                                        etiqueta:"bodegas",
                                        registroMovil:{
                                            id:"ID",
                                            codigo:"CODIGO",
                                            descripcion:"DESCRIPCION"
                                        }
                                    },
                                    secuencial_json_:"",
                                    arrayJson2:{
                                        sqlOrigen:"SELECT c.DISPOSITIVO, max(c.SECUENCIAL) as ULTIMO FROM SWISSMOVI.emovtcartera c JOIN emovtperfil_establecimiento pe on pe.id = c.mperfilestablecimiento_id where pe.mperfil_id=:ID AND secuencial is not null group by dispositivo",
                                        parametrosBusqueda:["registroInterno.perfil"],
                                        parametrosBusquedaValores:[],//Este array indica que se utilizaran paraemtros como el A que es id de donde empezara a leer y B que es la cantidad de registros a traer
                                        etiqueta:"secuencial_json_", //La terminacion en _valor_, permiter adjuntar el valor de la consulta y ya no el json
                                        registroMovil:{
                                            dispositivo:"DISPOSITIVO",
                                            ultimo:"ULTIMO",

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
                    validacionSql:{sqlEsperados:"SELECT COUNT(*) as TOTAL  FROM SWISSMOVI.EMOVTPERFIL_ESTABLECIMIENTO  WHERE MPERFIL_ID =:ID",sqlEncontrados:"SELECT COUNT(*) AS TOTAL FROM emovtperfil_establecimiento"},
                    sqlOrigen:"SELECT * FROM (SELECT * FROM SWISSMOVI.EMOVTPERFIL_ESTABLECIMIENTO  WHERE MPERFIL_ID =:ID ORDER BY ID ASC) PE WHERE  PE.ID>=:A AND ROWNUM<=:B",

                    parametrosBusqueda:["registroInterno.perfil"],
                    parametrosBusquedaValores:[], //Este array indica que se utilizaran paraemtros como el A que es id de donde empezara a leer y B que es la cantidad de registros a traer
                    registroTipoCamposNumericos:{
                        "ESTABLECIMIENTO_ID":"INTEGER",
                        "ESTABLECIMIENTOTIPOPAGO_ID":"INTEGER",
                        "fechalicencia":"INTEGER",
                        "fechavisita":"INTEGER"

                    },
                    registroMongo:{
                        registroMovil:{
                            id:"ID",
                            establecimiento_id:"ESTABLECIMIENTO_ID",
                            establecimientoTipoPago_id:"MESTABLECIMIENTOTIPOPAGO_ID",
                            codigoEstablecimiento:"CODIGO",
                            busqueda:"CONCATENAR(IDENTIFICACION,CODIGO,NOMBRE)",
                            infoEstablecimiento:{
                                perfilEstablecimiento_id:"ID",
                                nombre:"NOMBRE",
                                tipo_establecimiento:"TIPO_IDENTIFICACION",
                                identificacion:"IDENTIFICACION",
                                direcciones:"",
                                arrayJson5:{
                                    sqlOrigen:"SELECT * FROM SWISSMOVI.EMOVVDIRECCION WHERE ESTABLECIMIENTO_ID =:ID ORDER BY ID ASC",
                                    parametrosBusqueda:["registroMovil.establecimiento_id"],
                                    parametrosBusquedaValores:[],//Este array indica que se utilizaran paraemtros como el A que es id de donde empezara a leer y B que es la cantidad de registros a traer
                                    etiqueta:"direcciones",
                                    registroMovil:{
                                        id:"ID",
                                        categoria:"CATEGORIA",
                                        direccion:"DIRECCION"
                                    }
                                },
                                telefono:"TELEFONO",
                                email:"EMAIL",
                                emailrecaudacion:"EMAILRECAUDACION",
                                emailfacturacion:"EMAILFACTURACION",
                                tiponegocio_id:"TIPONEGOCIO_ID",
                                fechalicencia:"FECHALICENCIA",
                                fechavisita:"FECHAVISITA",
                                vencido:"VENCIDO",
                               
                            },
                            tipoPago:"",
                            arrayJson1:{
                                sqlOrigen:"SELECT TPD.* FROM SWISSMOVI.EMOVTESTABLECIMIENTO_TIPO_PAGO JOIN EMOVVTIPO_PAGO_DETALLE TPD ON TPD.TIPOPAGODETALLE_ID = MTIPOPAGODETALLE_ID  WHERE MPERFILESTABLECIMIENTO_ID =:ID ORDER BY TPD.ID ASC",
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
                            infoTipoNegocio:"",
                            arrayJson2:{
                                    sqlOrigen:"SELECT * FROM SWISSMOVI.EMOVTESTABLECIMIENTO_NEGOCIO  WHERE ESTABLECIMIENTO_ID =:ID AND TIPONEGOCIO_ID IS NOT NULL ORDER BY ID ASC",
                                    parametrosBusqueda:["registroMovil.establecimiento_id"],
                                    parametrosBusquedaValores:[],//Este array indica que se utilizaran parametros como el A que es id de donde empezara a leer y B que es la cantidad de registros a traer
                                    etiqueta:"infoTipoNegocio",
                                    registroMovil:{
                                        tiponegocio_id:"TIPONEGOCIO_ID",

                                    }
                            },
                            infoNegocio:"",
                            arrayJson3:{
                                    sqlOrigen:"SELECT * FROM SWISSMOVI.EMOVTESTABLECIMIENTO_NEGOCIO  WHERE ESTABLECIMIENTO_ID =:ID AND NEGOCIO_ID IS NOT NULL ORDER BY ID ASC",
                                    parametrosBusqueda:["registroMovil.establecimiento_id"],
                                    parametrosBusquedaValores:[],//Este array indica que se utilizaran paraemtros como el A que es id de donde empezara a leer y B que es la cantidad de registros a traer
                                    etiqueta:"infoNegocio",
                                    registroMovil:{
                                        negocio_id:"NEGOCIO_ID"
                                    }
                            }
                            

                        },
                        registroInterno:{
                            perfilEstablecimiento:"ID",

                        }
                        }
                    };
};


EntidadesMongoOracle.prototype.getJsonDiccionarioBodegaVentaPorPefil = function(){
    return {
                    coleccion:"emcdiccionariosporperfil",
                    movil:{tabla:"emovtdiccionarios", crear:false},
                    iteracionPorPerfil:true,
                    diccionario:false,
                    //sqlOrigen:"SELECT distinct ID,CODIGO,DESCRIPCION,TIPOBODEGA,ESTABLECIMIENTO_ID FROM (SELECT B.* FROM SWISSMOVI.EMOVTPERFIL_BODEGA PB JOIN  SWISSMOVI.EMOVVBODEGA B ON B.ID=PB.MBODEGA_ID WHERE PB.MPERFIL_ID=:ID ORDER BY PB.ID ASC) PE WHERE  PE.ID>=:A AND ROWNUM<=:B",
                   // sqlOrigen:"SELECT * FROM (SELECT * FROM SWISSMOVI.EMOVVBODEGA  WHERE MPERFIL_ID =:ID  ORDER BY ID ASC) PE WHERE  PE.ID>=:A AND ROWNUM<=:B",
                    sqlOrigen:"SELECT * FROM (SELECT B.ID, B.CODIGO, B.DESCRIPCION, B.TIPOBODEGA, B.ESTABLECIMIENTO_ID, PB.OFICINA_ID FROM SWISSMOVI.EMOVTPERFIL_BODEGA PB JOIN  SWISSMOVI.EMOVVBODEGA B ON B.ID=PB.MBODEGA_ID WHERE PB.MPERFIL_ID=:ID ORDER BY B.ID ASC) PE WHERE  PE.ID>=:A AND ROWNUM<=:B",
                    parametrosBusqueda:["registroInterno.perfil"],
                    parametrosBusquedaValores:[],//Este array indica que se utilizaran paraemtros como el A que es id de donde empezara a leer y B que es la cantidad de registros a traer
                    registroMongo:{
                        registroMovil:{
                            codigo:"*BOD",//El * significa que no sera buscado en el array origen y conservara su valor, pero se reemplazar el * por vacio
                            infoDiccionario:{
                                id:"ID",
                                codigo:"CODIGO",
                                descripcion:"DESCRIPCION",
                                tipo:"TIPOBODEGA",
                                establecimiento_id:"ESTABLECIMIENTO_ID",
                                oficina_id:"OFICINA_ID"

                            },
                        },
                        registroInterno:{
                            emovtdiccionario:"ID",

                        }

                        }
                    };
};

EntidadesMongoOracle.prototype.getJsonDiccionarioBanco = function(){
    return {
                    coleccion:"emcdiccionarios",
                    diccionario:true,
                    validacionSql:{sqlEsperados:"SELECT SUM(TOTAL) AS TOTAL FROM ( SELECT COUNT(*) AS TOTAL FROM SWISSMOVI.emovvcuenta_bancaria union all SELECT COUNT(*) AS TOTAL FROM SWISSMOVI.emovvbanco union all SELECT COUNT(*) AS TOTAL FROM SWISSMOVI.EMOVVFORMA_PAGO union all SELECT COUNT(*) AS TOTAL FROM SWISSMOVI.emovvlinea_negocio union all (SELECT COUNT(*) AS TOTAL  FROM SWISSMOVI.EMOVTPERFIL_BODEGA PB JOIN  SWISSMOVI.EMOVVBODEGA B ON B.ID=PB.MBODEGA_ID WHERE PB.MPERFIL_ID=:ID))",sqlEncontrados:"SELECT COUNT(*) AS TOTAL FROM emovtdiccionarios"},
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
                                arrayJson1:{
                                    sqlOrigen:"SELECT * FROM SWISSMOVI.EMOVVDOCUMENTO  WHERE  MFORMAPAGO_ID=:ID ORDER BY ID ASC",
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
EntidadesMongoOracle.prototype.getJsonDiccionarioLineaNegocio = function(){
    return {
                    coleccion:"emcdiccionarios",
                    movil:{tabla:"emovtdiccionarios", crear:true},
                    //sqlOrigen:"SELECT distinct ID,CODIGO,DESCRIPCION,TIPOBODEGA,ESTABLECIMIENTO_ID FROM (SELECT B.* FROM SWISSMOVI.EMOVTPERFIL_BODEGA PB JOIN  SWISSMOVI.EMOVVBODEGA B ON B.ID=PB.MBODEGA_ID WHERE PB.MPERFIL_ID=:ID ORDER BY PB.ID ASC) PE WHERE  PE.ID>=:A AND ROWNUM<=:B",
                    sqlOrigen:"SELECT * FROM (SELECT * FROM SWISSMOVI.EMOVVLINEA_NEGOCIO  ORDER BY ID ASC) PE WHERE  PE.ID>=:A AND ROWNUM<=:B",
                    parametrosBusquedaValores:[],//Este array indica que se utilizaran paraemtros como el A que es id de donde empezara a leer y B que es la cantidad de registros a traer
                    registroMongo:{
                        registroMovil:{
                            codigo:"*LIN",//El * significa que no sera buscado en el array origen y conservara su valor, pero se reemplazar el * por vacio
                            infoDiccionario:{
                                id:"ID",
                                padre_id:"PADRE_ID",
                                descripcion:"DESCRIPCION",
                                

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
                    validacionSql:{sqlEsperados:"SELECT COUNT(*) AS TOTAL FROM (SELECT EC.* FROM SWISSMOVI.EMOVTESTADO_CUENTA EC JOIN SWISSMOVI.EMOVTPERFIL_ESTABLECIMIENTO PE  ON PE.ID=EC.MPERFILESTABLECIMIENTO_ID WHERE PE.MPERFIL_ID=:ID)",sqlEncontrados:"SELECT COUNT(*) AS TOTAL FROM emovtestadoscuenta"},
                    sqlOrigen:"SELECT * FROM (SELECT EC.* FROM SWISSMOVI.EMOVTESTADO_CUENTA EC JOIN SWISSMOVI.EMOVTPERFIL_ESTABLECIMIENTO PE  ON PE.ID=EC.MPERFILESTABLECIMIENTO_ID WHERE PE.MPERFIL_ID=:ID ORDER BY EC.ID ASC) PA WHERE  PA.ID>=:A AND ROWNUM<=:B",
                    parametrosBusqueda:["registroInterno.perfil"],
                    parametrosBusquedaValores:[],//Este array indica que se utilizaran paraemtros como el A que es id de donde empezara a leer y B que es la cantidad de registros a traer
                    registroTipoCamposNumericos:{
                        "PERFILESTABLECIMIENTO_ID":"INTEGER",
                        "ID":"INTEGER",
                        "VALOR":"REAL",
                        "SALDO":"REAL",
                        "RETENCIONIVA":"REAL",
                        "RETENCIONFUENTE":"REAL",
                        "DIFERIDO":"REAL",
                        "FECHACARTERA":"INTEGER",
                        "FECHAVENCIMIENTO":"INTEGER",
                        "BASEIMPONIBLEIVA":"REAL",
                        "BASEIMPONIBLEFUENTE":"REAL"
                    },
                    registroMongo:{
                        registroMovil:{
                            id:"ID",
                            perfilEstablecimiento_id:"MPERFILESTABLECIMIENTO_ID",
                            codigoTipoDocumento:"TIPODOCUMENTO",
                            preimpreso:"PREIMPRESO",
                            fechaCartera:"FECHACARTERA",
                            fechaVencimiento:"FECHAVENCIMIENTO",
                            retencioniva:"RETENCIONIVA",
                            retencionfuente:"RETENCIONFUENTE",
                            valor:"VALOR",
                            saldo:"SALDO",
                            escartera:"ESCARTERA",
                            diferido:"DIFERIDO",
                            baseImponibleIva:"BASEIMPONIBLEIVA",
                            baseImponibleFuente:"BASEIMPONIBLEFUENTE"

                        },
                        registroInterno:{
                            emovtestadocuenta:"ID"

                        }

                        }
                    };
};

EntidadesMongoOracle.prototype.gdeftfJsonCruce = function(){
    return {
                    coleccion:"emccruce",
                    iteracionPorPerfil:true,
                    diccionario:false,
                    //iteracionPorPerfil:false,
                    movil:{tabla:"emovtcruce", crear:true},
                    //sqlOrigen:"SELECT * FROM (SELECT * FROM SWISSMOVI.EMOVTCRUCE  ORDER BY ID ASC) PE WHERE  PE.ID>=:A AND ROWNUM<=:B",
                    sqlOrigen:"SELECT * FROM (SELECT CR.* FROM SWISSMOVI.EMOVTCRUCE CR JOIN SWISSMOVI.EMOVTESTADO_CUENTA EC ON EC.ID = CR.DETALLEDEBITO_ID JOIN SWISSMOVI.EMOVTPERFIL_ESTABLECIMIENTO PEA  ON PEA.ID=EC.MPERFILESTABLECIMIENTO_ID WHERE PEA.MPERFIL_ID=:ID ORDER BY CR.ID ASC) PE WHERE  PE.ID>=:A AND ROWNUM<=:B",
                   // sqlOrigen:"SELECT * FROM EMOVTCRUCE PA WHERE  PA.ID>=:A AND ROWNUM<=:B",
                    parametrosBusqueda:["registroInterno.perfil"],
                    parametrosBusquedaValores:[],//Este array indica que se utilizaran paraemtros como el A que es id de donde empezara a leer y B que es la cantidad de registros a traer
                    registroTipoCamposNumericos:{
                        "ID":"INTEGER",
                        "DETALLECREDITO_ID":"REAL",
                        "DETALLEDEBITO_ID":"REAL",
                        "VALOR":"REAL",
                        "FECHAAFECTA":"INTEGER"
                       
                    },
                    registroMongo:{
                        registroMovil:{
                            id:"ID",
                            detallecredito_id:"DETALLECREDITO_ID",
                            detalledebito_id:"DETALLEDEBITO_ID",
                            valor:"VALOR",
                            fechaafecta:"FECHAAFECTA"
                            
                     },
                        registroInterno:{
                            emovtcruce:"ID"

                        }

                        }
                    };
};

//Crear precios tabla: emovtprecios
/*EntidadesMongoOracle.prototype.getJsonPrecios = function(){
    coleccion:"emcprecios",
    diccionario:true,
    movil:{tabla:"emovtprecio", crear:true},
    sqlOrigen:"SELECT * FROM (SELECT * FROM SWISSMOVI.EMOVTPRECIO ORDER BY ID ASC)  PE WHERE  PE.ID>=:A AND ROWNUM<=:B",
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
}*/
EntidadesMongoOracle.prototype.getJsonItems = function(){
    return {
                    coleccion:"emcitems",
                    diccionario:false,
                    iteracionPorPerfil:true,
                    //iterarPorEmpresa:true,
                    validacionSql : {sqlEsperados:"SELECT COUNT(*) AS TOTAL FROM (SELECT DISTINCT I.*  FROM SWISSMOVI.EMOVTITEM I JOIN SWISSMOVI.EMOVVLINEA_NEGOCIO LN  ON I.LINEANEGOCIO_ID=LN.ID JOIN SWISSMOVI.EMOVTPERFIL P ON P.DIVISION_ID = LN.PADRE_ID AND P.ID=:ID)",sqlEncontrados:"SELECT COUNT(*) AS TOTAL FROM emovtitems"},
                    movil:{tabla:"emovtitems", crear:true},
                    //sqlOrigen:"SELECT * FROM (SELECT * FROM SWISSMOVI.EMOVTITEM ORDER BY ID ASC)  PE WHERE  PE.ID>=:A AND ROWNUM<=:B",
                    sqlOrigen:"SELECT * FROM (SELECT DISTINCT I.* FROM EMOVTITEM I JOIN EMOVVLINEA_NEGOCIO LN  ON I.LINEANEGOCIO_ID=LN.ID JOIN EMOVTPERFIL P ON P.DIVISION_ID = LN.PADRE_ID AND P.ID=:ID ORDER BY I.ID ASC ) PEA WHERE  PEA.ID>=:A AND ROWNUM<=:B",
                    parametrosBusqueda:["registroInterno.perfil"],
                    parametrosBusquedaValores:[],//Este array indica que se utilizaran paraemtros como el A que es id de donde empezara a leer y B que es la cantidad de registros a traer
                    registroTipoCamposNumericos:{
                        "PRECIO":"REAL",
                        "DESCUENTO":"INTEGER",
                        "IMPUESTO1":"INTEGER",
                        "IMPUESTO2":"INTEGER",
                        "IMPUESTO3":"INTEGER",
                        "EMPRESA_ID":"INTEGER",
                        "LINEA_NEGOCIO_ID":"INTEGER",
                        "TOLERANCIA":"INTEGER"
                    },
                    registroMongo:{
                        registroMovil:{
                            id:"ID",
                            empresa_id:"EMPRESA_ID",
                            codigoItem:"CODIGO",
                            busqueda:"CONCATENAR(DESCRIPCION,CODIGO)",
                            infoItem:{
                                descripcion:"DESCRIPCION",
                                precio:"PRECIO",
                                infoPrecio_json_:"",
                                   
                                arrayJson1:{
                                        sqlOrigen:"SELECT NEGOCIO_ID,PRECIO FROM SWISSMOVI.EMOVTPRECIO WHERE ITEM_ID =:ID AND OFICINA_ID IS NULL AND NEGOCIO_ID IN (SELECT distinct negocio_id FROM emovtestablecimiento_negocio en JOIN emovtperfil_establecimiento pe ON pe.establecimiento_id = en.establecimiento_id WHERE pe.mperfil_id=:PERFIL) ORDER BY ID ASC",
                                        parametrosBusqueda:["registroInterno.emovtitem","perfil"],
                                        parametrosBusquedaValores:[],//Este array indica que se utilizaran paraemtros como el A que es id de donde empezara a leer y B que es la cantidad de registros a traer
                                        etiqueta:"infoPrecio_json_",
                                        registroMovil:{
                                            negocio_id:"NEGOCIO_ID",
                                            precio:"PRECIO"
                                        }
                                },

                                precioOficina_json_:"",

                                arrayJson3:{
                                        sqlOrigen:"SELECT OFICINA_ID, NEGOCIO_ID, PRECIO  FROM SWISSMOVI.EMOVTPRECIO WHERE ITEM_ID =:ID AND OFICINA_ID IN (SELECT oficina_id FROM emovtperfil_bodega WHERE mperfil_id=:PERFIL) ORDER BY ID ASC",
                                        parametrosBusqueda:["registroInterno.emovtitem", "perfil"],
                                        parametrosBusquedaValores:[],//Este array indica que se utilizaran paraemtros como el A que es id de donde empezara a leer y B que es la cantidad de registros a traer
                                        etiqueta:"precioOficina_json_",
                                        registroMovil:{
                                            negocio_id:"OFICINA_ID",
                                            precio:"PRECIO"
                                        }
                                },
                                
                                descuento:"DESCUENTO",
                                impuestos:{impuesto1:"IMPUESTO1",impuesto2:"IMPUESTO2",impuesto3:"IMPUESTO3"},
                                permitecambioprecio:"PERMITECAMBIOPRECIO",
                                controlado:"CONTRALADO",
                                linea_negocio_id:"LINEANEGOCIO_ID",
                                marca_id:"MARCA_ID",
                                tolerancia:"TOLERANCIA"
                            },
                            infoStock:"",
                            arrayJson2:{
                                sqlOrigen:"SELECT S.*, B.DESCRIPCION,B.CODIGO FROM SWISSMOVI.EMOVTSTOCK S JOIN SWISSMOVI.EMOVVBODEGA B ON S.MBODEGA_ID = B.ID WHERE MITEM_ID =:ID ORDER BY S.ID ASC",
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
                            },


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
                    diccionario:false,
                    iteracionPorPerfil:true,
                    movil:{tabla:"emovtitem_promocionventa", crear:true},
                    //validacionSql : {sqlEsperados:"SELECT count(*) as TOTAL FROM SWISSMOVI.EMOVTITEM_PROMOCIONVENTA", sqlEncontrados:"SELECT COUNT(*) AS TOTAL FROM emovtitem_promocionventa"},
                    validacionSql:{sqlEsperados:"SELECT COUNT(*) as TOTAL  FROM SWISSMOVI.EMOVTPERFIL_PROMOCIONVENTA  WHERE PERFIL_ID =:ID",sqlEncontrados:"SELECT COUNT(*) AS TOTAL FROM emovtitem_promocionventa"},
                   
                    //sqlOrigen:"SELECT * FROM (SELECT * FROM SWISSMOVI.EMOVTITEM_PROMOCIONVENTA ORDER BY ID ASC)  PE WHERE  PE.ID>=:A AND ROWNUM<=:B",
                     sqlOrigen:"SELECT * FROM (SELECT * FROM SWISSMOVI.EMOVTPERFIL_PROMOCIONVENTA  WHERE PERFIL_ID =:ID ORDER BY ID ASC) PE WHERE  PE.ID>=:A AND ROWNUM<=:B",
                    parametrosBusqueda:["registroInterno.perfil"],
                    parametrosBusquedaValores:[], //Este array indica que se utilizaran paraemtros como el A que es id de donde empezara a leer y B que es la 
                  //  parametrosBusquedaValores:[],//Este array indica que se utilizaran paraemtros como el A que es id de donde empezara a leer y B que es la cantidad de registros a traer
                    registroTipoCamposNumericos:{
                        "ID":"INTEGER",
                        "ITEM_ID":"INTEGER",
                        "DIAS":"INTEGER",
                        "VENTA":"REAL",
                        "ESTABLECIMIENTO_ID":"INTEGER",
                        "PROMOCIONVENTA_ID":"INTEGER",
                         "LOTE_ID":"INTEGER"

                    },
                    registroMongo:{
                        registroMovil:{
                            id:"ID",
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
                            lote_id:"LOTE_ID"
                            arrayJson1:{
                                sqlOrigen:"SELECT * FROM SWISSMOVI.EMOVTPROMOCION_BONIFICACION  WHERE MPROMOCIONVENTA_ID =:ID ORDER BY ID ASC",
                                parametrosBusqueda:["registroInterno.emovtitem_promocionventa"],
                                parametrosBusquedaValores:[],//Este array indica que se utilizaran paraemtros como el A que es id de donde empezara a leer y B que es la cantidad de registros a traer
                                etiqueta:"infoBonifica",
                                registroMovil:{
                                    id:"ID",
                                    mitem_id:"MITEM_ID",
                                    bonificacion:"BONIFICACION",
                                    descripcion:"INFOITEM",
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
                    coleccionBK:"emccarteraBK",
                    diccionario:false,
                    sincronizar:true,
                    iteracionPorPerfil:true,
                    movil:{tabla:"emovtcartera", crear:true, espejo:true, sql:"SELECT * FROM SWISSMOVI.EMOVTCARTERA where rownum = 1", secuencia:"SWISSMOVI.emovscartera"},
                    referencias:[{tabla:"emovtcartera_detalle",campofk:"MCARTERA_ID"},{tabla:"emovtafecta",campofk:"MCARTERA_ID"}],
                    sqlOrigen:"SELECT * FROM (SELECT C.* FROM SWISSMOVI.EMOVTCARTERA C JOIN SWISSMOVI.EMOVTPERFIL_ESTABLECIMIENTO PE ON PE.ID = C.MPERFILESTABLECIMIENTO_ID  WHERE  PE.MPERFIL_ID=:ID AND ROWNUM<=100 ORDER BY C.ID ASC) PEA WHERE  PEA.ID>=:A AND ROWNUM<=:B ",
                    parametrosBusqueda:["registroInterno.perfil"],
                    parametrosBusquedaValores:[],
                    registroTipoCamposNumericos:{
                        "MPERFILESTABLECIMIENTO_ID":"INTEGER",
                        "PRECARTERA_ID":"INTEGER",
                        "SECUENCIAL":"INTEGER"
                    },
                    registroMongo:{
                        registroMovil:{
                            id:"ID",
                            mperfilestablecimiento_id:"MPERFILESTABLECIMIENTO_ID",
                            preimpreso:"PREIMPRESO",
                            secuencial:"SECUENCIAL",
                            fechacreacion:"FECHACREACION",
                            dispositivo:"DISPOSITIVO",
                            precartera_id:"PRECARTERA_ID",
                            estado:"ESTADO",
                            comentario:"COMENTARIO"
                        }
                    }
                };//FIN DEL JSON
};
EntidadesMongoOracle.prototype.getJsonCarteraDetalle = function(){
    return {
                    coleccion:"emccarteraDetalle",
                    coleccionBK:"emccarteraDetalleBK",
                    diccionario:false,
                    iteracionPorPerfil:true,
                    movil:{tabla:"emovtcartera_detalle", crear:true, espejo:true, sql:"SELECT * FROM SWISSMOVI.EMOVTCARTERA_DETALLE where rownum = 1", secuencia:"SWISSMOVI.emovscartera_detalle"},
                    sqlOrigen:"SELECT * FROM (SELECT CD.* FROM SWISSMOVI.EMOVTCARTERA_DETALLE CD JOIN SWISSMOVI.EMOVTCARTERA C ON CD.MCARTERA_ID = C.ID JOIN SWISSMOVI.EMOVTPERFIL_ESTABLECIMIENTO PE ON PE.ID = C.MPERFILESTABLECIMIENTO_ID  WHERE  CD.MCARTERA_ID IN (SELECT C.ID FROM SWISSMOVI.EMOVTCARTERA C JOIN SWISSMOVI.EMOVTPERFIL_ESTABLECIMIENTO PE ON PE.ID = C.MPERFILESTABLECIMIENTO_ID  WHERE  PE.MPERFIL_ID=:ID AND ROWNUM<=500)  ORDER BY CD.ID ASC)  PEA WHERE  PEA.ID>=:A AND ROWNUM<=:B ",
                    parametrosBusqueda:["registroInterno.perfil"],
                    parametrosBusquedaValores:[],
                    referencias:[{tabla:"emovtafecta",campofk:"MDETALLECREDITO_ID"}],
                    registroTipoCamposNumericos:{
                        "MFORMAPAGO_ID":"INTEGER",
                        "MDOCUMENTO_ID":"INTEGER",
                        "VALOR":"REAL",
                        "SALDO":"REAL",
                        "MCUENTABANCARIA_ID":"INTEGER",
                        "MBANCO_ID":"INTEGER",
                        "MCARTERA_ID":"INTEGER",
                        "FACTURAREFERENCIA_ID":"INTEGER",
                        "FECHACARTERA":"INTEGER",
                        "FECHAVENCIMIENTO":"INTEGER",
                        "FECHAFINANCIERA":"INTEGER",
                        "FECHADOCUMENTO":"INTEGER"


                    },
                    updateOrigen:"",
                    registroMongo:{
                        registroMovil:{
                            id:"ID",
                            mformapago_id:"MFORMAPAGO_ID",
                            mdocumento_id:"MDOCUMENTO_ID",
                            valor:"VALOR",
                            saldo:"SALDO",
                            referencia:"REFERENCIA",
                            cuenta:"CUENTA",
                            fechacartera:"FECHACARTERA",
                            fechavencimiento:"FECHAVENCIMIENTO",
                            fechafinanciera:"FECHAFINANCIERA",
                            fechadocumento:"FECHADOCUMENTO",
                            mcuentabancaria_id:"MCUENTABANCARIA_ID",
                            mbanco_id:"MBANCO_ID",
                            identificacion:"IDENTIFICACION",
                            razonsocial:"RAZONSOCIAL",
                            mcartera_id:"MCARTERA_ID",
                            facturareferencia_id:"FACTURAREFERENCIA_ID"
                        }
                    }
                };//FIN DEL JSON
};
EntidadesMongoOracle.prototype.getJsonAfecta = function(){
    return {
                    coleccion:"emcafecta",
                    coleccionBK:"emcafecta",
                    diccionario:false,
                    iteracionPorPerfil:true,
                    movil:{tabla:"emovtafecta", crear:true, espejo:true, sql:"SELECT * FROM SWISSMOVI.EMOVTAFECTA where rownum = 1",secuencia:"SWISSMOVI.emovsafecta"},
                    sqlOrigen:"SELECT * FROM (SELECT A.* FROM SWISSMOVI.EMOVTAFECTA A JOIN SWISSMOVI.EMOVTCARTERA_DETALLE CD ON CD.ID = A.MDETALLECREDITO_ID JOIN SWISSMOVI.EMOVTCARTERA C ON C.ID=CD.MCARTERA_ID JOIN SWISSMOVI.EMOVTPERFIL_ESTABLECIMIENTO PE ON PE.ID = C.MPERFILESTABLECIMIENTO_ID WHERE  CD.MCARTERA_ID IN (SELECT C.ID FROM SWISSMOVI.EMOVTCARTERA C JOIN SWISSMOVI.EMOVTPERFIL_ESTABLECIMIENTO PE ON PE.ID = C.MPERFILESTABLECIMIENTO_ID  WHERE  PE.MPERFIL_ID=:ID AND ROWNUM<=500)  ORDER BY CD.ID ASC)  PEA WHERE  PEA.ID>=:A AND ROWNUM<=:B ",
                    parametrosBusqueda:["registroInterno.perfil"],
                    parametrosBusquedaValores:[],
                    registroTipoCamposNumericos:{
                        "MDETALLECREDITO_ID":"INTEGER",
                        "MDETALLEDEBITO_ID":"INTEGER",
                        "VALOR":"REAL"
                    },
                    updateOrigen:"",
                    registroMongo:{
                        registroMovil:{
                            id:"ID",
                            mdetallecredito_id:"MDETALLECREDITO_ID",
                            mdetalledebito_id:"MDETALLEDEBITO_ID",
                            valor:"VALOR",
                            fechaafecta:"FECHAAFECTA"
                        }
                    }
                };//Fin del json
};

EntidadesMongoOracle.prototype.getJsonOrden = function(){
    return {
                    coleccion:"emcorden",
                    diccionario:false,
                    sincronizar:true,
                    iteracionPorPerfil:true,
                    movil:{tabla:"emovtorden", crear:true, espejo:true, sql:"SELECT * FROM SWISSMOVI.EMOVTORDEN where rownum = 1",secuencia:"SWISSMOVI.emovsorden"},
                    referencias:[{tabla:"emovtorden_detalle",campofk:"MORDEN_ID"},{tabla:"emovtorden_condicion",campofk:"MORDEN_ID"}],
                    sqlOrigen:"SELECT * FROM (SELECT C.* FROM SWISSMOVI.EMOVTORDEN C JOIN SWISSMOVI.EMOVTPERFIL_ESTABLECIMIENTO PE ON PE.ID = C.MPERFILESTABLECIMIENTO_ID  WHERE  PE.MPERFIL_ID=:ID AND ROWNUM<=200 ORDER BY C.ID ASC) PEA WHERE  PEA.ID>=:A AND ROWNUM<=:B",
                    parametrosBusqueda:["registroInterno.perfil"],
                    parametrosBusquedaValores:[],
                    registroTipoCamposNumericos:{
                        "MPERFILESTABLECIMIENTO_ID":"INTEGER",
                        "DIRECCION":"INTEGER",
                        "MTIPOPAGODETALLE_ID":"INTEGER",
                        "ORDEN_ID":"INTEGER",
                        "MBODEGA_ID":"INTEGER",
                        "FECHACREACION":"INTEGER"
                    },
                    updateOrigen:"",
                    registroMongo:{
                        registroMovil:{
                            id:"ID",
                            mperfilestablecimiento_id:"MPERFILESTABLECIMIENTO_ID",
                            dispositivo:"DISPOSITIVO",
                            estado:"ESTADO",
                            fechacreacion:"FECHACREACION",
                            mtipopagodetalle_id:"MTIPOPAGODETALLE_ID",
                            orden_id:"ORDEN_ID",
                            mbodega_id:"MBODEGA_ID",
                            direccion:"DIRECCION",
                            comentario:"COMENTARIO",
                            observacion:"OBSERVACION",
                            emailcopia:"EMAILCOPIA",
                            token:"TOKEN",
                            hash:"HASH",
                            mensaje:"MENSAJE"
                        }
                    }
                };//Fin del json
};
EntidadesMongoOracle.prototype.getJsonOrdenDetalle = function(){
    return {
                    coleccion:"emcordenDetalle",
                    diccionario:false,
                    sincronizar:true,
                    iteracionPorPerfil:true,
                    movil:{tabla:"emovtorden_detalle", crear:true, espejo:true, sql:"SELECT * FROM SWISSMOVI.EMOVTORDEN_DETALLE where rownum = 1",secuencia:"SWISSMOVI.emovsorden_detalle"},
                    sqlOrigen:"SELECT * FROM (SELECT CD.* FROM SWISSMOVI.EMOVTORDEN_DETALLE CD JOIN SWISSMOVI.EMOVTORDEN C ON CD.MORDEN_ID = C.ID JOIN SWISSMOVI.EMOVTPERFIL_ESTABLECIMIENTO PE ON PE.ID = C.MPERFILESTABLECIMIENTO_ID  WHERE  CD.MORDEN_ID IN (SELECT C.ID FROM SWISSMOVI.EMOVTORDEN C JOIN SWISSMOVI.EMOVTPERFIL_ESTABLECIMIENTO PE ON PE.ID = C.MPERFILESTABLECIMIENTO_ID  WHERE  PE.MPERFIL_ID=:ID AND ROWNUM<=1500)  ORDER BY CD.ID ASC)  PEA WHERE  PEA.ID>=:A AND ROWNUM<=:B",
                    parametrosBusqueda:["registroInterno.perfil"],
                    parametrosBusquedaValores:[],
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
                        "MPROMOCIONBONIFICACION_ID":"INTEGER",
                        "LOTE_ID":"INTEGER"
                    },
                    updateOrigen:"",
                    registroMongo:{
                        registroMovil:{
                            id:"ID",
                            morden_id:"MORDEN_ID",
                            mitem_id:"MITEM_ID",
                            mpromocionventa_id:"MPROMOCIONVENTA_ID",
                            precio:"PRECIO",
                            descuento:"DESCUENTO",
                            impuesto1:"IMPUESTO1",
                            impuesto2:"IMPUESTO2",
                            impuesto3:"IMPUESTO3",
                            cantidad:"CANTIDAD",
                            mpromocionbonificacion_id:"MPROMOCIONBONIFICACION_ID",
                            preciooriginal:"PRECIOORIGINAL",
                            descuentooriginal:"DESCUENTOORIGINAL",
                            hash:"HASH",
                            lote_id:"LOTE_ID"
                        }
                    }
                };//Fin del json
};
EntidadesMongoOracle.prototype.getJsonOrdenCondicion = function(){
    return {
                    coleccion:"emcordencondicion",
                    diccionario:false,
                    sincronizar:true,
                    iteracionPorPerfil:true,
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
EntidadesMongoOracle.prototype.isColeccionesTipoDiccionario = function(coleccion, callback){
    obj = new EntidadesMongoOracle();
   
   return Object.getOwnPropertyNames( EntidadesMongoOracle.prototype ).filter(function(a){
            if(a.indexOf("getJson")>=0 && obj[a]() &&  obj[a]().diccionario===true && obj[a]().coleccion===coleccion){
               return true;
            }else{
                return false;
            }
    });

   
};

EntidadesMongoOracle.prototype.getColeccionesParaActualizar = function(tablas){
    obj = new EntidadesMongoOracle();
    return Object.getOwnPropertyNames( EntidadesMongoOracle.prototype ).filter(function(a){
            if(a.indexOf("getJson")>=0 && obj[a]()){
                tablas.forEach(function(tablaOracle){
                    if(obj[a]().sqlOrigen && obj[a]().sqlOrigen.toLowerCase().indexOf(tablaOracle.toLowerCase())>=0 ){
                       
                        return true;
                    }
                });
                    
                    
                
               
            }else{
                return false;
            }
    });

   
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
        if(key.indexOf("arrayJson")<0){
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
            if(key.indexOf("arrayJson")<0  && key != "id"){

                campos.push(key + (json.registroTipoCamposNumericos && json.registroTipoCamposNumericos[key.toUpperCase()] ?" " + json.registroTipoCamposNumericos[key.toUpperCase()]:" TEXT"));
            }
        }
    }
    if(espejo){
        return scritpEspejo.replace(/#TABLA/g, json.movil.tabla).replace("#COLUMNAS", campos.join(",").replace("_valor_","").replace("_json_","") );
    }else{
        return scritpA.replace(/#TABLA/g, json.movil.tabla).replace("#COLUMNAS", campos.join(",").replace("_valor_","").replace("_json_","") );
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


EntidadesMongoOracle.prototype.getValidacionesSql = function(){
    entidesMonogoDB = new EntidadesMongoOracle();
    return Object.getOwnPropertyNames( EntidadesMongoOracle.prototype ).reduce(function(res, a){
                        if(a.indexOf("getJson")>=0 && entidesMonogoDB[a]() &&  (entidesMonogoDB[a]().validacionSql)){
                            var validacionSql = entidesMonogoDB[a]().validacionSql;
                            if(entidesMonogoDB[a]().movil && entidesMonogoDB[a]().movil.tabla){
                              
                                validacionSql.tabla = entidesMonogoDB[a]().movil.tabla;
                            }
                           res.push(validacionSql);
                        }
                        return res;
                    },[]);
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
