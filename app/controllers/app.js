'user strict'

var mongoose = require('mongoose')
var User = mongoose.model('User')
var robot = require('../service/robot')


exports.signature = ctx =>{   // 从客户端上传的body有 type，cloud，accesstoken

  var body = ctx.request.body
  var cloud = body.cloud
  var data

  if(cloud === 'qiniu') {

    data = robot.getQiniuToken(body)

  }

  else{
    data = robot.getCloudinaryToken(body)
  }

  ctx.body = {
    success: true,
    data: data
  }
}



// 下面两个是中间件，检查请求的是否有body，或者accessToken

exports.hasBody = async (ctx, next) =>{
  var body = ctx.request.body || {}

  if(Object.keys(body).length === 0) {
     ctx.body = {    // return加在ctx前面 可以返回当前ctx.body的内容，而不会再往下执行 await next()
      success: false,
      err: 'no content'
    }
    return  //加这里也可以
  }
  await next()   // 异步执行下一个方法
}


exports.hasToken = async (ctx, next) =>{
var accessToken = ctx.query.accessToken  // 等价于 ctx.request.query.accessToken
console.log('let me see if have accessToken')
console.log(accessToken)
if(!accessToken){
  var accessToken = ctx.request.body.accessToken
}


if(!accessToken){   // 作用类似hasBody里面的 返回
   ctx.body ={
    success: false,
    err: 'no accessToken'
  }
  return
}

// await：完成User.findOne(),才会往下执行。相当于.then().then() 规定好按顺序执行
// 因为User.findOne本身是一个异步操作（当前进程进行的过程中，先去执行下一个进程，后面的都执行完了，才回来执行当前的进程）
//就是让异步的操作，通过同步的形式完成

var user = await User.findOne({
  accessToken: accessToken
})

if(!user){
   ctx.body ={
    success: false,
    err: 'not login'
  }
  return
}

ctx.session = ctx.session || {}
ctx.session.user = user   // 把mongodb里面拿到的user传到下一个session
await next()   // 跳出hasToken的方法，先去执行下一个session；只不过正好这里的hasToken后面已经没有要执行的了；但是当前session的内容可以传递到下一个session里面去的

}
