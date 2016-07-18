
var UAParser = require('ua-parser-js');
var parser = new UAParser();

//Converter Class 
var Converter = require("csvtojson").Converter;
var converter = new Converter({});
var devices=[];

TipoBrowser = function(){


}
TipoBrowser.prototype.browser = function(req, grabar){
        return parser.setUA(req.headers['user-agent']).getResult().browser;
}
TipoBrowser.prototype.getDevice = function(user_agent, resultado){
     user_agent = user_agent.split(' ');
   // console.log("user_agent",user_agent);
     if(devices && devices.length>0){
          resultado(
              devices.filter(function(a){
                var d=false;
                user_agent.forEach(function(model){
                    if(a.Model === model){d=true}
                });
                if(d){ return true; }
                })[0]
            );
     }else{
         converter.fromFile("/home/ecuaquimica/servidores/servidorMobil/utils/devicesPlay.csv",function(err,result){
             
             devices = result;
             console.log("devicesPlay",result.length);
             resultado(
              result.filter(function(a){
                var d=false;
                user_agent.forEach(function(model){
                    if(a.Model === model){d=true}
                });
                if(d){ return true; }
                })[0]
            );
        });
        
     }
    

}
TipoBrowser.prototype.browserAceptado = function(req, res, next){
    var ua = req.headers['user-agent'];     // user-agent header from an HTTP request
    if(req.session){
        req.session.browser =  parser.setUA(ua).getResult();
    }

    switch(parser.setUA(ua).getResult().browser.name){
        case 'IE':
            if(parser.setUA(ua).getResult().browser.version>=1){
                return next();
            }else{
                res.render('versiones-anteriores/index.html');
            }
        break;
        case 'Chrome':
            var version = parser.setUA(ua).getResult().browser.version.slice(0,2);
            if(version>=10){
                return next();
            }else{
                res.render('versiones-anteriores/index.html');
            }
        break;
        case 'Firefox':
            if(parser.setUA(ua).getResult().browser.version>=4){
                return next();
            }else{
                res.render('versiones-anteriores/index.html');
            }
        break;
        default:
            return next();

    }

}
module.exports = new TipoBrowser();
