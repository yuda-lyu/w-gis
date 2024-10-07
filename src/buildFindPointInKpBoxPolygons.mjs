import get from 'lodash-es/get.js'
import isestr from 'wsemi/src/isestr.mjs'
import isbol from 'wsemi/src/isbol.mjs'
import haskey from 'wsemi/src/haskey.mjs'
import turf from './importTurf.mjs'
import toMultiPolygon from './toMultiPolygon.mjs'
import findPointInKpBoxPolygons from './findPointInKpBoxPolygons.mjs'


/**
 * 判斷點陣列[x,y]或點物件{x,y}是否位於某一多邊形與其邊界內之字典物件，若有則回傳該特徵之鍵名，若無則回傳def值
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/buildFindPointInKpBoxPolygons.test.mjs Github}
 * @memberOf w-gis
 * @returns {Object} 回傳函數物件，包含add、getPoint函數。add為新增，輸入name、pgs與opt，無輸出。getPoint為查詢點位於哪個多邊形並回傳該鍵名，輸入p與opt，功能詳見findPointInKpBoxPolygons。
 * @example
 *
 * let kpPgs = {
 *     'pgs1': [
 *         [0, 0],
 *         [0, 1],
 *         [1, 1],
 *         [1, 0],
 *         [0, 0],
 *     ],
 *     'pgs2': [
 *         [1, 1],
 *         [1, 2],
 *         [2, 2],
 *         [2, 1],
 *         [1, 1],
 *     ],
 * }
 * let p
 * let r
 *
 * let BD = buildFindPointInKpBoxPolygons
 * let bd = new BD()
 * await bd.add('pgs1', kpPgs['pgs1'])
 * await bd.add('pgs2', kpPgs['pgs2'])
 *
 * p = [0.5, 0.5]
 * r = await bd.getPoint(p)
 * console.log(r)
 * // => 'pgs1'
 *
 * p = [1.5, 1.5]
 * r = await bd.getPoint(p)
 * console.log(r)
 * // => 'pgs2'
 *
 * p = [1.5, 0.5]
 * r = await bd.getPoint(p)
 * console.log(r)
 * // => 'unknow'
 *
 * p = [1.5, 0.5]
 * r = await bd.getPoint(p, { def: '未知' })
 * console.log(r)
 * // => '未知'
 *
 */
function Build() {
    let kp = {}

    function add(name, pgs, opt = {}) {

        //check
        if (!isestr(name)) {
            throw new Error(`name is not an effectiv string`)
        }

        //toTurfMultiPolygon
        let toTurfMultiPolygon = get(opt, 'toTurfMultiPolygon')
        if (!isbol(toTurfMultiPolygon)) {
            toTurfMultiPolygon = true
        }

        //check
        if (haskey(kp, name)) {
            throw new Error(`name has existed`)
        }

        //multiPolygon
        if (toTurfMultiPolygon) {

            //toMultiPolygon
            pgs = toMultiPolygon(pgs, opt)
            // console.log('pgs(toMultiPolygon)', pgs)

            //multiPolygon
            pgs = turf.helpers.multiPolygon(pgs)
            // console.log('pgs(multiPolygon)', pgs)

        }

        //bbox, [minX, minY, maxX, maxY]
        let bbox = turf.bbox(pgs)
        // console.log('bbox', bbox)

        //save
        kp[name] = {
            box: {
                xmin: bbox[0],
                xmax: bbox[2],
                ymin: bbox[1],
                ymax: bbox[3],
            },
            pgs,
        }

    }

    async function getPoint(p, opt = {}) {

        //findPointInKpBoxPolygons
        let value = findPointInKpBoxPolygons(p, kp, {
            ...opt,
            toTurfMultiPolygon: false,
        })

        return value
    }

    return {
        add,
        getPoint,
    }
}


export default Build
