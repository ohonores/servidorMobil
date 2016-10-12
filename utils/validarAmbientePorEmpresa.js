var os = require( 'os' );

var networkInterfaces = os.networkInterfaces( );
console.log(networkInterfaces);
var ip;
var ipEncontrada = false;
for( key in networkInterfaces){
     ip =  networkInterfaces[key].filter(function(ip){if (ip && ip.family && ip.family == "IPv4"){console.log(ip.address);return true;}})[0].address;
     if(JSON.parse(process.env.VALIDACIONIPS)[process.env.GRUPO] == ip){
        ipEncontrada = true;
        break;
    }else{
        console.log("LA IP DEL SERVIDOR ACTUAL ", ip, "NO**************** COINCIDE CON LA IP CONFIGURADA EN EL ARCHIVO bin/variablesProduccion");
        
       
    }
}
if(ipEncontrada){
    console.log("LA IP DEL SERVIDOR ACTUAL ", ip, "COINCIDE CON LA IP CONFIGURADA EN EL ARCHIVO bin/variablesProduccion");
}else{
    process.exit(0);
}
/*try{
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
if(!ip){
    try{
        ip =  networkInterfaces.eth1.filter(function(ip){if (ip && ip.family && ip.family == "IPv4"){console.log(ip.address);return true;}})[0].address;
    }catch(error){

    }
}


if(JSON.parse(process.env.VALIDACIONIPS)[process.env.GRUPO] != ip){
    console.log("LA IP DEL SERVIDOR ACTUAL ", ip, "NO**************** COINCIDE CON LA IP CONFIGURADA EN EL ARCHIVO bin/variablesProduccion");
    process.exit(0);
}else{
    console.log("LA IP DEL SERVIDOR ACTUAL ", ip, "COINCIDE CON LA IP CONFIGURADA EN EL ARCHIVO bin/variablesProduccion");
}*/


