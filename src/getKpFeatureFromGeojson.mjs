import get from 'lodash-es/get.js'
import each from 'lodash-es/each.js'
import join from 'lodash-es/join.js'
import isestr from 'wsemi/src/isestr.mjs'
import isearr from 'wsemi/src/isearr.mjs'
import iseobj from 'wsemi/src/iseobj.mjs'
import JSON5 from 'json5'
import turf from './importTurf.mjs'


/**
 * 由geojson內features提取指定key做鍵之字典物件
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/getKpFeatureFromGeojson.test.mjs Github}
 * @memberOf w-gis
 * @param {String|Object} geojson 輸入geojson字串或物件
 * @param {Object} [opt={}] 輸入設定物件，預設{}
 * @param {String} [opt.keyFeatures='geometry.coordinates.features'] 輸入geojson轉換至Turf的MultiPolygon物件時，取得Features數據之鍵名路徑字串，預設'geometry.coordinates.features'
 * @param {Array|String} [opt.keysPick=[]] 輸入由特徵取得做為鍵名之路徑字串，預設[]
 * @param {String} [opt.sepKeysPick='|'] 輸入由keysPick取得多鍵名之組裝用分隔字串，預設'|'
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
 * kp = getKpFeatureFromGeojson(geojson, { keysPick: 'properties.name' })
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

    //check
    if (isestr(geojson)) {
        geojson = JSON5.parse(geojson)
        // console.log('geojson', geojson)
    }

    //check
    if (!iseobj(geojson)) {
        throw new Error(`geojson is not an effective object or string from geojson`)
    }

    //keyFeatures
    let keyFeatures = get(opt, 'keyFeatures', '')
    if (!isestr(keyFeatures)) {
        keyFeatures = 'geometry.coordinates.features' //預設是基於QGIS轉出的geojson, 會使用多特徵(features)進行儲存, 但通常只用到1個特徵(feature)
    }

    //keysPick
    let keysPick = get(opt, 'keysPick', '')
    if (isestr(keysPick)) {
        keysPick = [keysPick]
    }
    if (!isearr(keysPick)) {
        keysPick = []
    }

    //sepKeysPick
    let sepKeysPick = get(opt, 'sepKeysPick', '')
    if (!isestr(sepKeysPick)) {
        sepKeysPick = '|'
    }

    //def
    let def = get(opt, 'def', '')
    if (!isestr(def)) {
        def = 'unknow'
    }

    //multiPolygon
    geojson = turf.multiPolygon(geojson)
    // console.log('geojson', geojson)

    //features
    let features = get(geojson, keyFeatures, [])
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
        if (isearr(keysPick)) {
            let _ks = []
            each(keysPick, (keyPick) => {
                let _k = get(v, keyPick, '')
                if (isestr(_k)) {
                    _ks.push(_k)
                }
            })
            k = join(_ks, sepKeysPick)
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
            console.log('keysPick', keysPick)
            console.log('def', def)
            console.log(`can not get keysPick[${keysPick}] in the feature, or invalid opt.keysPick or invalid opt.def`)
        }

    })
    // console.log('kp', kp)
    // console.log('keys(kp)', keys(kp))

    return kp
}


export default getKpFeatureFromGeojson
