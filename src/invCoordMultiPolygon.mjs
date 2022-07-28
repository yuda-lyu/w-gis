import isearr from 'wsemi/src/isearr.mjs'
import map from 'lodash/map'
import invCoordPolygon from './invCoordPolygon.mjs'


function invCoordMultiPolygon(pgs) {

    //check
    if (!isearr(pgs)) {
        return null
    }

    //invCoordPolygon
    let r = map(pgs, (pg) => {
        return invCoordPolygon(pg)
    })

    return r
}


export default invCoordMultiPolygon
