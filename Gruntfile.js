module.exports = function(grunt){
  grunt.initConfig({
    uglify: {
      app: {
        src:'public/edi-docElectronicos/app/app.js',
        dest:'public/edi-docElectronicos/jsminificado/app.min.js'
      },
      
      oracleMongo: {
        src:'utils/OracleMongo.js',
        dest:'utils/gruntfiles/OracleMongo.min.js'
      },
      jsonEntity: {
        src:'utils/jsonEntity.js',
        dest:'utils/gruntfiles/jsonEntity.min.js'
      },
    sqlCliente: {
        src:'utils/sqliteCliente.js',
        dest:'utils/gruntfiles/sqliteCliente.min.js'
      },
    ego: {
        src:'utils/geoLocalizacion.js',
        dest:'utils/gruntfiles/geoLocalizacion.min.js'
      },
    public: {
        src:'routes/publicas/serviciospublicos.js',
        dest:'utils/gruntfiles/serviciospublicos.min.js'
      }
     
    }
  });
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.registerTask('default',['uglify']);
};
