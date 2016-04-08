
var UAParser = require('ua-parser-js');
var parser = new UAParser();
TipoBrowser = function(){


}
TipoBrowser.prototype.browser = function(req, grabar){
        return parser.setUA(req.headers['user-agent']).getResult().browser;
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
