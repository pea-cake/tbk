# tbk-淘宝客返利系统（nodejs版 v14.16.0） 

## 现有功能  
* 支持 淘宝、京东、拼多多转链([转链服务源码](/tbk-api-server/README.md))
* 微信bot(是微信，不是公众号，当然公众号也实现了的)自动回复消息 转链、绑定订单(基于wechaty) ([微信bot源码](/wechat/README.md)) 
* 返利系统订单管理后台（vue2、element-ui、express、mongoose...）(已开源) ([管理后台](https://github.com/pea-cake/tbk-manage.git))
* ...

## 如何运行和部署
* 配置（./config/index.js） 阿里联盟、京东联盟、多多客 返佣账号appkey appsecret
```
JDconfig: {
    // 京东联盟
    appKey: "",
    appSecret: "",
},
TBconfig: {
    // 阿里联盟, 获取配置看这里https://github.com/pea-cake/tbk/issues/5
    appkey: "",
    appsecret: "",
    adzone_id: "", // 推广位pid 'mm_123_456_789' 的789就是adzone_id
},
PDDconfig: {
    // 多多客
    clientId: "",
    clientSecret: "",
}
```
* 安装mongodb数据库（自行查找方法）
* 安装node环境（自行查找方法）
* 安装所需包  
```npm i```
* 运行转链api服务  
```npm run server```
* 另启动一个终端，运行微信bot服务  
```npm run wechat```
扫码登录微信即可

* 想部署到服务器或者运行起来方便，可以使用pm2  
```npm install pm2 -g
pm2 start server
pm2 start wechat
```


## 🧐🧐🧐
* 这是一个能赚点小钱，即使不能赚钱，也能方便你省钱的系统  
* 已全部开源，欢迎使用，欢迎star，也期待你的添砖加瓦
* ... 

## 体验
微信扫码:  
<img src="https://user-images.githubusercontent.com/58544092/187089988-28c60792-83e5-4611-bde9-7ff3cfe93aec.jpg" width="200px" height="200px"/>  

## 展示  
微信消息部分：  
<img src="https://user-images.githubusercontent.com/58544092/185220186-c013651e-0640-4c22-95d6-15bf7f0de059.png" width="200px" height="400px"/> <img src="https://user-images.githubusercontent.com/58544092/185220657-78e275ed-1f36-49b6-a2f5-4dcd0c60f141.png" width="200px" height="400px"/> <img src="https://user-images.githubusercontent.com/58544092/185222647-693ffcb3-431d-4c73-bce9-7006764d65f2.png" width="200px" height="400px"/>  

管理系统截图：  

![image](https://user-images.githubusercontent.com/58544092/197322244-3db634f8-fdce-491c-8339-6ea9bdfdab75.png)

![image](https://user-images.githubusercontent.com/58544092/197322205-74d8f0e6-9798-43c9-af7b-a567a3144fde.png)
...

## 感谢
* 待添加
