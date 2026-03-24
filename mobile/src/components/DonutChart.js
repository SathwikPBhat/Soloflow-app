import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function DonutChart({
  percentage = 0,
  color = '#3b82f6',
  radius = 60,
  strokeWidth = 14,
  label = '',
  completed = 0,
  total = 0,
  darkMode = false,
}) {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const circumference = 2 * Math.PI * radius;
  const trackColor = darkMode ? '#23272e' : '#E5E7EB';

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: percentage,
      duration: 1200,
      useNativeDriver: false,
    }).start();
  }, [percentage]);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, circumference * (1 - percentage / 100)],
  });

  const size = (radius + strokeWidth) * 2;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: darkMode ? '#1e293b' : '#f0fdf4' },
      ]}
    >
      <Text style={[styles.label, { color: darkMode ? '#f1f5f9' : '#1f2937' }]}>
        {label}
      </Text>

      {total === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={{ color: darkMode ? '#6b7280' : '#9ca3af', fontSize: 15 }}>
            No projects!
          </Text>
        </View>
      ) : (
        <View style={styles.chartWrapper}>
          <Svg width={size} height={size}>
            <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
              {/* Background track */}
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={trackColor}
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              {/* Progress arc */}
              <AnimatedCircle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={color}
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </G>
          </Svg>
          {/* Center text */}
          <View style={[styles.centerLabel, { width: size, height: size }]}>
            <Text style={[styles.percentText, { color }]}>{percentage}%</Text>
          </View>
        </View>
      )}

      {total > 0 && (
        <Text
          style={[
            styles.statsText,
            { color: darkMode ? '#d1d5db' : '#374151' },
          ]}
        >
          <Text style={{ fontWeight: 'bold' }}>{completed}</Text>
          {' completed of '}
          <Text style={{ fontWeight: 'bold' }}>{total}</Text>
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 6,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    minWidth: 160,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  chartWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  emptyContainer: {
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsText: {
    marginTop: 10,
    fontSize: 13,
    textAlign: 'center',
  },
});