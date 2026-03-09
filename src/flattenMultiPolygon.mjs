import get from 'lodash-es/get.js'
import each from 'lodash-es/each.js'
import size from 'lodash-es/size.js'
import isearr from 'wsemi/src/isearr.mjs'
import getPointDepth from './getPointDepth.mjs'
import fixCloseMultiPolygon from './fixCloseMultiPolygon.mjs'
import polybooljs from 'polybooljs'
// import * as polyclip from 'polyclip-ts'


/**
 * 針對MultiPolygon進行扁平化處理，適配GeoJSON規範要求
 *
 * GeoJSON 規格(RFC 7946)對Polygon的定義是第1個LinearRing是exterior ring，後面的則是interior rings(holes)，把多層ring都塞在同一個Polygon內時，對於GeoJSON就變成除了第一個以外，其他ring都會被當成洞(interior rings)
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/flattenMultiPolygon.test.mjs Github}
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
 * // => [[[[0,4],[0,0],[2,0],[2,4],[0,4]]]]
 *
 * pgs = [ //polygon
 *     [[0, 0], [4, 0], [4, 4], [0, 4]],
 *     [[0, 0], [2, 0], [2, 2], [0, 2]],
 * ]
 * r = flattenMultiPolygon(pgs, { supposeType: 'ringStrings' }) //為多層套疊polygon時轉multiPolygon須使用ringStrings
 * console.log(JSON.stringify(r))
 * // => [[[[0,4],[0,2],[2,2],[2,0],[4,0],[4,4],[0,4]]]]
 *
 * pgs = [ //polygon
 *     [[0, 0], [4, 0], [4, 4], [0, 4]],
 *     [[0, 0], [2, 2], [0, 4]],
 * ]
 * r = flattenMultiPolygon(pgs, { supposeType: 'ringStrings' }) //為多層套疊polygon時轉multiPolygon須使用ringStrings
 * console.log(JSON.stringify(r))
 * // => [[[[0,4],[2,2],[0,0],[4,0],[4,4],[0,4]]]]
 *
 * pgs = [[ //multiPolygon
 *     [[0, 0], [4, 0], [4, 4], [0, 4]],
 *     [[2, 0], [4, 0], [4, 4], [2, 4]],
 * ]]
 * r = flattenMultiPolygon(pgs, {})
 * console.log(JSON.stringify(r))
 * // => [[[[0,4],[0,0],[2,0],[2,4],[0,4]]]]
 *
 * pgs = [[ //multiPolygon
 *     [[0, 0], [4, 0], [4, 4], [0, 4]],
 *     [[0, 0], [2, 0], [2, 2], [0, 2]],
 * ]]
 * r = flattenMultiPolygon(pgs, {})
 * console.log(JSON.stringify(r))
 * // => [[[[0,4],[0,2],[2,2],[2,0],[4,0],[4,4],[0,4]]]]
 *
 * pgs = [[ //multiPolygon
 *     [[0, 0], [4, 0], [4, 4], [0, 4]],
 *     [[0, 0], [2, 2], [0, 4]],
 * ]]
 * r = flattenMultiPolygon(pgs, {})
 * console.log(JSON.stringify(r))
 * // => [[[[0,4],[2,2],[0,0],[4,0],[4,4],[0,4]]]]
 *
 * pgs = [[ //multiPolygon
 *     [[0, 0], [4, 0], [4, 4], [0, 4]],
 *     [[10, 0], [12, 2], [10, 4]],
 * ]]
 * r = flattenMultiPolygon(pgs, {})
 * console.log(JSON.stringify(r))
 * // => [[[[0,4],[0,0],[4,0],[4,4],[0,4]]],[[[10,4],[10,0],[12,2],[10,4]]]]
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

    //fixCloseMultiPolygon裡面已有toMultiPolygon故不用另外呼叫處理

    //fixCloseMultiPolygon
    pgs = fixCloseMultiPolygon(pgs, { supposeType })
    // console.log('fixCloseMultiPolygon pgs', JSON.stringify(pgs))

    polybooljs.epsilon(epsilon)
    let xorPolygon = (pgs) => {

        //check
        let n = size(pgs)
        if (n === 0) {
            return []
        }
        else if (n === 1) {
            return pgs
        }

        //xorPoly
        let xorPoly = { regions: [pgs[0]] }
        // console.log('pgs[0]', pgs[0])
        for (let i = 1; i < pgs.length; i++) {
            // console.log(`pgs[${i}]`, pgs[i])
            xorPoly = polybooljs.xor(xorPoly, { regions: [pgs[i]] })
        }

        //geojson
        let geojson = polybooljs.polygonToGeoJSON(xorPoly)
        // console.log('geojson', geojson)

        //pgsNew
        let pgsNew = get(geojson, 'coordinates', [])
        // console.log('pgsNew', pgsNew)

        //d
        let d = getPointDepth(pgsNew)
        if (d === 2) {
            //大半回傳polygon, 強制轉multiPolygon
            pgsNew = [pgsNew]
        }
        else if (d === 3) {
            //若回傳multiPolygon, 例如不相干的polygon做xor, 就直接回傳
        }
        else {
            throw new Error(`invalid point depth[${d}]`)
        }

        //fixCloseMultiPolygon
        pgsNew = fixCloseMultiPolygon(pgsNew, { supposeType })
        // console.log('fixCloseMultiPolygon pgs', JSON.stringify(pgs))

        return pgsNew
    }

    //pgsNew
    let pgsNew = []
    each(pgs, (v) => {
        let pgsTemp = xorPolygon(v)
        pgsNew = [
            ...pgsNew,
            ...pgsTemp,
        ]
    })
    // console.log('pgsNew', JSON.stringify(pgsNew))

    return pgsNew
}


export default flattenMultiPolygon
