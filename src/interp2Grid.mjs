import get from 'lodash-es/get.js'
import size from 'lodash-es/size.js'
import isearr from 'wsemi/src/isearr.mjs'
import isestr from 'wsemi/src/isestr.mjs'
import isnum from 'wsemi/src/isnum.mjs'
import ispint from 'wsemi/src/ispint.mjs'
import isbol from 'wsemi/src/isbol.mjs'
import ispm from 'wsemi/src/ispm.mjs'
import isfun from 'wsemi/src/isfun.mjs'
import cdbl from 'wsemi/src/cdbl.mjs'
import cint from 'wsemi/src/cint.mjs'
import pmSeries from 'wsemi/src/pmSeries.mjs'
import _kriging from './interp2Kriging.mjs'


/**
 * 不規則點內插至規則網格
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/interp2Grid.test.mjs Github}
 * @memberOf w-gis
 * @param {Array} pts 輸入點物件陣列
 * @param {Number} xmin 輸入網格x向最小座標數字
 * @param {Number} xmax 輸入網格x向最大座標數字
 * @param {Number} dx 輸入網格x向間距數字
 * @param {Number} ymin 輸入網格y向最小座標數字
 * @param {Number} ymax 輸入網格y向最大座標數字
 * @param {Number} dy 輸入網格y向間距數字
 * @param {Object} [opt={}] 輸入設定物件，預設{}
 * @param {String} [opt.keyX='x'] 輸入點物件之x座標欄位字串，預設'x'
 * @param {String} [opt.keyY='y'] 輸入點物件之y座標欄位字串，預設'y'
 * @param {String} [opt.keyZ='z'] 輸入點物件之z座標或值欄位字串，預設'z'
 * @param {String} [opt.modePick='min'] 輸入挑選方式字串，可選'min'、'max'，預設'min'
 * @param {Function} [opt.funValid=(x,y)=>{return true}] 輸入確認點座標(x,y)是否有效函數，回傳布林值，可使用Promise回傳，預設(x,y)=>{return true}
 * @param {Function} [opt.funKriging=interp2Kriging] 輸入克利金處理函數，預設使用內建interp2Kriging
 * @param {String} [opt.variogram_model='spherical'] 輸入內建interp2Kriging之變異函數模型字串，預設'spherical'
 * @param {Number} [opt.nlags=9] 輸入內建interp2Kriging之分箱數量整數，預設9
 * @param {Function} [opt.funAdjust=(x,y,z)=>{return z}] 輸入內插後值調整函數，用於修正不合理值或做後處理，回傳布林值，可使用Promise回傳，預設(x,y,z)=>{return z}
 * @param {Boolean} [opt.returnGrid=true] 輸入是否回傳規則網格物件布林值，若false則回傳內插後點物件陣列，預設true
 * @param {Boolean} [opt.inverseKeyY=false] 輸入是否反轉y方向索引布林值，用於輸出grds之y向(列)順序，預設false
 * @returns {Object} 回傳規則網格物件，物件內grds為規則網格之二維陣列
 * @example
 *
 * function makeFunKrigingLinear(optIn = {}) {
 *     // 回傳 ipts 必須與 vpts 順序一致
 *     // z = x * sx + y * sy + b
 *     let keyX = optIn.keyX || 'x'
 *     let keyY = optIn.keyY || 'y'
 *     let keyZ = optIn.keyZ || 'z'
 *     let sx = (typeof optIn.sx === 'number') ? optIn.sx : 10
 *     let sy = (typeof optIn.sy === 'number') ? optIn.sy : 1
 *     let b = (typeof optIn.b === 'number') ? optIn.b : 0
 *
 *     return async (pts, vpts, opt) => {
 *         return vpts.map((m) => {
 *             let x = m[keyX]
 *             let y = m[keyY]
 *             return {
 *                 ...m,
 *                 [keyZ]: x * sx + y * sy + b,
 *             }
 *         })
 *     }
 * }
 *
 *
 * async function test() {
 *
 *     let pts
 *     let r
 *
 *     // ----------------
 *     // invalid inputs
 *     // ----------------
 *
 *     pts = 'not array'
 *     try {
 *         r = await interp2Grid(pts, 0, 1, 1, 0, 1, 1, {})
 *     }
 *     catch (err) {
 *         r = err.message
 *     }
 *     console.log(r)
 *     // => 'no pts'
 *
 *     pts = [{ x: 0, y: 0, z: 0 }]
 *     try {
 *         r = await interp2Grid(pts, 'a', 1, 1, 0, 1, 1, {})
 *     }
 *     catch (err) {
 *         r = err.message
 *     }
 *     console.log(r)
 *     // => 'xmin[a] is not an effective number'
 *
 *     pts = [{ x: 0, y: 0, z: 0 }]
 *     try {
 *         r = await interp2Grid(pts, 1, 0, 1, 0, 1, 1, {})
 *     }
 *     catch (err) {
 *         r = err.message
 *     }
 *     console.log(r)
 *     // => 'xmin[1]>xmax[0]'
 *
 *     pts = [{ x: 0, y: 0, z: 0 }]
 *     try {
 *         r = await interp2Grid(pts, 0, 1, 1, 1, 0, 1, {})
 *     }
 *     catch (err) {
 *         r = err.message
 *     }
 *     console.log(r)
 *     // => 'ymin[1]>ymax[0]'
 *
 *
 *     // -----------------------
 *     // returnGrid=true (default)
 *     // -----------------------
 *
 *     pts = [{ x: 0, y: 0, z: 0 }]
 *     r = await interp2Grid(pts, 0, 1, 1, 0, 1, 1, {
 *         funKriging: makeFunKrigingLinear({ keyX: 'x', keyY: 'y', keyZ: 'z', sx: 10, sy: 1, b: 0 }),
 *     })
 *     console.log(r)
 *     // => {
 *     //      xnum: 2, xmin: 0, xmax: 1, dx: 1,
 *     //      ynum: 2, ymin: 0, ymax: 1, dy: 1,
 *     //      zmin: 0, zmax: 11,
 *     //      grds: [ [0, 10], [1, 11] ]
 *     //    }
 *
 *
 *     // -----------------------
 *     // inverseKeyY
 *     // -----------------------
 *
 *     pts = [{ x: 0, y: 0, z: 0 }]
 *     r = await interp2Grid(pts, 0, 1, 1, 0, 1, 1, {
 *         inverseKeyY: true,
 *         funKriging: makeFunKrigingLinear({ keyX: 'x', keyY: 'y', keyZ: 'z', sx: 10, sy: 1, b: 0 }),
 *     })
 *     console.log(r)
 *     // => {
 *     //      ...
 *     //      grds: [ [1, 11], [0, 10] ]
 *     //    }
 *
 *
 *     // -----------------------
 *     // returnGrid=false
 *     // -----------------------
 *
 *     pts = [{ x: 0, y: 0, z: 0 }]
 *     r = await interp2Grid(pts, 0, 1, 1, 0, 1, 1, {
 *         returnGrid: false,
 *         funKriging: makeFunKrigingLinear({ keyX: 'x', keyY: 'y', keyZ: 'z', sx: 10, sy: 1, b: 0 }),
 *     })
 *     console.log(r)
 *     // => [
 *     //      { x: 0, y: 0, z: 0 },
 *     //      { x: 0, y: 1, z: 1 },
 *     //      { x: 1, y: 0, z: 10 },
 *     //      { x: 1, y: 1, z: 11 },
 *     //    ]
 *
 *
 *     // -----------------------
 *     // funValid + returnGrid=false
 *     // -----------------------
 *
 *     pts = [{ x: 0, y: 0, z: 0 }]
 *     r = await interp2Grid(pts, 0, 1, 1, 0, 1, 1, {
 *         returnGrid: false,
 *         funValid: (x, y) => {
 *             return (x === 0 && y === 0) || (x === 1 && y === 1)
 *         },
 *         funKriging: makeFunKrigingLinear({ keyX: 'x', keyY: 'y', keyZ: 'z', sx: 10, sy: 1, b: 0 }),
 *     })
 *     console.log(r)
 *     // => [
 *     //      { x: 0, y: 0, z: 0 },
 *     //      { x: 1, y: 1, z: 11 },
 *     //    ]
 *
 *
 *     // -----------------------
 *     // funAdjust
 *     // -----------------------
 *
 *     pts = [{ x: 0, y: 0, z: 0 }]
 *     r = await interp2Grid(pts, 0, 1, 1, 0, 1, 1, {
 *         returnGrid: false,
 *         funAdjust: (x, y, z) => {
 *             return z + 100
 *         },
 *         funKriging: makeFunKrigingLinear({ keyX: 'x', keyY: 'y', keyZ: 'z', sx: 10, sy: 1, b: 0 }),
 *     })
 *     console.log(r)
 *     // => [
 *     //      { x: 0, y: 0, z: 100 },
 *     //      { x: 0, y: 1, z: 101 },
 *     //      { x: 1, y: 0, z: 110 },
 *     //      { x: 1, y: 1, z: 111 },
 *     //    ]
 *
 *
 *     // -----------------------
 *     // custom keyX/keyY/keyZ
 *     // -----------------------
 *
 *     pts = [{ lon: 0, lat: 0, val: 0 }]
 *     r = await interp2Grid(pts, 121.0, 121.1, 0.1, 24.5, 24.6, 0.1, {
 *         keyX: 'lon',
 *         keyY: 'lat',
 *         keyZ: 'val',
 *         returnGrid: false,
 *         funKriging: makeFunKrigingLinear({ keyX: 'lon', keyY: 'lat', keyZ: 'val', sx: 10, sy: 1, b: 0 }),
 *     })
 *     console.log(r)
 *     // => [
 *     //      { lon: 121.0, lat: 24.5, val: 121.0*10 + 24.5 },
 *     //      { lon: 121.0, lat: 24.6, val: 121.0*10 + 24.6 },
 *     //      { lon: 121.1, lat: 24.5, val: 121.1*10 + 24.5 },
 *     //      { lon: 121.1, lat: 24.6, val: 121.1*10 + 24.6 },
 *     //    ]
 *
 * }
 *
 * test()
 *     .catch((err) => {
 *         console.log(err)
 *     })
 *
 */
