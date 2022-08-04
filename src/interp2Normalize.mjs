import get from 'lodash/get'
import map from 'lodash/map'
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

    //nxy
    let _x = map(ps, 'x')
    let _y = map(ps, 'y')
    let _xy = [..._x, ..._y]
    let nxy = normalizeArray(_xy)
    // console.log('nxy', nxy)

    //nz
    let nz = normalizeArray(map(ps, 'z'))
    // console.log('nz', nz)

    //st
    let stxy = {
        min: nxy.min,
        max: nxy.max,
        range: nxy.range,
    }
    let st = [
        stxy,
        stxy,
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

    return {
        ps,
        nv,
        inv,
    }
}


export default interp2Normalize
