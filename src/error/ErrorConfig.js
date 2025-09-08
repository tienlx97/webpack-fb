let n = false;

export const ErrorConfig = {
  config: {
    skipDupErrorGuard: false,
  },
  setup: (a) => {
    if (n === false) {
      n = true;
      ErrorConfig.config = Object.freeze(a);
    }
  },
};
