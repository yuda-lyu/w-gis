import b642str from 'wsemi/src/b642str.mjs'
import isWindow from 'wsemi/src/isWindow.mjs'
import getGlobal from 'wsemi/src/getGlobal.mjs'
import b64 from './_turfCoreBrowser.mjs'


/**
 * 於瀏覽器主執行緒以script注入turf程式碼並取回turf, 注入邏輯之單一出處(帳本R-D9), 依賴注入以便單元測試
 *
 * @param {Object} g 輸入全域物件(瀏覽器為window), 須有document
 * @param {String} code 輸入turf之UMD程式碼字串, 執行後設定全域turf
 * @returns {Object} 回傳注入之turf物件, 注入失敗或未執行時回傳null
 */
function injectTurf(g, code) {

    //prev, 宿主頁原有之全域turf, 注入後須還原, 不以本套件內嵌之turf覆寫宿主之版本(R-D9-a); 亦不沿用宿主之turf, 因其版本(例如v6)與本套件所用v7之API不同
    let hasPrev = 'turf' in g
    let prev = g.turf

    //inject
    let turf = null
    let msg = ''
    try {

        //ele
        let ele = g.document.createElement('script')

        //innerHTML, Trusted Types頁面於此拋錯, 須攔截使整包仍可載入(R-D9-c)
        ele.innerHTML = code

        //head
        let head = g.document.getElementsByTagName('head')[0]

        //appendChild
        head.appendChild(ele)

        //get turf, 注入之script執行後設定全域turf; CSP禁inline或頁面有AMD載入器時不會設定, 此時全域turf仍為prev
        if (g.turf && g.turf !== prev) {
            turf = g.turf
        }
        else {
            msg = 'injected script did not define turf (inline script blocked by CSP, or an AMD loader is present)'
        }

    }
    catch (err) {
        msg = String(err && err.message ? err.message : err)
    }

    //restore
    if (hasPrev) {
        g.turf = prev
    }

    //warn, 失敗時turf相關函數將無法使用, 須留下可理解之原因(R-D9-c)
    if (turf === null) {
        console.warn(`w-gis: turf is unavailable, turf-based functions will fail: ${msg}`)
    }

    return turf
}


function init() {
    //@turf目前沒辦法由Nodejs端按需引入的方式直接打包成為前端使用umd程式碼, 故改直接引用@turf官方編譯min.js檔, 於前端直接插入head中, 直接使用window.turf

    //check, 若要編譯成webworker, 得再確認
    if (!isWindow()) {
        return null
    }

    //injectTurf, 原以haskey(g, 'turf')判斷宿主是否已有turf, 但haskey只認[object Object]而對Window恆為false, 致每次皆注入並覆寫宿主之turf(D9), 已改由injectTurf還原
    return injectTurf(getGlobal(), b642str(b64))
}


let turf = init()


export { injectTurf }
export default turf
