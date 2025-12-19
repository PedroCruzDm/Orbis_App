// Design System - Main Theme Export
import colors from './colors';
import spacing from './spacing';
import typography from './typography';
import shadows from './shadows';

export const theme = {
  colors,
  spacing,
  typography,
  shadows,

  // Border radius
  borderRadius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 24,
    full: 9999,
  },

  // Opacity
  opacity: {
    0: 0,
    5: 0.05,
    10: 0.1,
    20: 0.2,
    30: 0.3,
    40: 0.4,
    50: 0.5,
    60: 0.6,
    70: 0.7,
    80: 0.8,
    90: 0.9,
    95: 0.95,
    100: 1,
  },
};

export { colors, spacing, typography, shadows };
export default theme;
