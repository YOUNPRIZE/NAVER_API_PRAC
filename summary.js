// MODULE
const request = require('request');
const express = require('express');
const charset = require('charset');
const bodyParser = require('body-parser');
const cheerio = require("cheerio");
const _ = require('lodash');
const iconv = require("iconv-lite");
const jschardet = require('jschardet');
const { header, acceptsCharsets } = require('express/lib/request');
var Jandi = require('jandi');
const cron = require('node-cron');
const ejs = require('ejs');

// SETTINGS
const app = express();
const port = 60000;
var jandi = new Jandi();
jandi.setWebhook('https://wh.jandi.com/connect-api/webhook/25736384/08743a26646f6f7487606607087dac71');

// API ID, PASSWORD 
// key 값 따로 저장

const client_id = '';
const client_secret = '';
const client_clova_id = '';
const client_clova_secret = '';

// NAVER SEARCH API INFO

// 변수 및 설정
const headers = {
    "X-NCP-APIGW-API-KEY-ID": client_clova_id,
    "X-NCP-APIGW-API-KEY": client_clova_secret,
    "Content-Type": "application/json"
};

const clova_api_url = "https://naveropenapi.apigw.ntruss.com/text-summary/v1/summarize";

const dataSum = {
    "document": {
    },
    "option": {
    "language": "ko",
    "model": "news",
    "tone": 2,
    }
};

const requestConfig = {
    url : clova_api_url,
    headers : headers,
    body : dataSum,
    json : true
};

var articleTitle = "";

app.use(bodyParser.json());

// 뷰 엔진으로 ejs를 사용
app.set('view engine','ejs');
// 뷰 페이지의 폴더 기본 경로 설정
app.set('views',__dirname + '/views');
app.engine('html',require('ejs').renderFile);

//urlencoded함수는 client에서 post로 보내준 데이터를 자동으로 파싱해주는 역할
//urlencoded함수는 body-parser모듈의 함수이지만 body-parser가 express에 내장되어 있음
//entended 옵션은 객체 형태로 전달된 데이터 내에서 또다른 중첩된 객체를 허용 여부를 결정하는 옵션이다.
//true 일 경우 따로 qs모듈을 설치해야 한다.=
app.use(express.urlencoded({extended:false}));

app.get('/',(req,res)=>{res.render('homepage.ejs');});

app.post(`/search/news`, (req, res) => {
    console.log(req.body.name);
    const api_url = 'https://openapi.naver.com/v1/search/news?query=' + encodeURI(req.body.name) + '&display=100';
    const naverSearchOptions = {
        url: api_url,
        headers: {'X-Naver-Client-Id':client_id, 'X-Naver-Client-Secret': client_secret},
        method : 'GET'
    };
    request(naverSearchOptions, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            // 밑 코드 주석처리 하니 잘 출력됨
            //res.writeHead(200, {'Content-Type': 'text/json;charset=utf-8'});
            const newBody = JSON.parse(body);
            console.log(newBody);
            // 네이버 뉴스만 추출
            const extractUrl = _.find(newBody.items, (o) => {return o.link.indexOf("https://news.naver.com") > -1});

            // 올바르지 않은 검색어일 경우를 처리
            if (extractUrl == undefined) {
                return res.render('notfound.ejs');
            };
            
            // request 변수 선언
            const newLink = {
                url: extractUrl.link,
                // charset 이 euc-kr일 경우 binary로 encoding 해야함.
                encoding: "binary",
                method : 'GET'
            };
            request(newLink, (error, response, html) => {
                // charset 이 euc-kr일 경우
                if (charset(html) == "euc-kr") {
                    euckrCheerio(html);
                // charset이 utf-8일 경우 
                } else {
                    delete newLink.encoding;
                    request(newLink, (error, response, html) => {    
                        utf8Cheerio(html);
                    });
                };
                // Promise 방식으로 request.post
                doRequest(requestConfig).then((resp) => {
                    console.log("doRequest func works!");
                    res.render('search', {
                        'title' : `${articleTitle}`,
                        'summary' : `${resp.body.summary}`,
                        'url' : `${extractUrl.link}`
                    });
                    jandiWebhook(articleTitle, resp.body.summary, extractUrl.link);
                // error 처리할 때 catch 문 활용할 것
                }).catch((err) => {
                    console.log("doRequest func do not work.");
                    console.log(error);
                    res.render('fail', {
                        'url' : `${extractUrl.link}`
                    });
                });
            });
        } else {
            //res.status(response.statusCode).end();
            res.render('null.ejs');
            console.log('error = ' + response.statusCode);
        };
    });
});

app.listen(port, () => {
    console.log(`http://34.64.139.202 app listening on port ${port}!`);
});

// function list
// request post Promise
const doRequest = (arg) => {
    return new Promise((resolve, reject) => {
        request.post(arg, (error, response) => {
            if(!error && response.statusCode == 200) {
                resolve(response);
            } else {
                reject(error);
            }
        });
    });
};

// Charset이 euc-kr일 경우 cheerio를 사용해서 필요한 text 부분 추출
const euckrCheerio = (html) => {
    const $ = cheerio.load(html);
    //기사 제목의 div의 class 명
    $('#articleTitle').each(function() {
        const artTitle = $(this);
        //text만 추출
        const artTitleText = artTitle.text();
        //문자열로 파싱
        const newTitle = JSON.stringify(artTitleText);
        //iconv 모듈로 euc-kr을 utf-8로 디코딩
        var newTitleConvert = iconv.decode(newTitle, 'euc-kr');
        //개행문자 제거 => \n, \t 등 역슬래쉬 자체를 문자열로 인식해서 \\를 두 번 씀으로써 \까지 replace
        //const, let의 경우 재할당이 불가능하기 때문에 var을 사용
        var newTitleConvert = newTitleConvert.replace(/\\n|\\t|\\/g, "");
        //전역변수에 재할당
        articleTitle = newTitleConvert;
        console.log(articleTitle);
    });
    //기사 본문 div의 class 및 id 명
    $('#articeBody, #articleBodyContents, #article-view-content-div, .articleView').each(function(){
        const artCon = $(this);
        const artConText = artCon.text();
        const newCon = JSON.stringify(artConText);
        var newConvert = iconv.decode(newCon, 'euc-kr');
        var newConvert = newConvert.replace(/\\n|\\t|\\/g, "");
        console.log(newConvert);
        //해당 기사의 본문 전체 문자열 삽입
        dataSum.document.content = newConvert;
    });
};

// Charset이 utf-8일 경우 cheerio를 사용해서 필요한 text 부분 추출
const utf8Cheerio = (html) => {
    const $ = cheerio.load(html);
    $('.end_tit').each(function() {
        const artTitle = $(this);
        const artTitleText = artTitle.text();
        const newTitle = JSON.stringify(artTitleText);
        var newTitleConvert = newTitle.replace(/\\n|\\t|\\/g, "");
        articleTitle = newTitleConvert;
        console.log(articleTitle);
    });
    $('#articeBody, #articleBodyContents, #article-view-content-div, .articleView').each(function(){
        const artCon = $(this);
        const artConText = artCon.text();
        const newCon = JSON.stringify(artConText);
        var newConvert = newCon.replace(/\\n|\\t|\\/g, "");
        dataSum.document.content = newConvert;
        console.log(newConvert);
    });
};

// Jandi로 Webhook 보내는 함수
const jandiWebhook = (title, summary, url) => {
    jandi.webhook({
        body: `제목 : ${title}\n요약 : ${summary}\nURL : ${url}`,
        connect: {
        color: '#000000'
    }
    }, function (err) {
        console.error(err)
    });
};