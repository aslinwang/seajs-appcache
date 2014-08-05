seajs-appcache
============

A Sea.js plugin for appcache and increjs 

Usage
-----
```html
<script src="path/to/sea.js"></script>
<script src="path/to/seajs-appcache.js"></script>

<script type="text/javascript">
  seajs.config({
    base : 'tests/assets',
    alias : {
      a : 'a_140707.js',
      b : 'b_140707_140708.js',
      'sub/c' : 'sub/c_140708.js'
    },
    appcache : {//appcache插件相关配置
      //dev : true,//开发调试环境
      jsdir : 'http://cdn.com/js',//cdn上js目录
      cacheEnable : true, //是否启用appcache特性
      incre : true//是否启用增量更新特性
    }
  });

  seajs.use('a', function(A){
    A.sayHi('Alice');
  });

  seajs.use('b', function(B){
    B.thanks('Bob');
  });
</script>
```


Attention
-----
**modify seatools/Gruntfile.js**
from 
```javascript
watch: {
  options: {
    spawn: false
  },
  template: {
    files: src,
    tasks: ['copy', 'meta'],
    options: {
      livereload: true
    }
  }
}
```
to
```javascript
watch: {
  options: {
    spawn: false
  },
  template: {
    files: src,
    tasks: ['build','copy', 'meta'],
    options: {
      livereload: true
    }
  }
}
```
when use `seatools site -w`, it can build plugin before livereload.
And seatools is installed global in system, don`t modify the wrong Gruntfile.js file.
