module.exports = {
  db: {
    mysql: {
        sr: {
            host: "192.168.99.100",
            user: 'sr',
            password: 'srpasswd_25',
            database: 'smartrewards_v25',
            multipleStatements: true  //允许多个语句提交
        },
        sp: {
            host: '172.16.0.23',
            user: 'root',
            password: '1234',
            database: 'sp',
            port: 3306,
            multipleStatements: true
        }
    }
  },
  tcpport:8088,  //tcp
  tcpip:"172.16.0.92",//tcp
  //
  threads_number:1,
  //SRmq
    srmq: {
        host: "192.168.99.56",
        port: 5672,
        login: 'guest',
        password: 'guest'
    },
    //SR
   srmqsetting:[
//    {
//        queue: "SR100_SocialBox_Text",
//        host: "192.168.99.100",
//        endpoint: "/api/WeChat/SubstribeSendMessageCallBack",
//        bind:"Social_Exchange100",
//        routekey:"*.Text.*"
//    },
//    {
//        queue: "SR100_SocialBox_Image",
//        host: "192.168.99.100",
//        endpoint: "/api/WeChat/SubstribeSendMessageCallBack",
//        bind:"Social_Exchange100",
//        routekey:"*.Image.*"
//    },

    {
        queue: "WXQueue_Node100",
        host: "192.168.99.100",
        endpoint: "/socialapi/wechatapi/DataHandler"
    },

    {
        queue: "WeiAppMQ100",
        host: "192.168.99.100",
        endpoint: "/api/weiapp/WeiAppSubscribeCallBack"
    },
    
    {
        queue: "SR100_CustServiceQueueDEV",
        host: "192.168.99.100",
        endpoint: "/api/Customer/CustomerDispose"
    },

    {
        queue: "SR100_RewardDisposeQueueDEV",
        host: "192.168.99.100",
        endpoint: "/api/RewardsProgram/RewardsDispose"
    },

    {
        queue: "SR100_DataDisposeQueueDEV",
        host: "192.168.99.100",
        endpoint: "/api/RewardsProgram/ProgramDispose"
    },

    {
        queue: "SR100_SocialServiceQueueDEV",
        host: "192.168.99.100",
        endpoint: "/api/Soical/SendTemplateMessageNew"
    },
    {
        queue: "SR100_TagServiceQueueDEV",
        host: "192.168.99.100",
        endpoint: ""
    },

    {
        queue: "SR100_ActivityServiceQueueDEV",
        host: "192.168.99.100",
        endpoint: ""
    }
],
    spmq: {
        host: "172.16.0.23",
        port: 5672,
        login: 'smartac',
        password: 'smartac2015'
    },
    //SP
    spmqsetting:[
        {
            queue: "sp.fence.srsend",
            host: "172.16.0.97",
            endpoint: "/sp/send_text",
            bind: "sc.fence",
            routekey: "#",
            isproto:true
        },
        {
            queue: "cf.send.all",
            host: "172.16.0.97",
            endpoint: "/sp/send_text",
            bind: "cf.send.realtime",
            routekey: "#",
            isproto:false
        }]
}
