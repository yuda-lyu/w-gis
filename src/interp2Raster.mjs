import get from 'lodash-es/get.js'
import each from 'lodash-es/each.js'
import isNumber from 'lodash-es/isNumber.js'
import isearr from 'wsemi/src/isearr.mjs'
import isestr from 'wsemi/src/isestr.mjs'
import isnum from 'wsemi/src/isnum.mjs'
import isfun from 'wsemi/src/isfun.mjs'
import cdbl from 'wsemi/src/cdbl.mjs'
import _kriging from './interp2Kriging.mjs'
import aggregatePoints from './aggregatePoints.mjs'
import interp2Grid from './interp2Grid.mjs'


/**
 * 不規則點資料先聚合後，再以克利金法內插為規則網格
 *
 * 流程:
 * 1. 由輸入點資料推算範圍(xmin/xmax/ymin/ymax)
 * 2. 以 `aggregatePoints` 依聚合網格(`dxAgr`/`dyAgr`)做抽樣
 * 3. 以 `interp2Grid` 產生規則網格(`grds`)
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/interp2Raster.test.mjs Github}
 * @memberOf w-gis
 * @param {Array} pts 輸入點物件陣列
 * @param {Object} [opt={}] 輸入設定物件，預設{}
 * @param {String} [opt.keyX='x'] 輸入點物件之x座標欄位字串，預設'x'
 * @param {String} [opt.keyY='y'] 輸入點物件之y座標欄位字串，預設'y'
 * @param {String} [opt.keyZ='z'] 輸入點物件之z座標或值欄位字串，預設'z'
 * @param {Number} [opt.dx=0.000979087] 輸入網格x向間距數字，預設0.000979087
 * @param {Number} [opt.dy=0.000906247] 輸入網格y向間距數字，預設0.000906247
 * @param {Number} [opt.dxAgr=opt.dx*2] 輸入依照規則網格提取點數據之網格x向間距數字，預設dx*2
 * @param {Number} [opt.dyAgr=opt.dy*2] 輸入依照規則網格提取點數據之網格y向間距數字，預設dy*2
 * @param {String} [opt.modePick='min'] 輸入挑選方式字串，可選'min'、'max'，預設'min'
 * @param {Function} [opt.funValid=(x,y)=>{return true}] 輸入確認點座標(x,y)是否有效函數，回傳布林值，可使用Promise回傳，預設(x,y)=>{return true}
 * @param {Function} [opt.funKriging=interp2Kriging] 輸入克利金處理函數，預設使用內建interp2Kriging
 * @param {Function} [opt.funAdjust=(x,y,z)=>{return z}] 輸入內插後數值修正函數，回傳z數值，可使用Promise回傳，預設(x,y,z)=>{return z}
 * @returns {Object} 回傳規則網格物件，物件內grds為規則網格之二維陣列
 * @example
 *
 * function makeFunKrigingLinear(optIn = {}) {
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
 *     let ops
 *     let r
 *
 *     // ----------------
 *     // invalid inputs
 *     // ----------------
 *
 *     ops = 'not array'
 *     try {
 *         r = await interp2Raster(ops, {})
 *     }
 *     catch (err) {
 *         r = err.message
 *     }
 *     console.log(r)
 *     // => 'ops'
 *
 *
 *     // -----------------------
 *     // modePick='min'
 *     // -----------------------
 *
 *     ops = [
 *         { x: 0, y: 0, z: 5, id: 'a' },
 *         { x: 0, y: 0, z: 2, id: 'b' },
 *         { x: 1, y: 1, z: 9, id: 'c' },
 *     ]
 *     r = await interp2Raster(ops, {
 *         dx: 1,
 *         dy: 1,
 *         dxAgr: 1,
 *         dyAgr: 1,
 *         modePick: 'min',
 *         funKriging: makeFunKrigingLinear({ keyX: 'x', keyY: 'y', keyZ: 'z', sx: 10, sy: 1, b: 0 }),
 *     })
 *     console.log(r)
 *     // => {
 *     //      xnum: 2, xmin: 0, xmax: 1, dx: 1,
 *     //      ynum: 2, ymin: 0, ymax: 1, dy: 1,
 *     //      zmin: 0, zmax: 11,
 *     //      grds: [ [1, 11], [0, 10] ],
 *     //      pts: [ { x: 0, y: 0, z: 2, id: 'b' }, { x: 1, y: 1, z: 9, id: 'c' } ]
 *     //    }
 *
 *
 *     // -----------------------
 *     // modePick='max'
 *     // -----------------------
 *
 *     ops = [
 *         { x: 0, y: 0, z: 5, id: 'a' },
 *         { x: 0, y: 0, z: 2, id: 'b' },
 *         { x: 1, y: 1, z: 9, id: 'c' },
 *     ]
 *     r = await interp2Raster(ops, {
 *         dx: 1,
 *         dy: 1,
 *         dxAgr: 1,
 *         dyAgr: 1,
 *         modePick: 'max',
 *         funKriging: makeFunKrigingLinear({ keyX: 'x', keyY: 'y', keyZ: 'z', sx: 10, sy: 1, b: 0 }),
 *     })
 *     console.log(r)
 *     // => {
 *     //      xnum: 2, xmin: 0, xmax: 1, dx: 1,
 *     //      ynum: 2, ymin: 0, ymax: 1, dy: 1,
 *     //      zmin: 0, zmax: 11,
 *     //      grds: [ [1, 11], [0, 10] ],
 *     //      pts: [ { x: 0, y: 0, z: 5, id: 'a' }, { x: 1, y: 1, z: 9, id: 'c' } ]
 *     //    }
 *
 *
 *     // -----------------------
 *     // funAdjust(async)
 *     // -----------------------
 *
 *     ops = [
 *         { x: 0, y: 0, z: 1 },
 *         { x: 1, y: 1, z: 2 },
 *     ]
 *     r = await interp2Raster(ops, {
 *         dx: 1,
 *         dy: 1,
 *         dxAgr: 1,
 *         dyAgr: 1,
 *         funAdjust: async (x, y, z) => {
 *             return z + 100
 *         },
 *         funKriging: makeFunKrigingLinear({ keyX: 'x', keyY: 'y', keyZ: 'z', sx: 10, sy: 1, b: 0 }),
 *     })
 *     console.log(r)
 *     // => {
 *     //      xnum: 2, xmin: 0, xmax: 1, dx: 1,
 *     //      ynum: 2, ymin: 0, ymax: 1, dy: 1,
 *     //      zmin: 100, zmax: 111,
 *     //      grds: [ [101, 111], [100, 110] ],
 *     //      pts: [ { x: 0, y: 0, z: 1 }, { x: 1, y: 1, z: 2 } ]
 *     //    }
 *
 * }
 *
 * test()
 *     .catch((err) => {
 *         console.log(err)
 *     })
 *
 */
