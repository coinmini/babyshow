// 'user strict'

var Router = require('koa-router')

var User = require('../app/controllers/user')
var App = require('../app/controllers/app')
var Creation = require('../app/controllers/creation')
var Comment = require('../app/controllers/comment')

// const router = require('koa-router')();  注意require('koa-router')返回的是函数:
//等价于
// const fn_router = require('koa-router');
// const router = fn_router();

module.exports = function(){
  var router = new Router({   // Router相当于类， router是new出来的实例，可以调用方法比如router.post
    prefix: '/api'
  })
//以下是在node服务器里面建立的一些API路径
  router.post('/u/signup', App.hasBody, User.signup)
  router.post('/u/verify', App.hasBody, User.verify)
  router.post('/u/update', App.hasBody, App.hasToken, User.update)

  router.post('/signature', App.hasBody, App.hasToken, App.signature)

  // creations
  router.post('/creations', App.hasBody, App.hasToken, Creation.save)
  router.post('/creations/video', App.hasBody, App.hasToken, Creation.video)
  router.post('/creations/audio', App.hasBody, App.hasToken, Creation.audio)

  //find
  router.get('/creations', Creation.find)
  router.get('/creations/search', Creation.search)

  //Comment
  router.get('/comments',  Comment.find)
  router.post('/comments', App.hasBody, App.hasToken, Comment.save)

  //votes
  router.post('/up', App.hasBody, App.hasToken, Creation.up)

  router.get('/',  App.pingNetwork) // pingNetwork测试，看看网络通不通
  return router
}
