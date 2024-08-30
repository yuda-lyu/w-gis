import get from 'lodash-es/get.js'
import each from 'lodash-es/each.js'
import sortBy from 'lodash-es/sortBy.js'
import size from 'lodash-es/size.js'
import isestr from 'wsemi/src/isestr.mjs'
import iseobj from 'wsemi/src/iseobj.mjs'
import isearr from 'wsemi/src/isearr.mjs'
import isnum from 'wsemi/src/isnum.mjs'
import isbol from 'wsemi/src/isbol.mjs'
import cdbl from 'wsemi/src/cdbl.mjs'
import _interp1 from 'wsemi/src/interp1.mjs'
import ptsXtoArr from './ptsXtoArr.mjs'
import ptsXYtoArr from './ptsXYtoArr.mjs'


/**
 * 針對不規則一維數據進行指定內插點數值
 *
 * @memberOf w-gis
 * @param {Array} ps 輸入一維數據，格式可支援兩種，第一種各點為陣列[[x1,y1],[x2,y2],...]，例如[[0.1,5],[0.2,12],...]，第二種各點為物件，屬性至少要有x與y，格式為[{x:x1,y:y1},{x:x2,y:y2},...]，例如[{x:0.1,y:5},{x:0.2,y:12},...]，key值x與y可由opt更換
 * @param {Number} x 輸入要內插點的x值
 * @param {Object} [opt={}] 輸入設定物件，預設{}
 * @param {String} [opt.method=''] 輸入內插方法，可選'linear'、'stairs'、'blocks'，預設'linear'
 * @param {String} [opt.keyX='x'] 輸入若數據為物件陣列，取物件x值時的key字串，預設為'x'
 * @param {String} [opt.keyY='y'] 輸入若數據為物件陣列，取物件y值時的key字串，預設為'y'
 * @param {Number} [opt.xMin=undefined] 輸入若mode='stairs'，更改x範圍下限值，預設為undefined
 * @param {Number} [opt.xMax=undefined] 輸入若mode='stairs'，更改x範圍上限值，預設為undefined
 * @returns {Number|Object} 回傳內插結果數值，或是無法內插時之錯誤訊息物件
 * @example
 *
 * async function test() {
 *
 *     let ps
 *     let p
 *     let r
 *
 *     ps = [{ x: 243, y: 206 }, { x: 233, y: 225 }, { x: 21, y: 325 }, { x: 953, y: 28 }, { x: 1092, y: 290 }, { x: 744, y: 200 }, { x: 174, y: 3 }, { x: 537, y: 368 }, { x: 1151, y: 371 }, { x: 814, y: 252 }]
 *     p = {
 *         x: 243,
 *     }
 *     r = await interp1(ps, p)
 *     console.log(r)
 *     // => { x: 243, y: 206 }
 *
 *     ps = [{ x: 243, y: 206 }, { x: 233, y: 225 }, { x: 21, y: 325 }, { x: 953, y: 28 }, { x: 1092, y: 290 }, { x: 744, y: 200 }, { x: 174, y: 3 }, { x: 537, y: 368 }, { x: 1151, y: 371 }, { x: 814, y: 252 }]
 *     p = {
 *         x: 283,
 *     }
 *     r = await interp1(ps, p)
 *     console.log(r)
 *     // => { x: 283, y: 228.0408163265306 }
 *
 *     ps = [{ x: 243, y: 206 }, { x: 233, y: 225 }, { x: 21, y: 325 }, { x: 953, y: 28 }, { x: 1092, y: 290 }, { x: 744, y: 200 }, { x: 174, y: 3 }, { x: 537, y: 368 }, { x: 1151, y: 371 }, { x: 814, y: 252 }]
 *     p = {
 *         x: 1160,
 *     }
 *     r = await interp1(ps, p)
 *     console.log(r)
 *     // => { x: 1160, y: null }
 *
 *     ps = [{ a: 243, b: 206 }, { a: 233, b: 225 }, { a: 21, b: 325 }, { a: 953, b: 28 }, { a: 1092, b: 290 }, { a: 744, b: 200 }, { a: 174, b: 3 }, { a: 537, b: 368 }, { a: 1151, b: 371 }, { a: 814, b: 252 }]
 *     p = {
 *         a: 243,
 *     }
 *     r = await interp1(ps, p, { keyX: 'a', keyY: 'b' })
 *     console.log(r)
 *     // => { a: 243, b: 206 }
 *
 *     ps = [{ x: 243, y: 206 }, { x: 233, y: 225 }, { x: 21, y: 325 }, { x: 953, y: 28 }, { x: 1092, y: 290 }, { x: 744, y: 200 }, { x: 174, y: 3 }, { x: 537, y: 368 }, { x: 1151, y: 371 }, { x: 814, y: 252 }]
 *     p = [
 *         {
 *             x: 243,
 *         },
 *         {
 *             x: 283,
 *         },
 *     ]
 *     r = await interp1(ps, p)
 *     console.log(r)
 *     // => [ { x: 243, y: 206 }, { x: 283, y: 228.0408163265306 } ]
 *
 *     ps = [{ x: 0.000243, y: 0.000206 }, { x: 0.000233, y: 0.000225 }, { x: 0.000021, y: 0.000325 }, { x: 0.000953, y: 0.000028 }, { x: 0.001092, y: 0.00029 }, { x: 0.000744, y: 0.000200 }, { x: 0.000174, y: 0.000003 }, { x: 0.000537, y: 0.000368 }, { x: 0.001151, y: 0.000371 }, { x: 0.000814, y: 0.000252 }]
 *     p = {
 *         x: 0.000243,
 *     }
 *     r = await interp1(ps, p)
 *     console.log(r)
 *     // => { x: 0.000243, y: 0.00020600000000000002 }
 *
 *     ps = [{ x: 243, y: 206 }, { x: 233, y: 225 }, { x: 21, y: 325 }, { x: 953, y: 28 }, { x: 1092, y: 290 }, { x: 744, y: 200 }, { x: 174, y: 3 }, { x: 537, y: 368 }, { x: 1151, y: 371 }, { x: 814, y: 252 }]
 *     p = {
 *         x: 243,
 *     }
 *     r = interp1(ps, p, { useSync: true }) //使用interp2.wk.umd.js則不支援sync模式
 *     console.log(r)
 *     // => { x: 243, y: 206 }
 *
 * }
 * test()
 *     .catch((err) => {
 *         console.log(err)
 *     })
 *
 */
