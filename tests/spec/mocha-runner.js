/**
 * Run test specs in mocha environment
 */

var should = require('should');

describe('mocha demo', function(){
	it('should return a number', function(){
		var a = 4;
		a.should.be.a.Number;
	});
	it('should return a string', function(){
		var num = '4';
		num.should.be.a.String;
	});
})
