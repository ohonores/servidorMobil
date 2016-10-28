var bunyan = require('bunyan');
var log = bunyan.createLogger({name: "myapp"});
log.info("hi");
var nodemailer = require('nodemailer');
var smtpConfig = {
    host: '192.168.1.13',
    port: 25,
    debug:true,
     logger:log 
    /*secure: true, // use SSL
    auth: {
        user: 'user@gmail.com',
        pass: 'pass'
    }*/
};
// create reusable transporter object using the default SMTP transport
//var transporter = nodemailer.createTransport('smtp://192.168.1.13');
var transporter = nodemailer.createTransport(smtpConfig);
// setup e-mail data with unicode symbols
var mailOptions = {
    from: '"Ecuaquimica recibos de pago" <eq-ecuaquimica@ecuaquimica.com.ec>', // sender address
    to: 'ohonores@hotmail.com', // list of receivers
    subject: 'Hello ?', // Subject line
    text: 'Hello world ??', // plaintext body
    html: '<b>Hello world ??</b>' // html body
};

// send mail with defined transport object
transporter.sendMail(mailOptions, function(error, info){
    if(error){
        return console.log(error);
    }
    console.log(info);
});
