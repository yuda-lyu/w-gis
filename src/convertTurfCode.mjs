import fs from 'fs'
import w from 'wsemi'


//提取turf前端js轉base64
let c = fs.readFileSync('./node_modules/@turf/turf/turf.min.js', 'utf8')
let b64 = w.str2b64(c)


//輸出json
let j = `{"b64":"${b64}"}`
fs.writeFileSync('./src/importTurfBrowser.json', j, 'utf8')


// //塞入程式碼於前端自動引入至window
// let t = fs.readFileSync('./src/importTurfBrowser.tmp', 'utf8')
// t = t.replace('{code}', b64)
// fs.writeFileSync('./src/importTurfBrowser.mjs', t, 'utf8')


//node --experimental-modules --es-module-specifier-resolution=node src/convertTurfCode.mjs
