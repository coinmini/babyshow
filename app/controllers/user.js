'user strict'

var xss = require('xss')
var mongoose = require('mongoose')
var User = mongoose.model('User')  // app.js里面已经通过require，初始化了 mongoose.model('User')，所以这里可以直接调用
var uuid = require('uuid')          // 如果没有在app.js里面初始化，也可以直接在这里require('../models/user')进行初始化
var sms = require('../service/sms')

exports.signup = async (ctx, next) => {
  var phoneNumber = ctx.request.body.phoneNumber
  // var phoneNumber = ctx.query.phoneNumber   这两个是等价的

  var user = await User.findOne({
    phoneNumber: phoneNumber})

  var verifyCode = sms.getCode()

  var accessToken = uuid.v4()

  if (!user) {
    user = new User({
      accessToken: accessToken,
      phoneNumber: xss(phoneNumber),
      verifyCode: verifyCode,
      nickname: 'little xx',
      avatar: 'https://avatar.dappnode.com/s3.jpg'})
  } else {
    user.verifyCode = verifyCode
  }

  try {
    user = await user.save()
  } catch (e) {
    ctx.body = {
      success: false
    }
    return next()
  }

  var msg = 'your registration code is :' + user.verifyCode

  try {
    sms.send(user.phoneNumber, msg)
  } catch (e) {
    console.log(e)
    ctx.body = {
      success: false,
      err: 'sms fails'
    }
    return
  }

  ctx.body = {
    success: true
  }
}

exports.verify = async (ctx, next) => {
  var verifyCode = ctx.request.body.verifyCode
  var phoneNumber = ctx.request.body.phoneNumber

  if (!verifyCode || !phoneNumber) {
    ctx.body = {
      success: false,
      err: 'false verification'
    }
    return next()
  }

  var user = await User.findOne({
    phoneNumber: phoneNumber,
    verifyCode: verifyCode})

  if (user) {    // 如果能找到到这个user，就把 mongodb里面的user info返回
    user.verified = true
    user = await user.save()
    ctx.body = {
      success: true,
      data: {
        nickname: user.nickname,
        accessToken: user.accessToken,
        avatar: user.avatar,
        _id: user._id,
        gender: user.gender,
        breed: user.breed,
        age: user.age
      }
    }
  } else {
    ctx.body = {
      success: false,
      err: 'false verification'
    }
  }
}

exports.update = async (ctx, next) => {
  var body = ctx.request.body
  var user = ctx.session.user // 拿到前一个session里面的内容
  // var accessToken = body.accessToken
  //
  //
  // var user = await User.findOne({accessToken: accessToken})
  //
  // if (!user) {
  //   ctx.body = {
  //     success: false,
  //     err: 'no user'
  //   }
  //   return next
  // }

  var fields = 'avatar,age,nickname,gender,breed'.split(',')  //注意不要加空格,因为split的只是 ， 这里到avatar就是本地上传来更新的
// console.log(fields) 打印出来 ['age', 'nickname', 'gender', 'breed']
// console.log(fields[0])  split 之后就变成了数组 打印出来是 age
  fields.forEach(function(field) {
    // console.log(field) 这里的field 打印出来依次是 age, nickname,gender, breed\
    if (body[field]) {                  // 更新当前user里面的内容
      user[field] = xss(body[field].trim())
    }
  })

  user = await user.save()  // 存到monogdb里面

  ctx.body = {
    success: true,
    data: {
      nickname: user.nickname,
      accessToken: user.accessToken,
      avatar: user.avatar,
      age: user.age,
      breed: user.breed,
      gender: user.gender,
      _id: user._id
    }
  }
}

//下面是老写法
// exports.update = function (ctx){
//   ctx.body = {
//     success: true
// }
// }
