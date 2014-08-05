define('b', function(require, exports){
  exports.name = 'b';

  exports.sayHi = function(name){
    name = name || '';
    console.log('hi,' + name);
  }
  
  exports.thanks = function(name){
    name = name || '';
    console.log('thank ', name);
  }

  console.log('b.js');
});