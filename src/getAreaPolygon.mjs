// import get from 'lodash/get'
import each from 'lodash/each'
// import map from 'lodash/map'
import isearr from 'wsemi/src/isearr.mjs'
// import polybooljs from 'polybooljs'
import toPolygon from './toPolygon.mjs'
// import intersectPolygon from './intersectPolygon.mjs'
import getAreaRingString from './getAreaRingString.mjs'


/**
 * 計算Polygon面積
 * 得要考慮多區域、剔除區域之組合: http://esri.github.io/geometry-api-java/doc/Polygon.html
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/getAreaPolygon.test.mjs Github}
 * @memberOf w-gis
 * @param {Array} pg 輸入Polygon資料陣列，為[[x1,y1],[x2,y2],...]RingString構成之陣列
 * @returns {Number} 回傳面積數字
 * @example
 *
 * let pg
 * let r
 *
 * pg = [
 *     [0, 0],
 *     [100, 0],
 *     [100, 1],
 *     [0, 1],
 *     [0, 0], //閉合
 * ]
 * r = getAreaPolygon(pg)
 * console.log(r)
 * // => 100
 *
 * pg = [
 *     [0, 0],
 *     [100, 0],
 *     [100, 1],
 *     [0, 1],
 * ]
 * r = getAreaPolygon(pg)
 * console.log(r)
 * // => 100
 *
 * pg = [
 *     [
 *         [0, 0],
 *         [100, 0],
 *         [100, 1],
 *         [0, 1],
 *     ]
 * ]
 * r = getAreaPolygon(pg)
 * console.log(r)
 * // => 100
 *
 * pg = [
 *     [
 *         [0, 0],
 *         [10, 0],
 *         [10, 1],
 *         [0, 1],
 *     ]
 * ]
 * r = getAreaPolygon(pg)
 * console.log(r)
 * // => 10
 *
 * pg = [
 *     [
 *         [0, 0],
 *         [100, 0],
 *         [100, 1],
 *         [0, 1],
 *     ],
 *     [
 *         [0, 0],
 *         [10, 0],
 *         [10, 1],
 *         [0, 1],
 *     ]
 * ]
 * r = getAreaPolygon(pg)
 * console.log(r)
 * // => 90
 *
 * pg = [
 *     [
 *         [0, 0],
 *         [100, 0],
 *         [100, 1],
 *         [0, 1],
 *     ],
 *     [ //第 2 RingString 與第 1 RingString 不重疊, 但polygon第1個為主要區, 其後為剔除區, 此為有問題多邊形
 *         [200, 0],
 *         [210, 0],
 *         [210, 1],
 *         [200, 1],
 *     ]
 * ]
 * r = getAreaPolygon(pg)
 * console.log(r)
 * // => 90, 實際為110
 *
 */
function getAreaPolygon(pg, opt = {}) {

    // //epsilon
    // let epsilon = get(opt, 'epsilon', 0.000000000001)

    //check
    if (!isearr(pg)) {
        return 0
    }

    //toPolygon
    pg = toPolygon(pg)
    // console.log('toPolygon pg', pg)

    // //ppg, 轉成polybooljs所需polygon
    // let ppg = {
    //     regions: pg,
    //     inverted: false, // is this polygon inverted?
    // }

    // //通過polybooljs轉geojson, 不過重疊多層ringString無法自動計算剔除與合併
    // polybooljs.epsilon(epsilon)
    // let gj = polybooljs.polygonToGeoJSON(ppg)
    // console.log('gj', gj.type, gj.coordinates)

    //r
    let r = 0
    each(pg, (v, k) => { //polygon為多個多邊形組成, 第1個為主要區, 之後為剔除區
        let a = getAreaRingString(v)
        if (k === 0) {
            r = a
        }
        else {
            r -= a
        }
    })

    //check
    if (r < 0) {
        return 0
    }

    return r
}


export default getAreaPolygon
