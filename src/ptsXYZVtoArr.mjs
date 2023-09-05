import get from 'lodash/get'
import each from 'lodash/each'
import size from 'lodash/size'
import toNumber from 'lodash/toNumber'
import isestr from 'wsemi/src/isestr.mjs'
import isnum from 'wsemi/src/isnum.mjs'
import isarr from 'wsemi/src/isarr.mjs'


/**
 * 提取點陣列內之點[0,1,2,3]或{x,y,z,v}或指定鍵值成為點{x,y,z,v}物件陣列
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/ptsXYZVtoArr.test.mjs Github}
 * @memberOf w-gis
 * @param {Array} ps 輸入點陣列，為[{x:x1,y:y1,z:z1,v:v1},{x:x2,y:y2,z:z2,v:v2},...]點物件之陣列，或[[x1,y1,z1,v1],[x2,y2,z2,v2],...]點座標陣列之陣列
 * @param {Object} [opt={}] 輸入設定物件，預設{}
 * @param {String} [opt.keyX='x'] 輸入點物件x座標鍵字串，預設'x'
 * @param {String} [opt.keyY='y'] 輸入點物件y座標鍵字串，預設'y'
 * @param {String} [opt.keyY='z'] 輸入點物件z座標鍵字串，預設'z'
 * @param {String} [opt.keyV='v'] 輸入點物件v座標鍵字串，預設'v'
 * @param {String} [opt.keyInd='ind'] 輸入點物件指標鍵字串，預設'ind'
 * @returns {Array} 回傳點{x,y,z,v}陣列
 * @example
 *
 * let ps
 * let r
 *
 * ps = [[243, 206, 95, 2.2], [233, 225, 146, 15.1], [21, 325, 22, 7.9]]
 * r = ptsXYZVtoArr(ps)
 * console.log(r)
 * // => [
 * //   { x: 243, y: 206, z: 95, v: 2.2, ind: 0 },
 * //   { x: 233, y: 225, z: 146, v: 15.1, ind: 1 },
 * //   { x: 21, y: 325, z: 22, v: 7.9, ind: 2 }
 * // ]
 *
 * ps = [{ 'x': 243, 'y': 206, 'z': 95, 'v': 2.2 }, { 'x': 233, 'y': 225, 'z': 146, 'v': 15.1 }, { 'x': 21, 'y': 325, 'z': 22, 'v': 7.9 }]
 * r = ptsXYZVtoArr(ps)
 * console.log(r)
 * // => [
 * //   { x: 243, y: 206, z: 95, v: 2.2, ind: 0 },
 * //   { x: 233, y: 225, z: 146, v: 15.1, ind: 1 },
 * //   { x: 21, y: 325, z: 22, v: 7.9, ind: 2 }
 * // ]
 *
 * ps = [{ 'a': 243, 'b': 206, 'c': 95, 'd': 2.2 }, { 'a': 233, 'b': 225, 'c': 146, 'd': 15.1 }, { 'a': 21, 'b': 325, 'c': 22, 'd': 7.9 }]
 * r = ptsXYZVtoArr(ps, { keyX: 'a', keyY: 'b', keyZ: 'c', keyV: 'd' })
 * console.log(r)
 * // => [
 * //   { x: 243, y: 206, z: 95, v: 2.2, ind: 0 },
 * //   { x: 233, y: 225, z: 146, v: 15.1, ind: 1 },
 * //   { x: 21, y: 325, z: 22, v: 7.9, ind: 2 }
 * // ]
 *
 */
function ptsXYZVtoArr(ps, opt = {}) {

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

    //keyV
    let keyV = get(opt, 'keyV')
    if (!isestr(keyV)) {
        keyV = 'v'
    }

    //keyInd
    let keyInd = get(opt, 'keyInd', '')
    if (!isestr(keyInd)) {
        keyInd = 'ind'
    }

    //rs
    let rs = []
    each(ps, (v, k) => {
        // console.log(k, v)
        let x = null
        let y = null
        let z = null
        let t = null
        if (isarr(v) && size(v) >= 4) {
            x = get(v, 0)
            y = get(v, 1)
            z = get(v, 2)
            t = get(v, 3)
        }
        else {
            x = get(v, keyX, null)
            y = get(v, keyY, null)
            z = get(v, keyZ, null)
            t = get(v, keyV, null)
        }
        // console.log('x', x, 'y', y, 'z', z, 't', t)
        if (isnum(x) && isnum(y) && isnum(z) && isnum(t)) {
            x = toNumber(x)
            y = toNumber(y)
            z = toNumber(z)
            t = toNumber(t)
            rs.push({
                x,
                y,
                z,
                v: t,
                [keyInd]: k,
            })
        }
    })

    return rs
}


export default ptsXYZVtoArr