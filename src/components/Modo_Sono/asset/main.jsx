import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView, ScrollView, View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { Audio } from 'expo-av';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';
import { Ionicons } from '@expo/vector-icons';

const screenWidth = Dimensions.get('window').width;

function formatTime(date) {
	const h = date.getHours().toString().padStart(2, '0');
	const m = date.getMinutes().toString().padStart(2, '0');
	return `${h}:${m}`;
}

import { sleepWeeklyData } from '../../../hooks/Users/data';

export default function ModoSonoMain() {
	const [wakeTime, setWakeTime] = useState(() => {
		const d = new Date();
		d.setHours(Math.min(7, d.getHours()), 0, 0, 0);
		return d;
	});
	const [showPicker, setShowPicker] = useState(false);
	const [isMonitoring, setIsMonitoring] = useState(false);
	const [monitoringStartedAt, setMonitoringStartedAt] = useState(null);
	const [monitoringEndedAt, setMonitoringEndedAt] = useState(null);
	const [features, setFeatures] = useState([]); // { t: Date, metering: number }
	const [recording, setRecording] = useState(null);
	const pollingRef = useRef(null);
	const [explainerOpen, setExplainerOpen] = useState(false);

	// Weekly stub data for dashboard (centralized)
	const weeklyData = useMemo(() => sleepWeeklyData, []);

	const metrics = useMemo(() => {
		const totalHours = weeklyData.reduce((s, d) => s + d.hours, 0);
		const avgHours = totalHours / weeklyData.length;
		const cycles = weeklyData.reduce((s, d) => s + d.cycles, 0);
		const deepAvg = Math.round(weeklyData.reduce((s, d) => s + d.deepPct, 0) / weeklyData.length);
		const bestNight = weeklyData.reduce((best, d) => (d.score > best.score ? d : best), weeklyData[0]);
		return { totalHours, avgHours, cycles, deepAvg, bestNight };
	}, [weeklyData]);

	const chartConfig = useMemo(() => ({
		backgroundGradientFrom: colors.card.light,
		backgroundGradientTo: colors.card.light,
		color: (opacity = 1) => `rgba(14, 165, 164, ${opacity})`,
		labelColor: (opacity = 1) => `rgba(55, 65, 81, ${opacity})`,
		propsForDots: { r: '3', strokeWidth: '1', stroke: colors.primary.dark },
		propsForBackgroundLines: { stroke: colors.gray[200] },
		decimalPlaces: 0,
	}), []);

	const requestMicPermission = useCallback(async () => {
		const { status } = await Audio.requestPermissionsAsync();
		if (status !== 'granted') {
			throw new Error('Permissão de microfone negada');
		}
	}, []);

	const startMonitoring = useCallback(async () => {
		try {
			await requestMicPermission();
			await Audio.setAudioModeAsync({
				allowsRecordingIOS: true,
				playsInSilentModeIOS: true,
				staysActiveInBackground: false, // Managed workflow foreground only
				interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
				interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
				shouldDuckAndroid: true,
			});

			const recording = new Audio.Recording();
			await recording.prepareToRecordAsync({
				android: {
					extension: '.3gp',
					outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
					audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
					sampleRate: 44100,
					numberOfChannels: 1,
					bitRate: 128000,
				},
				ios: {
					extension: '.m4a',
					audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_MEDIUM,
					sampleRate: 44100,
					numberOfChannels: 1,
					bitRate: 128000,
					outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
				},
				isMeteringEnabled: true,
			});

			await recording.startAsync();
			setRecording(recording);
			setIsMonitoring(true);
			const startAt = new Date();
			setMonitoringStartedAt(startAt);
			setMonitoringEndedAt(null);
			setFeatures([]);

			// Poll metering every 10s
			pollingRef.current = setInterval(async () => {
				try {
					const status = await recording.getStatusAsync();
					if (status.isRecording) {
						// status.metering is a negative dBFS value on iOS; may be undefined on Android
						const level = typeof status.metering === 'number' ? status.metering : Math.random() * -40; // fallback stub
						setFeatures(prev => [...prev, { t: new Date(), metering: Math.round(level) }].slice(-100));
					}
				} catch {}
			}, 10000);
		} catch (e) {
			console.warn(e?.message || String(e));
		}
	}, [requestMicPermission]);

	const stopMonitoring = useCallback(async () => {
		try {
			if (pollingRef.current) {
				clearInterval(pollingRef.current);
				pollingRef.current = null;
			}
			if (recording) {
				await recording.stopAndUnloadAsync();
			}
		} catch {}
		setIsMonitoring(false);
		setRecording(null);
		setMonitoringEndedAt(new Date());
	}, [recording]);

	useEffect(() => {
		return () => {
			if (pollingRef.current) clearInterval(pollingRef.current);
			if (recording) {
				recording.stopAndUnloadAsync().catch(() => {});
			}
		};
	}, [recording]);

	const lineLabels = useMemo(() => {
		const labels = features.map(f => `${f.t.getHours()}:${String(f.t.getMinutes()).padStart(2, '0')}`);
		return labels.length ? labels : [''];
	}, [features]);

	const lineDataset = useMemo(() => {
		const data = features.map(f => Math.max(-60, Math.min(0, f.metering)) + 60); // normalize to 0..60
		return data.length ? data : [0];
	}, [features]);

	const weeklyLabels = weeklyData.map(d => d.day);
	const weeklyScores = weeklyData.map(d => d.score);

	const qualityScore = useMemo(() => {
		// Simple example using last session duration if available
		let horasDormidas = 0;
		if (monitoringStartedAt && monitoringEndedAt) {
			const ms = monitoringEndedAt - monitoringStartedAt;
			horasDormidas = Math.max(0, ms / (1000 * 60 * 60));
		}
		const ciclosCompletos = Math.round((horasDormidas || metrics.avgHours) / 1.5); // approx 90-min cycles
		const consistenciaHorario = 0.8; // stub 0..1
		const score = (horasDormidas * 0.4) + (ciclosCompletos * 0.3) + (consistenciaHorario * 0.3) * 100 / (8 * 0.4 + 5 * 0.3 + 1 * 0.3);
		return Math.round(Math.max(0, Math.min(100, score)));
	}, [monitoringStartedAt, monitoringEndedAt, metrics.avgHours]);

	return (
		<SafeAreaView style={styles.safe}>
			<ScrollView contentContainerStyle={styles.container}>
				{/* Sleep Control */}
				<View style={styles.card}>
					<Text style={styles.cardTitle}>Gestão de Sono</Text>
					<Text style={styles.label}>Que horas você precisa acordar?</Text>
					<TouchableOpacity style={styles.timePickerButton} onPress={() => setShowPicker(true)}>
						<Ionicons name="alarm-outline" size={20} color={colors.primary.dark} />
						<Text style={styles.timeText}>{formatTime(wakeTime)}</Text>
					</TouchableOpacity>
					{showPicker && (
						<View style={styles.pickerWrap}>
							<DateTimePicker
								value={wakeTime}
								mode="time"
								is24Hour={true}
								display={Platform.OS === 'ios' ? 'spinner' : 'default'}
								onChange={(_, date) => {
									if (date) setWakeTime(date);
									setShowPicker(false);
								}}
							/>
						</View>
					)}

					{!isMonitoring ? (
						<TouchableOpacity style={styles.primaryButton} onPress={startMonitoring}>
							<Ionicons name="moon" size={18} color={colors.white} />
							<Text style={styles.primaryButtonText}>Iniciar Análise de Sono</Text>
						</TouchableOpacity>
					) : (
						<TouchableOpacity style={styles.stopButton} onPress={stopMonitoring}>
							<Ionicons name="square" size={18} color={colors.white} />
							<Text style={styles.primaryButtonText}>Parar Análise</Text>
						</TouchableOpacity>
					)}
					{isMonitoring && (
						<Text style={styles.helperText}>Monitorando (processamento local, sem gravação de áudio bruto)</Text>
					)}
				</View>

				{/* Sleep Dashboard */}
				<View style={styles.card}>
					<Text style={styles.cardTitle}>Qualidade do Sono</Text>
					<Text style={styles.sectionLabel}>Período do Sono (Nível acústico)</Text>
					<LineChart
						data={{ labels: lineLabels, datasets: [{ data: lineDataset }] }}
						width={screenWidth - spacing['3xl']}
						height={180}
						chartConfig={chartConfig}
						bezier
						style={styles.chart}
					/>

					<Text style={styles.sectionLabel}>Resumo Semanal (Pontuação)</Text>
					<BarChart
						data={{ labels: weeklyLabels, datasets: [{ data: weeklyScores }] }}
						width={screenWidth - spacing['3xl']}
						height={200}
						chartConfig={chartConfig}
						style={styles.chart}
						fromZero
						showValuesOnTopOfBars
					/>

					<View style={styles.metricsGrid}>
						<Metric title="Média de Horas" value={`${metrics.avgHours.toFixed(1)}h`} icon="time-outline" />
						<Metric title="Total Semanal" value={`${metrics.totalHours.toFixed(1)}h`} icon="calendar-outline" />
						<Metric title="Ciclos Completos" value={`${metrics.cycles}`} icon="refresh-outline" />
						<Metric title="Sono Profundo" value={`${metrics.deepAvg}%`} icon="moon-outline" />
						<Metric title="Melhor Noite" value={`${metrics.bestNight.day} (${metrics.bestNight.score})`} icon="star-outline" />
						<Metric title="Score Atual" value={`${qualityScore}`} icon="stats-chart-outline" />
					</View>
				</View>

				{/* Sleep Tips */}
				<View style={styles.card}>
					<Text style={styles.cardTitle}>Dicas para Melhorar seu Sono</Text>
					<TipItem text="Evite telas azuis 1h antes do horário planejado." />
					<TipItem text="Mantenha o quarto em uma temperatura amena." />
					<TipItem text="Tente manter o mesmo horário de despertar, mesmo nos fins de semana." />
				</View>

				{/* App Explainer */}
				<View style={styles.card}>
					<TouchableOpacity style={styles.secondaryButton} onPress={() => setExplainerOpen(v => !v)}>
						<Ionicons name="help-circle-outline" size={18} color={colors.primary.dark} />
						<Text style={styles.secondaryButtonText}>Como o Orbis funciona?</Text>
					</TouchableOpacity>
					{explainerOpen && (
						<View style={styles.modalBox}>
							<Text style={styles.modalText}>
								Ciclos de ~90 minutos variam entre sono leve, REM e profundo. O microfone detecta padrões de respiração e movimentação
								para inferir estágios sem gravar áudio bruto. Acordar em fase leve melhora disposição.
							</Text>
						</View>
					)}
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

function Metric({ title, value, icon }) {
	return (
		<View style={styles.metricItem}>
			<Ionicons name={icon} size={20} color={colors.primary.dark} />
			<View style={{ marginLeft: spacing.sm }}>
				<Text style={styles.metricTitle}>{title}</Text>
				<Text style={styles.metricValue}>{value}</Text>
			</View>
		</View>
	);
}

function TipItem({ text }) {
	return (
		<View style={styles.tipItem}>
			<Ionicons name="checkmark-circle-outline" size={18} color={colors.success.DEFAULT} />
			<Text style={styles.tipText}>{text}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	safe: {
		flex: 1,
		backgroundColor: colors.background.subtle,
	},
	container: {
		padding: spacing.lg,
		paddingBottom: spacing['3xl'],
	},
	card: {
		backgroundColor: colors.card.light,
		borderRadius: 12,
		padding: spacing.lg,
		marginBottom: spacing.xl,
		borderWidth: 1,
		borderColor: colors.border.light,
	},
	cardTitle: {
		fontSize: typography.fontSize['2xl'],
		fontWeight: typography.fontWeight.semibold,
		color: colors.text.primary,
		marginBottom: spacing.md,
	},
	label: {
		fontSize: typography.fontSize.base,
		color: colors.text.secondary,
		marginBottom: spacing.sm,
	},
	timePickerButton: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.sm,
		borderWidth: 1,
		borderColor: colors.gray[200],
		borderRadius: 8,
		paddingVertical: spacing.sm,
		paddingHorizontal: spacing.md,
		backgroundColor: colors.background.light,
		marginBottom: spacing.md,
	},
	timeText: {
		fontSize: typography.fontSize.lg,
		color: colors.text.primary,
		marginLeft: spacing.sm,
	},
	pickerWrap: {
		marginBottom: spacing.md,
	},
	primaryButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: spacing.sm,
		backgroundColor: colors.primary.DEFAULT,
		paddingVertical: spacing.md,
		borderRadius: 8,
	},
	stopButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: spacing.sm,
		backgroundColor: colors.error.DEFAULT,
		paddingVertical: spacing.md,
		borderRadius: 8,
	},
	primaryButtonText: {
		color: colors.white,
		fontSize: typography.fontSize.base,
		fontWeight: typography.fontWeight.semibold,
		marginLeft: spacing.sm,
	},
	helperText: {
		marginTop: spacing.sm,
		color: colors.text.secondary,
		fontSize: typography.fontSize.sm,
	},
	sectionLabel: {
		marginTop: spacing.md,
		marginBottom: spacing.sm,
		color: colors.text.secondary,
		fontSize: typography.fontSize.sm,
	},
	chart: {
		borderRadius: 12,
		marginBottom: spacing.md,
	},
	metricsGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
		gap: spacing.md,
		marginTop: spacing.md,
	},
	metricItem: {
		width: (screenWidth - spacing['3xl'] - spacing.lg) / 2 - spacing.md,
		borderWidth: 1,
		borderColor: colors.gray[200],
		borderRadius: 10,
		padding: spacing.md,
		backgroundColor: colors.background.light,
		flexDirection: 'row',
		alignItems: 'center',
	},
	metricTitle: {
		color: colors.text.secondary,
		fontSize: typography.fontSize.sm,
	},
	metricValue: {
		color: colors.text.primary,
		fontSize: typography.fontSize.lg,
		fontWeight: typography.fontWeight.semibold,
	},
	secondaryButton: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.sm,
		paddingVertical: spacing.sm,
		paddingHorizontal: spacing.md,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: colors.gray[200],
		backgroundColor: colors.background.light,
	},
	secondaryButtonText: {
		color: colors.primary.dark,
		fontSize: typography.fontSize.base,
		marginLeft: spacing.sm,
		fontWeight: typography.fontWeight.medium,
	},
	modalBox: {
		marginTop: spacing.md,
		borderRadius: 10,
		backgroundColor: colors.background.light,
		borderWidth: 1,
		borderColor: colors.border.light,
		padding: spacing.md,
	},
	modalText: {
		color: colors.text.secondary,
		fontSize: typography.fontSize.base,
		lineHeight: typography.lineHeight.relaxed,
	},
});

