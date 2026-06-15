# friedrich-js

A faithful, **zero-dependency** JavaScript (ES module) port of the Rust crate
[friedrich 0.6.0](https://crates.io/crates/friedrich) — Gaussian Process
Regression (a.k.a. Kriging).

A Gaussian process extracts a lot of information from scarce training data and
returns both a prediction and an uncertainty on that prediction. It handles
non-linear phenomena and can encode a prior on the output.

No npm dependencies: the linear algebra (matrices, Cholesky, triangular solves,
least squares) and the PRNG / normal sampler are all implemented in pure JS.

## Install / import

Everything is plain `.mjs` (ES modules). Import from `index.mjs`:

```js
import { GaussianProcess, mulberry32 } from './index.mjs';
```

Node 16+ (uses `Math.imul`, ES modules, `Array.prototype.flat`-free code).

## Usage

```js
import { GaussianProcess, mulberry32 } from './index.mjs';

// Train a Gaussian process on a dataset of one-dimensional vectors.
const trainingInputs = [[0.8], [1.2], [3.8], [4.2]];
const trainingOutputs = [3.0, 4.0, -2.0, -2.0];
const gp = GaussianProcess.default(trainingInputs, trainingOutputs);

// Predict the mean and variance of a single point (number[] in → scalar out).
const mean = gp.predict([1.0]);
const variance = gp.predict_variance([1.0]);
console.log(`prediction: ${mean} ± ${Math.sqrt(variance)}`);

// Several predictions at once (number[][] in → number[] out).
const outputs = gp.predict([[1.0], [2.0], [3.0]]);

// Sample from the posterior. mulberry32(seed) gives a reproducible generator.
const sampler = gp.sample_at([[1.0], [2.0]]);
const rng = mulberry32(42);
console.log(sampler.sample(rng));
```

See `example.mjs` (runnable: `node example.mjs`) and `test.mjs` (the integration
tests, runnable: `node test.mjs`).

## Inputs and outputs

Input flexibility is resolved **at runtime** (Rust uses the `Input` trait /
type system instead):

| JS input                       | meaning                  | prediction output |
|--------------------------------|--------------------------|-------------------|
| `[a, b, c]` (`number[]`)       | one multidimensional point | `number`        |
| `[[a], [b], [c]]` (`number[][]`) | several points          | `number[]`        |

A single 1-D point is `[1.0]` (scalar output); several 1-D points are
`[[1.0], [2.0]]` (vector output). `predict_covariance` **always** returns a
`number[][]` matrix.

## Public API

From `index.mjs`:

- **`GaussianProcess`**, **`GaussianProcessBuilder`**
- **`MultivariateNormal`**, **`mulberry32`**, **`standardNormal`**
- Kernels: **`SquaredExp`** (alias **`Gaussian`**), **`Exponential`**,
  **`Matern1`**, **`Matern2`**, **`Linear`**, **`Polynomial`**, **`HyperTan`**,
  **`Multiquadric`**, **`RationalQuadratic`**, plus **`KernelSum`**,
  **`KernelProd`**, **`addKernels`**, **`mulKernels`**, **`fitBandwidthMean`**,
  **`fitAmplitudeVar`**
- Priors: **`ZeroPrior`**, **`ConstantPrior`**, **`LinearPrior`**
- Conversion helpers: **`isSingle`**, **`toMatrix`**, **`toVector`**, **`fromVector`**

### `GaussianProcess`

- `GaussianProcess.default(inputs, outputs)` — Gaussian kernel + constant prior,
  both fitted (equivalent to `builder(...).fitKernel().fitPrior().train()`).
  Alias: `GaussianProcess.fromData(...)`.
- `GaussianProcess.builder(inputs, outputs)` — returns a `GaussianProcessBuilder`.
- `predict(inputs)` → `number | number[]`
- `predict_variance(inputs)` → `number | number[]`
- `predict_mean_variance(inputs)` → `[mean, variance]`
- `predict_covariance(inputs)` → `number[][]`
- `sample_at(inputs)` → `MultivariateNormal`
- `add_samples(inputs, outputs)` — incremental O(n²) update (no refit)
- `likelihood()` → `number` (log marginal likelihood)
- `fit_parameters(fitPrior, fitKernel, maxIter, convergenceFraction, maxTime?)`

### `GaussianProcessBuilder`

Chainable: `setPrior`, `setNoise`, `setKernel`, `setCholeskyEpsilon`,
`setFitParameters(maxIter, convergenceFraction)`, `fitKernel()`, `fitPrior()`,
then `train()` → `GaussianProcess`.

## Correspondence and differences vs. the Rust version

This port keeps the math and numeric behaviour of friedrich 0.6.0. The API is
the same shape; the differences are mechanical:

- **Method names are `snake_case`** to mirror the Rust API: `predict_variance`,
  `predict_mean_variance`, `predict_covariance`, `add_samples`, `sample_at`,
  `fit_parameters`. (`predict` and the builder's `fitKernel`/`fitPrior` are
  unchanged.)
- **No `serde` save/load.** Rust can serialize a trained model with serde; this
  port omits it — there is no `save`/`load`.
- **No `Input` trait.** Rust dispatches on `Vec<f64>` vs `Vec<Vec<f64>>` (and
  `DMatrix`/`ndarray`) via the type system. Here a runtime check
  (`number[]` vs `number[][]`) decides scalar-vs-vector output. The `DMatrix`
  and `ndarray` input forms have no JS equivalent.
- **PRNG is seedable but not bit-identical to Rust.** Rust uses
  `rand` / `rand_distr`; this port uses **mulberry32** (a small seedable PRNG)
  with a **Box-Muller** standard-normal sampler. `sample_at(...).sample(rng)`
  takes a `() => number ∈ [0,1)` generator (e.g. `mulberry32(seed)`). Sampling
  is statistically correct and reproducible for a fixed seed, but the exact
  numbers differ from Rust.
- **`maxTime` is in milliseconds.** Rust uses `chrono::Duration` (seconds); the
  optimizer here measures time with `Date.now()`. Default: `3600000` ms (1 h).
- **Linear algebra is pure JS.** nalgebra is replaced by hand-written
  primitives (Cholesky with optional `cholesky_epsilon` substitution,
  triangular solves, incremental Cholesky column insertion for `add_samples`,
  least squares for `LinearPrior.fit`). `cholesky_epsilon = null` throws on a
  non-positive-definite matrix (matches Rust `.expect`); a positive value
  substitutes the pivot (matches nalgebra `new_with_substitute`).
- **Data layout is row-major `number[][]`** (one sample per row). nalgebra is
  column-major internally; only the math is reproduced, not the memory layout.
- **Faithful latent bugs from the Rust source are preserved on purpose** (not
  "fixed"), so behaviour matches 0.6.0 exactly. These live in the rarely used
  `Multiquadric` kernel (`nbParameters()` returns 2 for its single parameter;
  `kernel()` uses the squared distance inside `hypot` while `gradient()` uses
  the non-squared distance; `setParameters` reads index 1) and in `Matern2`'s
  gradient (uses the raw `ls` in one exponent rather than `|ls|`). They are
  marked in the source with `NOTE: faithful to Rust source`.

Statistical / numeric tolerances follow `PORT_SPEC.md` §11: non-sampling
prediction paths agree with Rust to ~1e-9; the ADAM fitting path agrees in
direction and magnitude; sampling is reproducible per seed but not bit-exact.

## Files

| file | role |
|---|---|
| `index.mjs` | public API re-exports (mirrors Rust `lib.rs`) |
| `gaussian_process.mjs` | `GaussianProcess` + `GaussianProcessBuilder` |
| `kernels.mjs` | all kernels + combinators + fit heuristics |
| `priors.mjs` | `ZeroPrior` / `ConstantPrior` / `LinearPrior` |
| `optimizer.mjs` | ADAM gradient-ascent parameter fitting |
| `multivariate_normal.mjs` | `MultivariateNormal` + PRNG + normal sampler |
| `conversion.mjs` | runtime input/output normalisation |
| `algebra.mjs` | pure-JS linear algebra (Cholesky, solves, least squares, …) |
| `example.mjs` | runnable readme code sample |
| `test.mjs` | zero-dependency port of `tests/integration.rs` |

`PORT_SPEC.md` is the authoritative porting specification.
