import get from 'lodash/get'
import each from 'lodash/each'
import size from 'lodash/size'
import toNumber from 'lodash/toNumber'
import isestr from 'wsemi/src/isestr.mjs'
import iseobj from 'wsemi/src/iseobj.mjs'
import isnum from 'wsemi/src/isnum.mjs'
import isarr from 'wsemi/src/isarr.mjs'
import isearr from 'wsemi/src/isearr.mjs'
import getAreaPolygon from './getAreaPolygon.mjs'
import intersectPolygon from './intersectPolygon.mjs'
import { Delaunay } from 'd3-delaunay'


function gap(pg) {
    return Math.abs(getAreaPolygon(pg))
}


function toArrayXY(ps, opt = {}) {

    //若無數據回傳空陣列
    if (size(ps) <= 0) {
        return []
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

    //rs
    let rs = []
    each(ps, (v) => {
        let x = null
        let y = null
        if (isarr(v) && size(v) >= 2) {
            x = get(v, 0)
            y = get(v, 1)
        }
        else {
            x = get(v, keyX, null)
            y = get(v, keyY, null)
        }
        if (isnum(x) && isnum(y)) {
            x = toNumber(x)
            y = toNumber(y)
            rs.push({
                x,
                y,
            })
        }
    })

    return rs
}


function toArrayXYZ(ps, opt = {}) {

    //若無數據回傳空陣列
    if (size(ps) <= 0) {
        return []
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
    let keyZ = get(opt, 'keyZ', '')
    if (!isestr(keyZ)) {
        keyZ = 'z'
    }

    //rs
    let rs = []
    each(ps, (v) => {
        let x = null
        let y = null
        let z = null
        if (isarr(v) && size(v) >= 3) {
            x = get(v, 0)
            y = get(v, 1)
            z = get(v, 2)
        }
        else {
            x = get(v, keyX, null)
            y = get(v, keyY, null)
            z = get(v, keyZ, null)
        }
        if (isnum(x) && isnum(y) && isnum(z)) {
            x = toNumber(x)
            y = toNumber(y)
            z = toNumber(z)
            rs.push({
                x,
                y,
                z,
            })
        }
    })

    return rs
}


function interp2(psSrc, psTar, opt = {}) {

    //check psSrc
    if (!isearr(psSrc)) {
        return {
            err: 'psSrc is not an array'
        }
    }

    //check psTar
    if (!iseobj(psTar) && !isearr(psTar)) {
        return {
            err: 'psTar is not an object or array'
        }
    }
    if (iseobj(psTar)) {
        psTar = [psTar]
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
    let keyZ = get(opt, 'keyZ', '')
    if (!isestr(keyZ)) {
        keyZ = 'z'
    }


    //toArrayXYZ
    psSrc = toArrayXYZ(psSrc, opt)

    //check psSrc
    if (size(psSrc) === 0) {
        return {
            err: 'psSrc has no effective data'
        }
    }
    // console.log('psSrc', psSrc)

    //toArrayXY
    psTar = toArrayXY(psTar, opt)

    //check psTar
    if (size(psTar) === 0) {
        return {
            err: 'psTar has no effective data'
        }
    }
    // console.log('psTar', psTar)

    //psSrcItr
    let psSrcItr = [...psSrc]

    //psSrcOri
    let psSrcOri = [...psSrc]

    //initialVor
    let initialVor = Delaunay.from(psSrcOri, d => d[keyX], d => d[keyY]).voronoi()

    function addPoint(data, x, y) {
        let r
        try {
            r = addPointCore(data, x, y)
        }
        catch (err) {
            r = null
            data.pop()
        }
        return r
    }

    function addPointCore(data, x, y) {

        //psSrcTemp
        let psSrcTemp = [...psSrc]

        //newItem
        let newItem = { [keyX]: x, [keyY]: y, [keyZ]: 0 }

        //push
        psSrcTemp.push(newItem)
        data.push(newItem)

        //postVor
        let postVor = Delaunay.from(psSrcTemp, d => d[keyX], d => d[keyY]).voronoi()
        // console.log('postVor', postVor)

        //newIdx
        let newIdx = psSrcTemp.length - 1
        // console.log('newIdx', newIdx)

        //queryPoly
        let queryPoly = postVor.cellPolygon(newIdx)
        // console.log('queryPoly', queryPoly)

        //queryA
        let queryA = gap(queryPoly)
        // console.log('queryA', queryA)

        //neighborIndices
        let neighborIndices = []
        for (let i of postVor.delaunay.neighbors(newIdx)) {
            neighborIndices.push(i)
        }

        //subValues
        let subValues = neighborIndices.map((idx) => {

            //pgs1, pgs2
            let pgs1 = [queryPoly]
            let pgs2 = [initialVor.cellPolygon(idx)]
            //console.log('pgs1',pgs1,'pgs2',pgs2)

            //intersect
            let ints = intersectPolygon(pgs1, pgs2)
            //console.log('ints',ints)

            //intersectA
            let intersectA = 0
            if (size(ints) === 1) {
                try {
                    intersectA = gap(ints[0])
                    //console.log('getAreaPolygon',d3.getAreaPolygon(is.regions[0]),getAreaPolygon(is.regions[0]))
                }
                catch (err) {}
            }

            return {
                ia: intersectA,
                idx: idx,
            }
        })

        //newPointVal
        let newPointVal = subValues.map(o => {
            return (o.ia / queryA) * data[o.idx][keyZ]
        }).reduce((a, c) => a + c, 0)

        //update newPointVal
        data[data.length - 1][keyZ] = newPointVal

        return newPointVal
    }

    //r
    let r
    if (size(psTar) === 1) {
        let p = psTar[0]
        let x = p[keyX]
        let y = p[keyY]
        // console.log('psSrcItr', psSrcItr, 'x', x, 'y', y)
        let z = addPoint(psSrcItr, x, y)
        r = {
            [keyX]: x,
            [keyY]: y,
            [keyZ]: z,
        }
    }
    else {
        r = []
        each(psTar, (p) => {
            let x = p[keyX]
            let y = p[keyY]
            let z = addPoint(psSrcItr, x, y)
            r.push({
                [keyX]: x,
                [keyY]: y,
                [keyZ]: z,
            })
        })
    }

    return r
}


export default interp2
