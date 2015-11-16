module.exports = (gulp, $, conf) ->
  path   = require 'path'
  merge  = require 'merge2'
  runSequence = require 'run-sequence'

  {paths, tsOptions, runOptions, pkgInfo} = conf

  distMapDir = path.relative paths.tests.distDir.base
    , paths.tests.distDir.mapDir

  tsProject =
    $.typescript.createProject paths.tsconf, tsOptions

  gulp.task 'build:test', ['clean:test'], ->
    merge [
      gulp.src [
        paths.testDir.srcDir.srcTs
        paths.testDir.srcDir.typings
        paths.testDir.srcDir.libs
      ], {base: paths.testDir.srcDir.base}
        .pipe do $.sourcemaps.init
        .pipe $.typescript tsProject
        .js
        .pipe $.sourcemaps.write distMapDir
          ,
            sourceRoot: path.join do process.cwd
              , path.basename paths.testDir.srcDir.base
        .pipe gulp.dest paths.testDir.distDir.base
      gulp.src [
        paths.testDir.srcDir.datas
      ], {base: paths.testDir.srcDir.base}
        .pipe gulp.dest paths.testDir.distDir.base
    ]

  gulpMochaTest = (srcs) ->
    gulp.src srcs, {read: false}
      .pipe $.mocha
        reporter: process.env.MOCHA_REPORTER or 'nyan'
        require: [
          'source-map-support/register'
        ]

  gulp.task 'test:src', ['build:test'], ->
    gulpMochaTest [
      paths.testDir.distDir.testTs
    ]

  gulp.task 'test:typings', ->
    gulp.src [
      paths.libTyping
      paths.testDir.srcDir.typingTest
      paths.srcDir.typings
    ]
      .pipe $.typescript tsProject

  gulp.task 'test:examples:js', ->
    gulp.src [
      paths.docsDir.examples.srcJs
    ]
      .pipe $.replace 'require("sonparser")', '''
        require(require("path").join(
          require("path").relative(___dirname, process.cwd()),
          "lib/"
        ))
      '''
      .pipe $.replace 'console.log', '(function(){})'
      .pipe $.header '"use strict";'
      .pipe do $.jstester
      .pipe $.jstester.reporter true

  gulp.task 'test:examples', ->
    runSequence 'test:examples:js'

  gulp.task 'test', (cb) ->
    runSequence 'test:src'
      , 'test:typings'
      , 'test:examples'
      , cb
