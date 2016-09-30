var email   = require("emailjs");
var server;
var from;
var empresa;
var Email = function(conf, from_, empresa_){
    if(!conf){
        throw new Error('No se encontro el SMTP');
    }
    server = email.server.connect("smtp",conf);
    from = from_;
    empresa = empresa_;
}

/**
    Enviar mensajes
    Parametro:
    var message = {
               //text:    "i hope this works", 
               from:    "SWISSEDI RECEPCION DE DOCUMENTOS SRI <eq-ecuaquimica@ecuaquimica.com.ec>", 
               to:      "ANTONIO VILLEGAS <avillegas@cyl.com.ec>, ORLANDO HONORES<ohonores@hotmail.com>",
               subject: "RESULTADOS EMPRESA #EMPRESA :: REFERENCIA #REFERENCIA".replace("#EMPRESA",resultado2.rows[0].descripcion).replace("#REFERENCIA",referencia.replace(ruc,"")),
              
    };
*/

Email.prototype.enviarEmail = function(opciones, mensajeHtml){
    try{
        console.log(opciones);
        console.log(mensajeHtml)
        if (opciones && opciones.from && opciones.to && opciones.subject) {
            opciones.from = opciones.from.replace("#from",from).replace("#empresa",empresa);
            opciones.subject = opciones.subject.replace("#empresa",empresa);
            opciones.attachment = [ {data:mensajeHtml, alternative:true} ];
            server.send(opciones, function(err, opciones) { if(err){console.log(err);}else{console.log("Email enviado");}  });
        }
    }catch(error){
        console.log(error);
    }
    
}


module.exports = Email;
