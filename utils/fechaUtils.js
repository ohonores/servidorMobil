var FechaUtils = function() {};

FechaUtils.prototype.formatDate = function(d,separador) {
  var mm = d.getMonth()+1
  if ( mm < 10 ) mm = '0' + mm
  var dd = d.getDate();
  if ( dd < 10 ) dd = '0' + dd



  var yy = d.getFullYear();
  if ( yy < 10 ) yy = '0' + yy

  return '\''+mm+separador+dd+separador+yy+'\''
};

FechaUtils.prototype.getParametroCondiciiones = function() {
 //MMyyyydd condicones
 var d = new Date();
 var mm = d.getMonth()+1
  if ( mm < 10 ) mm = '0' + mm
  var dd = d.getDate();
  if ( dd < 10 ) dd = '0' + dd



  var yy = d.getFullYear();
  if ( yy < 10 ) yy = '0' + yy

  return 'c'+mm+''+yy+''+dd;
};
FechaUtils.prototype.getParametroCaptcha = function() {
 //ddyyyyMM captcah
 var d = new Date();
 var mm = d.getMonth()+1
  if ( mm < 10 ) mm = '0' + mm
  var dd = d.getDate();
  if ( dd < 10 ) dd = '0' + dd



  var yy = d.getFullYear();
  if ( yy < 10 ) yy = '0' + yy

  return dd+''+yy+''+mm;
}
FechaUtils.prototype.getParametroCodigo = function() {
 //yyyyddMM codigo
 var d = new Date();
 var mm = d.getMonth()+1
  if ( mm < 10 ) mm = '0' + mm
  var dd = d.getDate();
  if ( dd < 10 ) dd = '0' + dd



  var yy = d.getFullYear();
  if ( yy < 10 ) yy = '0' + yy

  return yy+''+dd+''+mm;
};
FechaUtils.prototype.getParametroClave = function() {
 //ddMMyyyy codigo/email
 var d = new Date();
 var mm = d.getMonth()+1
  if ( mm < 10 ) mm = '0' + mm
  var dd = d.getDate();
  if ( dd < 10 ) dd = '0' + dd



  var yy = d.getFullYear();
  if ( yy < 10 ) yy = '0' + yy

  return dd+''+mm+''+yy;
};

FechaUtils.prototype.getParametroNuevaClave = function() {
 //MMddyyyy codigo/email
 var d = new Date();
 var mm = d.getMonth()+1
  if ( mm < 10 ) mm = '0' + mm
  var dd = d.getDate();
  if ( dd < 10 ) dd = '0' + dd



  var yy = d.getFullYear();
  if ( yy < 10 ) yy = '0' + yy

  return 'n'+mm+''+dd+''+yy;
};

FechaUtils.prototype.getParametroReNuevaClave = function() {
 //ddyyyyMM codigo/email, ddyyyyMM
 var d = new Date();
 var mm = d.getMonth()+1
  if ( mm < 10 ) mm = '0' + mm
  var dd = d.getDate();
  if ( dd < 10 ) dd = '0' + dd



  var yy = d.getFullYear();
  if ( yy < 10 ) yy = '0' + yy

  return 'r'+dd+''+yy+''+mm;
}
module.exports = new FechaUtils();
