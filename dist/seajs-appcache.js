!function(){seajs.Module,seajs.data,seajs.on("load",function(a){console.log(a,"load")}),seajs.on("fetch",function(a){a.uri=a.uri+"?v=1",console.log(a,"fetch")}),seajs.on("request",function(a){console.log(a,"request"),console.log("abcdefghi")}),define("seajs/seajs-appcache/1.0.1/seajs-appcache",[],{})}();