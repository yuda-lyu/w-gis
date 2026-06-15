//! Gaussian process.
//!
//! Port of `friedrich 0.6.0`:
//!   - `src/gaussian_process/mod.rs`     → `GaussianProcess`
//!   - `src/gaussian_process/builder.rs` → `GaussianProcessBuilder`
//!
//! A Gaussian process that can make predictions based on its training data.
//!
//! Example (mirrors the Rust crate doc):
//!   import { GaussianProcess } from './gaussian_process.mjs';
//!   import { mulberry32 } from './multivariate_normal.mjs';
//!
//!   const trainingInputs  = [[0.8], [1.2], [3.8], [4.2]];
//!   const trainingOutputs = [3.0, 4.0, -2.0, -2.0];
//!   const gp = GaussianProcess.default(trainingInputs, trainingOutputs);
//!
//!   const mean = gp.predict([1.0]);            // → number (single point)
//!   const variance = gp.predict_variance([1.0]);
//!
//!   const outputs = gp.predict([[1.0], [2.0], [3.0]]); // → number[]
//!
//!   gp.add_samples([[0.], [1.], [2.], [5.]], [2.0, 3.0, -1.0, -2.0]);
//!   gp.fit_parameters(true, true, 100, 0.05, 3600 * 1000);
//!
//!   const sampler = gp.sample_at([[1.0], [2.0]]);
//!   const rng = mulberry32(42);
//!   sampler.sample(rng);
//!
//! Data representation (PORT_SPEC §2):
//!   point / vector = number[];  dataset / matrix = number[][] (one row per sample).
//!
//! Key semantic alignment with the Rust source (PORT_SPEC §6, §12):
//!   - `trainingOutputs` stores the PRIOR RESIDUAL (outputs − prior(inputs)), not
//!     the raw outputs. Every place that needs the raw outputs adds prior back,
//!     every place that re-stores them subtracts the prior.
//!   - `noise` is the noise STANDARD DEVIATION. `makeCholeskyCovMatrix` /
//!     `addRowsCholeskyCovMatrix` square it internally (adds noise² to the diag).
//!   - `predict`'s `gemm_tr(1, weights, outputs, 1)` computes
//!     `weightsᵀ · trainingOutputs + prior`, i.e.
//!     `mean[i] = prior[i] + Σ_t weights[t][i]·trainingOutputs[t]`.

import {
    ExtendableMatrix,
    ExtendableVector,
    makeCholeskyCovMatrix,
    makeCovarianceMatrix,
    addRowsCholeskyCovMatrix,
    solveLowerTri,
    transpose,
    matMul,
    matSub,
    normSquared,
    dot,
} from "./algebra.mjs";

import { Gaussian, fitAmplitudeVar } from "./kernels.mjs";
import { ConstantPrior } from "./priors.mjs";
import { toMatrix, toVector, fromVector, isSingle } from "./conversion.mjs";
import { MultivariateNormal } from "./multivariate_normal.mjs";
import {
    optimizeParameters,
    scaledOptimizeParameters,
    gradientMarginalLikelihood,
    scaledGradientMarginalLikelihood,
} from "./optimizer.mjs";

/** Default maximum fitting time: one hour, expressed in milliseconds (Rust uses chrono::Duration::seconds(3600)). */
const DEFAULT_MAX_TIME_MS = 3600 * 1000;

//=============================================================================
// GaussianProcess
//=============================================================================

/**
 * A Gaussian process that can be used to make predictions based on its training
 * data.
 *
 * Internal state (mirrors the Rust `GaussianProcess` struct, `mod.rs:59`):
 *   - `prior`           Prior instance.
 *   - `kernel`          Kernel instance.
 *   - `noise`           number — noise STANDARD DEVIATION (not variance).
 *   - `choleskyEpsilon` number | null — substitute pivot for Cholesky (or null).
 *   - `trainingInputs`  ExtendableMatrix.
 *   - `trainingOutputs` ExtendableVector — stores `outputs − prior(inputs)` (the residual!).
 *   - `covmatCholesky`  CholeskyDecomposition of K = kernel(X,X) + noise²·I.
 */
