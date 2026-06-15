//! # Kernels
//!
//! Port of `friedrich 0.6.0` `src/parameters/kernel.rs`.
//!
//! A kernel maps two row-vectors (`number[]`) to a scalar expressing their
//! similarity. Each kernel class implements the common interface:
//!   nbParameters() : number
//!   isScalable()   : boolean (default false)
//!   rescale(scale) : amplitude *= scale (scalable kernels only; throws otherwise)
//!   kernel(x1, x2) : number   (covariance value)
//!   gradient(x1,x2): number[] (gradient w.r.t. each hyper-parameter, in get/setParameters order)
//!   getParameters(): number[]
//!   setParameters(params): void
//!   heuristicFit(inputs, outputs): void (default no-op; some kernels override)
//!
//! SANITIZE convention (matches Rust): the optimizer may feed illegal (e.g.
//! negative) parameters, so kernel()/gradient() take Math.abs() of `ampl`/`ls`
//! where the Rust source does, and use Math.sign() (Rust `signum()`) for the
//! amplitude gradient. Faithfulness is the priority; some latent Rust bugs are
//! preserved verbatim (see Multiquadric and Matern2 notes).
//!
//! Data representation (PORT_SPEC §2): point / vector = number[].

import { dot, subVec, norm, normSquared, hypot } from './algebra.mjs';

//=============================================================================
// FIT HEURISTICS (free functions, exported for kernels & tests)
//=============================================================================

/**
 * Rough bandwidth estimate: mean Euclidean distance between distinct samples.
 *   Σ_{i<j} ‖xᵢ − xⱼ‖ / (n(n−1)/2)
 * @param {number[][]} inputs
 * @returns {number}
 */
export function fitBandwidthMean(inputs) {
    let sumDistances = 0;
    const nbSamples = inputs.length;
    for (let i = 0; i < nbSamples; i++) {
        for (let j = i + 1; j < nbSamples; j++) {
            sumDistances += norm(subVec(inputs[i], inputs[j]));
        }
    }
    // Integer arithmetic matches Rust `(n*n - n) / 2`.
    const nbDistances = (nbSamples * nbSamples - nbSamples) / 2;
    return sumDistances / nbDistances;
}

/**
 * Best-guess amplitude = variance of the outputs.
 *
 * Matches nalgebra `variance()`: Σ(yᵢ − mean)² / N (divides by N, the sample
 * count — NOT N−1). Confirmed from nalgebra 0.34.2 statistics.rs (PORT_SPEC §4.1).
 *
 * @param {number[]} outputs
 * @returns {number}
 */
export function fitAmplitudeVar(outputs) {
    const n = outputs.length;
    let mean = 0;
    for (let i = 0; i < n; i++) mean += outputs[i];
    mean /= n;
    let acc = 0;
    for (let i = 0; i < n; i++) {
        const d = outputs[i] - mean;
        acc += d * d;
    }
    return acc / n;
}

//=============================================================================
// CLASSICAL KERNELS
//=============================================================================

/**
 * Linear kernel: k(x,y) = xᵀy + c.
 * Parameters: [c] (default c = 0). nbParameters = 1. Not scalable.
 */
export class Linear {
    /** @param {number} [c=0] */
    constructor(c = 0) {
        /** @type {number} */
        this.c = c;
    }

    nbParameters() {
        return 1;
    }

    isScalable() {
        return false;
    }

    rescale(_scale) {
        throw new Error('You tried to rescale a Kernel that is not Scalable!');
    }

    /**
     * @param {number[]} x1
     * @param {number[]} x2
     * @returns {number}
     */
    kernel(x1, x2) {
        return dot(x1, x2) + this.c;
    }

    /**
     * gradient = [grad_c] = [1].
     * @param {number[]} _x1
     * @param {number[]} _x2
     * @returns {number[]}
     */
    gradient(_x1, _x2) {
        const gradC = 1;
        return [gradC];
    }

    getParameters() {
        return [this.c];
    }

    /** @param {number[]} parameters */
    setParameters(parameters) {
        this.c = parameters[0];
    }

    /** Default no-op heuristic fit. */
    heuristicFit(_inputs, _outputs) {}
}

//-----------------------------------------------

