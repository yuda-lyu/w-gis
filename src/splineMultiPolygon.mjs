import map from 'lodash/map'
import get from 'lodash/get'
import cloneDeep from 'lodash/cloneDeep'
import turf from './importTurf.mjs'


function splineMultiPolygon(pgs, opt = {}) {
    //splineMultiPolygon(pgs, { resolution: 50000, sharpness: 0.05 })

    function core(pg, opt = {}) {

        //cloneDeep
        pg = cloneDeep(pg)

        //pgNew
        let pgNew = map(pg, (ps, k) => {
            let line = turf.helpers.lineString(ps)
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