export class GaussianProcess {
    /**
     * Raw constructor (`mod.rs:142`). Prefer {@link GaussianProcess.default} or
     * {@link GaussianProcess.builder}.
     *
     * @param {object}       prior            Prior instance.
     * @param {object}       kernel           Kernel instance.
     * @param {number}       noise            noise standard deviation (≥ 0).
     * @param {number|null}  choleskyEpsilon  substitute pivot (or null to throw on failure).
     * @param {number[]|number[][]} trainingInputs  raw inputs.
     * @param {number|number[]}     trainingOutputs raw outputs (NOT yet residualised).
     */
    constructor(prior, kernel, noise, choleskyEpsilon, trainingInputs, trainingOutputs) {
        if (!(noise >= 0)) {
            throw new Error(
                `The noise parameter should be non-negative but we tried to set it to ${noise}`
            );
        }

        // Normalise inputs/outputs into matrix / vector form (matches T::into_dmatrix / into_dvector).
        const inputsMatrix = toMatrix(trainingInputs);
        const outputsVector = toVector(trainingOutputs);
        if (inputsMatrix.length !== outputsVector.length) {
            throw new Error(
                `training_inputs.nrows() (${inputsMatrix.length}) !== training_outputs.nrows() (${outputsVector.length})`
            );
        }

        /** @type {object} */
        this.prior = prior;
        /** @type {object} */
        this.kernel = kernel;
        /** @type {number} noise standard deviation */
        this.noise = noise;
        /** @type {number|null} */
        this.choleskyEpsilon = choleskyEpsilon;

        // Extendable training data. trainingOutputs holds the PRIOR RESIDUAL.
        /** @type {ExtendableMatrix} */
        this.trainingInputs = new ExtendableMatrix(inputsMatrix);
        const priorValues = prior.prior(inputsMatrix);
        const residual = new Array(outputsVector.length);
        for (let i = 0; i < outputsVector.length; i++) {
            residual[i] = outputsVector[i] - priorValues[i];
        }
        /** @type {ExtendableVector} */
        this.trainingOutputs = new ExtendableVector(residual);

        // Cholesky of the covariance matrix K = kernel(X,X) + noise²·I.
        /** @type {import('./algebra.mjs').CholeskyDecomposition} */
        this.covmatCholesky = makeCholeskyCovMatrix(inputsMatrix, kernel, noise, choleskyEpsilon);
    }

    //--------------------------------------------------------------------------
    // STATIC CONSTRUCTORS
    //--------------------------------------------------------------------------

    /**
     * Returns a Gaussian process with a Gaussian kernel and a constant prior,
     * both fitted to the data (`mod.rs:96`).
     *
     * Equivalent to `builder(inputs, outputs).fit_kernel().fit_prior().train()`.
     *
     * Note: `default` is a valid static-method name in JS classes; see
     * {@link GaussianProcess.fromData} for a safe alias.
     *
     * @param {number[]|number[][]} inputs
     * @param {number|number[]}     outputs
     * @returns {GaussianProcess}
     */
    static default(inputs, outputs) {
        return GaussianProcess.builder(inputs, outputs).fitKernel().fitPrior().train();
    }

    /**
     * Safe alias of {@link GaussianProcess.default} (in case a toolchain dislikes
     * the `default` method name). Identical behaviour.
     *
     * @param {number[]|number[][]} inputs
     * @param {number|number[]}     outputs
     * @returns {GaussianProcess}
     */
    static fromData(inputs, outputs) {
        return GaussianProcess.default(inputs, outputs);
    }

    /**
     * Returns a builder to define specific parameters of the Gaussian process
     * (`mod.rs:129`). Defaults to a Gaussian kernel + constant prior.
     *
     * @param {number[]|number[][]} inputs
     * @param {number|number[]}     outputs
     * @returns {GaussianProcessBuilder}
     */
    static builder(inputs, outputs) {
        return new GaussianProcessBuilder(inputs, outputs);
    }

    //--------------------------------------------------------------------------
    // ADD SAMPLES
    //--------------------------------------------------------------------------

