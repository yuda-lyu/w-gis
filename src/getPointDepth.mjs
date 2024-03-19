import get from 'lodash-es/get'
import size from 'lodash-es/size'


function getPointDepth(v) {
    let ip1 = size(get(v, '0', null))
    let ip2 = size(get(v, '0.0', null))
    let ip3 = size(get(v, '0.0.0', null))
    if (ip3 === 2) {
        return 3
    }
    if (ip2 === 2) {
        return 2
    }
    if (ip1 === 2) {
        return 1
    }
    if (ip1 === 0) {
        return 0
    }
    console.log('invalid point depth', v)
    return null
}


export default getPointDepth
