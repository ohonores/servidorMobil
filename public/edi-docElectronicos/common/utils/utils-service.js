angular.module('uiRouterDocElectronicos.utils.service', [

])

.factory('utils', function () {
  var reg = /^(((0[1-9]|[12]\d|3[01])\/(0[13578]|1[02])\/((19|[2-9]\d)\d{2}))|((0[1-9]|[12]\d|30)\/(0[13456789]|1[012])\/((19|[2-9]\d)\d{2}))|((0[1-9]|1\d|2[0-8])\/02\/((19|[2-9]\d)\d{2}))|(29\/02\/((1[6-9]|[2-9]\d)(0[48]|[2468][048]|[13579][26])|((16|[2468][048]|[3579][26])00))))$/g;
  return {
    // Util for finding an object by its 'id' property among an array
    findById: function findById(a, id) {
      for (var i = 0; i < a.length; i++) {
        if (a[i].id == id) return a[i];
      }
      return null;
    },
	 // Util for finding an object by its 'id' property among an array
    findByKey: function findById(a, key) {
		return a[key];
    },

    // Util for returning a random key from a collection that also isn't the current key
    newRandomKey: function newRandomKey(coll, key, currentKey){
      var randKey;
      do {
        randKey = coll[Math.floor(coll.length * Math.random())][key];
      } while (randKey == currentKey);
      return randKey;
    },
	/******
		Validacion de fechas
	*************/
	formatDateV2 = function formatDateV2(d) {
			  if(d instanceof Date){
				return true;
			  }
			  if(d.split('/').length == 2){
				return true;
			  }
			  if(d.split('-').length == 2){
				return true;
			  }
			  
			  var dd = d.slice(0,2);
			  
			  if ( dd.length < 2 ) dd = '0' + dd
			  var mm = d.slice(2,4)
			  if ( mm.length < 2 ) mm = '0' + mm
			  var yy = d.slice(4,8);
			 
			  if (reg.test(dd+'/'+mm+'/'+yy)) {
				return true;
			  }else{
				return false;
			  }
		  
		 
	}
  };
});