import get from 'lodash-es/get.js'
import each from 'lodash-es/each.js'
import isestr from 'wsemi/src/isestr.mjs'
import isearr from 'wsemi/src/isearr.mjs'
import JSON5 from 'json5'
import turf from './importTurf.mjs'


/**
 * 由geojson內features提取指定key做鍵之字典物件
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/getKpFeatureFromGeojson.test.mjs Github}
 * @memberOf w-gis
 * @param {String|Object} geojson 輸入geojson字串或物件
 * @param {Object} [opt={}] 輸入設定物件，預設{}
 * @param {String} [opt.key=''] 輸入字串，預設''
 * @param {String} [opt.def='unknow'] 輸入回傳預設鍵名字串，代表features內找不到opt.key則使用opt.def做鍵名，而若有多個找不到情形則複寫處理，也就是取最末者。預設'unknow'
 * @returns {Object} 回傳字典物件
 * @example
 *
 * let geojson
 * let kp
 *
 * geojson = `
 * {
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
 * `
 *
 * kp = getKpFeatureFromGeojson(geojson, { key: 'properties.name' })
 * console.log(kp)
 * // => {
 * //   pgs1: {
 * //     type: 'Feature',
 * //     properties: { name: 'pgs1' },
 * //     geometry: { type: 'MultiPolygon', coordinates: [Array] }
 * //   },
 * //   pgs2: {
 * //     type: 'Feature',
 * //     properties: { name: 'pgs2' },
 * //     geometry: { type: 'MultiPolygon', coordinates: [Array] }
 * //   }
 * // }
 *
 */
function getKpFeatureFromGeojson(geojson, opt = {}) {

    //key
    let key = get(opt, 'key', '')
    if (!isestr(key)) {
        key = ''
    }

    //def
    let def = get(opt, 'def', '')
    if (!isestr(def)) {
        def = 'unknow'
    }

    //pgs
    let pgs
    if (isestr(geojson)) {
        pgs = JSON5.parse(geojson)
    }
    else {
        pgs = geojson
    }

    //multiPolygon
    pgs = turf.multiPolygon(pgs)
    // console.log('pgs', pgs)

    //features
    let features = get(pgs, 'geometry.coordinates.features', [])
    // console.log('features', features)

    //check
    if (!isearr(features)) {
        throw new Error(`features of geojson is not an effective array`)
    }

    //kp
    let kp = {}
    each(features, (v) => {
        // console.log('v', v) //v可視為Turf的Feature, 於Turf內函數亦會自動轉MultiPolygon

        //k
        let k = ''
        if (isestr(key)) {
            k = get(v, key, '')
        }

        //kp
        if (isestr(k)) {
            kp[k] = v
        }
        else if (isestr(def)) {
            kp[def] = v
        }
        else {
            console.log('feature', v)
            console.log('key', key)
            console.log('def', def)
            console.log(`can not get key[${key}] in the feature, or invalid opt.key or invalid opt.def`)
        }

    })
    // console.log('kp', kp)
    // console.log('keys(kp)', keys(kp))

    return kp
}


export default getKpFeatureFromGeojson
