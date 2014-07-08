define('c', function(require, exports){
  exports.name = 'c';

  exports.sayHi = function(name){
    name = name || '';
    console.log('hi,' + name);
  }

  exports.work = function(){
    console.log('good good study');
  };

  console.log('c.js');
});