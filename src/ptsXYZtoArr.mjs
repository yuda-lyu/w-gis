import get from 'lodash/get'
import each from 'lodash/each'
import size from 'lodash/size'
import toNumber from 'lodash/toNumber'
import isestr from 'wsemi/src/isestr.mjs'
import isnum from 'wsemi/src/isnum.mjs'
import isarr from 'wsemi/src/isarr.mjs'


/**
 * 提取點陣列內之點[0,1,2]或{x,y,z}或指定鍵值成為點{x,y,z}物件陣列
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/ptsXYZtoArr.test.mjs Github}
 * @memberOf w-gis
 * @param {Array} ps 輸入點陣列，為[{x:x1,y:y1},{x:x2,y:y2},...]點物件之陣列，或[[x1,y1],[x2,y2],...]點座標陣列之陣列
 * @param {Object} [opt={}] 輸入設定物件，預設{}
 * @param {String} [opt.keyX='x'] 輸入點物件x座標鍵字串，預設'x'
 * @param {String} [opt.keyY='y'] 輸入點物件y座標鍵字串，預設'y'
 * @param {String} [opt.keyY='z'] 輸入點物件z座標鍵字串，預設'z'
 * @returns {Array} 回傳點{x,y,z}陣列
 * @example
 *
 * let ps
 * let r
 *
 * ps = [[243, 206, 95], [233, 225, 146], [21, 325, 22]]
 * r = ptsXYZtoArr(ps)
 * console.log(r)
 * // => [
 * //   { x: 243, y: 206, z: 95 },
 * //   { x: 233, y: 225, z: 146 },
 * //   { x: 21, y: 325, z: 22 }
 * // ]
 *
 * ps = [{ 'x': 243, 'y': 206, 'z': 95 }, { 'x': 233, 'y': 225, 'z': 146 }, { 'x': 21, 'y': 325, 'z': 22 }]
 * r = ptsXYZtoArr(ps)
 * console.log(r)
 * // => [
 * //   { x: 243, y: 206, z: 95 },
 * //   { x: 233, y: 225, z: 146 },
 * //   { x: 21, y: 325, z: 22 }
 * // ]
 *
 * ps = [{ 'a': 243, 'b': 206, 'c': 95 }, { 'a': 233, 'b': 225, 'c': 146 }, { 'a': 21, 'b': 325, 'c': 22 }]
 * r = ptsXYZtoArr(ps, { keyX: 'a', keyY: 'b', keyZ: 'c' })
 * console.log(r)
 * // => [
 * //   { x: 243, y: 206, z: 95 },
 * //   { x: 233, y: 225, z: 146 },
 * //   { x: 21, y: 325, z: 22 }
 * // ]
 *
 */
function ptsXYZtoArr(ps, opt = {}) {

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

    //keyZ
    let keyZ = get(opt, 'keyZ', '')
    if (!isestr(keyZ)) {
        keyZ = 'z'
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
        let z = null
        if (isarr(v) && size(v) >= 3) {
            x = get(v, 0)
            y = get(v, 1)
            z = get(v, 2)
        }
        else {
            x = get(v, keyX, null)
            y = get(v, keyY, null)
            z = get(v, keyZ, null)
        }
        if (isnum(x) && isnum(y) && isnum(z)) {
            x = toNumber(x)
            y = toNumber(y)
            z = toNumber(z)
            rs.push({
                x,
                y,
                z,
                [keyInd]: k,
            })
        }
    })

    return rs
}


export default ptsXYZtoArr