    /**
     * Adds new samples to the model (`mod.rs:173`).
     *
     * Updates the model in O(n²) (faster than retraining from scratch) but does
     * NOT refit the parameters.
     *
     * @param {number[]|number[][]} inputs
     * @param {number|number[]}     outputs
     */
    add_samples(inputs, outputs) {
        const inputsMatrix = toMatrix(inputs);
        const outputsVector = toVector(outputs);
        if (inputsMatrix.length !== outputsVector.length) {
            throw new Error(
                `inputs.nrows() (${inputsMatrix.length}) !== outputs.nrows() (${outputsVector.length})`
            );
        }
        if (inputsMatrix[0].length !== this.trainingInputs.ncols) {
            throw new Error(
                `inputs.ncols() (${inputsMatrix[0].length}) !== training_inputs.ncols() (${this.trainingInputs.ncols})`
            );
        }

        // Residualise the new outputs against the current prior.
        const priorValues = this.prior.prior(inputsMatrix);
        const residual = new Array(outputsVector.length);
        for (let i = 0; i < outputsVector.length; i++) {
            residual[i] = outputsVector[i] - priorValues[i];
        }

        // Grow the training data.
        this.trainingInputs.addRows(inputsMatrix);
        this.trainingOutputs.addRows(residual);

        // Incrementally extend the Cholesky decomposition with the new rows.
        const nbNewInputs = inputsMatrix.length;
        addRowsCholeskyCovMatrix(
            this.covmatCholesky,
            this.trainingInputs.asMatrix(),
            nbNewInputs,
            this.kernel,
            this.noise
        );
    }

    //--------------------------------------------------------------------------
    // LIKELIHOOD
    //--------------------------------------------------------------------------

    /**
     * Log likelihood of the current model given the training data (`mod.rs:196`).
     *
     * Formula:
     *   −½ ( outputᵀ·K⁻¹·output + Σ_r ln|kernel(xᵣ,xᵣ) + noise²| + n·ln(2π) )
     *
     * where `output` is the prior residual.
     *
     * @returns {number}
     */
    likelihood() {
        const output = this.trainingOutputs.asVector(); // residual
        const L = this.covmatCholesky.l();

        // transpose(ol)·ol = outputᵀ·K⁻¹·output, where L·ol = output.
        const ol = solveLowerTri(L, output);
        const dataFit = normSquared(ol);

        // Complexity penalty: Σ ln| self-covariance + noise² |.
        const inputs = this.trainingInputs.asMatrix();
        const noiseSq = this.noise * this.noise;
        let complexityPenalty = 0;
        for (let r = 0; r < inputs.length; r++) {
            const selfCov = this.kernel.kernel(inputs[r], inputs[r]) + noiseSq;
            complexityPenalty += Math.log(Math.abs(selfCov));
        }

        const n = inputs.length;
        const normalizationConstant = n * Math.log(2 * Math.PI);

        return -(dataFit + complexityPenalty + normalizationConstant) / 2;
    }

    //--------------------------------------------------------------------------
    // PREDICT
    //--------------------------------------------------------------------------

    /**
     * Predicts the mean of the Gaussian process for each row of `inputs`
     * (`mod.rs:226`).
     *
     * Formula: `prior + cov(input,train)·K⁻¹·output`.
     *
     * @param {number[]|number[][]} inputs
     * @returns {number|number[]} number for a single-point input, number[] otherwise.
     */
    predict(inputs) {
        const single = isSingle(inputs);
        const inputsMatrix = toMatrix(inputs);
        if (inputsMatrix[0].length !== this.trainingInputs.ncols) {
            throw new Error(
                `inputs.ncols() (${inputsMatrix[0].length}) !== training_inputs.ncols() (${this.trainingInputs.ncols})`
            );
        }

        const trainMatrix = this.trainingInputs.asMatrix();

        // weights (nTrain × nInput) = K⁻¹ · cov(train, inputs).
        let weights = makeCovarianceMatrix(trainMatrix, inputsMatrix, this.kernel);
        weights = this.covmatCholesky.solve(weights);

        const mean = this._meanFromWeights(weights, inputsMatrix);
        return fromVector(mean, single);
    }

