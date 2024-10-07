import get from 'lodash-es/get.js'
import each from 'lodash-es/each.js'
import cdbl from 'wsemi/src/cdbl.mjs'
import isestr from 'wsemi/src/isestr.mjs'
import isnum from 'wsemi/src/isnum.mjs'
import iseobj from 'wsemi/src/iseobj.mjs'
import isearr from 'wsemi/src/isearr.mjs'
import isbol from 'wsemi/src/isbol.mjs'
import turf from './importTurf.mjs'
import toMultiPolygon from './toMultiPolygon.mjs'
import ptXYtoObj from './ptXYtoObj.mjs'


/**
 * 判斷點陣列[x,y]或點物件{x,y}是否位於某一多邊形內之字典物件，若有則回傳該物件之鍵名，若無則回傳def值
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/findPointInKpBoxPolygons.test.mjs Github}
 * @memberOf w-gis
 * @param {Array|Object} p 輸入點陣列或點物件，為[x,y]或{x,y}
 * @param {Object} kpPgs 輸入多邊形字典物件，為{key1:pgs1,key2:pgs2,...keyn:pgsn}
 * @param {Object} [opt={}] 輸入設定物件，預設{}
 * @param {String} [opt.keyX='x'] 輸入點物件x座標鍵字串，預設'x'
 * @param {String} [opt.keyY='y'] 輸入點物件y座標鍵字串，預設'y'
 * @param {String} [opt.supposeType='polygons'] 輸入提取模式字串，當數據座標深度為2時，使用polygons代表每個其內多邊形為獨立polygon，若為ringStrings則表示其內多邊形為交錯的ringString(代表聯集與剔除)，預設'polygons'
 * @param {Boolean} [opt.toTurfMultiPolygon=true] 輸入是否轉換多邊形為Turf的MultiPolygon，若須加速可於外部先轉好就不用於函數內再轉，預設true
 * @param {String} [opt.def='unknow'] 輸入若點未位於任一多邊形時，回傳指定名稱字串，預設'unknow'
 * @returns {String} 回傳名稱字串
 * @example
 *
 * let p
 * let kpPgs = {
 *     'pgs1': [
 *         [0, 0],
 *         [0, 1],
 *         [1, 1],
 *         [1, 0],
 *         [0, 0],
 *     ],
 * }
 * let b
 *
 * p = [0.5, 0.5]
 * b = findPointInKpBoxPolygons(p, kpPgs)
 * console.log(b)
 * // => 'pgs1'
 *
 * p = [1.5, 0.5]
 * b = findPointInKpBoxPolygons(p, kpPgs)
 * console.log(b)
 * // => 'unknow'
 *
 * p = [1.5, 0.5]
 * b = findPointInKpBoxPolygons(p, kpPgs, { def: '未知' })
 * console.log(b)
 * // => '未知'
 *
 */
function findPointInKpBoxPolygons(p, kpPgs, opt = {}) {

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
    if (!iseobj(kpPgs)) {
        throw new Error(`kpPgs is not an effective object`)
    }

    //def
    let def = get(opt, 'def', '')
    if (!isestr(def)) {
        def = 'unknow'
    }

    //toTurfMultiPolygon
    let toTurfMultiPolygon = get(opt, 'toTurfMultiPolygon')
    if (!isbol(toTurfMultiPolygon)) {
        toTurfMultiPolygon = true
    }

    //point
    p = turf.point([x, y])
    // console.log('p', p)

    //booleanPointInPolygon
    let name = ''
    each(kpPgs, (v, kpgs) => {
        // console.log(kpgs, v)

        //box
        let box = get(v, 'box', {})

        //check
        if (!iseobj(box)) {
            // throw new Error(`kpPgs['${kpgs}'].box is not an effective object`)
            return true //跳出換下一個
        }

        //pgs
        let pgs = get(v, 'pgs', [])

        //check
        if (!isearr(pgs) && !iseobj(pgs)) { //有可能為加速由外部先轉Turf的Feature或MultiPolygon, 此為物件
            // throw new Error(`kpPgs['${kpgs}'].pgs is not an effective array`)
            return true //跳出換下一個
        }

        //toTurfMultiPolygon
        if (toTurfMultiPolygon) {

            //toMultiPolygon
            if (isearr(pgs)) {
                pgs = toMultiPolygon(pgs, opt)
            }

            //multiPolygon
            pgs = turf.helpers.multiPolygon(pgs)

        }

        //check
        if (x < box.xmin || x > box.xmax || y < box.ymin || y > box.ymax) {
            return true //跳出換下一個
        }

        //booleanPointInPolygon
        let b = turf.booleanPointInPolygon(p, pgs)
        // console.log(b)

        //check
        if (b) {
            name = kpgs
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


export default findPointInKpBoxPolygons
