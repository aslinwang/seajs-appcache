var chokidar = require('chokidar');
var exec = require('child_process').exec;

var connect = require('connect');
var serverStatic = require('serve-static');

connect().use(serverStatic(__dirname)).listen(5555, function(){
  console.log('Static Server listening on port 5555');
});

if(process.argv.indexOf('-w') != -1){
  var watch = chokidar.watch('../', {ignored : /[\/\\]\./, persistent : true});
  watch.on('change', function(path){
    exec('seatools build', function(err, stdout, stderr){
      console.log(stdout);
      if(stderr){
        console.log('stderr: ' + stderr);
      }
    });
  })
  .on('error', function(error){
    console.error('Error happened', error);
  });
}