import get from 'lodash/get'
import map from 'lodash/map'
import min from 'lodash/min'
import max from 'lodash/max'
import isNumber from 'lodash/isNumber'
import isnum from 'wsemi/src/isnum.mjs'
import cdbl from 'wsemi/src/cdbl.mjs'
import normalizeArray from './normalizeArray.mjs'


function interp2Normalize(ps, opt = {}) {

    //scaleXY
    let scaleXY = get(opt, 'scaleXY')
    if (!isnum(scaleXY)) {
        scaleXY = 1
    }
    scaleXY = cdbl(scaleXY)
    // console.log('scaleXY', scaleXY)

    //nx, ny, nz
    let nx = normalizeArray(map(ps, 'x'))
    let ny = normalizeArray(map(ps, 'y'))
    let nz = normalizeArray(map(ps, 'z'))
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
        return (v - st[i].min) / st[i].range * scaleXY
    }

    //inv
    let inv = (iv, i) => {
        // if (iv === 2) {
        //     return iv
        // }
        if (!isNumber(iv)) {
            return null
        }
        return iv / scaleXY * st[i].range + st[i].min
    }

    //normalize ps
    ps = map(ps, (v) => {
        let x = nv(v.x, 0)
        let y = nv(v.y, 1)
        let z = nv(v.z, 2)
        return { x, y, z }
    })
    // console.log('normalize ps', ps)

    //psX
    let psx = map(ps, 'x')
    let psxMin = min(psx)
    let psxMax = max(psx)
    let psy = map(ps, 'y')
    let psyMin = min(psy)
    let psyMax = max(psy)
    let psz = map(ps, 'z')
    let pszMin = min(psz)
    let pszMax = max(psz)

    return {
        ps,
        nv,
        inv,
        st,
        psMinMax: {
            psxMin,
            psxMax,
            psyMin,
            psyMax,
            pszMin,
            pszMax,
        },
    }
}


export default interp2Normalize