/**
 * Polynomial kernel: k(x,y) = (α·xᵀy + c)^d.
 * Parameters: [alpha, c, d] (defaults alpha = 1, c = 0, d = 1). nbParameters = 3.
 * Not scalable.
 */
export class Polynomial {
    /**
     * @param {number} [alpha=1]
     * @param {number} [c=0]
     * @param {number} [d=1]
     */
    constructor(alpha = 1, c = 0, d = 1) {
        /** @type {number} scaling of the inner product */
        this.alpha = alpha;
        /** @type {number} constant added to the inner product */
        this.c = c;
        /** @type {number} power */
        this.d = d;
    }

    nbParameters() {
        return 3;
    }

    isScalable() {
        return false;
    }

    rescale(_scale) {
        throw new Error('You tried to rescale a Kernel that is not Scalable!');
    }

    /**
     * @param {number[]} x1
     * @param {number[]} x2
     * @returns {number}
     */
    kernel(x1, x2) {
        return Math.pow(this.alpha * dot(x1, x2) + this.c, this.d);
    }

    /**
     * gradient = [grad_alpha, grad_c, grad_d]:
     *   x = x1·x2, inner = alpha·x + c
     *   grad_c     = d · inner^(d−1)
     *   grad_alpha = x · grad_c
     *   grad_d     = ln(inner) · inner^d
     * @param {number[]} x1
     * @param {number[]} x2
     * @returns {number[]}
     */
    gradient(x1, x2) {
        const x = dot(x1, x2);
        const innerTerm = this.alpha * x + this.c;

        const gradC = this.d * Math.pow(innerTerm, this.d - 1);
        const gradAlpha = x * gradC;
        const gradD = Math.log(innerTerm) * Math.pow(innerTerm, this.d);

        return [gradAlpha, gradC, gradD];
    }

    getParameters() {
        return [this.alpha, this.c, this.d];
    }

    /** @param {number[]} parameters */
    setParameters(parameters) {
        this.alpha = parameters[0];
        this.c = parameters[1];
        this.d = parameters[2];
    }

    heuristicFit(_inputs, _outputs) {}
}

//-----------------------------------------------

/**
 * Squared exponential (a.k.a. Gaussian) kernel:
 *   k(x,y) = A·exp(−‖x−y‖² / (2·ls²)),  A = |ampl|.
 * Parameters: [ls, ampl] (defaults ls = 1, ampl = 1). nbParameters = 2. Scalable.
 */
export class SquaredExp {
    /**
     * @param {number} [ls=1]
     * @param {number} [ampl=1]
     */
    constructor(ls = 1, ampl = 1) {
        /** @type {number} length scale */
        this.ls = ls;
        /** @type {number} amplitude */
        this.ampl = ampl;
    }

    nbParameters() {
        return 2;
    }

    isScalable() {
        return true;
    }

    /**
     * @param {number[]} x1
     * @param {number[]} x2
     * @returns {number}
     */
    kernel(x1, x2) {
        // Sanitize parameters.
        const ampl = Math.abs(this.ampl);
        const distanceSquared = normSquared(subVec(x1, x2));
        const x = -distanceSquared / (2 * this.ls * this.ls);
        return ampl * Math.exp(x);
    }

    /**
     * gradient = [grad_ls, grad_ampl] with d² = ‖x−y‖², A = |ampl|,
     *   e = exp(−d²/(2·ls²)):
     *   grad_ls   = (d² · A · e) / ls³
     *   grad_ampl = sign(ampl) · e
     * @param {number[]} x1
     * @param {number[]} x2
     * @returns {number[]}
     */
    gradient(x1, x2) {
        const ampl = Math.abs(this.ampl);
        const distanceSquared = normSquared(subVec(x1, x2));
        const exponential = Math.exp(-distanceSquared / (2 * this.ls * this.ls));
        const gradLs = (distanceSquared * ampl * exponential) / Math.pow(this.ls, 3);
        const gradAmpl = Math.sign(this.ampl) * exponential;
        return [gradLs, gradAmpl];
    }

    /** @param {number} scale */
    rescale(scale) {
        this.ampl *= scale;
    }

    getParameters() {
        return [this.ls, this.ampl];
    }