    /**
     * Predicts the variance of the Gaussian process for each row of `inputs`
     * (`mod.rs:248`).
     *
     * Formula (diagonal of):
     *   cov(input,input) − cov(input,train)·K⁻¹·cov(train,input)
     *
     * @param {number[]|number[][]} inputs
     * @returns {number|number[]}
     */
    predict_variance(inputs) {
        const single = isSingle(inputs);
        const inputsMatrix = toMatrix(inputs);
        if (inputsMatrix[0].length !== this.trainingInputs.ncols) {
            throw new Error(
                `inputs.ncols() (${inputsMatrix[0].length}) !== training_inputs.ncols() (${this.trainingInputs.ncols})`
            );
        }

        const trainMatrix = this.trainingInputs.asMatrix();

        // cov_train_inputs (nTrain × nInput).
        const covTrainInputs = makeCovarianceMatrix(trainMatrix, inputsMatrix, this.kernel);

        // kl = L⁻¹ · cov_train_inputs  (solve L·kl = cov_train_inputs).
        const kl = solveLowerTri(this.covmatCholesky.l(), covTrainInputs);

        // variance[i] = kernel(inputᵢ,inputᵢ) − ‖column i of kl‖².
        const nInput = inputsMatrix.length;
        const variances = new Array(nInput);
        for (let i = 0; i < nInput; i++) {
            const baseCov = this.kernel.kernel(inputsMatrix[i], inputsMatrix[i]);
            const predictedCov = columnNormSquared(kl, i);
            variances[i] = baseCov - predictedCov;
        }

        return fromVector(variances, single);
    }

    /**
     * Predicts both the mean and the variance for each row of `inputs`
     * (`mod.rs:290`). Faster than calling `predict` and `predict_variance`
     * separately.
     *
     * @param {number[]|number[][]} inputs
     * @returns {[number|number[], number|number[]]} `[mean, variance]`.
     */
    predict_mean_variance(inputs) {
        const single = isSingle(inputs);
        const inputsMatrix = toMatrix(inputs);
        if (inputsMatrix[0].length !== this.trainingInputs.ncols) {
            throw new Error(
                `inputs.ncols() (${inputsMatrix[0].length}) !== training_inputs.ncols() (${this.trainingInputs.ncols})`
            );
        }

        const trainMatrix = this.trainingInputs.asMatrix();

        // cov_train_inputs (nTrain × nInput);  weights = K⁻¹ · cov_train_inputs.
        const covTrainInputs = makeCovarianceMatrix(trainMatrix, inputsMatrix, this.kernel);
        const weights = this.covmatCholesky.solve(covTrainInputs);

        // ----- mean -----
        const meanVec = this._meanFromWeights(weights, inputsMatrix);
        const mean = fromVector(meanVec, single);

        // ----- variance -----
        // variance[i] = kernel(inputᵢ,inputᵢ) − (column i of cov_train_inputs)·(column i of weights).
        const nInput = inputsMatrix.length;
        const variances = new Array(nInput);
        for (let i = 0; i < nInput; i++) {
            const baseCov = this.kernel.kernel(inputsMatrix[i], inputsMatrix[i]);
            const predictedCov = columnDot(covTrainInputs, weights, i);
            variances[i] = baseCov - predictedCov;
        }
        const variance = fromVector(variances, single);

        return [mean, variance];
    }

    /**
     * Returns the full covariance matrix for the rows of `inputs` (`mod.rs:329`).
     *
     * Formula:
     *   cov(input,input) − cov(input,train)·K⁻¹·cov(train,input)
     *
     * ALWAYS returns a `number[][]` matrix (never scalarised — matches Rust which
     * always returns a `DMatrix`).
     *
     * @param {number[]|number[][]} inputs
     * @returns {number[][]} (nInput × nInput)
     */
    predict_covariance(inputs) {
        const inputsMatrix = toMatrix(inputs);
        if (inputsMatrix[0].length !== this.trainingInputs.ncols) {
            throw new Error(
                `inputs.ncols() (${inputsMatrix[0].length}) !== training_inputs.ncols() (${this.trainingInputs.ncols})`
            );
        }

        const trainMatrix = this.trainingInputs.asMatrix();

        const covTrainInputs = makeCovarianceMatrix(trainMatrix, inputsMatrix, this.kernel);
        const covInputsInputs = makeCovarianceMatrix(inputsMatrix, inputsMatrix, this.kernel);

        // kl = L⁻¹ · cov_train_inputs.
        const kl = solveLowerTri(this.covmatCholesky.l(), covTrainInputs);

        // result = cov_inputs_inputs − klᵀ·kl   (matches gemm_tr(-1, kl, kl, 1)).
        const klt_kl = matMul(transpose(kl), kl);
        return matSub(covInputsInputs, klt_kl);
    }

