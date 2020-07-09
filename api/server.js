const express = require("express");
const bodyParser = require("body-parser");
const db = require("./module/db2");
const md5 = require("md5");
const tools = require("./module/tools");
const upPic = require("./module/upPic");
const mongodb = require("mongodb");
const shopList = require("./module/shopList");
const goodsTypeList = require("./module/goodsTypeList");
const fs = require("fs");
const app = express();
app.use(bodyParser.json());
app.use(express.static(__dirname+"/upload"))
// 登陆接口
app.post("/login",async (req,res)=>{
    try{
        // 接收账号与密码
        const {adminName,passWord} = req.body;
        // 根据账号与密码查找管理员
        const info = await db.findOne("adminList",{
            adminName,
            passWord:md5(passWord+"(*^(*&^(*&)")
        })
        // 插入数据
        await db.insertOne("adminLog",{
            adminName,
            logType:(info?1:2),
            detail:"登陆信息："+(info?"成功":"失败"),
            addTime:Date.now()
        })
        // 返回结果
        if(info){
            // 更新管理员最后登陆的时间。
            await db.updateOne("adminList",{_id:info._id},{$set:{loginTime:Date.now()}})
            res.json({
                ok:1,
                msg:"登陆成功",
                token:tools.encode({adminName})
            })
        }else{
            tools.json(res,-1,"账号或密码错误");
        }
    }
    catch (err) {
        //
        tools.json(res,-1,err);
    }
})
// 除了登陆以外，都会执行该路由。如果token没问题，继续向下匹配。
app.all("*",(req,res,next)=>{
    const token = req.headers.authorization;
    const {ok,msg,info} = tools.decode(token);
    console.log(info)
    if(ok === 3) next();
    else{
        tools.json(res,2,msg);
    }
})
/*********************adminLog*****************************************************/
// 获得管理员日志
app.get("/adminLog",async (req,res)=>{
    let pageIndex = req.query.pageIndex/1;
    const response = await db.page("adminLog",{
        sort:{
            addTime:-1,
        },
        pageIndex
    })
    res.json(response)
    // setTimeout(async ()=>{
    //     /*被逼编程法。要将管理员的登陆日志拿出来*/
    //     /*获得指定页数的信息*/
    //     let pageIndex = req.query.pageIndex/1;
    //     const limit = 10;// 每页显示的数量
    //     let pageSum = 1;
    //     // 获得集合的总条数
    //     const count = await db.count("adminLog");
    //     /*确定 总页数，及当前页数。*/
    //     pageSum = Math.ceil(count/limit);
    //     if(pageSum < 1) pageSum = 1;
    //     if(pageIndex <1) pageIndex = 1;
    //     if(pageIndex>pageSum) pageIndex = pageSum;
    //
    //     const adminLog = await db.find('adminLog',{
    //         limit,
    //         skip:(pageIndex-1)*limit,
    //         sort:{
    //             addTime:-1
    //         }
    //     })
    //     res.json({
    //         ok:1,
    //         adminLog,
    //         pageIndex,
    //         pageSum
    //     })
    // },0)

})
/*********************adminList*****************************************************/
// 获得管理员列表
app.get("/adminList",async (req,res)=>{
    // 验证token
    // const token = req.headers.authorization;
    // const {ok,msg} = tools.decode(token);
    // if(ok === 3){
        let pageIndex = req.query.pageIndex/1;
        const response = await db.page("adminList",{
            sort:{
                addTime:-1,
            },
            limit:1,
            pageIndex
        })
        res.json(response);
    // }else{
    //     // -1 失败 1成功 2 token异常
    //     tools.json(res,2,msg);
    // }




})
// 根据Id删除日志。
app.delete("/adminLog/:id",async (req,res)=>{
    try{
        const id = req.params.id;
        await db.deleteOneById("adminLog",id);
        tools.json(res,1,"删除成功")
    }catch (e) {
        tools.json(res,-1,"删除成败")
    }


});
/****************************shopType*******************************************/
// 添加店铺类别
app.post("/shopTypeList",(req,res)=>{
    upPic(req,"shopTypePic",async function ({ok,msg,params}) {

        if(ok === 1 ){
            await db.insertOne("shopTypeList",{
                shopTypeName:params.shopTypeName,
                shopTypePic:params.newPicName,
                addTime:Date.now()
            })
            tools.json(res,1,"上传成功");
        }else{
            tools.json(res,-1,msg);
        }
        // console.log(obj);
        // res.json({
        //     oK:1,
        //     msg:"成功"
        // })
    })
})
// 修改店铺类别
app.put("/shopTypeList",(req,res)=>{
    upPic(req,"shopTypePic",async function ({ok,msg,params}) {
        if(ok === 3){
            tools.json(res,-1,msg);
        }else{
            const upObj = {
                $set:{
                    shopTypeName:params.shopTypeName
                }
            }
            // 如果成功上传了图片
            if(ok === 1){
                const shopTypeInfo = await db.findOneById("shopTypeList",params.shopTypeId);
                console.log(11111111,shopTypeInfo.shopTypePic);
                const result = await tools.deletePic(shopTypeInfo.shopTypePic);// 删除

                console.log(22222222);
                upObj.$set.shopTypePic = params.newPicName;
            }
            // 直接修改
            await db.updateOneById("shopTypeList",params.shopTypeId,upObj);
            tools.json(res,1,"修改成功")
            // if(ok === 1){
            //     // 上传图片成功，删除原图片
            //     const shopTypeInfo = await db.findOneById("shopTypeList",params.shopTypeId);
            //     fs.unlink(__dirname+"/upload/"+shopTypeInfo.shopTypePic,async function () {
            //         upObj.$set.shopTypePic = prams.newPicName;
            //         await db.updateOneById("shopTypeList",params.shopTypeId,upObj);
            //         tools.json(res,1,"修改成功")
            //     })
            //
            // }else{
            //     // 直接修改
            //     await db.updateOneById("shopTypeList",params.shopTypeId,upObj);
            //     tools.json(res,1,"修改成功")
            // }
            //

        }

    })
})
// 获得店铺类别 列表
app.get("/shopTypeList",async (req,res)=>{
    const pageIndex = req.query.pageIndex;
    const keyWord = req.query.keyWord || "";
    let whereObj = {};
    if(keyWord){
        whereObj={
            shopTypeName:new RegExp(keyWord)
        }
    }
    const response = await db.page("shopTypeList",{
        pageIndex,
        whereObj,
        sort:{
            addTime:-1
        },
        limit:2
    })
    res.json(response);
})
// 获得所有店铺类别
app.get("/allShopTypeList",async (req,res)=>{
    const shopTypeList = await db.find("shopTypeList",{
        sort:{
            addTime:-1
        }
    });
    res.json({
        ok:1,
        shopTypeList
    })
})
/****************************shopList*******************************************/
// 添加店铺
app.post("/shopList",shopList.shopListPost)
app.get("/shopList",shopList.getShopList)
app.get("/shopInfo/:id",shopList.getShopListByShopId)
// 根据店铺类别ID获得店铺信息
app.get("/shopList/:shopTypeId",shopList.getShopListByShopTypeId)
/*****************************goodsTypeList***************************************************/
app.post("/goodsTypeList",goodsTypeList.addGoodsTypeList);
// 获取商品类别列表
app.get("/goodsTypeList",goodsTypeList.getGoodsTypeList);
// 登陆接口
// app.post("/login",(req,res)=>{
//     /**
//      * 登陆思路
//      * 1、接收参数 adminName,passWord
//      * 2、去数据库当中进行搜索
//      *      1、查找到，登陆成功
//      *          1、增加登陆日志
//      *              返回内容：
//      *                  {
//      *
//      *                  }
//      *      2、未找到，登陆失败*/
//     const {adminName,passWord} = req.body;
//     console.log(adminName,passWord);
//     db.findOne("adminList",{
//         adminName,
//         passWord:md5(passWord+"(*^(*&^(*&)")
//     },function (err,info) {
//         if(err) tools.json(res);
//         else{
//             db.insertOne("adminLog",{
//                 adminName,
//                 logType:(info?1:2),
//                 detail:"登陆信息："+(info?"成功":"失败"),
//                 addTime:Date.now()
//             },function (err,reuslts) {
//                 if(info){
//                     res.json({
//                         ok:1,
//                         msg:"登陆成功",
//                         token:tools.encode({adminName})
//                     })
//                 }else{
//                     tools.json(res,-1,"账号或密码错误");
//                 }
//             })
//             // setTimeout(()=>{
//             //
//             //     if(info){
//             //
//             //         tools.json(res,1,"登陆成功");
//             //     }else{
//             //         tools.json(res,-1,"账号或密码错误");
//             //     }
//             // },1000)
//
//         }
//     });
//
//
// });
app.listen(80,function () {
    console.log("success");
})