var chokidar = require('chokidar');
var exec = require('child_process').exec;

var connect = require('connect');
var serverStatic = require('serve-static');

var app = connect();
var tmpl = [
  '<!doctype html>',
  '<html>',
    '<head>',
    '<body>',
      '<a href="/demo">查看demo</a>',
    '</body>',
    '</head>',
  '</html>'
].join('');


app.use(serverStatic(__dirname)).listen(5555, function(){
  console.log('Static Server listening on port 5555');
});

app.use(function(req, res){
  res.end(tmpl);
});

if(process.argv.indexOf('-w') != -1){
  var watch = chokidar.watch('../', {ignored : /[\/\\]\./, persistent : true});
  watch.on('change', function(path){
    exec('make build', function(err, stdout, stderr){//windows下执行命令会出错，linux下不会。所以windows就手动make吧。。
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