    /** @param {number[]} parameters */
    setParameters(parameters) {
        this.ls = parameters[0];
        this.ampl = parameters[1];
    }

    /**
     * heuristic: ls = mean inter-sample distance, ampl = output variance.
     * @param {number[][]} inputs
     * @param {number[]} outputs
     */
    heuristicFit(inputs, outputs) {
        this.ls = fitBandwidthMean(inputs);
        this.ampl = fitAmplitudeVar(outputs);
    }
}

/** Gaussian kernel — alias of SquaredExp (Rust `pub type Gaussian = SquaredExp`). */
export const Gaussian = SquaredExp;

//-----------------------------------------------

/**
 * Exponential kernel:
 *   k(x,y) = A·exp(−‖x−y‖ / (2·ls²)),  A = |ampl|.
 * NOTE the denominator is 2·ls² (NOT ls), faithful to Rust.
 * Parameters: [ls, ampl] (defaults ls = 1, ampl = 1). nbParameters = 2. Scalable.
 */
export class Exponential {
    /**
     * @param {number} [ls=1]
     * @param {number} [ampl=1]
     */
    constructor(ls = 1, ampl = 1) {
        /** @type {number} length scale */
        this.ls = ls;
        /** @type {number} amplitude */
        this.ampl = ampl;
    }

    nbParameters() {
        return 2;
    }

    isScalable() {
        return true;
    }

    /**
     * @param {number[]} x1
     * @param {number[]} x2
     * @returns {number}
     */
    kernel(x1, x2) {
        const ampl = Math.abs(this.ampl);
        const distance = norm(subVec(x1, x2));
        const x = -distance / (2 * this.ls * this.ls);
        return ampl * Math.exp(x);
    }

    /**
     * gradient = [grad_ls, grad_ampl] with d = ‖x−y‖, A = |ampl|,
     *   e = exp(−d/(2·ls²)):
     *   grad_ls   = (d · A · e) / ls³
     *   grad_ampl = sign(ampl) · e
     * @param {number[]} x1
     * @param {number[]} x2
     * @returns {number[]}
     */
    gradient(x1, x2) {
        const ampl = Math.abs(this.ampl);
        const distance = norm(subVec(x1, x2));
        const exponential = Math.exp(-distance / (2 * this.ls * this.ls));
        const gradLs = (distance * ampl * exponential) / Math.pow(this.ls, 3);
        const gradAmpl = Math.sign(this.ampl) * exponential;
        return [gradLs, gradAmpl];
    }

    /** @param {number} scale */
    rescale(scale) {
        this.ampl *= scale;
    }

    getParameters() {
        return [this.ls, this.ampl];
    }

    /** @param {number[]} parameters */
    setParameters(parameters) {
        this.ls = parameters[0];
        this.ampl = parameters[1];
    }

    /**
     * @param {number[][]} inputs
     * @param {number[]} outputs
     */
    heuristicFit(inputs, outputs) {
        this.ls = fitBandwidthMean(inputs);
        this.ampl = fitAmplitudeVar(outputs);
    }
}

//-----------------------------------------------

/**
 * Matèrn1 kernel (ν = 3/2, 1-differentiable):
 *   k(x,y) = A·(1 + x)·exp(−x),  A = |ampl|, l = |ls|, x = √3·d/l, d = ‖x−y‖.
 * Parameters: [ls, ampl] (defaults ls = 1, ampl = 1). nbParameters = 2. Scalable.
 */
export class Matern1 {
    /**
     * @param {number} [ls=1]
     * @param {number} [ampl=1]
     */
    constructor(ls = 1, ampl = 1) {
        /** @type {number} length scale */
        this.ls = ls;
        /** @type {number} amplitude */
        this.ampl = ampl;
    }

    nbParameters() {
        return 2;
    }

    isScalable() {
        return true;
    }

    /**
     * @param {number[]} x1
     * @param {number[]} x2
     * @returns {number}
     */
    kernel(x1, x2) {
        const ampl = Math.abs(this.ampl);
        const l = Math.abs(this.ls);
        const distance = norm(subVec(x1, x2));
        const x = Math.sqrt(3) * distance / l;
        return ampl * (1 + x) * Math.exp(-x);
    }

