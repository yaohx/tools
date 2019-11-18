// 'use strict';

const http = require("http");
const fs = require("fs");
const cheerio = require("cheerio");
const iconv = require("iconv-lite");
const url = 'http://www.stats.gov.cn/tjsj/tjbz/tjyqhdmhcxhfdm/2018'

/**
 * 1、输入url 筛选类--->得到一个对象[{code:'1100000',name:''}]
 */

function myHttp(url) {
    let promise = new Promise(function (resolve, rejecte) {
        let req = http.get(url)
        req.on("response", function (res) {
            let chunks = [];
            res.on("data", function (data) {
                chunks.push(data);
            });
            res.on('end', function (date) {
                let buff = Buffer.concat(chunks);
                resolve(iconv.decode(buff, 'gb2312'))
            })
        });
    })
    return promise;
}

// ['.citytr','.countytr','.towntr','.villagetr']
async function crawler(path,arr){
    let html = await myHttp(`${url}/${path}`)
    const $ = cheerio.load(html);
    const result=[]
    if(arr.length>1){
        const allRow=$(arr[0]);
        for(let i=0;i<allRow.length;i++){
            let row=allRow[i];
            let code , name ,children;
            console.log(path,i)
            if(row.children[0].children[0].children){
                code=row.children[0].children[0].children[0].data;
                name=row.children[1].children[0].children[0].data;
                children=await crawler(row.children[0].children[0].attribs['href'],arr.slice(1))
            }else{
                code=row.children[0].children[0].data;
                name=row.children[1].children[0].data;
            }

            result.push({
                code:code,
                name:name,
                children: children
            })
        }

    }else{
        const allRow=$(arr[0]);
        for(let i=0;i<allRow.length;i++){
            let row=allRow[i];
            let code=row[0].children[0].children[0].data;
            let link=row[0].children[1].children[0].data;
            let name=row[0].children[2].children[0].data;
            result.push({
                code:code,
                name:name
            })
        }
    }
    if(arr.length>=4)
        console.log(result)
    return result;


}
async function crawlerProvince(path, cls) {
    let html = await myHttp(`${url}/${path}`)
    const $ = cheerio.load(html);
    const result=[]
    const allRow=$(`${cls}`);
    for(let i=0;i<allRow.length;i++){
        let row=allRow[i];
        let code , name ,children;
        console.log(path,i)
        if(row.children[0].children[0].children){
            code=row.children[0].children[0].children[0].data;
            name=row.children[1].children[0].children[0].data;
            // children=await crawler(row.children[0].children[0].attribs['href'],arr.slice(1))
        }else{
            code=row.children[0].children[0].data;
            name=row.children[1].children[0].data;
        }

        result.push({
            code:code,
            name:name,
            children: children
        })
    }
    return ;
}
// crawlerProvince('13/1301.html','.countytr')
async function crawlerWeb(path, cls) {
    let jsonObj = {};
    let html = await myHttp(`${url}/${path}`)

    const $ = cheerio.load(html);
    for(let i=0;i<$(`${cls}`).length;i++){
        const el = $($(`${cls}`)[i]);//row
        for(let col=0;col<el.find("td a").length;col++){
            let province=el.find("td a")[col];
            let link = province.attribs['href'],
                title = province.children[0].data;
            const pro=await  crawler(link,['.citytr','.countytr','.towntr','.villagetr']);
            jsonObj[pro.code] = {code: pro.code, name: title, url: link,tpe:pro.tpe};
        }

    }
    console.log(jsonObj)
}

crawlerWeb('index.html', '.provincetr')
// http.get(`${url}/index.html`, function(res) {
//     // 设置编码
//     // res.setEncoding("gb2312");
//     // 当接收到数据时，会触发 "data" 事件的执行
//     const chunks = [];
//     res.on("data", function(data){
//         chunks.push(data);
//     });
//     // 数据接收完毕，会触发 "end" 事件的执行
//     res.on("end", function(){
//         let buff = Buffer.concat(chunks), headers = res.headers;
//         // let charset = headers['content-type'].match(/(?:charset=)(\w+)/)[1] || 'utf8';
//         let charset = 'gb2312';
//         // 转编码，保持跟响应一致
//         let html = iconv.decode(buff, charset);
//
//         // 待保存到文件中的字符串
//         let fileData = {};
//         // 调用 cheerio.load() 方法，生成一个类似于 jQuery 的对象
//         const $ = cheerio.load(html);
//         // 接下来像使用 jQuery 一样来使用 cheerio
//         $(".provincetable .provincetr").each(function(index, element) {
//             const el = $(element);
//
//             el.find("td a").each((id,province)=>{
//                 let link = province.attribs['href'],
//                     title = province.children[0].data;
//                 fileData[title]= link;
//             })
//
//
//         });
//         fs.writeFile("./dist/source.txt", JSON.stringify(fileData), function(err) {
//             if (err)
//                 return;
//             console.log("成功")
//         });
//     })
// });