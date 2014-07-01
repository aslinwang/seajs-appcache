var connect = require('connect');
var serverStatic = require('serve-static');

console.log(__dirname);
connect().use(serverStatic(__dirname)).listen(5555);
