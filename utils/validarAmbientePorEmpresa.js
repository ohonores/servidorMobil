var os = require( 'os' );

var networkInterfaces = os.networkInterfaces( );
var ip;
try{
    ip =  networkInterfaces.ens32.filter(function(ip){if (ip && ip.family && ip.family == "IPv4"){console.log(ip.address);return true;}})[0].address;
}catch(error){
    ip=null;
}
if(!ip){
    try{
        ip =  networkInterfaces.eth0.filter(function(ip){if (ip && ip.family && ip.family == "IPv4"){console.log(ip.address);return true;}})[0].address;
    }catch(error){

    }
}


if(JSON.parse(process.env.VALIDACIONIPS)[process.env.GRUPO] != ip){
    console.log("LA IP DEL SERVIDOR ACTUAL ", ip, "NO**************** COINCIDE CON LA IP CONFIGURADA EN EL ARCHIVO bin/variablesProduccion");
    process.exit(0);
}else{
    console.log("LA IP DEL SERVIDOR ACTUAL ", ip, "COINCIDE CON LA IP CONFIGURADA EN EL ARCHIVO bin/variablesProduccion");
}


