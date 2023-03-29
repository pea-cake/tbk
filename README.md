# tbk-淘宝客返利系统（nodejs v16）

## 现有功能  

* 支持 淘宝、京东、拼多多转链([转链服务源码](/tbk-api-server/README.md)) ([api测试链接](https://tbk-api.xumeng.host/?url=%E3%80%90%E6%B7%98%E5%AE%9D%E3%80%91https://m.tb.cn/h.UKRgdJO?tk=Aa0UdRum9Sd%20CZ3457%20%E3%80%8C%E4%B8%80%E6%AC%A1%E6%80%A7%E9%A5%BA%E5%AD%90%E7%9B%92%E5%A4%96%E5%8D%96%E4%B8%93%E7%94%A8%E9%A4%90%E7%9B%92%E5%95%86%E7%94%A8%E9%80%9F%E5%86%BB%E6%B0%B4%E9%A5%BA%E7%9B%92%E9%A6%84%E9%A5%A8%E6%89%93%E5%8C%85%E7%9B%92%E5%88%86%E6%A0%BC%E5%8C%85%E8%A3%85%E7%9B%92%E5%AD%90%E3%80%8D%20%E7%82%B9%E5%87%BB%E9%93%BE%E6%8E%A5%E7%9B%B4%E6%8E%A5%E6%89%93%E5%BC%80%20%E6%88%96%E8%80%85%20%E6%B7%98%E5%AE%9D%E6%90%9C%E7%B4%A2%E7%9B%B4%E6%8E%A5%E6%89%93%E5%BC%80))
* 微信bot(是微信，不是公众号，当然公众号也实现了的)自动回复消息 转链、绑定订单(基于wechaty) ([微信bot源码](/wechat/README.md))
* 返利系统订单管理后台（vue2、element-ui、express、mongoose...）(已开源) ([管理后台](https://github.com/pea-cake/tbk-manage.git))
* ...

## 如何运行和部署

### 运行

1. 配置（./config/index.js） 阿里联盟、京东联盟、多多客 返佣账号appkey appsecret

    ```text
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
        pid: "", // 推广位pid
    }
    ```

2. 安装mongodb数据库（自行查找方法）  

3. 安装node环境（自行查找方法）  

4. 安装所需包  

    ```bash
    npm i
    ```

5. 运行转链api服务  

    ```bash
    npm run server
    ```

6. 另启动一个终端，运行微信bot服务  

    ```bash
    npm run wechat
    ```

7. 扫码登录微信即可
8. 还可使用pm2 运行

    ```bash
    npm install pm2 -g
    pm2 start tbk-api-server/index.js
    pm2 start wechat/index.js
    ```

### 部署

## docker

1. 已经安装docker
2. 完成配置（config/index.js）
3.  
    * DockerFile  

    ```bash
    docker build -t tbk:v1 .
    docker run -it tbk:v1 /bin/bash
    ```

    * docker远程仓库  

    ```bash
    docker pull peacaker/tbk:1.0.0
    docker run -it peacaker/tbk:1.0.0 /bin/bash
    ```

4. 扫码登录微信即可

## 🧐🧐🧐

* 这是一个能赚点小钱，即使不能赚钱，也能方便你省钱的系统  
* 已全部开源，欢迎使用，欢迎star，也期待你的添砖加瓦
* ...

## 体验
1. 转链api体验：https://tbk-api.xumeng.host/?url=商品链接.  
2. 微信扫码(风控暂时停用，可能由于玩chatgpt多了):  
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