async function interp2Grid(pts, xmin, xmax, dx, ymin, ymax, dy, opt = {}) {

    //check
    if (!isearr(pts)) {
        throw new Error(`no pts`)
    }

    //check xmin
    if (!isnum(xmin)) {
        throw new Error(`xmin[${xmin}] is not an effective number`)
    }
    xmin = cdbl(xmin)

    //check xmax
    if (!isnum(xmax)) {
        throw new Error(`xmax[${xmax}] is not an effective number`)
    }
    xmax = cdbl(xmax)

    //check dx
    if (!isnum(dx)) {
        throw new Error(`dx[${dx}] is not an effective number`)
    }
    dx = cdbl(dx)

    //check xmin>xmax
    if (xmin > xmax) {
        throw new Error(`xmin[${xmin}]>xmax[${xmax}]`)
    }

    //check ymin
    if (!isnum(ymin)) {
        throw new Error(`ymin[${ymin}] is not an effective number`)
    }
    ymin = cdbl(ymin)

    //check ymax
    if (!isnum(ymax)) {
        throw new Error(`ymax[${ymax}] is not an effective number`)
    }
    ymax = cdbl(ymax)

    //check dy
    if (!isnum(dy)) {
        throw new Error(`dy[${dy}] is not an effective number`)
    }
    dy = cdbl(dy)

    //check ymin>ymax
    if (ymin > ymax) {
        throw new Error(`ymin[${ymin}]>ymax[${ymax}]`)
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

    //funValid
    let funValid = get(opt, 'funValid')
    if (!isfun(funValid)) {
        funValid = () => {
            return true
        }
    }

    //funKriging
    let funKriging = get(opt, 'funKriging')
    if (!isfun(funKriging)) {
        funKriging = _kriging
    }

    //variogram_model
    let variogram_model = get(opt, 'variogram_model')
    if (!isestr(variogram_model)) {
        variogram_model = 'spherical'
    }

    //nlags
    let nlags = get(opt, 'nlags')
    if (!ispint(nlags)) {
        nlags = 9
    }
    nlags = cint(nlags)

    //funAdjust
    let funAdjust = get(opt, 'funAdjust')
    if (!isfun(funAdjust)) {
        funAdjust = (x, y, z) => {
            return z
        }
    }

    //returnGrid
    let returnGrid = get(opt, 'returnGrid')
    if (!isbol(returnGrid)) {
        returnGrid = true
    }

    //inverseKeyY
    let inverseKeyY = get(opt, 'inverseKeyY')
    if (!isbol(inverseKeyY)) {
        inverseKeyY = false
    }

    //xnum
    let xnum = 0
    for (let x = xmin; x <= xmax; x += dx) {
        xnum++
    }

    //ynum
    let ynum = 0
    for (let y = ymin; y <= ymax; y += dy) {
        ynum++
    }

    //vpts
    let vpts = []
    let kpInx = {}
    let k = -1
    let ix = -1
    for (let x = xmin; x <= xmax; x += dx) {
        ix++

        let iy = -1
        for (let y = ymin; y <= ymax; y += dy) {
            iy++
            k++

            //funValid
            let b = funValid(x, y)
            if (ispm(b)) {
                b = await b
            }

            //check
            if (!b) {
                continue
            }

            //push
            vpts.push({
                [keyX]: x,
                [keyY]: y,
                [keyZ]: '',
            })

            //save
            kpInx[`${ix}:${iy}`] = k

        }
    }
    // console.log('rs', rs)

    //check
    if (size(vpts) === 0) {
        console.log(xmin, xmax, dx, ymin, ymax, dy)
        throw new Error(`no vpts`)
    }

    //funKriging
    let ipts = await funKriging(pts, vpts, {

        keyX,
        keyY,
        keyZ,

        ...opt,

        //interp2Kriging設定參數
        // scale,
        // model,
        // sigma2,
        // alpha,

        //WKriging設定參數
        // variogram_model,
        // nlags,

    })

    //調整不合理值
    ipts = await pmSeries(ipts, async (m) => {
        // console.log('m', m)

        //funAdjust
        let z = funAdjust(m[keyX], m[keyY], m[keyZ])
        if (ispm(z)) {
            z = await z
        }

        //update
        m[keyZ] = z

        return m
    })
    // console.log('ipts(adjust)', ipts)

    //returnGrid
    let rs = null
    if (!returnGrid) {
        rs = ipts
    }
    else {
        let grds = []
        let zmin = 1e20
        let zmax = -1e20
        for (let iy = 0; iy < ynum; iy++) {
            grds[iy] = []
            let _iy = iy
            if (inverseKeyY) {
                _iy = ynum - 1 - iy
            }
            for (let ix = 0; ix < xnum; ix++) {
                let k = kpInx[`${ix}:${_iy}`]
                grds[iy][ix] = ipts[k][keyZ]
                zmin = Math.min(zmin, ipts[k][keyZ])
                zmax = Math.max(zmax, ipts[k][keyZ])
            }
        }
        rs = {

            xnum,
            xmin,
            xmax,
            dx,

            ynum,
            ymin,
            ymax,
            dy,

            zmin,
            zmax,

            grds,

        }
    }

    return rs

}

export default interp2Grid
