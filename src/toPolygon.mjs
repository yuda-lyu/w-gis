import flatten from 'lodash/flatten'
import getPointDepth from './getPointDepth.mjs'


function toPolygon(v) {
    let d = getPointDepth(v)
    if (d === 3) {
        return flatten(v)
    }
    if (d === 2) {
        return v
    }
    if (d === 1) {
        return [v]
    }
    if (d === 0) {
        return []
    }
    return v
}


export default toPolygon
