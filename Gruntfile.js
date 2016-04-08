module.exports = function(grunt){
  grunt.initConfig({
    uglify: {
      app: {
        src:'public/edi-docElectronicos/app/app.js',
        dest:'public/edi-docElectronicos/jsminificado/app.min.js'
      },
      servicios: {
        src:'public/edi-docElectronicos/app/js/servicios/servicios.js',
        dest:'public/edi-docElectronicos/jsminificado/servicios.min.js'
      },
      controladores: {
        src:'public/edi-docElectronicos/app/controlador.js',
        dest:'public/edi-docElectronicos/jsminificado/controlador.min.js'
      },
      typehead: {
        src:'public/edi-docElectronicos/app/js/typehead/movTypehead.js',
        dest:'public/edi-docElectronicos/jsminificado/movTypehead.min.js'
      }
    }
  });
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.registerTask('default',['uglify']);
};
