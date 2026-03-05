import get from 'lodash-es/get.js'
import each from 'lodash-es/each.js'
import isearr from 'wsemi/src/isearr.mjs'
import toMultiPolygon from './toMultiPolygon.mjs'
import fixClosePolygon from './fixClosePolygon.mjs'
import polybooljs from 'polybooljs'
// import * as polyclip from 'polyclip-ts'


/**
 * 針對MultiPolygon進行扁平化處理，適配GeoJSON規範要求
 *
 * GeoJSON 規格(RFC 7946)對Polygon的定義是第1個LinearRing是exterior ring，後面的則是interior rings(holes)，把多層ring都塞在同一個Polygon內時，對於GeoJSON就變成除了第一個以外，其他ring都會被當成洞(interior rings)
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/clipMultiPolygon.test.mjs Github}
 * @memberOf w-gis
 * @param {Array} pgs 輸入MultiPolygon資料陣列，為[[ [[x11,y11],[x12,y12],...], [[x21,y21],[x22,y22],...] ]]構成之陣列
 * @param {Object} [opt={}] 輸入設定物件，預設{}
 * @param {String} [opt.supposeType='polygons'] 輸入提取模式字串，當數據座標深度為2時，使用polygons代表每個其內多邊形為獨立polygon，若為ringStrings則表示其內多邊形為交錯的ringString(代表聯集與剔除)，預設'polygons'
 * @returns {Array} 回傳MultiPolygon陣列
 * @example
 *
 * let pgs
 * let r
 *
 * pgs = 'not array'
 * try {
 *     r = flattenMultiPolygon(pgs, {})
 * }
 * catch (err) {
 *     r = err.message
 * }
 * console.log(r)
 * // => no pgs
 *
 * pgs = [ //polygon
 *     [[0, 0], [4, 0], [4, 4], [0, 4]],
 *     [[2, 0], [4, 0], [4, 4], [2, 4]],
 * ]
 * r = flattenMultiPolygon(pgs, { supposeType: 'ringStrings' }) //為多層套疊polygon時轉multiPolygon須使用ringStrings
 * console.log(JSON.stringify(r))
 * // => [[[[2,4],[2,0],[0,0],[0,4],[2,4]]]]
 *
 * pgs = [ //polygon
 *     [[0, 0], [4, 0], [4, 4], [0, 4]],
 *     [[0, 0], [2, 0], [2, 2], [0, 2]],
 * ]
 * r = flattenMultiPolygon(pgs, { supposeType: 'ringStrings' }) //為多層套疊polygon時轉multiPolygon須使用ringStrings
 * console.log(JSON.stringify(r))
 * // => [[[[4,4],[4,0],[2,0],[2,2],[0,2],[0,4],[4,4]]]]
 *
 * pgs = [ //polygon
 *     [[0, 0], [4, 0], [4, 4], [0, 4]],
 *     [[0, 0], [2, 2], [0, 4]],
 * ]
 * r = flattenMultiPolygon(pgs, { supposeType: 'ringStrings' }) //為多層套疊polygon時轉multiPolygon須使用ringStrings
 * console.log(JSON.stringify(r))
 * // => [[[[4,4],[4,0],[0,0],[2,2],[0,4],[4,4]]]]
 *
 * pgs = [[ //multiPolygon
 *     [[0, 0], [4, 0], [4, 4], [0, 4]],
 *     [[2, 0], [4, 0], [4, 4], [2, 4]],
 * ]]
 * r = flattenMultiPolygon(pgs, {})
 * console.log(JSON.stringify(r))
 * // => [[[[2,4],[2,0],[0,0],[0,4],[2,4]]]]
 *
 * pgs = [[ //multiPolygon
 *     [[0, 0], [4, 0], [4, 4], [0, 4]],
 *     [[0, 0], [2, 0], [2, 2], [0, 2]],
 * ]]
 * r = flattenMultiPolygon(pgs, {})
 * console.log(JSON.stringify(r))
 * // => [[[[4,4],[4,0],[2,0],[2,2],[0,2],[0,4],[4,4]]]]
 *
 * pgs = [[ //multiPolygon
 *     [[0, 0], [4, 0], [4, 4], [0, 4]],
 *     [[0, 0], [2, 2], [0, 4]],
 * ]]
 * r = flattenMultiPolygon(pgs, {})
 * console.log(JSON.stringify(r))
 * // => [[[[4,4],[4,0],[0,0],[2,2],[0,4],[4,4]]]]
 *
 */
function flattenMultiPolygon(pgs, opt = {}) {

    //check pgs
    if (!isearr(pgs)) {
        throw new Error(`no pgs`)
    }

    //supposeType
    let supposeType = get(opt, 'supposeType')
    if (supposeType !== 'polygons' && supposeType !== 'ringStrings') {
        supposeType = 'polygons'
    }

    //epsilon
    let epsilon = get(opt, 'epsilon', 0.000000000001)

    //toMultiPolygon
    pgs = toMultiPolygon(pgs, { supposeType })
    // console.log('pgs', pgs)

    let funXOR = (pgs1, pgs2) => {

        //xor
        polybooljs.epsilon(epsilon)
        let ints = polybooljs.xor(
            { regions: pgs1 },
            { regions: pgs2 }
        )
        // console.log('ints', ints)

        //pgs
        let pgs = get(ints, 'regions', [])

        //fixClosePolygon
        pgs = fixClosePolygon(pgs)

        return pgs
    }

    //pgsNew
    let pgsNew = []
    each(pgs, (vs, k) => {
        let vsNew = [vs[0]]
        // console.log('vs[0]', vs[0])
        for (let i = 1; i < vs.length; i++) {
            // console.log('vsNew(before)', vsNew)
            // vsNew = polyclip.xor(vsNew, [vs[i]])
            vsNew = funXOR(vsNew, [vs[i]])
            // console.log('vs[i]', vs[i])
            // console.log('vsNew(xor)', vsNew)
        }
        pgsNew.push(vsNew)
    })
    // console.log('pgsNew', pgsNew)

    return pgsNew
}


export default flattenMultiPolygon
