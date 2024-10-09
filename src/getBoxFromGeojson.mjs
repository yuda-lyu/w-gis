import get from 'lodash-es/get.js'
import each from 'lodash-es/each.js'
import map from 'lodash-es/map.js'
import min from 'lodash-es/min.js'
import max from 'lodash-es/max.js'
import isbol from 'wsemi/src/isbol.mjs'
import isestr from 'wsemi/src/isestr.mjs'
import JSON5 from 'json5'
import turf from './importTurf.mjs'
import getBox from './getBox.mjs'


/**
 * 計算Geojson的點、線、面陣列之外接矩形範圍
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/getBoxFromGeojson.test.mjs Github}
 * @memberOf w-gis
 * @param {Array} geojson 輸入資料陣列，為多點(multiPoint)、線(line)、多線(multiLine)、面(polygon)、多面(multiPolygon)數據陣列
 * @param {Object} [opt={}] 輸入設定物件，預設{}
 * @param {String} [opt.keyFeatures='geometry.coordinates.features'] 輸入提取Truf的MultiPolygon內Features所在鍵名路徑字串，預設'geometry.coordinates.features'
 * @param {String} [opt.keyCoordinates='geometry.coordinates'] 輸入提取Truf的Features內Coordinates所在鍵名路徑字串，預設'geometry.coordinates'
 * @param {Boolean} [opt.toTurfMultiPolygon=true] 輸入是否轉換多邊形為Turf的MultiPolygon，若須加速可於外部先轉好就不用於函數內再轉，預設true
 * @returns {Object} 回傳外接矩形範圍物件
 * @example
 *
 * let geojson = {
 *     'type': 'FeatureCollection',
 *     'name': 'pgs',
 *     'features': [
 *         {
 *             'type': 'Feature',
 *             'properties': {
 *                 'name': 'pgs1',
 *             },
 *             'geometry': {
 *                 'type': 'MultiPolygon',
 *                 'coordinates': [
 *                     [
 *                         [
 *                             [0, 0],
 *                             [0, 1],
 *                             [1, 1],
 *                             [1, 0],
 *                             [0, 0],
 *                         ]
 *                     ]
 *                 ]
 *             }
 *         },
 *         {
 *             'type': 'Feature',
 *             'properties': {
 *                 'name': 'pgs2',
 *             },
 *             'geometry': {
 *                 'type': 'MultiPolygon',
 *                 'coordinates': [
 *                     [
 *                         [
 *                             [1, 1],
 *                             [1, 2],
 *                             [2, 2],
 *                             [2, 1],
 *                             [1, 1],
 *                         ]
 *                     ]
 *                 ]
 *             }
 *         },
 *     ]
 * }
 * let r
 *
 * r = getBoxFromGeojson(geojson)
 * console.log(r)
 *
 */
function getBoxFromGeojson(geojson, opt = {}) {

    //keyFeatures
    let keyFeatures = get(opt, 'keyFeatures', '')
    if (!isestr(keyFeatures)) {
        keyFeatures = 'geometry.coordinates.features'
    }

    //keyCoordinates
    let keyCoordinates = get(opt, 'keyCoordinates', '')
    if (!isestr(keyCoordinates)) {
        keyCoordinates = 'geometry.coordinates'
    }

    //toTurfMultiPolygon
    let toTurfMultiPolygon = get(opt, 'toTurfMultiPolygon')
    if (!isbol(toTurfMultiPolygon)) {
        toTurfMultiPolygon = true
    }

    //check
    if (isestr(geojson)) {
        geojson = JSON5.parse(geojson)
        // console.log('geojson', geojson)
    }

    //multiPolygon
    if (toTurfMultiPolygon) {

        //multiPolygon
        geojson = turf.multiPolygon(geojson)
        // console.log('geojson', geojson)

    }

    //fts
    let fts = get(geojson, keyFeatures, [])
    // console.log('fts', fts)

    //bxs
    let bxs = []
    each(fts, (ft, kft) => {

        //pgsFt
        let pgsFt = get(ft, keyCoordinates, [])
        // console.log(kft, 'pgsFt', pgsFt)

        //bx
        let bx = getBox(pgsFt)
        // console.log(kft, 'bx', bx)

        //push
        bxs.push(bx)

    })

    //bx
    let bx = null
    if (true) {
        let rs
        rs = [
            ...map(bxs, 'xmin'),
            ...map(bxs, 'xmax')
        ]
        let xmin = min(rs)
        let xmax = max(rs)
        rs = [
            ...map(bxs, 'ymin'),
            ...map(bxs, 'ymax')
        ]
        let ymin = min(rs)
        let ymax = max(rs)
        bx = {
            xmin,
            xmax,
            ymin,
            ymax,
        }
    }
    // console.log('bx', bx)

    return bx
}


export default getBoxFromGeojson
