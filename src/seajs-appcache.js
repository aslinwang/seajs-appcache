/**
 * The Sea.js plugin for appcache and increjs 
 * localStorage,version,increjs
 *  MI.define
 *  MI.app
 *  MI.appcache
 *  MI.S
 *
 *  test framework:mocha+should.js
 *
 * @todo 
 * 1、appcache测试用例
 *
 * seatools build会检测语法错误
 * 
 * appCache原理：
 * 使用ajax的方式请求cdn上的js代码内容，并将其存入localStorage中
 * 可能有跨域问题，解决方案
 *  - Access-Control-Allow-Origin:http://m.qzone.com
 *  - 将js文件存在与主站同域的CDN上
 */

var Module = seajs.Module;
var Data = seajs.data;

Function.prototype.__proxy = function(context) {
  var method = this;
  return function(){
    return method.apply(context || {}, arguments);
  };
};

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
    info.ver = uri.match(/_(\w+).js/);
    info.ver = info.ver ? info.ver[1] : null;

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
  ret.save = function(uri){
    uri = uri.replace('mat1.gtimg.com/www', 'www.qq.com/mb/mat1');//腾讯微博解决方案
    var info = parseUri(uri);
    if(info.ver){//有版本号才保存
      manifest.jsdir = info.jsdir;
      getjs(uri, function(text){
        manifest[info.url] = info.ver;

        S.set(manifestKey, JSON.stringify(manifest));
        S.set(info.url, text);
      });
    }
  };

  ret.exist = function(uri){//检测uri是否在本地存储中有备份
    manifest = S.get(manifestKey, true) || {};
    var info = parseUri(uri);
    if(info.ver){
      if(manifest[info.url] === info.ver){
        return true;
      }
    }
    return false;
  };

  ret.exec = function(uri){//从cache中获取代码并执行
    var info = parseUri(uri);
    if(info.ver){
      var code = S.get(info.url) || '';
      if(code){
        execjs(code);
        console.log('exec js...');
      }
    }
  };

  ret.clear = function(){//从cache中清除
    S.removeAll();
    manifest = {};
  };

  return ret;
}());

var cacheEnable = true;//是否启用appcache
var increEnable = true;//是否启用增量更新

function debug(){
  seajs.S = S;
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
  //console.log('load>>>>>', arg);
});

seajs.on("fetch", function(data){
  //data.uri - 存储最终要发出请求的url
  //1.查询本地存储，是否有本地cache
  //2.查看url的版本号，是否符合增量规则[pathname:jscode]
  //Data.fetchedList[data.requestUri] = true;//终止网络请求
  if(cacheEnable){
    if(!jscode.exist(data.uri)){
      jscode.save(data.uri);//存储code
      console.log('save');
    }
    else{//本地cache有代码，不必重新请求
      jscode.exec(data.uri);
      Data.fetchedList[data.uri] = true;//终止网络请求
    }
  }
  console.log('fetch>>>>>');
});

seajs.on("request", function(arg){
  console.log('request>>>>>');
});

seajs.on("define", function(data){
  console.log('define>>>>>');
});