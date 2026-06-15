/**
 * index.mjs — public API of the JavaScript (ESM) port of friedrich 0.6.0.
 *
 * Mirrors the `pub use` re-exports of the Rust crate's `src/lib.rs`:
 *   - `pub mod gaussian_process`         → GaussianProcess, GaussianProcessBuilder
 *   - `pub use conversion::Input`        → (runtime helpers, see conversion.mjs)
 *   - `pub use parameters::*`            → all kernels & priors
 *   - `pub use algebra::{SMatrix, …}`    → (linear-algebra primitives, see algebra.mjs)
 *
 * The JS port has no equivalent of Rust's `Input` trait or `serde`; input
 * flexibility is handled at runtime (see conversion.mjs) and there is no
 * save/load. The PRNG (mulberry32) is seedable but not bit-for-bit identical to
 * Rust's `rand`. See README.md for the full Rust ↔ JS correspondence.
 *
 * Example:
 *   import { GaussianProcess, mulberry32 } from './index.mjs';
 *
 *   const gp = GaussianProcess.default([[0.8], [1.2], [3.8], [4.2]], [3, 4, -2, -2]);
 *   const mean = gp.predict([1.0]);
 *   const variance = gp.predict_variance([1.0]);
 *
 * PORT_SPEC §10.3.
 */

// --- Gaussian process core (mod.rs + builder.rs) --------------------------
export { GaussianProcess, GaussianProcessBuilder } from './gaussian_process.mjs';

// --- Multivariate normal + seedable PRNG (multivariate_normal.rs) ---------
export { MultivariateNormal, mulberry32, standardNormal } from './multivariate_normal.mjs';

// --- Kernels (parameters/kernel.rs) ---------------------------------------
export {
    SquaredExp,
    Gaussian,          // alias of SquaredExp (Rust `pub type Gaussian = SquaredExp`)
    Exponential,
    Matern1,
    Matern2,
    Linear,
    Polynomial,
    HyperTan,
    Multiquadric,
    RationalQuadratic,
    KernelSum,
    KernelProd,
    addKernels,
    mulKernels,
    fitBandwidthMean,
    fitAmplitudeVar,
} from './kernels.mjs';

// --- Priors (parameters/prior.rs) -----------------------------------------
export { ZeroPrior, ConstantPrior, LinearPrior } from './priors.mjs';

// --- Input / conversion helpers (conversion/mod.rs) -----------------------
// Not part of the primary public surface, but exposed for callers that want to
// pre-normalise inputs the way the GP does internally.
export { isSingle, toMatrix, toVector, fromVector } from './conversion.mjs';
