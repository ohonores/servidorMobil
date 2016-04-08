var email   = require("emailjs");

var Email = function(){

}
//Establecer credenciales:
Email.prototype.buscarCredenciales = function(empresa_id, callback){


}

Email.prototype.setCredendiales = function(empresa_id, callback){
    this.buscarCredenciales(empresa_id, function(estado, res, to){
        if(estado){

          var server  = email.server.connect({
             user:    res.cuenta,
             password:res.password,
             host:    res['mail.smtp.host'],
             port:    465,
             ssl:     true

          });
          callback(true, server,res["email.emisor"], to["email"])

        }else{
          callback(false, null);
        }
     })//buscarCredenciales
};
Email.prototype.enviarEmail = function(empresa_id, mensaje, subject, callback){
    console.log("mensaje");
    this.setCredendiales(empresa_id, function(estado, server, froma, toa){

        if(estado){
            var message = {
            from : froma,
            to : "ohonores@hotmail.com",
            subject: subject,
            attachment:
            [
               {data:"<html>"+mensaje+"</html>", alternative:true}

            ]
            }
            server.send(message, function(err, message) { console.log(err || message); });
        }
    });
    callback();
}
module.exports = new Email();
