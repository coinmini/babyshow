'use strict'

var mongoose = require('mongoose')
var ObjectId = mongoose.Schema.Types.ObjectId
var Mixed = mongoose.Schema.Types.Mixed

var VideoSchema = new mongoose.Schema({

  author:{   //每一个视频都指向一个视频, 也就是拿到User里面的ObjectId， 但是在mongodb的collection里面不显示
    type: ObjectId,
    ref: 'User'
  },
  qiniu_key: String,
  persistentId: String,
  qiniu_final_key: String,  // 这个没有
  qiniu_detail: Mixed, // 这个没有

//cloudinary
  public_id: String,
  detail: Mixed,  // {} 多层的json

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

VideoSchema.pre('save', function(next) {
  if(this.isNew) {
    this.meta.createAt = this.meta.updateAt = Date.now()
  }
  else {
    this.meta.updateAt = Date.now()
  }
  next()
})


module.exports = mongoose.model('Video', VideoSchema)
