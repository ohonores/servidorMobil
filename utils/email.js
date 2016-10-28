var bunyan = require('bunyan');
var log = bunyan.createLogger({name: "enviar-email"});
log.info("hi");
var nodemailer = require('nodemailer');
var from;
var empresa;
var transporter;
var Email = function(conf, from_, empresa_){
    /*Ejemplo de la variable conf
        var smtpConfig = {
            host: '192.168.1.13',
            port: 25,
            debug:true,
            logger:log
        };
    */
    if(!conf){
        throw new Error('No se encontro el SMTP');
    }
    if(conf.debug){
        conf.logger = log;
    }
    transporter = nodemailer.createTransport(conf);
    from = from_;
    empresa = empresa_;
}

Email.prototype.enviarEmail = function(opciones, mensajeHtml){
    try{
        if (opciones && opciones.from && opciones.to && opciones.subject) {
            opciones.from = opciones.from.replace("#from",from).replace("#empresa",empresa);
            opciones.subject = opciones.subject.replace("#empresa",empresa);
            opciones.html = mensajeHtml;
            /* Eejmplo
            var opciones = {
                from: '"Ecuaquimica recibos de pago" <eq-ecuaquimica@ecuaquimica.com.ec>', // sender address
                to: 'ohonores@hotmail.com', // list of receivers
                subject: 'Hello ?', // Subject line
                text: 'Hello world ??', // plaintext body
                html: '<b>Hello world ??</b>' // html body
            };
            */
            transporter.sendMail(opciones, function(error, info){
                if(error){
                    return console.log(error);
                }
                console.log(info);
            });
        }
    }catch(error){
        console.log(error);
    }
}

module.exports = Email;


