import get from 'lodash-es/get'
import size from 'lodash-es/size'
import each from 'lodash-es/each'
import isearr from 'wsemi/src/isearr.mjs'
import isbol from 'wsemi/src/isbol.mjs'
import isnum from 'wsemi/src/isnum.mjs'
import cdbl from 'wsemi/src/cdbl.mjs'


/**
 * 計算RingString面積
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/getAreaRingString.test.mjs Github}
 * @memberOf w-gis
 * @param {Array} rs 輸入RingString資料陣列，為[x,y]點構成之陣列
 * @param {Object} [opt={}] 輸入設定物件，預設{}
 * @param {Boolean} [opt.useAbs=true] 輸入面積是否取絕對值，預設true
 * @returns {Number} 回傳面積數字
 * @example
 *
 * let rs
 * let r
 *
 * rs = [
 *     [0, 0],
 *     [100, 0],
 *     [100, 1],
 *     [0, 1],
 *     [0, 0], //閉合
 * ]
 * r = getAreaRingString(rs)
 * console.log(r)
 * // => 100
 *
 * rs = [
 *     [0, 0],
 *     [100, 0],
 *     [100, 1],
 *     [0, 1],
 * ]
 * r = getAreaRingString(rs)
 * console.log(r)
 * // => 100
 *
 * rs = [
 *     [
 *         [0, 0],
 *         [100, 0],
 *         [100, 1],
 *         [0, 1],
 *     ]
 * ]
 * r = getAreaRingString(rs)
 * console.log(r)
 * // => 0
 *
 */
function getAreaRingString(rs, opt = {}) {

    //useAbs
    let useAbs = get(opt, 'useAbs')
    if (!isbol(useAbs)) {
        useAbs = true
    }

    //check
    if (!isearr(rs)) {
        return 0
    }

    //ers
    let ers = []
    each(rs, (v) => {
        if (size(v) === 2) {
            if (isnum(v[0]) && isnum(v[1])) {
                ers.push([
                    cdbl(v[0]),
                    cdbl(v[1]),
                ])
            }
        }
    })

    //check
    if (!isearr(ers)) {
        return 0
    }

    //area
    let i = -1
    let n = size(ers)
    let a
    let b = ers[n - 1]
    let area = 0
    while (++i < n) {
        a = b
        b = ers[i]
        area += a[1] * b[0] - a[0] * b[1]
    }
    let r = area / 2

    //useAbs
    if (useAbs) {
        r = Math.abs(r)
    }

    return r
}


export default getAreaRingString
