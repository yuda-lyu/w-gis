import get from 'lodash-es/get.js'
import each from 'lodash-es/each.js'
import cdbl from 'wsemi/src/cdbl.mjs'
import isestr from 'wsemi/src/isestr.mjs'
import isnum from 'wsemi/src/isnum.mjs'
import iseobj from 'wsemi/src/iseobj.mjs'
import turf from './importTurf.mjs'
import ptXYtoObj from './ptXYtoObj.mjs'


/**
 * 判斷點陣列[x,y]或點物件{x,y}是否位於某一特徵(Feature)內之字典物件，若有則回傳該特徵之鍵名，若無則回傳def值
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/findPointInKpFeature.test.mjs Github}
 * @memberOf w-gis
 * @param {Array|Object} p 輸入點陣列或點物件，為[x,y]或{x,y}
 * @param {Object} kpFt 輸入字典物件，為{key1:ft1,key2:ft2,...keyn:ftn}
 * @param {Object} [opt={}] 輸入設定物件，預設{}
 * @param {String} [opt.keyX='x'] 輸入點物件x座標鍵字串，預設'x'
 * @param {String} [opt.keyY='y'] 輸入點物件y座標鍵字串，預設'y'
 * @param {String} [opt.supposeType='polygons'] 輸入提取模式字串，當數據座標深度為2時，使用polygons代表每個其內多邊形為獨立polygon，若為ringStrings則表示其內多邊形為交錯的ringString(代表聯集與剔除)，預設'polygons'
 * @param {String} [opt.def='unknow'] 輸入若點未位於任一多邊形時，回傳指定名稱字串，預設'unknow'
 * @returns {String} 回傳名稱字串
 * @example
 *
 * let p
 * let kpFt = {
 *     ft1: {
 *         'type': 'Feature',
 *         'properties': {
 *             'name': 'pgs1',
 *         },
 *         'geometry': {
 *             'type': 'MultiPolygon',
 *             'coordinates': [
 *                 [
 *                     [
 *                         [0, 0],
 *                         [0, 1],
 *                         [1, 1],
 *                         [1, 0],
 *                         [0, 0],
 *                     ]
 *                 ]
 *             ]
 *         }
 *     },
 *     ft2: {
 *         'type': 'Feature',
 *         'properties': {
 *             'name': 'pgs2',
 *         },
 *         'geometry': {
 *             'type': 'MultiPolygon',
 *             'coordinates': [
 *                 [
 *                     [
 *                         [1, 1],
 *                         [1, 2],
 *                         [2, 2],
 *                         [2, 1],
 *                         [1, 1],
 *                     ]
 *                 ]
 *             ]
 *         }
 *     },
 * }
 * let b
 *
 * p = [0.5, 0.5]
 * b = findPointInKpFeature(p, kpFt)
 * console.log(b)
 * // => 'ft1'
 *
 * p = [1.5, 0.5]
 * kpFt = {
 *     'ft1': [
 *         [0, 0],
 *         [0, 1],
 *         [1, 1],
 *         [1, 0],
 *         [0, 0],
 *     ],
 * }
 * b = findPointInKpFeature(p, kpFt)
 * console.log(b)
 * // => 'unknow'
 *
 * p = [1.5, 0.5]
 * kpFt = {
 *     'ft1': [
 *         [0, 0],
 *         [0, 1],
 *         [1, 1],
 *         [1, 0],
 *         [0, 0],
 *     ],
 * }
 * b = findPointInKpFeature(p, kpFt, { def: '未知' })
 * console.log(b)
 * // => '未知'
 *
 */
function findPointInKpFeature(p, kpFt, opt = {}) {

    //pt
    let pt = ptXYtoObj(p, opt)

    //check
    if (!iseobj(pt)) {
        throw new Error('p need to be [x,y] or {x,y}')
    }

    //x
    let x = get(pt, 'x', '')
    if (!isnum(x)) {
        throw new Error('p[0] or p.x is not an effective number')
    }
    x = cdbl(x)

    //y
    let y = get(pt, 'y', '')
    if (!isnum(y)) {
        throw new Error('p[1] or p.y is not an effective number')
    }
    y = cdbl(y)

    //check
    if (!iseobj(kpFt)) {
        throw new Error(`kpFt is not an effective object`)
    }

    //def
    let def = get(opt, 'def', '')
    if (!isestr(def)) {
        def = 'unknow'
    }

    //point
    p = turf.point([x, y])
    // console.log('p', p)

    //booleanPointInPolygon
    let name = ''
    each(kpFt, (ft, kft) => {
        // console.log(kft, ft)

        //check
        if (!iseobj(ft)) {
            // throw new Error(`ft is not an effective object`)
            return true //跳出換下一個
        }

        //booleanPointInPolygon
        let b = turf.booleanPointInPolygon(p, ft)
        // console.log(b)

        //check
        if (b) {
            name = kft
            return false //跳出
        }

    })
    // console.log('name', name)

    //check
    if (!isestr(name)) {
        name = def
        // console.log('name(def)', name)
    }

    return name
}


export default findPointInKpFeature
