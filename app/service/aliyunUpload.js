//步骤：第一步先到云空间的node服务器获取sts token；第二步拿到token后，在app客户端里面封装client，就可以把图片上传到endpoint对应到bucket

//在node服务器端创建临时token
var OSS = require('ali-oss');
var STS = OSS.STS;
var co = require('co');
var sts = new STS({
  accessKeyId: '<子账号的AccessKeyId>',
  accessKeySecret: '<子账号的AccessKeySecret>'
});
co(function* () {
  var token = yield sts.assumeRole(    //临时token
    '<role-arn>', '<policy>', '<expiration>', '<session-name>');



//以下的内容是是写到客户端app里面的
//把上述临时token创建后的内容返回给 客户端创建oss的client
  var client = new OSS({
    region: '<region>',
    accessKeyId: token.credentials.AccessKeyId,
    accessKeySecret: token.credentials.AccessKeySecret,
    stsToken: token.credentials.SecurityToken,
    bucket: '<bucket-name>'
  });
}).catch(function (err) {
  console.log(err);
});


co(function* () {
  var result = yield client.put('object-key', 'local-file');
 // object-key 是给要上传的文件取的名字
  console.log(result);
}).catch(function (err) {
  console.log(err);
});
