import get from 'lodash-es/get'
import map from 'lodash-es/map'
import min from 'lodash-es/min'
import max from 'lodash-es/max'
import isNumber from 'lodash-es/isNumber'
import isnum from 'wsemi/src/isnum.mjs'
import isestr from 'wsemi/src/isestr.mjs'
import cdbl from 'wsemi/src/cdbl.mjs'
import normalizeArray from './normalizeArray.mjs'


function interp2Normalize(ps, opt = {}) {

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
    let keyZ = get(opt, 'keyZ', '')
    if (!isestr(keyZ)) {
        keyZ = 'z'
    }

    //keyInd
    let keyInd = get(opt, 'keyInd', '')
    if (!isestr(keyInd)) {
        keyInd = 'ind'
    }

    //scale
    let scale = get(opt, 'scale')
    if (!isnum(scale)) {
        scale = 1
    }
    scale = cdbl(scale)
    if (scale <= 0) {
        throw new Error(`scale need >= 0`)
    }
    // console.log('scale', scale)

    //nx, ny, nz
    let nx = normalizeArray(map(ps, keyX))
    let ny = normalizeArray(map(ps, keyY))
    let nz = normalizeArray(map(ps, keyZ))
    // console.log('nx', nx)
    // console.log('ny', ny)
    // console.log('nz', nz)

    //rangeXY
    let rangeXY = Math.max(nx.range, ny.range)

    //rangeXYHalf
    let rangeXYHalf = rangeXY / 2

    //st, x,y使用同網格尺寸縮放
    let st = [
        {
            min: nx.mid - rangeXYHalf,
            max: nx.mid + rangeXYHalf,
            range: rangeXY,
        },
        {
            min: ny.mid - rangeXYHalf,
            max: ny.mid + rangeXYHalf,
            range: rangeXY,
        },
        {
            min: nz.min,
            max: nz.max,
            range: nz.range,
        },
    ]
    // console.log('st', st)

    //nv
    let nv = (v, i) => {
        // if (i === 2) {
        //     return v
        // }
        if (!isNumber(v)) {
            return null
        }
        if (st[i].range <= 0) {
            return v
        }
        return (v - st[i].min) / st[i].range * scale
    }

    //inv
    let inv = (iv, i) => {
        // if (iv === 2) {
        //     return iv
        // }
        if (!isNumber(iv)) {
            return null
        }
        if (scale <= 0) {
            return iv
        }
        return iv / scale * st[i].range + st[i].min
    }

    //normalize ps
    ps = map(ps, (v) => {
        let x = nv(v[keyX], 0)
        let y = nv(v[keyY], 1)
        let z = nv(v[keyZ], 2)
        let ind = v[keyInd]
        return {
            [keyX]: x,
            [keyY]: y,
            [keyZ]: z,
            [keyInd]: ind,
        }
    })
    // console.log('normalize ps', ps)

    //psMinMax
    let psx = map(ps, keyX)
    let psxMin = min(psx)
    let psxMax = max(psx)
    let psy = map(ps, keyY)
    let psyMin = min(psy)
    let psyMax = max(psy)
    let psz = map(ps, keyZ)
    let pszMin = min(psz)
    let pszMax = max(psz)
    let psMinMax = {
        xmin: psxMin,
        xmax: psxMax,
        ymin: psyMin,
        ymax: psyMax,
        zmin: pszMin,
        zmax: pszMax,
    }

    return {
        ps,
        psMinMax,
        st,
        nv,
        inv,
    }
}


export default interp2Normalize
