(function(){
/**
 * The Sea.js plugin for appcache and increjs 
 * require : sea.js 3.0.0
 * 
 * localStorage,version,increjs
 *  MI.define
 *  MI.app
 *  MI.appcache
 *  MI.S
 *
 * test framework
 *  mocha+should.js+blanket.js
 *
 * @todo 
 * 1、appcache测试用例
 * 2、开发increjs node模块 increfile.js
 * 3、暂不支持IE
 * 4、holdLoad不好使，只能存callback+打标记了
 *
 * seatools build会检测语法错误
 * 
 * appCache原理：
 * 使用ajax的方式请求cdn上的js代码内容，并将其存入localStorage中
 * 版本控制方案：在文件名后追加"_140801x",如"a_140801.js","a_140801a.js"
 * 增量文件生成，可使用increjs工作(https://github.com/aslinwang/increjs)
 * 可能有跨域问题，解决方案
 *  - Access-Control-Allow-Origin:http://m.qzone.com
 *  - 将js文件存在与主站同域的CDN上
 *  - 本插件方案专为腾讯微博实现
 */

var Module = seajs.Module;
var Data = seajs.data;

/**
 * 浏览器版本
 * 
 * @type Object
 *            @example
 *            B.ie//如果是IE，返回IE的版本号(6,8,9,10,11)
 *            B.ie6
 *            B.ipad
 */
var B = (function(){ //Browser
  var b = {},
    userAgent = navigator.userAgent,
    key = {
      win : 'Windows',
      mac : 'Mac',
      ie : 'MSIE',
      ie6 : 'MSIE 6',
      ie7 : 'MSIE 7',
      ie8 : 'MSIE 8',
      ie9 : 'MSIE 9',
      safari : 'WebKit',
      webkit : 'WebKit',
      chrome : 'Chrome',
      ipad : 'iPad',
      iphone : 'iPhone',
      os4 : 'OS 4',
      os5 : 'OS 5',
      os6 : 'OS 6',
      qq : 'QQBrowser',
      firefox : 'Firefox',
      tt : 'TencentTraveler',
      opera : 'Opera',
      esobi : 'eSobiSubscriber'//http://product.esobi.com/esobi/index.jsp，@liuy使用这货
    };
  b.win = b.win || userAgent.indexOf('Win32') != -1;
  for(var item in key){
    b[item] = userAgent.indexOf(key[item]) != -1;
  };
  b.ie6 = b.ie6 && !b.ie7 && !b.ie8;
  b.opera = window['opera'] || b.opera;
  try{
    b.maxthon = window['external'] && window['external']['max_version'];//Error In Some ie8
  }catch(e){}
  //detect ie11
  var m = /(msie\s|trident.*rv:)([\w.]+)/.exec(userAgent.toLowerCase());
  if(m && m.length > 0){
    b.ie = true;
    if(m[2]){
      b.ie = parseFloat(m[2]);
    }
  }
  //@TODO 万恶的微软啊，先这样处理IE11吧，如果以后出IE12什么的要升级Trident，到时候再处理吧
  if(!!userAgent.match(/Trident\/7\./)){
    b.ie = 11;
  }
  return b;
})();

var DomReady = (function(){
  var done = false,//ready队列中的操作是否执行完毕
      loaded = false,//页面是否已经加载完全
      funcs = [],
      ie9 = navigator.userAgent.indexOf('MSIE 9') !== -1;
  var onReady = function(){
    if(!done){
      done = true;
      for(var i = 0, num = funcs.length; i < num; i++){
        if(funcs[i]){
          funcs[i]();
        }
      }
      funcs = null;
    }
  };

  var load = function(){
    if(loaded){
      return;
    }
    loaded = true;
    if(document.readyState === 'complete'){
      onReady();
    }
    else if(document.addEventListener){
      if(document.readyState === 'interactive' && !ie9){
        onReady();
      }
      else{
        document.addEventListener('DOMContentLoaded', function(){
          document.removeEventListener('DOMContentLoaded', arguments.callee, false);
          onReady();
        }, false);
      }
    }
    else if(document.attachEvent){
      var iframe = top !== self;
      if(iframe){
        document.attachEvent('onreadystatechange', function(){
          if(document.readyState === 'complete'){
            document.detachEvent('onreadystatechange', arguments.callee);
            onReady();
          }
        });
      }
      else if(document.documentElement.doScroll && !iframe){
        (function(){
          if(done){
            return;
          }
          try{
            document.documentElement.doScroll('left');
          }
          catch(e){
            setTimeout(arguments.callee, 0);
            return;
          }
          onReady();
        }());
      }
    }
    if(document.addEventListener){
      window.addEventListener('load', onReady, false);
    }
    else if(document.attachEvent){
      window.attachEvent('onload', onReady, false);
    }
  };

  var ready = function(f){
    if(done){
      return f();
    }
    if(loaded){
      funcs.push(f);
    }
    else{
      funcs = [f];
      load();
    }
  };

  return ready;
}());

function random(){
  return parseInt( new Date().getTime());
}

function createNode(n){
  return document.createElement(n);
}

function attr(o,n,v){
  if(o && o.getAttribute){
    if(v == undefined){
      return o.getAttribute(n) || '';
    }
    else if(v == ''){
      o.removeAttribute(n);
    }
    else{
      o.setAttribute(n,v);
    }
  }
}

function html(s){
  var wrap = createNode('div'),nodes=[];
  wrap.innerHTML = s;
  var children = wrap.childNodes;
  for(var i = 0; i < children.length; i++){
    var node = children[i];
    if(node && node.nodeType === 1){
      nodes.push(node);
    }
  }
  return nodes;
}

function sealog(){
  if(Data.appcache && Data.appcache.dev){
    console.log.apply(console, arguments);
  }
}

var xmlHttp = (function(){
  var f;
  if(window.ActiveXObject){
    f = function(){
      return new ActiveXObject('Microsoft.XMLHTTP');
    };
  }
  else if(window.XMLHttpRequest){
    f = function(){
      return new XMLHttpRequest();
    };
  }
  else{
    f = function(){
      return;
    };
  }

  return f;
})();

function rawAjax(o){
  var xhr = o.xhr || xmlHttp(),
      complete,
      timeout;
  o.async = typeof o.async === 'undefined' ? true : o.async;
  xhr.onreadystatechange = function(){
    if(xhr.readyState === 1){
      if(o.timeout && o.fail){//超时
        timeout = setTimeout(function(){
          if(!complete){
            complete = 1;
            o.fail();
            xhr.abort();
            xhr = null;
          }
        }, o.timeout);
        o.timeout = 0;
      }
    }
    else if(xhr.readyState === 2){
      if(o.send){
        o.send();
      }
    }
    else if(xhr.readyState === 4 && !complete){
      complete = 1;
      if(xhr.status === 200){
        if(o.success){
          o.success(xhr.responseText);
        }
      }
      else{
        if(o.fail){
          o.fail();
        }
      }
      clearTimeout(timeout);
      xhr = null;
    }
  };
  if(typeof o.data === 'object'){
    var data = [];
    for(var i in o.data){
      data.push(i + '=' + encodeURIComponent(o.data[i]));
    }
    o.data = data.join('&');
  }
  var rf = function(){
    if(o.refer){
      xhr.setRequestHeader('rf', o.refer);
    }
  }
  if(o.type && o.type.toLowerCase() === 'get'){
    if(o.data){
      o.url += (o.url.indexOf('?') !== -1 ? '&' : '?') + o.data;
    }
    xhr.open('GET', o.url, o.async);
    rf();
    xhr.send(null);
  }
  else{
    xhr.open('POST', o.url, o.async);
    rf();
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.send(o.data);
  }
  return xhr;
}

window.fetchAjax = function(o, lonely){
  var iframe = '_ajaxProxy_',
      ajax = '_ajax_',
      xhrName = '_ajaxXhr_',
      xhrObj = '_ajaxObj_';

  var srcHost = 'http://' + document.location.host;
  var destHost = srcHost;

  if(typeof o === 'object'){
    if(o.url){
      destHost = o.url.match(/(http:\/\/)+([^\/]+)/i);
      if(destHost && destHost[0]){
        destHost = destHost[0];
      }
    }

    o.data = o.data || '';
    o.id = o.id || xhrObj + random();

    if(destHost === srcHost){//同域跳过
      return rawAjax(o);
    }
  }

  document.domain = 'qq.com';
  if(!window._AJAX_){
    window._AJAX_ = {};
  }
  if(typeof o === 'string'){
    destHost = 'http://' + o.replace(ajax, '');
  }
  var _AJAX_ = window._AJAX_;
  var destHostName = destHost.replace('http://', '');
  iframe += destHostName;
  xhrName += destHostName;
  ajax += destHostName;
  if(typeof o === 'string'){//来自iframe onload的调用
    ajax = o;
  }
  if(!_AJAX_[ajax]){//请求队列
    _AJAX_[ajax] = [];
  }
  if(!_AJAX_[iframe]){//创建proxy.html iframe
    _AJAX_[ajax].push(o);
    var name = 'ajaxProxy' + random();
    if(o.url && o.url.indexOf('www.qq.com/mb') !== -1){//请求素材
      destHost += '/mb/mat1/mb/js';
    }
    _AJAX_[iframe] = html([
        '<iframe id = "', name , '" name = "', name , '" src = "', destHost , '/proxy.html" ',
          'style = "display:none" ',
          'onload = "setTimeout(function(){window._AJAX_[\'', xhrName , '\'] = 1; window.fetchAjax(\'', ajax , '\');},50);"',
        '></iframe>'
      ].join(''))[0];
    DomReady(function(){
      document.body.appendChild(_AJAX_[iframe]);
    });
  }
  else if(!_AJAX_[xhrName]){//proxy.html加载中
    _AJAX_[ajax].push(o);
  }
  else{
    if(_AJAX_[ajax].length && !lonely){
      for(var key in _AJAX_[ajax]){
        window.fetchAjax(_AJAX_[ajax][key], true);
      }
    }
    else if(typeof o === 'object'){
      _AJAX_[ajax] = [];
      try{
        o.xhr = _AJAX_[iframe].contentWindow.xmlHttp();
      }
      catch(e){}
      o.refer = document.location.href;

      _AJAX_[o.id] = rawAjax(o);
      return _AJAX_[o.id];
    }
  }
}

//__getjs__为自定义get ajax 
var getjs = window.__getjs__ || function(url, cb){
  window.fetchAjax({
    url : url,
    type : 'get',
    success : function(data){
      if(cb){
        cb(data);
      }
    }
  });  
};

var getJsonp = function(url, call, charset, keep){
  var el = createNode('script');
  if(B.ie && B.ie < 11){
    el.onreadystatechange = function(){
      if(this.readyState == 'loaded' || this.readyState == 'complete'){
        if(call){
          call();
        }
        el = null;
      }
    }
  }
  else{
    el.onload = function(){
      if(call){
        call();
      }
      el = null;
    }
  }
  if(charset){
    attr(el, 'charset', charset);
  }
  attr(el, 'type', 'text/javascript');
  attr(el, 'src', url);
  attr(el, 'async', 'true');
  document.getElementsByTagName('head')[0].appendChild(el);
};

var S = {
  _maxRetry : 1,
  _retry : true,
  _prefix : /^https?\:/,//key前缀
  enable : window.hasOwnProperty('localStorage'),
  setPrefix : function(v){
    this._prefix = v;
  },
  get : function(key, parse){
    var val;
    try{
      val = localStorage.getItem(key);
    }
    catch(e){
      return undefined;
    }
    if(val){
      return parse ? JSON.parse(val) : val;
    }
    else{
      return undefined;
    }
  },
  set : function(key, val, retry){
    retry = (typeof retry === 'undefined') ? this._retry : retry;
    try{
      localStorage.setItem(key, val);
    }
    catch(e){
      if(retry){
        var max = this._maxRetry;
        while(max > 0){
          max--;
          this.removeAll();
          this.set(key, val, false);
        }
      }
    }
  },
  remove : function(url){
    try{
      localStorage.removeItem(url);
    }
    catch(e){

    }
  },
  removeAll : function(){
    var prefix = this._prefix;
    for(var i = localStorage.length - 1; i >= 0; i--){
      var key = localStorage.key(i);
      if(!prefix.test(key)){
        continue;
      }
      localStorage.removeItem(key);
    }
  }
};

var jscode = (function(){
  var manifestKey = 'seajs_manifest';
  var manifest = S.get(manifestKey, true) || {};
  var parseUri = function(uri){
    var info = {};
    info.jsdir = Data.appcache.jsdir;
    info.url = uri.replace(Data.appcache.jsdir, '').replace(/_(\w+).js/, '');
    // info.ver = uri.match(/_(\w+).js/);
    // info.ver = info.ver ? info.ver[1] : null;

    var vers = uri.match(/\d{6}[a-zA-Z0-9]?/g);
    if(vers){
      if(vers.length == 1){
        info.ver = vers[0];
        info.localver = null;
      }
      else if(vers.length == 2){
        info.ver = vers[1];
        info.localver = vers[0];
      }
    }
    else{
      info.ver = null;
      info.localver = null;
    }

    manifest = S.get(manifestKey, true) || {};
    info.cachever = manifest[info.url];

    return info;
  };
  var execjs = function(code){
    if(window.execScript){
      window.execScript(code);
    }
    else{
      window.eval(code);
    }
  };

  var ret = {};
  ret.save = function(uri, code){
    uri = uri.replace('mat1.gtimg.com/www', 'www.qq.com/mb/mat1');//腾讯微博解决方案
    var info = parseUri(uri);
    if(info.ver){//有版本号才保存
      manifest.jsdir = info.jsdir;
      if(code){
        manifest[info.url] = info.ver;

        S.set(manifestKey, JSON.stringify(manifest));
        S.set(info.url, code);
      }
      else{
        getjs(uri, function(text){
          manifest[info.url] = info.ver;

          S.set(manifestKey, JSON.stringify(manifest));
          S.set(info.url, text);
        });
      }
    }
  };

  ret.exist = function(uri){//检测uri是否在本地存储中有备份
    /*
    manifest = S.get(manifestKey, true) || {};
    var info = parseUri(uri);
    if(info.ver){
      if(manifest[info.url] === info.ver){
        return true;
      }
    }
    return false;
    */
   var info = parseUri(uri);
   return info.cachever && info.cachever == info.ver;
  };

  ret.exec = function(uri){//从cache中获取代码并执行
    var code = ret.getcode(uri);
    if(code){
      execjs(code);
      sealog('exec js...');
    }
  };

  ret.getcode = function(uri){
    var info = parseUri(uri);
    var code = ''
    if(info.ver){
      code = S.get(info.url) || '';
    }
    return code;
  };

  ret.clear = function(){//从cache中清除
    S.removeAll();
    manifest = {};
  };

  ret.getIncre = function(uri){//是否请求增量版本
    var info = parseUri(uri);
    var _ret = {
      incre : false,
      ver : info.ver,//cdn version
      localver : info.localver,//local version
      cachever : info.cachever//cache version
    };
    //parse version
    if(info.ver){
      if(info.localver && info.localver == info.cachever && increEnable){
        _ret.js = [Data.appcache.jsdir, info.url, '_', info.localver, '_', info.ver, '.js'].join('');
        _ret.incre = true;
      }
      else{
        _ret.js = [Data.appcache.jsdir, info.url, '_', info.ver, '.js'].join('');
      }
      _ret.alljs = [Data.appcache.jsdir, info.url, '_', info.ver, '.js'].join('');
    }
    else{
      _ret.js = uri;
      _ret.alljs = uri;
    }
    //check enable
    return _ret;
  };

  /**
   * js增量更新算法-增量文件合并
   * @param  {[type]} source       [description]
   * @param  {[type]} trunksize    [description]
   * @param  {[type]} checksumcode [description]
   * @return {[type]}              [description]
   */
  ret.mergejs = function(source, trunksize, checksumcode){
    var str = '';
    for(var i = 0; i < checksumcode.length; i++){
      var code = checksumcode[i];
      if(typeof (code) == 'string'){
        str += code;
      }
      else{
        var start = code[0]*trunksize;
        var end = code[1]*trunksize;
        var oldcode = source.substr(start, end);
        str += oldcode;
      }
    }
    return str;
  };

  ret.execjs = execjs;

  return ret;
}());

var cacheEnable = true;//是否启用appcache
var increEnable = true;//是否启用增量更新
var modInfoCache = {};

function debug(){
  seajs.S = S;
  seajs.getjs = getjs;
  seajs.clearS = function(){//快速清空cache
    jscode.clear();
  };
}

seajs.on('config', function(){
  Data.appcache.sPrefix = /(.*\.js$)|(^seajs_manifest$)/;//localstorage中key正则
  cacheEnable = Data.appcache.cacheEnable && S.enable;
  increEnable = cacheEnable && Data.appcache.incre;

  S.setPrefix(Data.appcache.sPrefix);

  if(Data.appcache.dev){
    debug();
  }
});

seajs.on("load", function(arg){
  //sealog('load>>>>>', arg);
});

seajs.on("fetch", function(data){
  //data.uri - 存储最终要发出请求的url
  //1.查询本地存储，是否有本地cache
  //2.查看url的版本号，是否符合增量规则[pathname:jscode]
  //Data.fetchedList[data.requestUri] = true;//终止网络请求
  var mod = Module.get(data.uri);
  if(cacheEnable){
    if(!jscode.exist(data.uri)){
      var incre = jscode.getIncre(data.uri);
      if(incre.incre){
        var key = data.uri.replace(Data.base, '')
                          .replace(/_[0-9a-zA-Z]+/g, '')
                          .replace('.js', '');
        //getjs increjs
        getJsonp(incre.js, function(){
          var mergejs = '';
          var localjs = '';
          var increData = window['increCallback_' + key.replace('/', '_')];

          localjs = jscode.getcode(Data.base + key + '_' + incre.cachever + '.js');
          if(localjs && increData){
            //merge js
            mergejs = jscode.mergejs(localjs, increData.chunkSize, increData.data);
            mergejs = mergejs ? '/**' + incre.localver + '_' + incre.ver + '**/' + mergejs : localjs;

            try{
              //exec js
              jscode.execjs(mergejs);
              console.log(mergejs);

              //resume callback
              Module.resumeCallback();

              //save js
              jscode.save(Data.base + key + '_' + incre.ver + '.js', mergejs);
            }
            catch(e){
              sealog(e);
              getJsonp(incre.alljs, function(){
                //resume callback
                Module.resumeCallback();

                jscode.save(incre.alljs);
              });
            }
          }
        });
        Data.fetchedList[data.uri] = true;//终止网络请求
        mod.holdCallback();
      }
      else{
        jscode.save(incre.js);//存储code
        data.requestUri = incre.js;
      }
    }
    else{//本地cache有代码，不必重新请求
      jscode.exec(data.uri);
      Data.fetchedList[data.uri] = true;//终止网络请求
    }
  }
  sealog('fetch>>>>>');
});

seajs.on("loaded", function(mod){
  if(mod.nonet){
    mod.status = Module.STATUS.FETCHING;
  }
});

seajs.on("request", function(arg){
  sealog('request>>>>>');
});

seajs.on("define", function(data){
  sealog('define>>>>>');
});

seajs.on('error', function(data){
  //请求失败-js文件404
});

Module.prototype.holdCallback = function(){
  var mod = this;

  mod.nonet = true;//不经过网络请求
  if(typeof mod.callback == 'function'){
    mod.holdCb = true;
  }
  for(var i = 0, len = (mod._entry || []).length; i < len; i++){
    var entry = mod._entry[i];
    if(typeof entry.callback == 'function'){
      entry.holdCb = true;
    }
  }

  mod.entrybak = mod._entry;
};

//@override
Module.prototype.onload = function() {
  var mod = this;
  mod.status = Module.STATUS.LOADED;

  // When sometimes cached in IE, exec will occur before onload, make sure len is an number
  for (var i = 0, len = (mod._entry || []).length; i < len; i++) {
    var entry = mod._entry[i];
    if (--entry.remain === 0) {
      entry.callback();
    }
  }

  seajs.emit('loaded', mod);

  delete mod._entry
}

var isArray = Array.isArray || isType("Array");

// @override
// Use function is equal to load a anonymous module
Module.use = function (ids, callback, uri) {
  var mod = Module.get(uri, isArray(ids) ? ids : [ids]);

  mod._entry.push(mod);
  mod.history = {};
  mod.remain = 1;

  mod.callback = function() {
    if (callback && !mod.holdCb) {
      var exports = [];
      var uris = mod.resolve();

      for (var i = 0, len = uris.length; i < len; i++) {
        exports[i] = seajs.cache[uris[i]].exec();
      }

      callback.apply(window, exports);
    }
    modInfoCache[mod.uri] = {
      mod : mod,
      callback : callback,
      exports : exports
    };

    delete mod.callback;
    delete mod.history;
    delete mod.remain;
    delete mod._entry;
  }

  mod.load();
}

Module.resumeCallback = function(){
  for(var key in modInfoCache){
    var modInfo = modInfoCache[key];
    var mod = modInfo.mod;
    if(mod.holdCb){
      var exports = [];
      var uris = mod.resolve();
      for (var i = 0, len = uris.length; i < len; i++) {
        var cache = seajs.cache[uris[i]];
        cache.status = Module.STATUS.LOADED;
        cache._entry = cache.entrybak;
        exports[i] = cache.exec();
      }

      modInfo.callback.apply(window, exports);
      delete mod.holdCb;
    }
    delete modInfoCache[key];
  }
}
define("seajs/seajs-appcache/1.0.1/seajs-appcache-debug", [], {});
})();