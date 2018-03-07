'use strict'

var mongoose = require('mongoose')
var ObjectId = mongoose.Schema.Types.ObjectId
var Mixed = mongoose.Schema.Types.Mixed

var CommentSchema = new mongoose.Schema({

  creation: {
    type: ObjectId,
    ref: 'Creation'
  },

  content: String,

  replyBy: {
    type: ObjectId,
    ref: 'User'
  },

  replyTo: {
    type: ObjectId,
    ref: 'User'
  },

  reply: [
    {
      from: {type: ObjectId, ref: 'User'},
      to: {type: ObjectId, ref: 'User'},
      content: String
    }
  ],

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

// {
// 	"_id" : ObjectId("5a825a1d136fb1422e967e6a"),
// 	"creation" : ObjectId("5a7dae4d3b8e4d2445fd9756"),
// 	"replyBy" : ObjectId("5a825970136fb1422e967e69"),  ref 的users collection里面的某个user（通过objectId来区分具体是哪个user）
// 	"replyTo" : ObjectId("5a7d4b0388d1e808c6b456dd"),
// 	"content" : "麻麻希望你健康快乐地成长么么么么哒",
// 	"meta" : {
// 		"updateAt" : ISODate("2018-02-13T03:23:09.965Z"),
// 		"createAt" : ISODate("2018-02-13T03:23:09.965Z")
// 	},
// 	"reply" : [ ],
// 	"__v" : 0
// }


CommentSchema.pre('save', function(next) {
  if(this.isNew) {
    this.meta.createAt = this.meta.updateAt = Date.now()
  }
  else {
    this.meta.updateAt = Date.now()
  }
  next()
})


module.exports = mongoose.model('Comment', CommentSchema)
