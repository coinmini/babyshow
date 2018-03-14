// 'user strict'

const router = require('koa-router')()

var User = require('../app/controllers/user')
var App = require('../app/controllers/app')
var Creation = require('../app/controllers/creation')
var Comment = require('../app/controllers/comment')


// const router = require('koa-router')();  注意require('koa-router')返回的是函数:
//等价于
// const fn_router = require('koa-router');
// const router = fn_router();

// module.exports = function(){
//   var router = new Router({   // Router相当于类， router是new出来的实例，可以调用方法比如router.post
//     prefix: '/api'
//   })
//以下是在node服务器里面建立的一些API路径
  router.post('/api/u/signup', App.hasBody, User.signup)
  router.post('/api/u/verify', App.hasBody, User.verify)
  router.post('/api/u/update', App.hasBody, App.hasToken, User.update)

  router.post('/api/signature', App.hasBody, App.hasToken, App.signature)

  // creations
  router.post('/api/creations', App.hasBody, App.hasToken, Creation.save)
  router.post('/api/creations/video', App.hasBody, App.hasToken, Creation.video)
  router.post('/api/creations/audio', App.hasBody, App.hasToken, Creation.audio)

  //find
  router.get('/api/creations', Creation.find)
  router.get('/api/creations/search', Creation.search)

  //Comment
  router.get('/api/comments',  Comment.find)
  router.post('/api/comments', App.hasBody, App.hasToken, Comment.save)

  //votes
  router.post('/api/up', App.hasBody, App.hasToken, Creation.up)

  router.get('/api',  App.pingNetwork)

  router.get('/FitsPie/PrivacyPolicy', App.PrivacyPolicy)


module.exports = router