    /**
     * Produces a multivariate Gaussian that can be sampled at the input points
     * (`mod.rs:371`).
     *
     * Covariance:
     *   cov(input,input) − cov(input,train)·K⁻¹·cov(train,input)
     * Mean:
     *   prior + cov(input,train)·K⁻¹·output
     *
     * The returned {@link MultivariateNormal} has a `.sample(rng)` method where
     * `rng` is a `() => number ∈ [0,1)` (e.g. from `mulberry32`).
     *
     * @param {number[]|number[][]} inputs
     * @returns {MultivariateNormal}
     */
    sample_at(inputs) {
        const single = isSingle(inputs);
        const inputsMatrix = toMatrix(inputs);
        if (inputsMatrix[0].length !== this.trainingInputs.ncols) {
            throw new Error(
                `inputs.ncols() (${inputsMatrix[0].length}) !== training_inputs.ncols() (${this.trainingInputs.ncols})`
            );
        }

        const trainMatrix = this.trainingInputs.asMatrix();

        // weights = K⁻¹ · cov(train, inputs).
        const covTrainInputs = makeCovarianceMatrix(trainMatrix, inputsMatrix, this.kernel);
        const weights = this.covmatCholesky.solve(covTrainInputs);

        // cov = cov(input,input) − cov_train_inputsᵀ·weights  (gemm_tr(-1, covTrainInputs, weights, 1)).
        const covInputsInputs = makeCovarianceMatrix(inputsMatrix, inputsMatrix, this.kernel);
        const ct_w = matMul(transpose(covTrainInputs), weights);
        const cov = matSub(covInputsInputs, ct_w);

        // mean = prior + weightsᵀ·trainingOutputs.
        const mean = this._meanFromWeights(weights, inputsMatrix);

        return new MultivariateNormal(mean, cov, single);
    }

    //--------------------------------------------------------------------------
    // FIT
    //--------------------------------------------------------------------------

    /**
     * Fits the requested parameters and retrains the model (`mod.rs:406`).
     *
     * Noise and kernel parameters are fitted by gradient ascent (ADAM) on the
     * marginal log-likelihood. Runs for at most `maxIter` iterations, stopping
     * early when all gradients are below `convergenceFraction`·param or after
     * `maxTime`.
     *
     * @param {boolean} fitPrior              fit the prior to the data.
     * @param {boolean} fitKernel             fit the kernel (and noise) parameters.
     * @param {number}  maxIter               max gradient-ascent iterations.
     * @param {number}  convergenceFraction   relative convergence threshold.
     * @param {number} [maxTime=3600000]      max fitting time in MILLISECONDS
     *                                        (Rust uses chrono::Duration seconds).
     */
    fit_parameters(fitPrior, fitKernel, maxIter, convergenceFraction, maxTime = DEFAULT_MAX_TIME_MS) {
        if (fitPrior) {
            const inputs = this.trainingInputs.asMatrix();

            // Recover the original (raw) outputs: residual + prior_old(inputs).
            const residualOld = this.trainingOutputs.asVector();
            const priorOld = this.prior.prior(inputs);
            const originalOutputs = new Array(residualOld.length);
            for (let i = 0; i < residualOld.length; i++) {
                originalOutputs[i] = residualOld[i] + priorOld[i];
            }

            // Refit the prior on the raw outputs.
            this.prior.fit(inputs, originalOutputs);

            // Re-residualise against the new prior and store back.
            const priorNew = this.prior.prior(inputs);
            const residualNew = new Array(originalOutputs.length);
            for (let i = 0; i < originalOutputs.length; i++) {
                residualNew[i] = originalOutputs[i] - priorNew[i];
            }
            this.trainingOutputs.assign(residualNew);

            // If the kernel is NOT being fitted, retrain the covariance Cholesky
            // from scratch (the residuals changed). When fitKernel is true the
            // optimizer rebuilds it anyway.
            if (!fitKernel) {
                this.covmatCholesky = makeCholeskyCovMatrix(
                    inputs,
                    this.kernel,
                    this.noise,
                    this.choleskyEpsilon
                );
            }
        }

        if (fitKernel) {
            if (this.kernel.isScalable()) {
                scaledOptimizeParameters(this, maxIter, convergenceFraction, maxTime);
            } else {
                optimizeParameters(this, maxIter, convergenceFraction, maxTime);
            }
        }
    }

    //--------------------------------------------------------------------------
    // INTERNAL HELPERS
    //--------------------------------------------------------------------------