function interp1(psSrc, psTar, opt = {}) {

    //check psSrc
    if (!isearr(psSrc)) {
        return {
            err: 'psSrc is not an effective array'
        }
    }

    //check psTar
    if (!isnum(psTar) && !iseobj(psTar) && !isearr(psTar)) {
        return {
            err: 'psTar is not a number or an effective object or array'
        }
    }

    //isOne
    let isOne = isnum(psTar) || iseobj(psTar)
    if (isnum(psTar)) {
        psTar = [cdbl(psTar)]
    }
    else if (iseobj(psTar)) {
        psTar = [psTar]
    }

    //keyX
    let keyX = get(opt, 'keyX')
    if (!isestr(keyX)) {
        keyX = 'x'
    }

    //keyY
    let keyY = get(opt, 'keyY')
    if (!isestr(keyY)) {
        keyY = 'y'
    }

    //method
    let method = get(opt, 'method')
    if (method !== 'linear' && method !== 'stairs' && method !== 'blocks') {
        method = 'linear'
    }

    //useSync
    let useSync = get(opt, 'useSync')
    if (!isbol(useSync)) {
        useSync = false
    }

    //keyInd
    let keyInd = 'ind'

    //ptsXYtoArr
    psSrc = ptsXYtoArr(psSrc, { keyX, keyY, keyInd })

    //check psSrc
    if (size(psSrc) === 0) {
        return {
            err: 'psSrc has no effective data'
        }
    }
    // console.log('ptsXYtoArr psSrc', psSrc)

    //sortBy
    psSrc = sortBy(psSrc, 'x')
    // console.log('psSrc', psSrc)

    //ptsXtoArr
    psTar = ptsXtoArr(psTar, { keyX, keyInd })
    // console.log('psTar', psTar)

    //check psTar
    if (size(psTar) === 0) {
        return {
            err: 'psTar has no effective data'
        }
    }
    // console.log('ptsXtoArr psTar', psTar)

    //_sync
    let _sync = () => {

        //_interp1
        let ts = _interp1(psSrc, psTar, {
            ...opt,
            mode: method,
            keyX: 'x', //已正規化至'x'
            keyY: 'y', //已正規化至'y'
        })
        // console.log('_interp1 ts', ts)

        //rs
        let rs = []
        each(psTar, (o, k) => {
            let v = ts[k]
            if (isnum(v)) {
                v = cdbl(v)
            }
            else {
                v = null
            }
            let r = {
                [keyX]: o.x,
                [keyY]: v,
            }
            rs.push(r)
        })
        // console.log('rs', rs)

        //r
        let r
        if (isOne) {
            r = rs[0]
        }
        else {
            r = rs
        }
        // console.log('isOne', isOne, r)

        return r
    }

    //_async
    let _async = async () => {
        let r = null
        try {
            r = _sync()
            let err = get(r, 'err')
            if (isestr(err)) {
                return Promise.reject(err)
            }
            else {
                return r
            }
        }
        catch (err) {
            console.log(err)
            return Promise.reject(err.toString())
        }
    }

    if (useSync) {
        return _sync()
    }
    else {
        return _async()
    }
}


export default interp1
