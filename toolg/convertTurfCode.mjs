import fs from 'fs'
import w from 'wsemi'


//提取turf前端js轉base64
let c = fs.readFileSync('./node_modules/@turf/turf/turf.min.js', 'utf8')
let b64 = w.str2b64(c)

//輸出json
let j = `let b64='${b64}'; export default b64`
fs.writeFileSync('./src/_turfCoreBrowser.mjs', j, 'utf8')
