import get from 'lodash/get'
import each from 'lodash/each'
import size from 'lodash/size'
import toNumber from 'lodash/toNumber'
import isestr from 'wsemi/src/isestr.mjs'
import isnum from 'wsemi/src/isnum.mjs'
import isarr from 'wsemi/src/isarr.mjs'


/**
 * 提取點陣列內之點[0,1]或{x,y}或指定鍵值成為點{x,y}物件陣列
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/ptsXYtoArr.test.mjs Github}
 * @memberOf w-gis
 * @param {Array} ps 輸入點陣列，為[{x:x1,y:y1},{x:x2,y:y2},...]點物件之陣列，或[[x1,y1],[x2,y2],...]點座標陣列之陣列
 * @param {Object} [opt={}] 輸入設定物件，預設{}
 * @param {String} [opt.keyX='x'] 輸入點物件x座標鍵字串，預設'x'
 * @param {String} [opt.keyY='y'] 輸入點物件y座標鍵字串，預設'y'
 * @returns {Array} 回傳點{x,y}陣列
 * @example
 *
 * let ps
 * let r
 *
 * ps = [[243, 206, 95], [233, 225, 146], [21, 325, 22]]
 * r = ptsXYtoArr(ps)
 * console.log(r)
 * // => [ { x: 243, y: 206 }, { x: 233, y: 225 }, { x: 21, y: 325 } ]
 *
 * ps = [{ 'x': 243, 'y': 206, 'z': 95 }, { 'x': 233, 'y': 225, 'z': 146 }, { 'x': 21, 'y': 325, 'z': 22 }]
 * r = ptsXYtoArr(ps)
 * console.log(r)
 * // => [ { x: 243, y: 206 }, { x: 233, y: 225 }, { x: 21, y: 325 } ]
 *
 * ps = [{ 'a': 243, 'b': 206, 'c': 95 }, { 'a': 233, 'b': 225, 'c': 146 }, { 'a': 21, 'b': 325, 'c': 22 }]
 * r = ptsXYtoArr(ps, { keyX: 'a', keyY: 'b' })
 * console.log(r)
 * // => [ { x: 243, y: 206 }, { x: 233, y: 225 }, { x: 21, y: 325 } ]
 *
 */
function ptsXYtoArr(ps, opt = {}) {

    //若無數據回傳空陣列
    if (size(ps) <= 0) {
        return []
    }

    //keyX
    let keyX = get(opt, 'keyX')
    if (!isestr(keyX)) {
        keyX = 'x'
    }

    //keyY
    let keyY = get(opt, 'keyY')
    if (!isestr(keyY)) {
        keyY = 'y'
    }

    //keyInd
    let keyInd = get(opt, 'keyInd', '')
    if (!isestr(keyInd)) {
        keyInd = 'ind'
    }

    //rs
    let rs = []
    each(ps, (v, k) => {
        let x = null
        let y = null
        if (isarr(v) && size(v) >= 2) {
            x = get(v, 0)
            y = get(v, 1)
        }
        else {
            x = get(v, keyX, null)
            y = get(v, keyY, null)
        }
        if (isnum(x) && isnum(y)) {
            x = toNumber(x)
            y = toNumber(y)
            rs.push({
                x,
                y,
                [keyInd]: k,
            })
        }
    })

    return rs
}


export default ptsXYtoArr
