import get from 'lodash-es/get.js'
import each from 'lodash-es/each.js'
import size from 'lodash-es/size.js'
import isestr from 'wsemi/src/isestr.mjs'
import iseobj from 'wsemi/src/iseobj.mjs'
import isearr from 'wsemi/src/isearr.mjs'
import isnum from 'wsemi/src/isnum.mjs'
import cdbl from 'wsemi/src/cdbl.mjs'
import execPyodide from 'wsemi/src/execPyodide.mjs'
import ptsXYZtoArr from './ptsXYZtoArr.mjs'
import ptsXYZVtoArr from './ptsXYZVtoArr.mjs'


/**
 * 針對不規則三維數據進行指定內插點數值
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/interp3.test.mjs Github}
 * @memberOf w-gis
 * @param {Array} psSrc 輸入點陣列，為[{x:x1,y:y1},{x:x2,y:y2},...]點物件之陣列
 * @param {Array|Object} psTar 輸入點陣列或點物件，為[{x:x1,y:y1},{x:x2,y:y2},...]點物件之陣列，或{x:x1,y:y1}點物件
 * @param {String} [opt.keyX='x'] 輸入點物件之x座標欄位字串，預設'x'
 * @param {String} [opt.keyY='y'] 輸入點物件之y座標欄位字串，預設'y'
 * @param {String} [opt.keyZ='z'] 輸入點物件之z座標或值欄位字串，預設'z'
 * @returns {Promise|Array|Object} 回傳Promise或點物件陣列或點物件，若useSync=false則回傳Promise，resolve為回傳點物件陣列或點物件，reject為失敗訊息，若useSync=true則回傳點物件陣列或點物件，若發生錯誤則回傳錯誤訊息物件
 * @example
 *
 * async function test() {
 *
 *     let ps
 *     let p
 *     let r
 *
 *     ps = [{ x: 243, y: 206, z: 95, v: 2.2 }, { x: 233, y: 225, z: 146, v: 15.1 }, { x: 21, y: 325, z: 22, v: 7.9 }, { x: 953, y: 28, z: 223, v: 5.1 }, { x: 1092, y: 290, z: 39, v: 17.5 }, { x: 744, y: 200, z: 191, v: 6.6 }, { x: 174, y: 3, z: 22, v: 1.4 }, { x: 537, y: 368, z: 249, v: 2.9 }, { x: 1151, y: 371, z: 86, v: 7.3 }, { x: 814, y: 252, z: 125, v: 8.2 }]
 *     p = {
 *         x: 243,
 *         y: 207,
 *         z: 100,
 *     }
 *     r = await interp3(ps, p)
 *     console.log(r)
 *     // => { x: 243, y: 207, z: 100, v: 3.4894028270041137 }
 *
 *     ps = [{ x: 243, y: 206, z: 95, v: 2.2 }, { x: 233, y: 225, z: 146, v: 15.1 }, { x: 21, y: 325, z: 22, v: 7.9 }, { x: 953, y: 28, z: 223, v: 5.1 }, { x: 1092, y: 290, z: 39, v: 17.5 }, { x: 744, y: 200, z: 191, v: 6.6 }, { x: 174, y: 3, z: 22, v: 1.4 }, { x: 537, y: 368, z: 249, v: 2.9 }, { x: 1151, y: 371, z: 86, v: 7.3 }, { x: 814, y: 252, z: 125, v: 8.2 }]
 *     p = {
 *         x: 283,
 *         y: 207,
 *         z: 100,
 *     }
 *     r = await interp3(ps, p)
 *     console.log(r)
 *     // => { x: 283, y: 207, z: 100, v: 2.5832273787671967 }
 *
 *     ps = [{ x: 243, y: 206, z: 95, v: 2.2 }, { x: 233, y: 225, z: 146, v: 15.1 }, { x: 21, y: 325, z: 22, v: 7.9 }, { x: 953, y: 28, z: 223, v: 5.1 }, { x: 1092, y: 290, z: 39, v: 17.5 }, { x: 744, y: 200, z: 191, v: 6.6 }, { x: 174, y: 3, z: 22, v: 1.4 }, { x: 537, y: 368, z: 249, v: 2.9 }, { x: 1151, y: 371, z: 86, v: 7.3 }, { x: 814, y: 252, z: 125, v: 8.2 }]
 *     p = {
 *         x: 1160,
 *         y: 380,
 *         z: 100,
 *     }
 *     r = await interp3(ps, p)
 *     console.log(r)
 *     // => { x: 1160, y: 380, z: null }
 *
 *     ps = [{ a: 243, b: 206, c: 95, d: 2.2 }, { a: 233, b: 225, c: 146, d: 15.1 }, { a: 21, b: 325, c: 22, d: 7.9 }, { a: 953, b: 28, c: 223, d: 5.1 }, { a: 1092, b: 290, c: 39, d: 17.5 }, { a: 744, b: 200, c: 191, d: 6.6 }, { a: 174, b: 3, c: 22, d: 1.4 }, { a: 537, b: 368, c: 249, d: 2.9 }, { a: 1151, b: 371, c: 86, d: 7.3 }, { a: 814, b: 252, c: 125, d: 8.2 }]
 *     p = {
 *         a: 243,
 *         b: 207,
 *         c: 100,
 *     }
 *     r = await interp3(ps, p, { keyX: 'a', keyY: 'b', keyZ: 'c', keyV: 'd' })
 *     console.log(r)
 *     // => { a: 243, b: 207, c: 100, d: 3.4894028270041137 }
 *
 *     ps = [{ x: 243, y: 206, z: 95, v: 2.2 }, { x: 233, y: 225, z: 146, v: 15.1 }, { x: 21, y: 325, z: 22, v: 7.9 }, { x: 953, y: 28, z: 223, v: 5.1 }, { x: 1092, y: 290, z: 39, v: 17.5 }, { x: 744, y: 200, z: 191, v: 6.6 }, { x: 174, y: 3, z: 22, v: 1.4 }, { x: 537, y: 368, z: 249, v: 2.9 }, { x: 1151, y: 371, z: 86, v: 7.3 }, { x: 814, y: 252, z: 125, v: 8.2 }]
 *     p = [
 *         {
 *             x: 243,
 *             y: 207,
 *             z: 100,
 *         },
 *         {
 *             x: 283,
 *             y: 207,
 *             z: 100,
 *         },
 *     ]
 *     r = await interp3(ps, p)
 *     console.log(r)
 *     // => [
 *     //   { x: 243, y: 207, z: 100, v: 3.4894028270041137 },
 *     //   { x: 283, y: 207, z: 100, v: 2.5832273787671967 }
 *     // ]
 *
 *     ps = [{ x: 0.000243, y: 0.000206, z: 0.000095, v: 2.2 }, { x: 0.000233, y: 0.000225, z: 0.000146, v: 15.1 }, { x: 0.000021, y: 0.000325, z: 0.000022, v: 7.9 }, { x: 0.000953, y: 0.000028, z: 0.000223, v: 5.1 }, { x: 0.001092, y: 0.00029, z: 0.000039, v: 17.5 }, { x: 0.000744, y: 0.0002, z: 0.000191, v: 6.6 }, { x: 0.000174, y: 0.000003, z: 0.000022, v: 1.4 }, { x: 0.000537, y: 0.000368, z: 0.000249, v: 2.9 }, { x: 0.001151, y: 0.000371, z: 0.000086, v: 7.3 }, { x: 0.000814, y: 0.000252, z: 0.000125, v: 8.2 }]
 *     p = {
 *         x: 0.000243,
 *         y: 0.000207,
 *         z: 0.0001,
 *     }
 *     r = await interp3(ps, p)
 *     console.log(r)
 *     // => { x: 0.000243, y: 0.000207, z: 100, v: 3.489402827004115 }
 *
 * }
 * test()
 *     .catch((err) => {
 *         console.log(err)
 *     })
 *
 */
