import get from 'lodash-es/get.js'
import each from 'lodash-es/each.js'
import map from 'lodash-es/map.js'
import size from 'lodash-es/size.js'
import toNumber from 'lodash-es/toNumber.js'
import isestr from 'wsemi/src/isestr.mjs'
import isnum from 'wsemi/src/isnum.mjs'
import isarr from 'wsemi/src/isarr.mjs'
import isbol from 'wsemi/src/isbol.mjs'


/**
 * 提取點陣列內之點[0]或{x}或指定鍵值成為點{x}物件陣列
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/ptsXtoArr.test.mjs Github}
 * @memberOf w-gis
 * @param {Array} ps 輸入點陣列，為[{x:x1},{x:x2},...]點物件之陣列，或[[x1],[x2],...]點座標陣列之陣列
 * @param {Object} [opt={}] 輸入設定物件，預設{}
 * @param {String} [opt.keyX='x'] 輸入點物件x座標鍵字串，預設'x'
 * @param {String} [opt.keyInd='ind'] 輸入點物件指標鍵字串，預設'ind'
 * @param {Boolean} [opt.returnObjArray=true] 輸入是否回傳物件陣列，若true代表回傳點為物件{x}之陣列，若false回傳點陣列[x]之陣列，預設true
 * @returns {Array} 回傳點陣列
 * @example
 *
 * let ps
 * let r
 *
 * ps = [[243], [233], [21]]
 * r = ptsXtoArr(ps)
 * console.log(r)
 * // => [
 * //   { x: 243, ind: 0 },
 * //   { x: 233, ind: 1 },
 * //   { x: 21, ind: 2 }
 * // ]
 *
 * ps = [{ 'x': 243 }, { 'x': 233 }, { 'x': 21 }]
 * r = ptsXtoArr(ps)
 * console.log(r)
 * // => [
 * //   { x: 243, ind: 0 },
 * //   { x: 233, ind: 1 },
 * //   { x: 21, ind: 2 }
 * // ]
 *
 * ps = [{ 'a': 243 }, { 'a': 233 }, { 'a': 21 }]
 * r = ptsXtoArr(ps, { keyX: 'a' })
 * console.log(r)
 * // => [
 * //   { x: 243, ind: 0 },
 * //   { x: 233, ind: 1 },
 * //   { x: 21, ind: 2 }
 * // ]
 *
 */
function ptsXtoArr(ps, opt = {}) {

    //若無數據回傳空陣列
    if (size(ps) <= 0) {
        return []
    }

    //keyX
    let keyX = get(opt, 'keyX')
    if (!isestr(keyX)) {
        keyX = 'x'
    }

    //keyInd
    let keyInd = get(opt, 'keyInd', '')
    if (!isestr(keyInd)) {
        keyInd = 'ind'
    }

    //returnObjArray
    let returnObjArray = get(opt, 'returnObjArray')
    if (!isbol(returnObjArray)) {
        returnObjArray = true
    }

    //rs
    let rs = []
    each(ps, (v, k) => {
        let x = null
        if (isnum(v)) {
            x = toNumber(v)
        }
        else if (isarr(v) && size(v) >= 1) {
            x = get(v, 0)
        }
        else {
            x = get(v, keyX, null)
        }
        if (isnum(x)) {
            x = toNumber(x)
            rs.push({
                x,
                [keyInd]: k,
            })
        }
    })

    //returnObjArray
    if (!returnObjArray) {
        rs = map(rs, (v) => {
            return [v.x, v[keyInd]]
        })
    }

    return rs
}


export default ptsXtoArr
