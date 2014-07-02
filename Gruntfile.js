module.exports = function(grunt){
  //some functions
  function help(){
    grunt.log.writeln('');
    grunt.log.writeln('   Build Usage:');
    grunt.log.writeln('');
    grunt.log.writeln('     grunt help                  show help');
    grunt.log.writeln('     grunt staticServe           start static server');
    grunt.log.writeln('     grunt test                  mocha test');
  }

  grunt.initConfig({
    shell : {//使用grunt执行其他shell命令
      staticServe : {
        command : 'node demo/runner.js',
        options : {
          stdout : true,
          strerr : true
        }
      },
      test : {
        command : 'mocha tests/spec/mocha-runner.js',
        options : {
          stdout : true,
          strerr : true
        }
      },
      build : {
        command : 'seatools build',
        options : {
          stdout : true,
          strerr : true
        }
      }
    },
    mocha : {
      test : {
        options : {
          run : true
        },
        src : ['tests/spec/mocha-runner.js']
      }
    }
  });

  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-mocha');

  grunt.registerTask('staticServe', 'shell:staticServe');
  //grunt.registerTask('test', 'mocha:test');//@todo 无法连接到phantom
  grunt.registerTask('test', 'shell:test');//@todo 无法显示mocha的测试结果
  grunt.registerTask('build', 'shell:build');

  grunt.registerTask('default', 'show help', function(){
    help();
  });

  grunt.registerTask('help', 'show help', function(){
    help();
  });
}