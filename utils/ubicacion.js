var request = require("request");
var UbicacionIp = function(){};
/**********************************************
GET UBICACION DE LA IP
SE UTILIZO UN WEB SERVICE GRATUITO LLAMADO:
https://freegeoip.net
Ejemplo: https://freegeoip.net/json/200.31.25.34
Resultado: {"ip":"200.31.25.34","country_code":"EC","country_name":"Ecuador","region_code":"P","region_name":"Provincia de Pichincha","city":"Quito","zip_code":"","time_zone":"America/Guayaquil","latitude":-0.217,"longitude":-78.5,"metro_code":0}

http://ip.pycox.com
Ejemplo: http://ip.pycox.com/json/64.27.57.24
Resultado: {"site": "http://ip.pycox.com", "city": "Quito", "region_name": "Pichincha", "region": "18", "area_code": 0, "time_zone": "America/Guayaquil", "longitude": -78.5, "metro_code": 0, "country_code3": "ECU", "latitude": -0.2167000025510788, "postal_code": null, "dma_code": 0, "country_code": "EC", "country_name": "Ecuador", "q": "200.31.25.34"}
***********************************************/

UbicacionIp.prototype.getUbicacionIp = function(ip, respuesta){
    if(ip.replace("::ffff:","").startsWith("192.1") || ip.replace("::ffff:","").startsWith("local") ||ip =="::1"){
        console.log("getUbicacionIp es localll");
        respuesta({ubicacion:"red local"});
    }
    // Set las cabeceras
    var headersA = {
	'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
	'Accept-Language':'es-ES,es;q=0.8,en;q=0.6',
	'Cache-Control':'max-age=0',
	'Connection':'keep-alive',
	'Host':'ip-json.rhcloud.com',
	//'If-None-Match':"40c768c9fae643f5bc12870a13cedf3a425fb3a9",
	'User-Agent':'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.90 Safari/537.36'
    }

    request({
		uri: "http://ip-json.rhcloud.com/json/"+ip,
		method: "GET",
		headers: headersA,
		timeout : 8000
	//	rejectUnauthorized: false,
	}, function(error, response, body) {
	   if(error){
			respuesta({error:true,mensaje:error,ip:ip});
	   }else{
			if(response && response.statusCode == 200 ){
                if(body && body.indexOf('error')>=0){
                    respuesta({error:true,mensaje:JSON.parse(body),ip:ip});
                }
				respuesta(body);
			}else{
				respuesta({error:true,mensaje:'No encontrada'});
			}
	   }


   });
   //
}
module.exports  = new UbicacionIp();
