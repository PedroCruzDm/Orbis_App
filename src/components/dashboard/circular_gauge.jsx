import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import theme from '../../theme';

export default function CircularGauge({ value = 0, max = 100, size = 80, strokeWidth = 6 }) {
  const percentage = Math.max(0, Math.min(100, Math.round((value / max) * 100)));
  const color = percentage >= 80 ? theme.colors.success[500] : percentage >= 50 ? theme.colors.primary[500] : theme.colors.warning[500];
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        {/* Círculo de fundo */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Círculo de progresso */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-270 ${size / 2} ${size / 2})`}
        />
      </Svg>

      <View style={styles.textContainer}>
        <Text style={[styles.value, { color }]}>{percentage}%</Text>
        <Text style={styles.sub}>{value}/{max}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { 
    alignItems: 'center', 
    justifyContent: 'center',
    position: 'relative',
  },
  svg: { 
    position: 'absolute',
  },
  textContainer: { 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  value: { 
    fontSize: theme.typography.fontSize.lg, 
    fontWeight: theme.typography.fontWeight.bold 
  },
  sub: { 
    fontSize: theme.typography.fontSize.xs, 
    color: theme.colors.text.secondary 
  },
});
