// 'use strict'
//
// var koa = require('koa')
// var logger = require('koa-logger')
// var session = require('koa-session')
// var bodyParser = require('koa-bodyparser')
// var app = new koa()
//
// app.keys = ['imooc']
// // app.use(logger())
// app.use(session(app))
// app.use(bodyParser())
//
// app.use(function *(next) {
//   console.log(this.href)
//   console.log(this.method)
      // this.body = {
      //   success: true
      // }
      // yield next
// })
// app.listen(1234)
//
// console.log('listening: 1234')


// 步骤：
// 1. 先上传视频，到qiniu，然后在node服务器端先保存到video目录下，然后在服务器端上传到cloudinary,再在node服务器端保存到mongodb 的video表格
// 2. 录音，+ preview
// 3. 点击下一步到时候，上传 纯audio 到cloudinary，将返回的结果response(public_id等等一大坨，detail信息)，再保存到mongodb的audio表格里面,（这时都只是纯audio）
//    在node服务器端会触发 asyncMedia函数，对音频和视频进行拼接(cloudinary的地址拼接法),将这个拼接上传到qiniu，之后更新audio表格，添加拼接后的mp3
// 3 和 4 之间就会发生 进行creations的时候，3里面的视频上传到qiniu还没有完成，导致4里面拿不到合并好的视频
// 4. 把qiniu里面合并好到结果保存到mongodb的creations表格


// mongoose相关的必须放在最上面，先运行起来
var fs = require('fs')
var path = require('path')
var mongoose = require('mongoose')
var db = 'mongodb://localhost/FitsPie'   // 这里是数据库名

mongoose.Promise = require('bluebird')  // 给mongoose设置promise，用的是bluebird里面的。因为mongoose官方不建议用mongoose自带的promise
mongoose.connect(db)

// 这个node server 启动的时候，就会连接mongodb

// 然后通过require把所有的 mongoose的 models都加载进来，进行初始化，然后才可以给controllers下面的用到这些models
// require('./app/models/user')

// 整个下面的文件读取操作可以用require代替，但是当文件比较多的时候，一个一个require进来就不合适了


var models_path  = path.join(__dirname, '/app/models')  // 把models 路径引进来，下面的方法就是去读取文件， join是拼接路径，__dirname是当前目录，



var walk = function(modelPath) {
  fs
    .readdirSync(modelPath)  // 同步的读出 modelPath 下面所有的文件（包括文件夹）
    .forEach(function(file){         // 对每一个文件进行遍历， file就是每一个文件的文件名，比如 user.js
      var filePath = path.join(modelPath, '/' + file)  // 先拿到路径
      var stat = fs.statSync(filePath)  // 拿到状态，也是同步的方式

      if(stat.isFile()){    //如果是文件， isFile标示一个文件（不是文件夹）
        if(/(.*)\.(js|coffe)/.test(file)) {   // 正则判断后缀是不是js或者coffe文件，如果是的话，通过了test为true
          require(filePath) // 完成model文件的加载和初始化
        }
      }
      else if (stat.isDirectory()){  // 如果下面还有文件
        walk(filePath)
      }
    })
}


walk(models_path)


const Koa = require('koa')
const logger = require('koa-logger')
const session = require('koa-session')
const bodyParser = require('koa-bodyparser')
const app = new Koa()
var router_api = require('./config/routes')


app.keys = ['imooc']
app.use(logger())
app.use(session(app))
app.use(bodyParser())

//下面是 async 和await的用法， await直接代替yield
// app.use(async (ctx, next) => {
//   console.log(ctx.href)
//   console.log(ctx.method)
//   await next()               // 实际是等待next()所指向的方法完成后，再指向接下的ctx.body += 'i am seconde'；这里的next()跳出当前async所在的方法
//   ctx.body += 'i am seconde'
//
// })
//
// app.use( ctx =>{
//   console.log('print me first')
//   ctx.body = 'i am first'
// }
// )

//每一个app.use()处理一个http请求，比如app.use('/videos',get), app.use('/audio',post)等等api。

// app.use( async ctx=> {
//   if (ctx.request.path === '/PrivacyPolicy') {
//       ctx.response.type = 'html'
//       ctx.body = fs.createReadStream('./PrivacyPolicy.html')
//  }
// })


  // router.get('/PrivacyPolicy', ctx =>{
  //   ctx.response.type = 'html'
  //   ctx.body = fs.createReadStream('./PrivacyPolicy.html')
  // })

app
  .use(router_api.routes())
  .use(router_api.allowedMethods())


app.listen(3006)
console.log('listening:3000')
