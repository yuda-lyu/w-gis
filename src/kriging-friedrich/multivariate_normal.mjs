/**
 * Multivariate Normal Distribution sampler.
 *
 * Port of `friedrich 0.6.0` `src/gaussian_process/multivariate_normal.rs`.
 *
 * Exports:
 *   - `mulberry32(seed)`     – seedable PRNG (PORT_SPEC §3)
 *   - `standardNormal(rng)`  – Box-Muller N(0,1) sampler (PORT_SPEC §3)
 *   - `MultivariateNormal`   – class produced by `GaussianProcess.sampleAt`
 *
 * Zero external npm dependencies. PRNG choice (mulberry32 + Box-Muller) is
 * NOT bit-for-bit identical to Rust's rand / rand_distr, but is statistically
 * correct and reproducible given a seed (PORT_SPEC §12.6).
 *
 * Data representation (PORT_SPEC §2):
 *   vector = number[]
 *   matrix = number[][] (row-major)
 */

import { cholesky, matVec } from './algebra.mjs';
import { fromVector } from './conversion.mjs';

//=============================================================================
// PRNG – mulberry32 (PORT_SPEC §3, exact implementation specified)
//=============================================================================

/**
 * Seedable 32-bit PRNG (mulberry32).
 *
 * Returns a closure `() => number ∈ [0, 1)` that advances the PRNG state on
 * each call. Pass the returned function as the `rng` argument to
 * `standardNormal` and `MultivariateNormal.sample`.
 *
 * Example:
 *   const rng = mulberry32(42);
 *   rng(); // reproducible pseudo-random number
 *
 * @param {number} seed  32-bit unsigned integer seed
 * @returns {() => number}
 */
export function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
        a |= 0;
        a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

//=============================================================================
// NORMAL SAMPLER – Box-Muller (PORT_SPEC §3, exact implementation specified)
//=============================================================================

/**
 * Draw one standard-normal sample N(0,1) using the Box-Muller transform.
 *
 * Consumes two uniform draws from `rng`; retries if the first draw is exactly
 * 0 (to avoid log(0) → -Infinity).
 *
 * Note: this uses only the cosine branch of Box-Muller (the sine branch is
 * discarded), matching the PORT_SPEC §3 canonical implementation. Statistical
 * correctness is maintained; the sine branch would give equally valid samples
 * but is not required.
 *
 * @param {() => number} rng  uniform [0, 1) generator (e.g. from mulberry32)
 * @returns {number}
 */
export function standardNormal(rng) {
    let u1 = 0, u2 = 0;
    while (u1 === 0) u1 = rng(); // avoid log(0)
    u2 = rng();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

//=============================================================================
// MultivariateNormal CLASS
//=============================================================================

/**
 * Multivariate Normal Distribution N(mean, Σ).
 *
 * Produced by `GaussianProcess.sampleAt(inputs)`. Stores the Cholesky factor
 * L of the posterior covariance Σ (where Σ = L·Lᵀ). Sampling uses:
 *
 *   z ~ N(0, I)  (draw each component via Box-Muller)
 *   x = mean + L·z  →  x ~ N(mean, Σ)
 *
 * The `isSingle` flag mirrors the Rust `PhantomData<T>` mechanism: when the
 * GP was queried at a single point (`T = Vec<f64>`) the output of `mean()` and
 * `sample()` is a `number`; when queried at multiple points it is a `number[]`.
 *
 * Port notes:
 *   - Rust stores `cholesky_covariance` (already the lower-triangular factor L
 *     from `nalgebra::Cholesky::unpack()`). JS likewise stores only L after
 *     decomposing the covariance in the constructor.
 *   - Cholesky failure → throw (matches Rust `.expect("...")`).
 */
export class MultivariateNormal {
    /**
     * @param {number[]}   mean        posterior mean vector (length n)
     * @param {number[][]} covariance  posterior covariance matrix (n×n), symmetric positive-definite
     * @param {boolean}    isSingle    true when the GP input was a single point (number[]);
     *                                 false when multiple points (number[][])
     */
    constructor(mean, covariance, isSingle) {
        /** @type {number[]} */
        this._mean = mean;
        /**
         * Lower-triangular Cholesky factor L of the covariance (Σ = L·Lᵀ).
         * @type {number[][]}
         */
        this._L = cholesky(covariance, null); // null → throw on failure (matches Rust .expect)
        /** @type {boolean} */
        this._isSingle = isSingle;
    }

    /**
     * Posterior mean.
     *
     * Returns a `number` when `isSingle` is true (single-point query),
     * or a `number[]` when false (multi-point query).
     *
     * @returns {number | number[]}
     */
    mean() {
        return fromVector(this._mean, this._isSingle);
    }

    /**
     * Draw one sample from N(mean, Σ).
     *
     * Algorithm (PORT_SPEC §8):
     *   1. z = [standardNormal(rng), …]  (one N(0,1) per dimension)
     *   2. sampleVec = mean + L·z
     *   3. return fromVector(sampleVec, isSingle)
     *
     * `rng` must be a `() => number ∈ [0, 1)` function, e.g. the closure
     * returned by `mulberry32(seed)`. The output type mirrors `mean()`.
     *
     * Numeric note: the PRNG and Box-Muller implementation differ from Rust's
     * `rand`/`rand_distr`, so sample values will not match Rust bit-for-bit.
     * Statistical correctness and reproducibility given a seed are guaranteed.
     *
     * @param {() => number} rng
     * @returns {number | number[]}
     */
    sample(rng) {
        const n = this._mean.length;
        // Step 1: draw z ~ N(0, I)
        const z = new Array(n);
        for (let i = 0; i < n; i++) z[i] = standardNormal(rng);
        // Step 2: sampleVec = mean + L·z
        const Lz = matVec(this._L, z);
        const sampleVec = new Array(n);
        for (let i = 0; i < n; i++) sampleVec[i] = this._mean[i] + Lz[i];
        // Step 3: convert to scalar or vector depending on query type
        return fromVector(sampleVec, this._isSingle);
    }
}
