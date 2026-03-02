import isearr from 'wsemi/src/isearr.mjs'
import turf from './importTurf.mjs'
// import clipPolygon from './clipPolygon.mjs'
import toMultiPolygon from './toMultiPolygon.mjs'
import distilMultiPolygon from './distilMultiPolygon.mjs'


/**
 * MultiPolygon做差集(clip)，代表 `pgs1 - pgs2`
 *
 * 目前採用 turf 的 `difference` 計算，再透過 `distilMultiPolygon` 統一輸出為 MultiPolygon 座標陣列。
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/clipMultiPolygon.test.mjs Github}
 * @memberOf w-gis
 * @param {Array} pgs1 輸入被裁切之 RingString、Polygon 或 MultiPolygon 座標陣列
 * @param {Array} pgs2 輸入裁切用之 RingString、Polygon 或 MultiPolygon 座標陣列
 * @param {Object} [opt={}] 輸入設定物件，會傳入 `toMultiPolygon`
 * @param {String} [opt.supposeType='polygons'] 輸入深度為2時之判定模式，可選 `polygons` 或 `ringStrings`
 * @returns {Array|null} 回傳差集後之 MultiPolygon 座標陣列；當 `pgs1` 或 `pgs2` 非陣列時回傳 `null`
 * @example
 *
 * let pgs1
 * let pgs2
 * let r
 *
 * pgs1 = [[[[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]]]]
 * pgs2 = [[[[2, 0], [4, 0], [4, 4], [2, 4], [2, 0]]]]
 * r = clipMultiPolygon(pgs1, pgs2)
 * console.log(JSON.stringify(r))
 * // => [[[[0,0],[2,0],[2,4],[0,4],[0,0]]]]
 *
 */
function clipMultiPolygon(pgs1, pgs2, opt = {}) {
    //尚未使用polybooljs處理MultiPolygon, 故持續使用turf進行difference
    //代表pgs1減去pgs2

    //check
    if (!isearr(pgs1)) {
        return null
    }
    if (!isearr(pgs2)) {
        return null
    }

    //toMultiPolygon
    pgs1 = toMultiPolygon(pgs1, opt)
    pgs2 = toMultiPolygon(pgs2, opt)

    //multiPolygon
    pgs1 = turf.multiPolygon(pgs1)
    pgs2 = turf.multiPolygon(pgs2)

    //difference
    let r = turf.difference(pgs1, pgs2) //須使用turf 6.5.0版, 7.0.0以上會出現要求最小須2個元素才能計算錯誤, 待turf修正

    return distilMultiPolygon(r)
}


// function clipMultiPolygon(pgs1, pgs2) {
//     //代表pgs1減去pgs2

//     //check
//     if (!isearr(pgs1)) {
//         return null
//     }
//     if (!isearr(pgs2)) {
//         return null
//     }

//     //toMultiPolygon
//     let pgs1Temp = toMultiPolygon(pgs1, opt)
//     let pgs2Temp = toMultiPolygon(pgs2, opt)

//     //pgs
//     let pgs = []
//     each(pgs1Temp, (v1) => {
//         each(pgs2Temp, (v2) => {
//             let r = clipPolygon(v1, v2)
//             if (size(r) > 0) {
//                 pgs.push(r)
//             }
//         })
//     })

//     //toMultiPolygon
//     pgs = toMultiPolygon(pgs, opt)

//     return pgs
// }


export default clipMultiPolygon