    /**
     * gradient = [grad_ls, grad_ampl] with d = ‖x−y‖, A = |ampl|, l = |ls|,
     *   x = √3·d/l:
     *   grad_ls   = (3 · A · d² · exp(−x)) / ls³
     *   grad_ampl = sign(ampl) · (1 + x) · exp(−x)
     * @param {number[]} x1
     * @param {number[]} x2
     * @returns {number[]}
     */
    gradient(x1, x2) {
        const ampl = Math.abs(this.ampl);
        const l = Math.abs(this.ls);
        const distance = norm(subVec(x1, x2));
        const x = Math.sqrt(3) * distance / l;
        const gradLs = (3 * ampl * Math.pow(distance, 2) * Math.exp(-x)) / Math.pow(this.ls, 3);
        const gradAmpl = Math.sign(this.ampl) * (1 + x) * Math.exp(-x);
        return [gradLs, gradAmpl];
    }

    /** @param {number} scale */
    rescale(scale) {
        this.ampl *= scale;
    }

    getParameters() {
        return [this.ls, this.ampl];
    }

    /** @param {number[]} parameters */
    setParameters(parameters) {
        this.ls = parameters[0];
        this.ampl = parameters[1];
    }

    /**
     * @param {number[][]} inputs
     * @param {number[]} outputs
     */
    heuristicFit(inputs, outputs) {
        this.ls = fitBandwidthMean(inputs);
        this.ampl = fitAmplitudeVar(outputs);
    }
}

//-----------------------------------------------

/**
 * Matèrn2 kernel (ν = 5/2, 2-differentiable):
 *   k(x,y) = A·(1 + x + 5d²/(3l²))·exp(−x),
 *   A = |ampl|, l = |ls|, x = √5·d/l, d = ‖x−y‖.
 * Parameters: [ls, ampl] (defaults ls = 1, ampl = 1). nbParameters = 2. Scalable.
 */
export class Matern2 {
    /**
     * @param {number} [ls=1]
     * @param {number} [ampl=1]
     */
    constructor(ls = 1, ampl = 1) {
        /** @type {number} length scale */
        this.ls = ls;
        /** @type {number} amplitude */
        this.ampl = ampl;
    }

    nbParameters() {
        return 2;
    }

    isScalable() {
        return true;
    }

    /**
     * @param {number[]} x1
     * @param {number[]} x2
     * @returns {number}
     */
    kernel(x1, x2) {
        const ampl = Math.abs(this.ampl);
        const l = Math.abs(this.ls);
        const distance = norm(subVec(x1, x2));
        const x = Math.sqrt(5) * distance / l;
        return ampl * (1 + x + (5 * distance * distance) / (3 * l * l)) * Math.exp(-x);
    }

    /**
     * gradient = [grad_ls, grad_ampl] with d = ‖x−y‖, A = |ampl|, l = |ls|.
     *
     * NOTE (faithful to Rust source): the exponent `x` here uses the RAW `this.ls`
     * (not the sanitized `l = |ls|`) — i.e. x = √5·d/this.ls — which differs from
     * kernel()'s x = √5·d/l. Both are reproduced exactly as in Rust.
     *   grad_ls   = sign(ls) · A · ((2l/3 + 1) + d·√5·((l²/3 + l + 1)/l²)) · exp(−x)
     *   grad_ampl = sign(ampl) · (1 + x + 5d²/(3l²)) · exp(−x)
     * @param {number[]} x1
     * @param {number[]} x2
     * @returns {number[]}
     */
    gradient(x1, x2) {
        const ampl = Math.abs(this.ampl);
        const l = Math.abs(this.ls);
        const distance = norm(subVec(x1, x2));
        // NOTE: faithful to Rust source — divides by raw this.ls, not l = |ls|.
        const x = Math.sqrt(5) * distance / this.ls;
        const gradLs =
            Math.sign(this.ls) *
            ampl *
            ((2 * l / 3 + 1) +
                distance * Math.sqrt(5) * ((Math.pow(l, 2) / 3 + l + 1) / Math.pow(l, 2))) *
            Math.exp(-x);
        const gradAmpl =
            Math.sign(this.ampl) *
            (1 + x + (5 * distance * distance) / (3 * l * l)) *
            Math.exp(-x);
        return [gradLs, gradAmpl];
    }

