import get from 'lodash-es/get.js'
import each from 'lodash-es/each.js'
import size from 'lodash-es/size.js'
import sortBy from 'lodash-es/sortBy.js'
import isestr from 'wsemi/src/isestr.mjs'
import haskey from 'wsemi/src/haskey.mjs'


function aggregatePoints(ops, xmin, dx, ymin, dy, opt = {}) {

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

    //modePick
    let modePick = get(opt, 'modePick')
    if (modePick !== 'min' && modePick !== 'max') {
        modePick = 'min'
    }

    //pts
    let pts = []
    if (true) {

        //kp
        let kp = {}
        each(ops, (m, km) => {
            let ix = (m[keyX] - xmin) / dx
            ix = Math.floor(ix)
            let iy = (m[keyY] - ymin) / dy
            iy = Math.floor(iy)
            // console.log('ix', ix, 'iy', iy, m[keyZ])
            let key = `${ix}:${iy}`
            if (!haskey(kp, key)) {
                kp[key] = []
            }
            kp[key].push({
                km,
                z: m[keyZ],
            })
        })
        // console.log('kp', kp)

        //提取各網格內最小值
        pts = []
        each(kp, (ps, key) => {
            let n = size(ps)
            if (n === 1) {
                let km = ps[0].km
                let op = ops[km]
                pts.push(op)
            }
            else if (n > 1) {
                // console.log('ps', ps)
                ps = sortBy(ps, 'z')
                // console.log('ps(sortBy)', ps)
                let j = 0
                if (modePick === 'max') {
                    j = size(ps) - 1
                }
                let km = ps[j].km
                let op = ops[km]
                pts.push(op)
            }
        })
        // console.log('pts', take(pts, 5), size(pts))

        // //zmin, zmax
        // let zmin = 1e20
        // let zmax = -1e20
        // each(pts, (m) => {
        //     zmin = Math.min(m[keyZ], zmin)
        //     zmax = Math.max(m[keyZ], zmax)
        // })
        // console.log('pts', 'zmin', zmin, 'zmax', zmax)

    }
    // console.log('pts', take(pts, 5), size(pts))

    return pts
}


export default aggregatePoints
