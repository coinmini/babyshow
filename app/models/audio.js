'use strict'

var mongoose = require('mongoose')
var ObjectId = mongoose.Schema.Types.ObjectId
var Mixed = mongoose.Schema.Types.Mixed

var AudioSchema = new mongoose.Schema({

  author:{
    type: ObjectId,
    ref: 'User'
  },
  // "_id" : ObjectId("5a86f64b136fb1422e967e6e"), 这个是mongodb 分配给audio的默认值,
	// "author" : ObjectId("5a7d4b0388d1e808c6b456dd"), 这个是ref到User里面的对应的


  video:{
    type: ObjectId,
    ref: 'Video'    //每一个音频都指向一个视频, 也就是拿到Video里面的ObjectId
  },
  //qiniu上合并视频和音频后都文件
  qiniu_video: String,
  qiniu_thumb: String,
//cloudinary

  public_id: String,
  detail: Mixed,

  meta: {
    createAt: {
      type:Date,
      default: Date.now()
    },
    updateAt: {
      type: Date,
      default: Date.now()
    }
  }
})

AudioSchema.pre('save', function(next) {
  if(this.isNew) {
    this.meta.createAt = this.meta.updateAt = Date.now()
  }
  else {
    this.meta.updateAt = Date.now()
  }
  next()
})


module.exports = mongoose.model('Audio', AudioSchema)
