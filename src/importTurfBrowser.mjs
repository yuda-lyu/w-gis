import b642str from 'wsemi/src/b642str.mjs'
import isWindow from 'wsemi/src/isWindow.mjs'
import getGlobal from 'wsemi/src/getGlobal.mjs'
import j from './importTurfBrowser.json'


function init() {
    //@turf目前沒辦法由Nodejs端按需引入的方式直接打包成為前端使用umd程式碼, 故改直接引用@turf官方編譯min.js檔, 於前端直接插入head中, 直接使用window.turf

    //check
    if (!isWindow()) {
        return null
    }

    let g = getGlobal()

    //ele
    let ele = g.document.createElement('script')

    //b64
    let b64 = j.b64

    //innerHTML
    ele.innerHTML = b642str(b64)

    //head
    let head = g.document.getElementsByTagName('head')[0]

    //appendChild
    head.appendChild(ele)

    //get turf
    let turf = g.turf

    return turf
}


let turf = init()


export default turf
