import { vi } from "vitest";

// Force polyfill ElementInternals for jsdom
// JSDOM might have a partial/broken implementation, so we force ours.
if (typeof HTMLElement !== "undefined") {
  // @ts-expect-error - polyfilling attachInternals for jsdom
  HTMLElement.prototype.attachInternals = function () {
    return {
      setFormValue: vi.fn(),
      setValidity: vi.fn(),
      validationMessage: "",
      willValidate: true,
      checkValidity: vi.fn(() => true),
      reportValidity: vi.fn(() => true),
      labels: [],
      form: null,
      states: new Set(),
      validity: {
        badInput: false,
        customError: false,
        patternMismatch: false,
        rangeOverflow: false,
        rangeUnderflow: false,
        stepMismatch: false,
        tooLong: false,
        tooShort: false,
        typeMismatch: false,
        valid: true,
        valueMissing: false,
      },
    };
  };
}
