import get from 'lodash-es/get.js'
import size from 'lodash-es/size.js'
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
// import _kriging from 'w-kriging/src/WKriging.mjs'


async function interp2Grid(pts, xmin, xmax, dx, ymin, ymax, dy, opt = {}) {

    //check
    if (size(pts) === 0) {
        console.log(pts)
        throw new Error(`no pts`)
    }

    //funKriging
    let funKriging = get(opt, 'funKriging')
    if (!isfun(funKriging)) {
        funKriging = _kriging
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

    // //scale
    // let scale = get(opt, 'scale')
    // if (!isnum(scale)) {
    //     scale = 1
    // }
    // scale = cdbl(scale)

    // //model
    // let model = get(opt, 'model')
    // if (model !== 'exponential' && model !== 'gaussian' && model !== 'spherical') {
    //     model = 'exponential'
    // }

    // //sigma2
    // let sigma2 = get(opt, 'sigma2')
    // if (!isnum(sigma2)) {
    //     sigma2 = 0
    // }
    // sigma2 = cdbl(sigma2)

    // //alpha
    // let alpha = get(opt, 'alpha')
    // if (!isnum(alpha)) {
    //     alpha = 100
    // }
    // alpha = cdbl(alpha)

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

    //funValid
    let funValid = get(opt, 'funValid')
    if (!isfun(funValid)) {
        funValid = () => {
            return true
        }
    }

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
        for (let iy = 0; iy < ynum; iy++) {
            grds[iy] = []
            let _iy = iy
            if (inverseKeyY) {
                _iy = ynum - 1 - iy
            }
            for (let ix = 0; ix < xnum; ix++) {
                let k = kpInx[`${ix}:${_iy}`]
                grds[iy][ix] = ipts[k][keyZ]
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

            grds,

        }
    }

    return rs

}

export default interp2Grid