    /** @param {number} scale */
    rescale(scale) {
        this.ampl *= scale;
    }

    getParameters() {
        return [this.ls, this.ampl];
    }

    /** @param {number[]} parameters */
    setParameters(parameters) {
        this.ls = parameters[0];
        this.ampl = parameters[1];
    }

    /**
     * @param {number[][]} inputs
     * @param {number[]} outputs
     */
    heuristicFit(inputs, outputs) {
        this.ls = fitBandwidthMean(inputs);
        this.ampl = fitAmplitudeVar(outputs);
    }
}

//-----------------------------------------------

/**
 * Hyperbolic tangent kernel: k(x,y) = tanh(α·xᵀy + c).
 * Parameters: [alpha, c] (defaults alpha = 1, c = 0). nbParameters = 2.
 * Not scalable.
 */
export class HyperTan {
    /**
     * @param {number} [alpha=1]
     * @param {number} [c=0]
     */
    constructor(alpha = 1, c = 0) {
        /** @type {number} scaling of the inner product */
        this.alpha = alpha;
        /** @type {number} constant added to the inner product */
        this.c = c;
    }

    nbParameters() {
        return 2;
    }

    isScalable() {
        return false;
    }

    rescale(_scale) {
        throw new Error('You tried to rescale a Kernel that is not Scalable!');
    }

    /**
     * @param {number[]} x1
     * @param {number[]} x2
     * @returns {number}
     */
    kernel(x1, x2) {
        return Math.tanh(this.alpha * dot(x1, x2) + this.c);
    }

    /**
     * gradient = [grad_alpha, grad_c] with x = x1·x2:
     *   grad_c     = 1 / cosh(α·x + c)²
     *   grad_alpha = x · grad_c
     * @param {number[]} x1
     * @param {number[]} x2
     * @returns {number[]}
     */
    gradient(x1, x2) {
        const x = dot(x1, x2);
        const gradC = 1 / Math.pow(Math.cosh(this.alpha * x + this.c), 2);
        const gradAlpha = x * gradC;
        return [gradAlpha, gradC];
    }

    getParameters() {
        return [this.alpha, this.c];
    }

    /** @param {number[]} parameters */
    setParameters(parameters) {
        this.alpha = parameters[0];
        this.c = parameters[1];
    }

    heuristicFit(_inputs, _outputs) {}
}

//-----------------------------------------------

/**
 * Multiquadric kernel: k(x,y) = sqrt(‖x−y‖² + c²).
 *
 * Faithful to Rust, this class preserves THREE latent bugs (PORT_SPEC §4.2):
 *   1. nbParameters() returns 2, but there is really only one parameter `c`.
 *   2. kernel() uses the SQUARED distance inside hypot (`‖x−y‖².hypot(c)` =
 *      sqrt(‖x−y‖⁴ + c²)), while gradient() uses the NON-squared distance
 *      (`‖x−y‖.hypot(c)`) — the two are inconsistent.
 *   3. setParameters() reads parameters[1] although getParameters() returns [c]
 *      at index 0.
 * None are "fixed" — consistency with Rust 0.6.0 is the requirement.
 *
 * Parameters: [c] (default c = 0). Not scalable.
 */
export class Multiquadric {
    /** @param {number} [c=0] */
    constructor(c = 0) {
        /** @type {number} constant added to the square of the difference */
        this.c = c;
    }

    // NOTE: faithful to Rust latent bug — returns 2 although only `c` exists.
    nbParameters() {
        return 2;
    }

    isScalable() {
        return false;
    }

    rescale(_scale) {
        throw new Error('You tried to rescale a Kernel that is not Scalable!');
    }

    /**
     * k(x,y) = hypot(‖x−y‖², c) = sqrt(‖x−y‖⁴ + c²).
     * NOTE: faithful to Rust latent bug — uses the SQUARED norm inside hypot
     * (inconsistent with gradient()'s non-squared norm).
     * @param {number[]} x1
     * @param {number[]} x2
     * @returns {number}
     */
    kernel(x1, x2) {
        return hypot(normSquared(subVec(x1, x2)), this.c);
    }

