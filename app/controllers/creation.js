'user strict'

var mongoose = require('mongoose')
var xss = require('xss')
var _ = require('lodash')
var Video = mongoose.model('Video')
var Creation = mongoose.model('Creation')
var Audio = mongoose.model('Audio')
var Promise = require('bluebird')
var config = require('../../config/config')

var robot = require('../service/robot')


exports.up = async (ctx, next) => {
  var body = ctx.request.body
  var user = ctx.session.user
  var creation = await Creation.findOne({
    _id: body.id
    })

  if(!creation){
    ctx.body = {
      success: false,
      err: 'no creation'
    }
    return
  }

  if (body.up === 'yes'){
    creation.votes.push(String(user._id))
  }
  else {
    creation.votes = _.without(creation.votes, String(user._id))  //把这个user从votes里面踢出去
  }

  creation.up = creation.votes.length  //统计votes里面有几个id，就是几个点赞
  await creation.save()

  ctx.body = {
    success: true
  }

}



var userFields = [
  'avatar',
  'nickname',
  'gender',
  'age',
  'breed'
]

exports.find = async (ctx, next) => {
  var feed = ctx.query.feed
  var cid = ctx.query.cid
  // var sortRequest = ctx.query.sortRequest

  var count = 5

  var query = {
  }

  var sortType = {
    'meta.createAt': -1
  }

  // if(sortRequest === 'byCommentNumber') {
  //   sortType = {
  //     'commentTotal': -1
  //   }
  // }

  if (cid) {
    if (feed === 'recent') {
      query._id = {'$gt': cid}  // mongodb的条件查询，大于，query._id 会直接添加到query里面去
    }
    else {
      query._id = {'$lt': cid}
    }
  }

  console.log('what is query for video')
  console.log(query)
  //下拉刷新的时候，打印的结果是{ _id: { '$gt': '5a6e944ce5def6352b4bcf86' } }


  var creation  = await Creation
   .find(query)   //没有cid，就是第一次加载列表，find(query) => find({})
   .sort(sortType)
   .limit(count)
   .populate('author', userFields.join(' '))
   //monogdb的 creations的表格内容里面的author只是一个 objectid，pupulate就是额外把author的字段扩展后发给前端，便于展现author的内容
   //另外包括creations本身内容
   //存到前端的dataSource里面，进而传到row里面

   var total = await Creation.count({})
  //上面每一个查询都是异步的，等于是同步，第一个查询完，才会进行下一个查询； 下面的数组方式有问题，查询是整个数组里面的两个元素都查询完成后，再返回结果


   ctx.body = {
     success: true,
     data: creation,
     total: total
   }
}

// // 下面查询的方法是用page的老办法
// exports.find = async (ctx, next) => {
//   var page  = parseInt(ctx.query.page, 10) || 1
//   var count = 5
//   var offset = (page - 1) * count
//
//
//   var creation  = await Creation
//    .find({})
//    .sort({
//      'meta.createAt': -1
//    })
//    .skip(offset)
//    .limit(count)
//    .populate('author', userFields.join(' '))
//    //monogdb的 creations的表格内容里面的author只是一个 objectid，pupulate就是额外把author的字段扩展后发给前端，另外包括creations本身内容
//    //存到前端的dataSource里面，进而传到row里面
//
//    var total = await Creation.count({})
//   //上面每一个查询都是异步的，等于是同步，第一个查询完，才会进行下一个查询； 下面的数组方式有问题，查询是整个数组里面的两个元素都查询完成后，再返回结果
//
//   //  var queryArray = [
//   //    Creation
//   //     .find({})
//   //     .sort({
//   //       'meta.createAt': -1
//   //     })
//   //     .populate('author'),
//    //
//   //     Creation.count({})
//   //  ]
//    //
//   //  var data = await queryArray
//
//    ctx.body = {
//      success: true,
//      data: creation,
//      total: total
//    }
// }

