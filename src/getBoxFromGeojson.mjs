import get from 'lodash-es/get.js'
import map from 'lodash-es/map.js'
import min from 'lodash-es/min.js'
import max from 'lodash-es/max.js'
import isNumber from 'lodash-es/isNumber.js'
import flatten from 'lodash-es/flatten.js'
import cloneDeep from 'lodash-es/cloneDeep.js'
import isbol from 'wsemi/src/isbol.mjs'
import isestr from 'wsemi/src/isestr.mjs'
import isearr from 'wsemi/src/isearr.mjs'
import iseobj from 'wsemi/src/iseobj.mjs'
import treeObj from 'wsemi/src/treeObj.mjs'
import JSON5 from 'json5'
import turf from './importTurf.mjs'
import toMultiPoint from './toMultiPoint.mjs'


/**
 * 計算Geojson的點、線、面陣列之外接矩形範圍
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/getBoxFromGeojson.test.mjs Github}
 * @memberOf w-gis
 * @param {Array} geojson 輸入資料陣列，為多點(multiPoint)、線(line)、多線(multiLine)、面(polygon)、多面(multiPolygon)數據陣列
 * @param {Object} [opt={}] 輸入設定物件，預設{}
 * @param {Boolean} [opt.toTurfMultiPolygon=true] 輸入是否轉換多邊形為Turf的MultiPolygon，若須加速可於外部先轉好就不用於函數內再轉，預設true
 * @returns {Object} 回傳外接矩形範圍物件
 * @example
 *
 * let geojson
 * let r
 *
 * geojson = {
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
 * r = getBoxFromGeojson(geojson)
 * console.log(r)
 * // => { xmin: 0, xmax: 2, ymin: 0, ymax: 2 }
 *
 * geojson = {
 *     'type': 'Feature',
 *     'properties': {},
 *     'geometry': {
 *         'type': 'MultiPolygon',
 *         'coordinates': {
 *             'type': 'Feature',
 *             'properties': {
 *                 'name': 'pgs',
 *             },
 *             'geometry': {
 *                 'type': 'MultiPolygon',
 *                 'coordinates': [
 *                     [
 *                         [
 *                             [0, 0],
 *                             [-0.2, 1],
 *                             [1, 1.1],
 *                             [1, 0],
 *                             [0, 0],
 *                         ]
 *                     ]
 *                 ]
 *             }
 *         }
 *     }
 * }
 * r = getBoxFromGeojson(geojson)
 * console.log(r)
 * // => { xmin: -0.2, xmax: 1, ymin: 0, ymax: 1.1 }
 *
 */
function getBoxFromGeojson(geojson, opt = {}) {

    //check
    if (isestr(geojson)) {
        geojson = JSON5.parse(geojson)
        // console.log('geojson', geojson)
    }

    //check
    if (!iseobj(geojson)) {
        throw new Error(`geojson is not an effective object or string from geojson`)
    }

    //toTurfMultiPolygon
    let toTurfMultiPolygon = get(opt, 'toTurfMultiPolygon')
    if (!isbol(toTurfMultiPolygon)) {
        toTurfMultiPolygon = true
    }

    //multiPolygon
    if (toTurfMultiPolygon) {

        //multiPolygon
        geojson = turf.multiPolygon(geojson)
        // console.log('geojson', geojson)

    }

    //cds
    let cds = []
    treeObj(geojson, (value, key, nk) => {
        // console.log('=>', value, key, nk)
        if (key === 'coordinates' && isearr(value)) {

            //cloneDeep
            let v = cloneDeep(value)
            // console.log('v', v)

            //toMultiPoint
            v = toMultiPoint(v)
            // console.log('v', v)

            //coordinates
            v = get(v, 'geometry.coordinates', [])

            //push
            cds.push(v)

            return
        }
        return value
    })
    cds = flatten(cds)
    // console.log('cds', cds)

    //bx
    let rs
    rs = map(cds, 0)
    let xmin = min(rs)
    let xmax = max(rs)
    rs = map(cds, 1)
    let ymin = min(rs)
    let ymax = max(rs)

    //check
    if (!isNumber(xmin)) {
        xmin = null
    }
    if (!isNumber(ymin)) {
        ymin = null
    }
    if (!isNumber(xmax)) {
        xmax = null
    }
    if (!isNumber(ymax)) {
        ymax = null
    }

    return {
        xmin,
        ymin,
        xmax,
        ymax,
    }
}


export default getBoxFromGeojson