    /**
     * gradient = [grad_c]:
     *   grad_c = c / hypot(‖x−y‖, c)
     * NOTE: faithful to Rust latent bug — uses the NON-squared norm here
     * (inconsistent with kernel()'s squared norm).
     * @param {number[]} x1
     * @param {number[]} x2
     * @returns {number[]}
     */
    gradient(x1, x2) {
        const gradC = this.c / hypot(norm(subVec(x1, x2)), this.c);
        return [gradC];
    }

    getParameters() {
        return [this.c];
    }

    /**
     * @param {number[]} parameters
     * NOTE: faithful to Rust latent bug — reads index 1, while getParameters
     * returns `c` at index 0.
     */
    setParameters(parameters) {
        this.c = parameters[1];
    }

    heuristicFit(_inputs, _outputs) {}
}

//-----------------------------------------------

/**
 * Rational quadratic kernel:
 *   k(x,y) = (1 + ‖x−y‖² / (2·α·ls²))^(−α).
 * Parameters: [alpha, ls] (defaults alpha = 1, ls = 1). nbParameters = 2.
 * Not scalable.
 */
export class RationalQuadratic {
    /**
     * @param {number} [alpha=1]
     * @param {number} [ls=1]
     */
    constructor(alpha = 1, ls = 1) {
        /** @type {number} controls inverse power and difference scale */
        this.alpha = alpha;
        /** @type {number} length scale */
        this.ls = ls;
    }

    nbParameters() {
        return 2;
    }

    isScalable() {
        return false;
    }

    rescale(_scale) {
        throw new Error('You tried to rescale a Kernel that is not Scalable!');
    }

    /**
     * @param {number[]} x1
     * @param {number[]} x2
     * @returns {number}
     */
    kernel(x1, x2) {
        const distanceSquared = normSquared(subVec(x1, x2));
        return Math.pow(
            1 + distanceSquared / (2 * this.alpha * this.ls * this.ls),
            -this.alpha
        );
    }

    /**
     * gradient = [grad_alpha, grad_ls] with l = |ls|, d² = ‖x−y‖²:
     *   grad_alpha = ((d² + 2l²α)/(l²α))^(−α) ·
     *                ( 2^α·(1 − ln((d² + 2l²α)/(2l²α))) − (l²·2^(α+1)·α)/(d² + 2l²α) )
     *   grad_ls    = d² · (d²/(2αl²) + 1)^(−α−1) / ls³
     * @param {number[]} x1
     * @param {number[]} x2
     * @returns {number[]}
     */
    gradient(x1, x2) {
        // Sanitize parameters.
        const l = Math.abs(this.ls);
        const distanceSquared = normSquared(subVec(x1, x2));
        const l2 = Math.pow(l, 2);

        const gradAlpha =
            Math.pow(
                (distanceSquared + 2 * l2 * this.alpha) / (l2 * this.alpha),
                -this.alpha
            ) *
            (Math.pow(2, this.alpha) *
                (1 -
                    Math.log(
                        (distanceSquared + 2 * l2 * this.alpha) / (2 * l2 * this.alpha)
                    )) -
                (l2 * Math.pow(2, this.alpha + 1) * this.alpha) /
                    (distanceSquared + 2 * l2 * this.alpha));

        const gradLs =
            distanceSquared *
            Math.pow(distanceSquared / (2 * this.alpha * l * l) + 1, -this.alpha - 1) /
            Math.pow(this.ls, 3);

        return [gradAlpha, gradLs];
    }

    getParameters() {
        return [this.alpha, this.ls];
    }

    /** @param {number[]} parameters */
    setParameters(parameters) {
        this.alpha = parameters[0];
        this.ls = parameters[1];
    }

    heuristicFit(_inputs, _outputs) {}
}

//=============================================================================
// KERNEL COMBINATORS
//=============================================================================

/**
 * Sum of two kernels: k(x,y) = k1(x,y) + k2(x,y).
 *
 * Corresponds to Rust `KernelSum<T, U>`. Default construction is just
 * `new KernelSum(new T(), new U())`.
 */
export class KernelSum {
    /**
     * @param {object} k1
     * @param {object} k2
     */
    constructor(k1, k2) {
        this.k1 = k1;
        this.k2 = k2;
    }

    nbParameters() {
        return this.k1.nbParameters() + this.k2.nbParameters();
    }