async function interp3(psSrc, psTar, opt = {}) {

    //check psSrc
    if (!isearr(psSrc)) {
        return {
            err: 'psSrc is not an effective array'
        }
    }

    //check psTar
    if (!iseobj(psTar) && !isearr(psTar)) {
        return {
            err: 'psTar is not an effective object or array'
        }
    }

    //isOne
    let isOne = iseobj(psTar)
    if (isOne) {
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

    //keyZ
    let keyZ = get(opt, 'keyZ')
    if (!isestr(keyZ)) {
        keyZ = 'z'
    }

    //keyV
    let keyV = get(opt, 'keyV')
    if (!isestr(keyV)) {
        keyV = 'v'
    }

    //keyInd
    let keyInd = 'ind'

    //ptsXYZVtoArr
    psSrc = ptsXYZVtoArr(psSrc, { keyX, keyY, keyZ, keyV, keyInd })
    // console.log('ptsXYZVtoArr psSrc', psSrc)

    //check psSrc
    if (size(psSrc) === 0) {
        return {
            err: 'psSrc has no effective data'
        }
    }

    //ptsXYZtoArr
    psTar = ptsXYZtoArr(psTar, { keyX, keyY, keyZ, keyInd })
    // console.log('ptsXYZtoArr psTar', psTar)

    //check psTar
    if (size(psTar) === 0) {
        return {
            err: 'psTar has no effective data'
        }
    }

    //execPyodide
    let pkgs = [
        'scipy',
    ]
    let imps = [
        'from scipy.interpolate import griddata', //griddata是呼叫LinearNDInterpolator
    ]

    let _psLocs = []
    let _psValus = []
    for (let k = 0; k < psSrc.length; k++) {
        let o = psSrc[k]
        _psLocs.push([o.x, o.y, o.z])
        _psValus.push(o.v)
    }
    // console.log('_psLocs', _psLocs)
    // console.log('_psValus', _psValus)

    let _psTar = []
    for (let k = 0; k < psTar.length; k++) {
        let o = psTar[k]
        _psTar.push([o.x, o.y, o.z])
    }
    // console.log('_psTar', _psTar)

    //execPyodide
    let inps = [
        _psLocs,
        _psValus,
        _psTar,
    ]
    let content = `
ret = griddata(rIn1, rIn2, rIn3, method='linear')
    `
    let ts = await execPyodide({
        pkgs,
        imps,
        inps,
        content,
    })
    // console.log('ts', ts)

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
            [keyY]: o.y,
            [keyZ]: o.z,
            [keyV]: v,
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

    return r
}


export default interp3
