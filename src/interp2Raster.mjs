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
 * 依照規則網格提取點數據
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/interp2Raster.test.mjs Github}
 * @memberOf w-gis
 * @param {Array} ops 輸入點物件陣列
 * @param {Object} [opt={}] 輸入設定物件，預設{}
 * @returns {Object} 回傳規則網格物件，物件內grds為規則網格之二維陣列
 *

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
