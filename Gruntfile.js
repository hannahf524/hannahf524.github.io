module.exports = function(grunt) {

  // Project configuration
  grunt.initConfig({
    
    pkg: grunt.file.readJSON('package.json'),
    src: 'public/resources',
    scripts: '<%= src %>/scripts',


    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      lint: {
        src: '<%= scripts %>/**/*.js'
      }
    },

    uglify: {
      options: {
        // mangle: true,
        enclose: true,
        compress: {
          'booleans': true,
          'unused': true,
          'if_return': true,
          'join_vars': true,
          'drop_console': true
        }
      },
      build: {
        src: '<%= scripts %>/**/*.js',
        dest: 'build/<%= pkg.name %>.min.js'
      }
    }
  });

  // Load plugins
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');

  // Default tasks
  grunt.registerTask('default', ['jshint', 'uglify']);

};
