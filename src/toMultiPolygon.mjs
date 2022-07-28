import map from 'lodash/map'
import getPointDepth from './getPointDepth.mjs'


function toMultiPolygon(v) {
    let d = getPointDepth(v)
    if (d === 3) {
        return v
    }
    if (d === 2) {
        return map(v, (vv) => {
            return [vv]
        })
    }
    if (d === 1) {
        return [[v]]
    }
    if (d === 0) {
        return []
    }
    return v
}


export default toMultiPolygon
