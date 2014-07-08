/**
 * js基础工具库
 * @author:dreamjet.wang@gmail.com
 */
!function (name, definition) {
  if (typeof define == 'function' && typeof define.amd  == 'object') define(definition);
  else this[name] = definition();
}('gear', function () {
  var gear = {};

  gear.isObject = function(o){
    return typeof o == 'object';
  };

  /**
   * 递归深入合并（同一层级，同一类型不会产生覆盖）
   * @example
   * obj = gear.extend({a:{a:1,b:2},b:2,c:3}, {a:{c:3},b:3,d:4});//返回{a:{a:1,b:2,c:3},b:3,c:3,d:4}
   * obj = Zepto.extend({a:{a:1,b:2},b:2,c:3}, {a:{c:3},b:3,d:4});//返回{a:{c:3},b:3,c:3,d:4}
   */
  gear.extend = function(){
    var args = arguments;
    var target = args[0];

    for(var i = 1; i < args.length; i++){
      var options = args[i];
      if(options){
        for(var name in options){
          if(gear.isObject(target[name]) && gear.isObject(options[name])){
            gear.extend(target[name], options[name]);
          }
          else{
            target[name] = options[name];
          }
        }
      }
    }
    return target;
  };

  return gear;
});