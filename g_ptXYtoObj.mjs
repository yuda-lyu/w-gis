import ptXYtoObj from './src/ptXYtoObj.mjs'


let p
let r

p = [1, 2]
r = ptXYtoObj(p)
console.log(r)
// => { x: 1, y: 2 }

p = { x: 1, y: 2 }
r = ptXYtoObj(p)
console.log(r)
// => { x: 1, y: 2 }


//node g_ptXYtoObj.mjs
