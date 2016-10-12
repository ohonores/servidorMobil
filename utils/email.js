var email   = require("emailjs");
var server;
var from;
var empresa;
var Email = function(conf, from_, empresa_){
    console.log(conf);
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
            console.log(opciones);
            console.log(mensajeHtml)
            server.send(opciones, function(err, opciones) { if(err){console.log(err);}else{console.log("Email enviado");}  });
        }
    }catch(error){
        console.log(error);
    }
    
}

function prueba (opciones, mensajeHtml){
    try{
       
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

/*
process.env.SMPS = '{"1":{"user":"e-doceq","password":"e-doceq","host":"192.168.1.13","ssl":true,"port":465,"tls":true},"2":{"user":"swissystem","password":"swissystem","host":"192.168.1.242","ssl":true,"port":465,"tls":true},"3":{"user":"swissystem","password":"swissystem@farmagro.com","host":"192.168.60.2","ssl":true,"port":465,"tls":true}}';
*/
var email_d = new Email({"user":"swissystem","password":"swissystem","host":"192.168.60.2","ssl":true,"port":465,"tls":true}, "swissystem@farmagro.com", "FARMAGRO");


setTimeout(function(){
    email_d.enviarEmail({from:"#from",subject:"#empresa test",to:"ohonores@hotmail.com,arobalino@ecuaquimica.com.ec"}, "<hr>TEST DESDE FARMAGRO");
    console.log("fin");
},15000);

module.exports = Email;
