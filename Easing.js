// Easing.js (robustata)
const clamp01 = t => t < 0 ? 0 : t > 1 ? 1 : t;

const Easing = {
  Power: {
    In: (power = 1) => {
      power = Math.round(power);
      return t => Math.pow(clamp01(t), power);
    },
    Out: (power = 1) => {
      power = Math.round(power);
      return t => 1 - Math.pow(1 - clamp01(t), power);
    },
    InOut: (power = 1) => {
      power = Math.round(power);
      return t => {
        t = clamp01(t) * 2;
        if (t < 1) return 0.5 * Math.pow(t, power);
        return 1 - 0.5 * Math.pow(2 - t, power);
      };
    }
  },

  Sine: {
    // Canoniche: In = 1 - cos(πt/2), Out = sin(πt/2), InOut = 0.5*(1 - cos(πt))
    In:  () => t => 1 - Math.cos((Math.PI / 2) * clamp01(t)),
    Out: () => t => Math.sin((Math.PI / 2) * clamp01(t)),
    InOut: () => t => 0.5 * (1 - Math.cos(Math.PI * clamp01(t))),
  },

  Back: {
    In:  (s = 1.70158) => t => {
      t = clamp01(t);
      return t * t * ((s + 1) * t - s);
    },
    Out: (s = 1.70158) => t => {
      t = clamp01(t) - 1;
      return t * t * ((s + 1) * t + s) + 1;
    }
  },

  Elastic: {
    // Out: classica con ampiezza (a) e periodo (p)
    Out: (amplitude = 1, period = 0.3) => {
      const a = amplitude > 0 ? amplitude : 1;
      const p = period > 0 ? period : 0.3;

      const PI2 = Math.PI * 2;
      const s = (Math.asin(1 / a) || 0) * (p / PI2);

      return t => {
        t = clamp01(t);
        // evita exp e sin quando siamo a 0 o 1
        if (t === 0) return 0;
        if (t === 1) return 1;
        return a * Math.pow(2, -10 * t) * Math.sin((t - s) * (PI2 / p)) + 1;
      };
    }
  }
};

export { Easing };
