import get from 'lodash/get'
import each from 'lodash/each'
import map from 'lodash/map'
import size from 'lodash/size'
import toNumber from 'lodash/toNumber'
import isestr from 'wsemi/src/isestr.mjs'
import isnum from 'wsemi/src/isnum.mjs'
import isarr from 'wsemi/src/isarr.mjs'
import isbol from 'wsemi/src/isbol.mjs'


/**
 * 提取點陣列內之點[0,1]或{x,y}或指定鍵值成為點{x,y}物件陣列
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/ptsXYtoArr.test.mjs Github}
 * @memberOf w-gis
 * @param {Array} ps 輸入點陣列，為[{x:x1,y:y1},{x:x2,y:y2},...]點物件之陣列，或[[x1,y1],[x2,y2],...]點座標陣列之陣列
 * @param {Object} [opt={}] 輸入設定物件，預設{}
 * @param {String} [opt.keyX='x'] 輸入點物件x座標鍵字串，預設'x'
 * @param {String} [opt.keyY='y'] 輸入點物件y座標鍵字串，預設'y'
 * @param {String} [opt.keyInd='ind'] 輸入點物件指標鍵字串，預設'ind'
 * @param {Boolean} [opt.returnObjArray=true] 輸入是否回傳物件陣列，若true代表回傳點為物件{x,y}之陣列，若false回傳點陣列[x,y]之陣列，預設true
 * @returns {Array} 回傳點{x,y}陣列
 * @example
 *
 * let ps
 * let r
 *
 * ps = [[243, 206], [233, 225], [21, 325]]
 * r = ptsXYtoArr(ps)
 * console.log(r)
 * // => [
 * //   { x: 243, y: 206, ind: 0 },
 * //   { x: 233, y: 225, ind: 1 },
 * //   { x: 21, y: 325, ind: 2 }
 * // ]
 *
 * ps = [{ 'x': 243, 'y': 206 }, { 'x': 233, 'y': 225 }, { 'x': 21, 'y': 325 }]
 * r = ptsXYtoArr(ps)
 * console.log(r)
 * // => [
 * //   { x: 243, y: 206, ind: 0 },
 * //   { x: 233, y: 225, ind: 1 },
 * //   { x: 21, y: 325, ind: 2 }
 * // ]
 *
 * ps = [{ 'a': 243, 'b': 206 }, { 'a': 233, 'b': 225 }, { 'a': 21, 'b': 325 }]
 * r = ptsXYtoArr(ps, { keyX: 'a', keyY: 'b' })
 * console.log(r)
 * // => [
 * //   { x: 243, y: 206, ind: 0 },
 * //   { x: 233, y: 225, ind: 1 },
 * //   { x: 21, y: 325, ind: 2 }
 * // ]
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

    //returnObjArray
    let returnObjArray = get(opt, 'returnObjArray')
    if (!isbol(returnObjArray)) {
        returnObjArray = true
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

    //returnObjArray
    if (!returnObjArray) {
        rs = map(rs, (v) => {
            return [v.x, v.y, v[keyInd]]
        })
    }

    return rs
}


export default ptsXYtoArr
