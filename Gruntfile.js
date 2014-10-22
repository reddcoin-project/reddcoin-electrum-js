'use strict';

var build = require("./browser/build");

module.exports = function (grunt) {

    // Project configuration.
    grunt.initConfig({
        nodeunit : {
            all : ['test/**/*_test.js']
        },
        jshint   : {
            options   : {
                jshintrc : '.jshintrc'
            },
            gruntfile : {
                src : 'Gruntfile.js'
            },
            lib       : {
                src : ['lib/**/*.js']
            },
            test      : {
                src : ['test/**/*.js']
            }
        },
        watch    : {
            gruntfile : {
                files : '<%= jshint.gruntfile.src %>',
                tasks : ['jshint:gruntfile']
            },
            lib       : {
                files : '<%= jshint.lib.src %>',
                tasks : ['jshint:lib', 'nodeunit']
            },
            test      : {
                files : '<%= jshint.test.src %>',
                tasks : ['jshint:test', 'nodeunit']
            }
        }
    });

    // These plugins provide necessary tasks.
    grunt.loadNpmTasks('grunt-contrib-nodeunit');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask("build", "Build ", function () {
        build();
    });

    //allows things like `grunt test:transaction`
    grunt.registerTask('test', function(file) {
        if (file) grunt.config('nodeunit.all', 'test/**/' + file + '_test.js');
        grunt.task.run('nodeunit');
    });

    // Default task.
    grunt.registerTask('default', ['jshint', 'nodeunit']);

};