    /**
     * Computes the posterior mean `prior + weightsᵀ·trainingOutputs`, i.e.
     * `mean[i] = prior(inputs)[i] + Σ_t weights[t][i]·trainingOutputs[t]`.
     *
     * This reproduces nalgebra `prior.gemm_tr(1, weights, trainingOutputs, 1)`,
     * where `weights` is (nTrain × nInput), `trainingOutputs` is the residual
     * vector (length nTrain), and the result has length nInput.
     *
     * @param {number[][]} weights      (nTrain × nInput)
     * @param {number[][]} inputsMatrix (nInput × d)
     * @returns {number[]} posterior mean (length nInput), prior already added.
     * @private
     */
    _meanFromWeights(weights, inputsMatrix) {
        const nInput = inputsMatrix.length;
        const nTrain = weights.length;
        const outputs = this.trainingOutputs.asVector(); // residual
        const priorVec = this.prior.prior(inputsMatrix);

        const mean = new Array(nInput);
        for (let i = 0; i < nInput; i++) {
            let s = priorVec[i];
            for (let t = 0; t < nTrain; t++) {
                s += weights[t][i] * outputs[t];
            }
            mean[i] = s;
        }
        return mean;
    }
}

// Mixin the optimizer free-functions onto the prototype so they are also
// reachable as methods (e.g. `gp.optimizeParameters(...)`). `fit_parameters`
// above calls the imported free functions directly; these aliases just keep the
// surface consistent with PORT_SPEC §7 ("import then call as methods").
GaussianProcess.prototype.optimizeParameters = function (maxIter, convergenceFraction, maxTime) {
    return optimizeParameters(this, maxIter, convergenceFraction, maxTime);
};
GaussianProcess.prototype.scaledOptimizeParameters = function (maxIter, convergenceFraction, maxTime) {
    return scaledOptimizeParameters(this, maxIter, convergenceFraction, maxTime);
};
GaussianProcess.prototype.gradientMarginalLikelihood = function () {
    return gradientMarginalLikelihood(this);
};
GaussianProcess.prototype.scaledGradientMarginalLikelihood = function () {
    return scaledGradientMarginalLikelihood(this);
};

//=============================================================================
// GaussianProcessBuilder
//=============================================================================

/**
 * Builder to set the parameters of a Gaussian process (`builder.rs`).
 *
 * Chainable setters culminating in `train()`. Produced by
 * `GaussianProcess.builder(inputs, outputs)`.
 *
 * Defaults (`builder.rs:66`):
 *   - constant prior (0 unless fitted)
 *   - a Gaussian kernel
 *   - noise = 10% of the output standard deviation
 *   - does not fit any parameters
 *   - fit runs for ≤ 100 iterations / 1 hour unless all gradients are below 5%.
 *
 * Setters mutate and return `this` (Rust returns a new typed builder; for JS we
 * keep a single mutable builder — behaviour is identical for the fluent API).
 */
export class GaussianProcessBuilder {
    /**
     * @param {number[]|number[][]} trainingInputs
     * @param {number|number[]}     trainingOutputs
     */
    constructor(trainingInputs, trainingOutputs) {
        const inputsMatrix = toMatrix(trainingInputs);
        const outputsVector = toVector(trainingOutputs);

        /** @type {number[][]} */
        this.trainingInputs = inputsMatrix;
        /** @type {number[]} */
        this.trainingOutputs = outputsVector;

        // Default prior: ConstantPrior(0) (dim is ignored by ConstantPrior).
        /** @type {object} */
        this.prior = ConstantPrior.default(inputsMatrix.length === 0 ? 0 : inputsMatrix[0].length);
        // Default kernel: Gaussian / SquaredExp with default parameters.
        /** @type {object} */
        this.kernel = new Gaussian();
        // Default noise: 10% of the output standard deviation.
        //   row_variance(outputs)[0] = Σ(yᵢ−ȳ)²/N  (divide by N — see fitAmplitudeVar).
        /** @type {number} */
        this.noise = 0.1 * Math.sqrt(fitAmplitudeVar(outputsVector));
        /** @type {number|null} */
        this.choleskyEpsilon = null;

        /** @type {boolean} */
        this.shouldFitKernel = false;
        /** @type {boolean} */
        this.shouldFitPrior = false;

        /** @type {number} */
        this.maxIter = 100;
        /** @type {number} */
        this.convergenceFraction = 0.05;
        /** @type {number} max fitting time in milliseconds */
        this.maxTime = DEFAULT_MAX_TIME_MS;
    }

