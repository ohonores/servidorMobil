var Menus = function() {
    this.menuPrincipal = [
                        {
                            "nombre":"Documentos",
                            "estado":true,
                            "icono":"icon-folder-close-alt",
                            "seleccionado":true,
                            "codigo":"10",
                            "perfiles":"edi,admin"
                        },
                        {
                            "nombre":"Productos Consumidos",
                            "estado":true,
                            "icono":"icon-shopping-cart",
                            "seleccionado":false,
                            "codigo":"40",
                            "perfiles":"admin"
                        },
                        {
                            "nombre":"Impuestos Retenidos",
                            "estado":true,
                            "icono":"icon-suitcase",
                            "seleccionado":false,
                            "codigo":"90",
                            "perfiles":""
                        },
                        {
                            "nombre":"Mis datos",
                            "estado":true,
                            "icono":"icon-user",
                            "seleccionado":false,
                            "codigo":"50",
                            "perfiles":"edi,admin"
                        },
                        {
                            "nombre":"Soperte en l\u00EDnea",
                            "estado":true,
                            "icono":"icon-male",
                            "seleccionado":false,
                            "codigo":"80",
                            "perfiles":"edi,admin"
                        },
                        {
                            "nombre":"Configuraci\u00F3n",
                            "estado":true,
                            "icono":"icon-cog",
                            "seleccionado":false,
                            "codigo":"70",
                            "perfiles":"admin",
                            "submenu":[
                                        {
                                            "nombre":"Web Service",
                                            "estado":true,
                                            "icono":"icon-cloud-upload",
                                            "seleccionado":false,
                                            "url":"/administracion-edi"
                                        },
                                        {
                                            "nombre":"Usuarios conectados",
                                            "estado":true,
                                            "icono":"icon-male",
                                            "seleccionado":false,
                                            "url":"/usuarios-conectados"
                                        },
                                        {
                                            "nombre":"Robots",
                                            "estado":true,
                                            "icono":"icon-group",
                                            "seleccionado":false,
                                            "url":"/administracion-robots/ingresar"
                                        },
                                        {
                                            "nombre":"Notificaciones",
                                            "estado":true,
                                            "icono":"icon-refresh",
                                            "seleccionado":false,
                                            "submenunoti":
                                            true
                                        }
                                    ]
                        },
                        {
                            "nombre":"Subir archivo",
                            "estado":true,
                            "icono":"icon-file",
                            "seleccionado":false,
                            "codigo":"100",
                            "perfiles":"admin"
                        }
                    ]

}

module.exports = new Menus();
