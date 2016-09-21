process.env.NODE_ENV="development";
process.env.GRUPO="2"; //1:: EQ //2::CO //3::FA //4::QU //5::SW
process.env.REDIS=1;

process.env.DOMINIO='{"1":"http://documentos.ecuaquimica.com.ec:8080","2":"http://www.conauto.com.ec:56794"}'
//process.env.DOMINIO="http://www.conauto.com.ec:56794";
//process.env.DOMINIO="http://documentos.farmagro.com:8080";
process.env.BDS="/u02/movil/sqlite/bds/"
process.env.ZIPSSQLITE="/u02/movil/zipsSqls/"
process.env.UV_THREADPOOL_SIZE=10