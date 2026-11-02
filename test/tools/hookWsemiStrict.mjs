const STRICT = new URL('./wsemiInterp1Strict.mjs', import.meta.url).href


//僅把w-gis之src/interp1.mjs對wsemi/src/interp1.mjs之引用導向替身, 替身自身與其他模組之引用不受影響
export async function resolve(specifier, context, nextResolve) {
    let parent = context.parentURL
    if (specifier === 'wsemi/src/interp1.mjs' && typeof parent === 'string' && /\/src\/interp1\.mjs$/.test(parent) && !parent.includes('/node_modules/')) {
        return { url: STRICT, shortCircuit: true }
    }
    return nextResolve(specifier, context)
}
