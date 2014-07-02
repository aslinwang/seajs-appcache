//cp - 复制
if(process.argv.length != 4){
  return;
}

var fs = require('fs');

var src = process.argv[2];
var dest = process.argv[3];

fs.createReadStream(src).pipe(fs.createWriteStream(dest));