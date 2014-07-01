/**
 * The Sea.js plugin for appcache and increjs 
 * localStorage,version,increjs
 * 	MI.define
 * 	MI.app
 * 	MI.appcache
 * 	MI.S
 *
 * 	test framework:mocha+should.js
 */

var Module = seajs.Module
var FETCHING = Module.STATUS.FETCHING

var data = seajs.data
var comboHash = data.comboHash = {}

//seajs.on("load", setComboHash)
//seajs.on("fetch", setRequestUri)

