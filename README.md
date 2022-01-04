# NAVER API PRACTICE
## Outline
NAVER의 OPEN API 중 검색을 원하는 문자열을 통해 제목, 링크, 요약 등의 결과를 알려주는 SEARCH API 와 2,000자 미만의 본문을 3문장 이내로 요약해주는 CLOVA SUMMARY API를 사용하여 Node.js의 Express 프레임워크를 이용해서 GCP(Google Cloud Platform)를 통해 만든 웹서버에 출력해주고, Jandi의 Webhook 서비스를 통해서 해당 내용을 메시지로 전송하는 기능을 간단하게 만들어 보았습니다.
## Description
> 1. 메인 홈페이지를 View Engine인 ejs를 통해 생성
> 
> ![main](./png/search.png)
>
> 2. 원하는 Keyword를 검색
>
> ![main](./png/main.png)
>
> 3. 해당 Keyword에 대한 제목과 요약 내용을 출력과 동시에 Jandi로 메시지 전송
>
> ![main](./png/jandi.png)