var nodemailer = require('nodemailer');

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



var Email = function(){

}
Email.prototype.enviarEmail(datos){
    mailOptions.to  = datos.to;
    mailOptions.subject  = "Ecuaquimica recibo de pago #numero".replace("#numero",datos.numero);
    mailOptions.html  = "Estimado #cliente hemos recibido su pago, realizado el día #fecha con nuestro vendedor #vendedor.<br> Forma de pago #fpago # #cantidad";
    // send mail with defined transport object
    transporter.sendMail(mailOptions, function(error, info){
        if(error){
            return console.log(error);
        }
        console.log('Message sent: ' + info.response);
    });

}
module.exports = new Email();