    isScalable() {
        return this.k1.isScalable() && this.k2.isScalable();
    }

    /**
     * @param {number[]} x1
     * @param {number[]} x2
     * @returns {number}
     */
    kernel(x1, x2) {
        return this.k1.kernel(x1, x2) + this.k2.kernel(x1, x2);
    }

    /**
     * Concatenation of both child gradients.
     * @param {number[]} x1
     * @param {number[]} x2
     * @returns {number[]}
     */
    gradient(x1, x2) {
        return [...this.k1.gradient(x1, x2), ...this.k2.gradient(x1, x2)];
    }

    /** @param {number} scale */
    rescale(scale) {
        this.k1.rescale(scale);
        this.k2.rescale(scale);
    }

    getParameters() {
        return [...this.k1.getParameters(), ...this.k2.getParameters()];
    }

    /**
     * Splits the parameter slice between the two children.
     * @param {number[]} parameters
     */
    setParameters(parameters) {
        const n1 = this.k1.nbParameters();
        this.k1.setParameters(parameters.slice(0, n1));
        this.k2.setParameters(parameters.slice(n1));
    }

    /**
     * @param {number[][]} inputs
     * @param {number[]} outputs
     */
    heuristicFit(inputs, outputs) {
        this.k1.heuristicFit(inputs, outputs);
        this.k2.heuristicFit(inputs, outputs);
    }
}

/**
 * Point-wise product of two kernels: k(x,y) = k1(x,y) · k2(x,y).
 *
 * Corresponds to Rust `KernelProd<T, U>`.
 */
export class KernelProd {
    /**
     * @param {object} k1
     * @param {object} k2
     */
    constructor(k1, k2) {
        this.k1 = k1;
        this.k2 = k2;
    }

    nbParameters() {
        return this.k1.nbParameters() + this.k2.nbParameters();
    }

    isScalable() {
        return this.k1.isScalable() || this.k2.isScalable();
    }

    /**
     * @param {number[]} x1
     * @param {number[]} x2
     * @returns {number}
     */
    kernel(x1, x2) {
        return this.k1.kernel(x1, x2) * this.k2.kernel(x1, x2);
    }

    /**
     * Product rule: [ ...k1.gradient · k2val, ...k2.gradient · k1val ],
     * where k1val = k1.kernel(x,y), k2val = k2.kernel(x,y).
     * @param {number[]} x1
     * @param {number[]} x2
     * @returns {number[]}
     */
    gradient(x1, x2) {
        const k1val = this.k1.kernel(x1, x2);
        const k2val = this.k2.kernel(x1, x2);
        const g1 = this.k1.gradient(x1, x2).map((g) => g * k2val);
        const g2 = this.k2.gradient(x1, x2).map((g) => g * k1val);
        return [...g1, ...g2];
    }

    /**
     * Rescale the first scalable child, else the second.
     * @param {number} scale
     */
    rescale(scale) {
        if (this.k1.isScalable()) {
            this.k1.rescale(scale);
        } else {
            this.k2.rescale(scale);
        }
    }

    getParameters() {
        return [...this.k1.getParameters(), ...this.k2.getParameters()];
    }

    /**
     * @param {number[]} parameters
     */
    setParameters(parameters) {
        const n1 = this.k1.nbParameters();
        this.k1.setParameters(parameters.slice(0, n1));
        this.k2.setParameters(parameters.slice(n1));
    }

    /**
     * @param {number[][]} inputs
     * @param {number[]} outputs
     */
    heuristicFit(inputs, outputs) {
        this.k1.heuristicFit(inputs, outputs);
        this.k2.heuristicFit(inputs, outputs);
    }
}

/**
 * Convenience constructor for k1 + k2 (Rust `KernelArith` Add operator).
 * @param {object} k1
 * @param {object} k2
 * @returns {KernelSum}
 */
export function addKernels(k1, k2) {
    return new KernelSum(k1, k2);
}

/**
 * Convenience constructor for k1 · k2 (Rust `KernelArith` Mul operator).
 * @param {object} k1
 * @param {object} k2
 * @returns {KernelProd}
 */
export function mulKernels(k1, k2) {
    return new KernelProd(k1, k2);
}
