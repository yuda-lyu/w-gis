import get from 'lodash-es/get.js'
import isnum from 'wsemi/src/isnum.mjs'
import isearr from 'wsemi/src/isearr.mjs'
import iseobj from 'wsemi/src/iseobj.mjs'
import isbol from 'wsemi/src/isbol.mjs'
import cdbl from 'wsemi/src/cdbl.mjs'
import turf from './importTurf.mjs'
import toMultiPolygon from './toMultiPolygon.mjs'
import ptXYtoObj from './ptXYtoObj.mjs'


/**
 * 判斷點陣列[x,y]或點物件{x,y}是否位於多邊形陣列內
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/isPointInPolygons.test.mjs Github}
 * @memberOf w-gis
 * @param {Array|Object} p 輸入點陣列或點物件，為[x,y]或{x,y}
 * @param {Array} pgs 輸入多邊形陣列
 * @param {Object} [opt={}] 輸入設定物件，預設{}
 * @param {String} [opt.keyX='x'] 輸入點物件x座標鍵字串，預設'x'
 * @param {String} [opt.keyY='y'] 輸入點物件y座標鍵字串，預設'y'
 * @param {String} [opt.supposeType='polygons'] 輸入提取模式字串，當數據座標深度為2時，使用polygons代表每個其內多邊形為獨立polygon，若為ringStrings則表示其內多邊形為交錯的ringString(代表聯集與剔除)，預設'polygons'
 * @param {Boolean} [opt.toTurfMultiPolygon=true] 輸入是否轉換多邊形為Turf的MultiPolygon，若須加速可於外部先轉好就不用於函數內再轉，預設true
 * @returns {Boolean} 回傳是否位於多邊形陣列內布林值
 * @example
 *
 * let p
 * let pgs
 * let b
 *
 * p = [0.5, 0.5]
 * pgs = [
 *     [0, 0],
 *     [0, 1],
 *     [1, 1],
 *     [1, 0],
 *     [0, 0],
 * ]
 * b = isPointInPolygons(p, pgs)
 * console.log(b)
 * // => true
 *
 * p = [1.5, 0.5]
 * pgs = [
 *     [0, 0],
 *     [0, 1],
 *     [1, 1],
 *     [1, 0],
 *     [0, 0],
 * ]
 * b = isPointInPolygons(p, pgs)
 * console.log(b)
 * // => false
 *
 */
function isPointInPolygons(p, pgs, opt = {}) {

    //pt
    let pt = ptXYtoObj(p, opt)

    //check
    if (!iseobj(pt)) {
        throw new Error('p needs to be [x,y] or {x,y}')
    }

    //x
    let x = get(pt, 'x', '')
    if (!isnum(x)) {
        throw new Error('p[0] or p.x is not an effective number')
    }
    x = cdbl(x)

    //y
    let y = get(pt, 'y', '')
    if (!isnum(y)) {
        throw new Error('p[1] or p.y is not an effective number')
    }
    y = cdbl(y)

    //check
    if (!isearr(pgs)) {
        // throw new Error(`pgs is not an effective array`)
        return false
    }

    //toTurfMultiPolygon
    let toTurfMultiPolygon = get(opt, 'toTurfMultiPolygon')
    if (!isbol(toTurfMultiPolygon)) {
        toTurfMultiPolygon = true
    }

    //point
    p = turf.point([x, y])

    //check
    if (!isearr(pgs)) {
        // throw new Error(`pgs is not an effective array`)
        return false
    }

    //toTurfMultiPolygon
    if (toTurfMultiPolygon) {

        //toMultiPolygon
        pgs = toMultiPolygon(pgs, opt)

        //multiPolygon
        pgs = turf.multiPolygon(pgs)

    }

    //booleanPointInPolygon
    let b = turf.booleanPointInPolygon(p, pgs)

    return b
}


export default isPointInPolygons
