/**
 * example.mjs — runnable JavaScript translation of the friedrich readme.md
 * "Code sample" section.
 *
 * Rust original (readme.md):
 *   use friedrich::gaussian_process::GaussianProcess;
 *
 *   // trains a gaussian process on a dataset of one-dimensional vectors
 *   let training_inputs = vec![vec![0.8], vec![1.2], vec![3.8], vec![4.2]];
 *   let training_outputs = vec![3.0, 4.0, -2.0, -2.0];
 *   let gp = GaussianProcess::default(training_inputs, training_outputs);
 *
 *   // predicts the mean and variance of a single point
 *   let input = vec![1.];
 *   let mean = gp.predict(&input);
 *   let var = gp.predict_variance(&input);
 *   println!("prediction: {} ± {}", mean, var.sqrt());
 *
 *   // makes several prediction
 *   let inputs = vec![vec![1.0], vec![2.0], vec![3.0]];
 *   let outputs = gp.predict(&inputs);
 *   println!("predictions: {:?}", outputs);
 *
 *   // samples from the distribution
 *   let new_inputs = vec![vec![1.0], vec![2.0]];
 *   let sampler = gp.sample_at(&new_inputs);
 *   let mut rng = rand::rng();
 *   println!("samples: {:?}", sampler.sample(&mut rng));
 *
 * JS port notes:
 *   - `GaussianProcess::default(...)`  → `GaussianProcess.default(...)`.
 *   - method names are snake_case in this port: `predict_variance`,
 *     `sample_at` (`predict` is unchanged).
 *   - a single point is `[1.0]` (number[]) → scalar output; multiple points are
 *     `[[1.0], [2.0], [3.0]]` (number[][]) → vector output (PORT_SPEC §9).
 *   - `rand::rng()` is replaced by the seedable `mulberry32(seed)`, which returns
 *     a `() => number ∈ [0,1)` generator. A fixed seed makes the sample
 *     reproducible (PORT_SPEC §3, §12.6).
 */

import { GaussianProcess, mulberry32 } from './index.mjs';

// Trains a Gaussian process on a dataset of one-dimensional vectors.
const trainingInputs = [[0.8], [1.2], [3.8], [4.2]];
const trainingOutputs = [3.0, 4.0, -2.0, -2.0];
const gp = GaussianProcess.default(trainingInputs, trainingOutputs);

// Predicts the mean and variance of a single point.
const input = [1.0];
const mean = gp.predict(input);
const variance = gp.predict_variance(input);
console.log(`prediction: ${mean} ± ${Math.sqrt(variance)}`);

// Makes several predictions at once.
const inputs = [[1.0], [2.0], [3.0]];
const outputs = gp.predict(inputs);
console.log(`predictions: [${outputs.join(', ')}]`);

// Predicts mean and variance together (faster than separate calls).
const [means, variances] = gp.predict_mean_variance(inputs);
console.log(`mean+variance: [${means.join(', ')}] / [${variances.join(', ')}]`);

// Samples from the posterior distribution at new points.
const newInputs = [[1.0], [2.0]];
const sampler = gp.sample_at(newInputs);
const rng = mulberry32(42); // seedable PRNG → reproducible sample
console.log(`samples: [${sampler.sample(rng).join(', ')}]`);
