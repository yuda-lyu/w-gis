import get from 'lodash-es/get.js'
import isearr from 'wsemi/src/isearr.mjs'
import isbol from 'wsemi/src/isbol.mjs'
import isnum from 'wsemi/src/isnum.mjs'
import cdbl from 'wsemi/src/cdbl.mjs'
import turf from './importTurf.mjs'
import fixCloseMultiPolygon from './fixCloseMultiPolygon.mjs'


/**
 * 針對MultiPolygon進行Simplify處理
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/simplifyMultiPolygon.test.mjs Github}
 * @memberOf w-gis
 * @param {Array} pgs 輸入MultiPolygon資料陣列，為[[ [[x11,y11],[x12,y12],...], [[x21,y21],[x22,y22],...] ]]構成之陣列
 * @param {Object} [opt={}] 輸入設定物件，預設{}
 * @param {String} [opt.supposeType='polygons'] 輸入提取模式字串，當數據座標深度為2時，使用polygons代表每個其內多邊形為獨立polygon，若為ringStrings則表示其內多邊形為交錯的ringString(代表聯集與剔除)，預設'polygons'
 * @param {Number} [opt.tolerance=0.005] 輸入簡化容許值數字，代表點到線的最大允許距離，故跟座標係有關，預設0.005
 * @param {Boolean} [opt.highQuality=true] 輸入處理模式布林值，true代表品質優先，false代表速度優先，預設true
 * @returns {Array} 回傳MultiPolygon陣列
 * @example
 *
 * let pgs
 * let r
 *
 * pgs = [ //polygon
 *     [
 *         [0, 0],
 *         [10, 0],
 *         [10, 0.9],
 *         [10, 1],
 *         [0, 1],
 *     ]
 * ]
 * r = simplifyMultiPolygon(pgs)
 * console.log(JSON.stringify(r))
 * // => [[[[0,0],[10,0],[10,1],[0,1],[0,0]]]]
 *
 * pgs = [ //polygon
 *     [
 *         [0, 0],
 *         [9.995, 0],
 *         [9.995, 0.995],
 *         [10, 1],
 *         [0, 1],
 *     ]
 * ]
 * r = simplifyMultiPolygon(pgs)
 * console.log(JSON.stringify(r))
 * // => [[[[0,0],[9.995,0],[10,1],[0,1],[0,0]]]]
 *
 * pgs = [ //polygon
 *     [
 *         [0, 0],
 *         [9.99, 0],
 *         [9.99, 0.99],
 *         [10, 1],
 *         [0, 1],
 *     ]
 * ]
 * r = simplifyMultiPolygon(pgs)
 * console.log(JSON.stringify(r))
 * // => [[[[0,0],[9.99,0],[9.99,0.99],[10,1],[0,1],[0,0]]]]
 *
 * pgs = [ //polygon
 *     [
 *         [0, 0],
 *         [9.99, 0],
 *         [9.99, 0.99],
 *         [10, 1],
 *         [0, 1],
 *     ]
 * ]
 * r = simplifyMultiPolygon(pgs, { tolerance: 0.01 })
 * console.log(JSON.stringify(r))
 * // => [[[[0,0],[9.99,0],[10,1],[0,1],[0,0]]]]
 *
 * pgs = [[ //multiPolygon
 *     [
 *         [0, 0],
 *         [10, 0],
 *         [10, 0.9],
 *         [10, 1],
 *         [0, 1],
 *     ]
 * ]]
 * r = simplifyMultiPolygon(pgs)
 * console.log(JSON.stringify(r))
 * // => [[[[0,0],[10,0],[10,1],[0,1],[0,0]]]]
 *
 * pgs = [[ //multiPolygon
 *     [
 *         [0, 0],
 *         [9.995, 0],
 *         [9.995, 0.995],
 *         [10, 1],
 *         [0, 1],
 *     ]
 * ]]
 * r = simplifyMultiPolygon(pgs)
 * console.log(JSON.stringify(r))
 * // => [[[[0,0],[9.995,0],[10,1],[0,1],[0,0]]]]
 *
 * pgs = [[ //multiPolygon
 *     [
 *         [0, 0],
 *         [9.99, 0],
 *         [9.99, 0.99],
 *         [10, 1],
 *         [0, 1],
 *     ]
 * ]]
 * r = simplifyMultiPolygon(pgs)
 * console.log(JSON.stringify(r))
 * // => [[[[0,0],[9.99,0],[9.99,0.99],[10,1],[0,1],[0,0]]]]
 *
 * pgs = [[ //multiPolygon
 *     [
 *         [0, 0],
 *         [9.99, 0],
 *         [9.99, 0.99],
 *         [10, 1],
 *         [0, 1],
 *     ]
 * ]]
 * r = simplifyMultiPolygon(pgs, { tolerance: 0.01 })
 * console.log(JSON.stringify(r))
 * // => [[[[0,0],[9.99,0],[10,1],[0,1],[0,0]]]]
 *
 */
function simplifyMultiPolygon(pgs, opt = {}) {

    //check
    if (!isearr(pgs)) {
        throw new Error(`no pgs`)
    }

    //supposeType
    let supposeType = get(opt, 'supposeType')
    if (supposeType !== 'polygons' && supposeType !== 'ringStrings') {
        supposeType = 'polygons'
    }

    //tolerance
    let tolerance = get(opt, 'tolerance')
    if (!isnum(tolerance)) {
        tolerance = 0.005
    }
    tolerance = cdbl(tolerance)

    //highQuality
    let highQuality = get(opt, 'highQuality')
    if (!isbol(highQuality)) {
        highQuality = true
    }

    //fixCloseMultiPolygon裡面已有toMultiPolygon故不用另外呼叫處理

    //fixCloseMultiPolygon
    pgs = fixCloseMultiPolygon(pgs, { supposeType })
    // console.log('fixCloseMultiPolygon pgs', JSON.stringify(pgs))

    //multiPolygon
    pgs = turf.multiPolygon(pgs)

    //simplify
    let r = turf.simplify(pgs, { tolerance, highQuality })

    //get pgs
    r = get(r, 'geometry.coordinates', [])
    // console.log('r',r)

    return r
}


export default simplifyMultiPolygon