function asyncMedia(videoId, audioId){


  if(!videoId) return

  var query = {
    _id: audioId
  }

  if(!audioId) {   //这是针对 exports.video 里面的 asyncMedia方法，里面没有audioId
    query = {
      video: videoId
    }
  }

//.all 是要求all里面的异步操作都完成后，才能返回
//videoId 是 video._id, audioId是audio._id
  Promise.all([   //  先查询到视频和音频都有，再将两个拼接，因为下面很多函数是异步，会导致视频还没上传完毕，就开始拼接
    Video.findOne({
      _id: videoId
    }),
    Audio.findOne(query)
  ])
  .then((data)=>{
    var video = data[0]   //是把两个models都拿出来了
    var audio = data[1]
    console.log('check data')
      if(!video || !video.public_id || !audio || !audio.public_id){
        return
      }

      console.log('start combine')

      var video_public_id = video.public_id
      var audio_public_id = audio.public_id.replace(/\//g, ':')
      //多层文件夹用冒号标示层级关系,  正则替换，g是全局， 本来只是替换‘／’
      //audio/wlotzxyqv4ud50cri50i  变成audio:wlotzxyqv4ud50cri50i
      var videoName = video_public_id.replace(/\//g, '_') + '.mp4'
      var videoURL = 'http://res.cloudinary.com/bobolin/video/upload/e_volume:-100/e_volume:400,l_video:' + audio_public_id + '/' +
      video_public_id + '.mp4'
      //拼接到结果如下
      // overlay原始格式: /upload/l_video:public_id1/public_id2  将public_id1 叠加到public_id2上面
      //http://res.cloudinary.com/bobolin/video/upload/e_volume:-100/e_volume:400,l_video:audio:wlotzxyqv4ud50cri50i/video/el6ptypxev8opwqxw3ru.mp4
      //    /e_volume:400,l_video:audio:wlotzxyqv4ud50cri50i,  e_volume是控制音量，l_video是add overlay,格式：l_video:public_id
      // /e_volume:-100 是针对 video/el6ptypxev8opwqxw3ru.mp4


      var thumbName = video_public_id.replace(/\//g, '_') + '.jpg'
      var thumbURL = 'http://res.cloudinary.com/bobolin/video/upload/' + video_public_id + '.jpg'


        console.log('async video to qiniu')

      robot  // 上面地址拼接的结果就是将视频和音频合并好了。然后保存到七牛
          .saveToQiniu(videoURL, videoName)
          .catch(function(err){
            console.log(err)
          })
          .then(function(response){
            if(response && response.key) {

              console.log('this is saveToQiniu s response of video')

              console.log(response)
              audio.qiniu_video = response.key    // 通过地址拼接，处理音频和视频的合并，然后上传到qiniu, 这里到response.key就是合并后到结果了
              audio.save().then(function(_audio){
                //将合并后到结果save到 database里面到audio表格里面，保证视频上传qiniu完毕后，才去进行creation
                //_audio是save之后返回的结果，内容是audio collection里面的一条
                Creation.findOne({
                  video: video._id,
                  audio: audio._id
                })
                .then(function(_creation){  // _creation是findone返回的找到的结果
                  if(_creation){
                    if(!_creation.qiniu_video){
                      _creation.qiniu_video = _audio.qiniu_video  //添加这个合并好的视频到creation里面
                      _creation.save()
                    }
                  }
                })

              })
              console.log('async video complete')
            }
          })


        console.log('async thumb to qiniu')

      robot
          .saveToQiniu(thumbURL, thumbName)
          .catch(function(err){
            console.log(err)
          })
          .then(function(response){
            if(response && response.key) {
              audio.qiniu_thumb = response.key
              audio.save().then(function(_audio){

                Creation.findOne({
                  video: video._id,
                  audio: audio._id
                })
                .then(function(_creation){
                  if(_creation){
                    if(!_creation.qiniu_video){
                      _creation.qiniu_thumb = _audio.qiniu_thumb
                      _creation.save()
                    }
                  }
                })
              })
              console.log('async thumb complete')
            }
          })

  })


}


//需要改成阿里云
exports.video = async (ctx, next) =>{  //
//video上传到qiniu，将返回的 response(hash,key,persistenID) 再上传到mongoDB的 video目录,
//node服务器端同步到cloudinary,再在node服务器端保存到mongodb 的video表格

  var body = ctx.request.body
  var videoData = body.video
  var user = ctx.session.user
 console.log('i am  body.video')
 console.log(videoData)
  if(!videoData || !videoData.key){
    ctx.body = {
      success: false,
      err: 'no video uploaded to database'
    }
    return
  }

  //qiniu的response(hash,key,persistentId)上传到 mongodb到video目录，如果找不到，就new新的进去
  var video = await Video.findOne({
    qiniu_key: videoData.key
  })

//如果没有，就new一个
  if(!video) {
    video = new Video({
      // author: user._id,
      qiniu_key: videoData.key,   // 上传视频到七牛后返回得到的key
      persistentId: videoData.persistentId   // 这个是七牛返回的结果
    })

    video = await video.save()  //保存到mongodb里面
  }

//在服务器端拿到qiniu视频的地址，就得去mongodb里面去拿，如video.qiniu_key; 所以 这就是mongodb存在的意义，存储表单信息，结构化这些信息。
//oss的作用是存储非结构化的，如图片，视频等。
//拿到在qiniu空间的视频地址,上传到cloudinary，通过cloudinary处理这个视频，返回的结果更新 mongodb里面的那段视频
  var url = config.qiniu.video + video.qiniu_key  // 七牛空间的视频

//这里可以上传到aliyun来处理
  robot
    .uploadToCloudinary(url)    // 把七牛video的链接直接上传到cloudinary
    .then((data)=>{
        if(data && data.public_id){
          video.public_id = data.public_id
// 返回的内容： "secure_url" : "https://res.cloudinary.com/bobolin/video/upload/v1519709147/video/vxstl2ctb3nqmzku2bex.mov",
//"public_id" : "video/vxstl2ctb3nqmzku2bex"
          video.detail = data   // detail其实用不到
//mongoose.Promise = require('bluebird'),在入口文件app.js里面已经把mongoose设置了promise
// 等于是一个promise，video.save()之后返回一个结果data，then(_video)相当于then(data)
// 等价于在执行 video = video.save()之后， 再执行asyncMedia(video._id)； 因为video.save()是一个异步，避免还没保存好就执行后面的程序


          video.save().then((_video)=>{ //mongodb里面多了 一个public_id
// 这里的asyncMedia有什么作用？
            asyncMedia(_video._id)   //	"_id" : ObjectId("5a94ebd6220aab284ad7589e"), video collection里面的内容
          })
        }
      })

  ctx.body ={
    success: true,
    data: video._id  // 返回到客户端，用来和audio匹配
  }
}

exports.audio = async (ctx, next) =>{
  var body = ctx.request.body
  var audioData = body.audio  // 这个就是 包含public_id等一大坨信息的detail
  var videoId = body.videoId  // 这个是用来指向对应videoId的
  var user = ctx.session.user


  if(!audioData || !audioData.public_id){
    ctx.body = {
      success: false,
      err: 'no audio uploaded to database'
    }
    return
  }

  var audio = await Audio.findOne({
    public_id: audioData.public_id
  })

  var video = await Video.findOne({
    _id: videoId     //看看在video里面能不能找到刚刚上传的video的 public_id
  })


//	"secure_url" : "https://res.cloudinary.com/bobolin/video/upload/v1519709188/audio/d0fyjykkatkqqwldlemq.aac",
  if(!audio) {
    var _audio ={
      author: user._id,
      public_id: audioData.public_id,   //"public_id" : "audio/d0fyjykkatkqqwldlemq",
      detail: audioData
    }

 //如果 _id能找到，audio里面增加video参数，值就是video._id；格式是video是ref到Video model（参见audio models里面的定义）
    if(video){
      _audio.video = video._id
    }

    audio = new Audio(_audio) //添加audio collection

    audio = await audio.save()   // 如果不写await 就是promise了
  }

  //这是异步操作
  asyncMedia(video._id, audio._id)  //音频保存到databse之后，asyncMedia方法，会合并音频和视频，并且保存到qiniu

  ctx.body ={
    success: true,
    data: audio._id
  }
}

exports.save = async (ctx, next) =>{   // 将视频和音频合并后，保存到databse
  var body = ctx.request.body
  var audioId = body.audioId
  var videoId = body.videoId
  var title = body.title
  var user = ctx.session.user

  console.log('videoId and audioId for save ')

  console.log(audioId)
  console.log(videoId)
  var video = await Video.findOne({
    _id: videoId
  })

  var audio = await Audio.findOne({
    _id: audioId
  })

  if(!video || !audio) {
    ctx.body = {
      success: false,
      err: 'no video or audio'
    }
    return
  }

  var creation = await Creation.findOne({    // 因为Creation的schema里面有 video 和audio的ref, 所以可以直接找audioid 和videoid
    audio: audioId,
    video: videoId
  })

  if(!creation){
    var creationData = {
      author: user._id,
      title: title,
      audio: audioId,
      video: videoId,
      finish: 20,
    }

    var video_public_id = video.public_id
    var audio_public_id = audio.public_id

    //下面cloudinary的地址拼接，只是给databse里面的creation表格做一个合并视频的备份。理论上可以直接从qiniu里面拿到拼接后到结果
    if(video_public_id && audio_public_id) {
      //封面截图
      creationData.cloudinary_thumb = 'http://res.cloudinary.com/bobolin/video/upload/' + video_public_id + '.jpg'
      //视频和音频拼接
      creationData.cloudinary_video = 'http://res.cloudinary.com/bobolin/video/upload/e_volume:-100/e_volume:400,l_video:'
      + audio_public_id.replace(/\//g, ':') + '/' + video_public_id+ '.mp4'
      console.log('this is my url for qiniu')
      console.log(creationData.cloudinary_video)
      creationData.finish += 20
    }

    if(audio.qiniu_thumb) {
      creationData.qiniu_thumb = audio.qiniu_thumb
      creationData.finish += 30
    }
//添加qiniu_video给creationData， 并且把database的audio表格里面已经合并好的结果赋值给 creation 表格里面的qiniu_video
    if(audio.qiniu_video) {
      creationData.qiniu_video = audio.qiniu_video
      creationData.finish += 40
    }

    console.log('this is creation data from save')
    console.log(creationData)
    creation = new Creation(creationData)

    creation = await creation.save()
  }


  ctx.body ={
    success: true,
    data: {
      _id: creation._id,
      finish: creation.finish,
      title: creation.title,
      qiniu_thumb: creation.qiniu_thumb,
      qiniu_video: creation.qiniu_video,
      author: {
        avatar: user.avatar,
        nickname: user.nickname,
        gender: user.gender,
        breed: user.breed,
        _id: user._id
      }

    }
  }
}