async function interp2Raster(ops, opt = {}) {

    //check
    if (!isearr(ops)) {
        throw new Error(`ops`)
    }

    let dlng = 0.000979087
    let dlat = 0.000906247

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

    //dx
    let dx = get(opt, 'dx')
    if (!isnum(dx)) {
        dx = dlng
    }
    dx = cdbl(dx)

    //dy
    let dy = get(opt, 'dy')
    if (!isnum(dy)) {
        dy = dlat
    }
    dy = cdbl(dy)

    //dxAgr
    let dxAgr = get(opt, 'dxAgr')
    if (!isnum(dxAgr)) {
        dxAgr = dy * 2
    }
    dxAgr = cdbl(dxAgr)

    //dyAgr
    let dyAgr = get(opt, 'dyAgr')
    if (!isnum(dyAgr)) {
        dyAgr = dy * 2
    }
    dyAgr = cdbl(dyAgr)

    //modePick
    let modePick = get(opt, 'modePick')
    if (modePick !== 'min' && modePick !== 'max') {
        modePick = 'min'
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

    //funAdjust
    let funAdjust = get(opt, 'funAdjust')
    if (!isfun(funAdjust)) {
        funAdjust = (x, y, z) => {
            return z
        }
    }

    //xmin, xmax, ymin, ymax
    let xmin = 1e20
    let xmax = -1e20
    let ymin = 1e20
    let ymax = -1e20
    each(ops, (m) => {
        let v

        v = get(m, keyX)
        if (isNumber(v)) {
            xmin = Math.min(v, xmin)
            xmax = Math.max(v, xmax)
        }

        v = get(m, keyY)
        if (isNumber(v)) {
            ymin = Math.min(v, ymin)
            ymax = Math.max(v, ymax)
        }

    })
    // console.log('xmin', xmin, 'xmax', xmax)
    // console.log('ymin', ymin, 'ymax', ymax)

    //pts, 用dxAgr與dyAgr聚合提取點數據
    let pts = aggregatePoints(ops, xmin, dxAgr, ymin, dyAgr, {
        modePick,
    })
    // console.log('pts', take(pts, 5), size(pts))

    //rg
    let rg = await interp2Grid(pts, xmin, xmax, dx, ymin, ymax, dy, {
        funKriging,
        funValid,
        funAdjust,
        returnGrid: true,
        inverseKeyY: true,
    })
    // console.log('rg[keyX]num', rg[keyX]num, 'rg[keyY]num', rg[keyY]num)
    // console.log('rg.grds', rg.grds[0])

    //save
    rg.pts = pts

    return rg
}


export default interp2Raster
