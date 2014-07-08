seajs-appcache
============

A Sea.js plugin for appcache and increjs 


Install
-------


Usage
-----

Attention
-----
**modify Gruntfile.js**
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
when use `seatools site -w`, it can build plugin before livereload