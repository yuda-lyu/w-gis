import get from 'lodash-es/get.js'
import parseGeometryCollection from './parseGeometryCollection.mjs'


/**
 * 解析 turf 計算結果並萃取為 MultiPolygon 座標陣列
 *
 * turf 的幾何布林運算可能回傳 `Polygon`、`MultiPolygon`、`GeometryCollection` 或其他型別，
 * 此函數會統一轉為 MultiPolygon 格式回傳。
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/distilMultiPolygon.test.mjs Github}
 * @memberOf w-gis
 * @param {Object} r 輸入 turf 幾何運算回傳之 GeoJSON Feature 物件
 * @returns {Array} 回傳 MultiPolygon 座標陣列，若無有效 Polygon 幾何則回傳空陣列
 * @example
 *
 * let r
 * let pgs
 *
 * r = {
 *     geometry: {
 *         type: 'Polygon',
 *         coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
 *     },
 * }
 * pgs = distilMultiPolygon(r)
 * console.log(JSON.stringify(pgs))
 * // => [[[[0,0],[1,0],[1,1],[0,1],[0,0]]]]
 *
 */
function distilMultiPolygon(r) {
    //因turf計算後可能產生多種幾何類型, 例如Polygon,MultiPolygon,LineString,GeometryCollection, 故將全部轉成MultiPolygon後回傳

    //type
    let type = get(r, 'geometry.type', '')

    //pgNew
    let pgNew = get(r, 'geometry.coordinates', [])

    if (type === 'Polygon') {
        return [pgNew]
    }
    else if (type === 'MultiPolygon') {
        return pgNew
    }
    else if (type === 'GeometryCollection') {
        return parseGeometryCollection(r)
    }
    else {
        // console.log('type', type, r)
        return []
    }
}


export default distilMultiPolygon
