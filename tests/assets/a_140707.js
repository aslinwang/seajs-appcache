define('a', function(require, exports){
  exports.name = 'a';

  exports.sayHi = function(name){
    name = name || '';
    console.log('hi,' + name);
  }

  console.log('a.js');
});