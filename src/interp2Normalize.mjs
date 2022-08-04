import map from 'lodash/map'
import isNumber from 'lodash/isNumber'
import normalizeArray from './normalizeArray.mjs'


function interp2Normalize(psSrc) {

    //nxy
    let _x = map(psSrc, 'x')
    let _y = map(psSrc, 'y')
    let _xy = [..._x, ..._y]
    let nxy = normalizeArray(_xy)
    // console.log('nxy', nxy)

    //nz
    let nz = normalizeArray(map(psSrc, 'z'))
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
        return (v - st[i].min) / st[i].range
    }

    //inv
    let inv = (iv, i) => {
        // if (iv === 2) {
        //     return iv
        // }
        if (!isNumber(iv)) {
            return null
        }
        return iv * st[i].range + st[i].min
    }

    //normalize psSrc
    psSrc = map(psSrc, (v) => {
        let x = nv(v.x, 0)
        let y = nv(v.y, 1)
        let z = nv(v.z, 2)
        return { x, y, z }
    })
    // console.log('normalize psSrc', psSrc)

    return {
        psSrc,
        nv,
        inv,
    }
}


export default interp2Normalize
