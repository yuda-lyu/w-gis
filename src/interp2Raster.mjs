import get from 'lodash-es/get.js'
import each from 'lodash-es/each.js'
import isestr from 'wsemi/src/isestr.mjs'
import isnum from 'wsemi/src/isnum.mjs'
import isfun from 'wsemi/src/isfun.mjs'
import cdbl from 'wsemi/src/cdbl.mjs'
import _kriging from './interp2Kriging.mjs'
// import _kriging from 'w-kriging/src/WKriging.mjs'
import aggregatePoints from './aggregatePoints.mjs'
import interp2Grid from './interp2Grid.mjs'


async function interp2Raster(ops, opt = {}) {

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
        dx = 0.000979087
    }
    dx = cdbl(dx)

    //dy
    let dy = get(opt, 'dy')
    if (!isnum(dy)) {
        dy = 0.000906247
    }
    dy = cdbl(dy)

    //dxAgr
    let dxAgr = get(opt, 'dxAgr')
    if (!isnum(dxAgr)) {
        dxAgr = 0.000979087 * 2
    }
    dxAgr = cdbl(dxAgr)

    //dyAgr
    let dyAgr = get(opt, 'dyAgr')
    if (!isnum(dyAgr)) {
        dyAgr = 0.000906247 * 2
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
        xmin = Math.min(m[keyX], xmin)
        xmax = Math.max(m[keyX], xmax)
        ymin = Math.min(m[keyY], ymin)
        ymax = Math.max(m[keyY], ymax)
    })
    // console.log('xmin', xmin, 'xmax', xmax)
    // console.log('ymin', ymin, 'ymax', ymax)

    //pts, 用dx*2與dy*2聚合提取最小值的效果較好
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