    //--------------------------------------------------------------------------
    // SETTERS (chainable)
    //--------------------------------------------------------------------------

    /**
     * Sets a new prior.
     * @param {object} prior
     * @returns {this}
     */
    setPrior(prior) {
        this.prior = prior;
        return this;
    }

    /**
     * Sets the noise parameter (standard deviation of the output noise).
     * @param {number} noise (≥ 0)
     * @returns {this}
     */
    setNoise(noise) {
        if (!(noise >= 0)) {
            throw new Error(
                `The noise parameter should be non-negative but we tried to set it to ${noise}`
            );
        }
        this.noise = noise;
        return this;
    }

    /**
     * Changes the kernel of the Gaussian process.
     * @param {object} kernel
     * @returns {this}
     */
    setKernel(kernel) {
        this.kernel = kernel;
        return this;
    }

    /**
     * Sets the Cholesky epsilon. When a strictly positive value is given, the
     * Cholesky decomposition is guaranteed to succeed (the value is used in
     * place of a non-positive diagonal pivot). `null` ignores it.
     * @param {number|null} choleskyEpsilon
     * @returns {this}
     */
    setCholeskyEpsilon(choleskyEpsilon) {
        this.choleskyEpsilon = choleskyEpsilon;
        return this;
    }

    /**
     * Modifies the stopping criteria of the gradient descent used to fit the
     * noise and kernel parameters.
     * @param {number} maxIter
     * @param {number} convergenceFraction
     * @returns {this}
     */
    setFitParameters(maxIter, convergenceFraction) {
        this.maxIter = maxIter;
        this.convergenceFraction = convergenceFraction;
        return this;
    }

    /**
     * Asks for the kernel parameters to be fitted on the training data (applied
     * when `train()` is called).
     * @returns {this}
     */
    fitKernel() {
        this.shouldFitKernel = true;
        return this;
    }

    /**
     * Asks for the prior to be fitted on the training data (applied when
     * `train()` is called).
     * @returns {this}
     */
    fitPrior() {
        this.shouldFitPrior = true;
        return this;
    }

    //--------------------------------------------------------------------------
    // TRAIN
    //--------------------------------------------------------------------------

    /**
     * Trains the Gaussian process, fitting the parameters if requested
     * (`builder.rs:189`).
     *
     * Steps:
     *   1. if `shouldFitKernel` → `kernel.heuristicFit(inputs, outputs)` using the
     *      RAW outputs (the builder has not subtracted the prior yet).
     *   2. construct the GaussianProcess.
     *   3. `gp.fit_parameters(shouldFitPrior, shouldFitKernel, …)`.
     *
     * @returns {GaussianProcess}
     */
    train() {
        // 1. Kernel heuristic fit (uses raw outputs).
        if (this.shouldFitKernel) {
            this.kernel.heuristicFit(this.trainingInputs, this.trainingOutputs);
        }

        // 2. Build the GP (this residualises the outputs and builds the Cholesky).
        const gp = new GaussianProcess(
            this.prior,
            this.kernel,
            this.noise,
            this.choleskyEpsilon,
            this.trainingInputs,
            this.trainingOutputs
        );

        // 3. Fit on the training data, if requested.
        gp.fit_parameters(
            this.shouldFitPrior,
            this.shouldFitKernel,
            this.maxIter,
            this.convergenceFraction,
            this.maxTime
        );

        return gp;
    }
}

//=============================================================================
// LOCAL COLUMN HELPERS
//=============================================================================

/**
 * Squared Euclidean norm of column `c` of matrix `M` (number[][]).
 * @param {number[][]} M
 * @param {number} c
 * @returns {number}
 */
function columnNormSquared(M, c) {
    let s = 0;
    for (let r = 0; r < M.length; r++) {
        const v = M[r][c];
        s += v * v;
    }
    return s;
}

/**
 * Dot product of column `c` of A with column `c` of B (both number[][]).
 * @param {number[][]} A
 * @param {number[][]} B
 * @param {number} c
 * @returns {number}
 */
function columnDot(A, B, c) {
    let s = 0;
    for (let r = 0; r < A.length; r++) {
        s += A[r][c] * B[r][c];
    }
    return s;
}
