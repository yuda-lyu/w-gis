import map from 'lodash-es/map.js'
import get from 'lodash-es/get.js'
import cloneDeep from 'lodash-es/cloneDeep.js'
import turf from './importTurf.mjs'


function splineMultiPolygon(pgs, opt = {}) {
    //splineMultiPolygon(pgs, { resolution: 50000, sharpness: 0.05 })

    function core(pg, opt = {}) {

        //cloneDeep
        pg = cloneDeep(pg)

        //pgNew
        let pgNew = map(pg, (ps, k) => {
            let line = turf.lineString(ps)
            let r = turf.bezierSpline(line, opt)
            let psNew = get(r, 'geometry.coordinates')
            return psNew
        })

        return pgNew
    }

    //cloneDeep
    pgs = cloneDeep(pgs)

    //core
    pgs = map(pgs, (pg) => {
        return core(pg, opt)
    })

    return pgs
}


export default splineMultiPolygon
