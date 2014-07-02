(function(){
/**
 * The Sea.js plugin for appcache and increjs 
 * localStorage,version,increjs
 *  MI.define
 *  MI.app
 *  MI.appcache
 *  MI.S
 *
 *  test framework:mocha+should.js
 */

var Module = seajs.Module;
var data = seajs.data;

seajs.on("load", function(arg){
  console.log(arg, 'load');
});

seajs.on("fetch", function(arg){
  arg.uri = arg.uri + '?v=1';
  console.log(arg, 'fetch');
});

seajs.on("request", function(arg){
  console.log(arg, 'request');
  console.log('abcdefghi');
});


define("seajs/seajs-appcache/1.0.1/seajs-appcache-debug", [], {});
})();