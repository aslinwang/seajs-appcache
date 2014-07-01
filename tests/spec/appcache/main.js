seajs.config({
	base : "./appcache",
	test : true	
});

seajs.use('../../dist/seajs-appcache-debug', function(){
	seajs.use('init');
});
