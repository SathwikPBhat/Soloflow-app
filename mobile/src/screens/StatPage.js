import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AppHeader from '../components/AppHeader';
import DonutChart from '../components/DonutChart';
import { API_BASE_URL } from '../utils/config';
import { useTheme } from '../contexts/ThemeContext';
import { storage } from '../utils/storage';

const { width } = Dimensions.get('window');

const CHARTS = [
  { label: "Today's Projects", endpoint: 'today', color: '#10B981' },
  { label: "This Week's Projects", endpoint: 'thisweek', color: '#4F46E5' },
  { label: "This Month's Projects", endpoint: 'thismonth', color: '#F59E42' },
];

const GITHUB_COLORS = ['#ebedf0', '#c6e48b', '#7bc96f', '#239a3b', '#196127'];

function getHeatColor(count) {
  if (!count || count === 0) return GITHUB_COLORS[0];
  if (count <= 3) return GITHUB_COLORS[1];
  if (count <= 7) return GITHUB_COLORS[2];
  if (count <= 11) return GITHUB_COLORS[3];
  return GITHUB_COLORS[4];
}

function HeatMap({ data = [], darkMode }) {
  const CELL = 14;
  const GAP = 2;
  const today = new Date();
  const startDate = new Date(today);
  startDate.setFullYear(today.getFullYear() - 1);
  startDate.setDate(startDate.getDate() - startDate.getDay());

  const dateMap = {};
  data.forEach((d) => {
    if (d.date) dateMap[d.date.split('T')[0]] = d.count || 0;
  });

  const weeks = [];
  for (let w = 0; w < 53; w++) {
    const days = [];
    for (let d = 0; d < 7; d++) {
      const cur = new Date(startDate);
      cur.setDate(startDate.getDate() + w * 7 + d);
      const key = cur.toISOString().split('T')[0];
      days.push({ date: key, count: dateMap[key] || 0 });
    }
    weeks.push(days);
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={{ flexDirection: 'row', gap: GAP, padding: 8 }}>
        {weeks.map((week, wi) => (
          <View key={wi} style={{ flexDirection: 'column', gap: GAP }}>
            {week.map((day, di) => (
              <View
                key={di}
                style={{
                  width: CELL,
                  height: CELL,
                  borderRadius: 2,
                  backgroundColor: getHeatColor(day.count),
                  opacity: darkMode && day.count === 0 ? 0.3 : 1,
                }}
              />
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function BarChart({ data = [], darkMode }) {
  if (!data || data.length === 0) return null;
  const maxVal = Math.max(...data.map((d) => d.count || 0), 1);
  const barWidth = Math.min(40, (width - 80) / data.length - 4);

  return (
    <View style={styles.barChart}>
      <View style={styles.bars}>
        {data.map((item, i) => {
          const h = Math.max(4, ((item.count || 0) / maxVal) * 120);
          return (
            <View key={i} style={styles.barCol}>
              <Text
                style={[
                  styles.barValue,
                  { color: darkMode ? '#d1d5db' : '#374151' },
                ]}
              >
                {item.count || 0}
              </Text>
              <View
                style={[
                  styles.bar,
                  { height: h, width: barWidth, backgroundColor: '#4f46e5' },
                ]}
              />
              <Text
                style={[
                  styles.barLabel,
                  { color: darkMode ? '#9ca3af' : '#6b7280' },
                ]}
                numberOfLines={1}
              >
                {item.day || item.week || ''}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function StatPage() {
  const { darkMode } = useTheme();
  const [userId, setUserId] = useState(null);
  const [token, setToken] = useState(null);
  const [stats, setStats] = useState([
    { total: 0, completed: 0 },
    { total: 0, completed: 0 },
    { total: 0, completed: 0 },
  ]);
  const [loading, setLoading] = useState([true, true, true]);
  const [animatedPercent, setAnimatedPercent] = useState([0, 0, 0]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [heatmapLoading, setHeatmapLoading] = useState(true);
  const [weeklyData, setWeeklyData] = useState([]);
  const [weeklyLoading, setWeeklyLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const uid = await storage.getItem('user_id');
      const tok = await storage.getItem('token');
      setUserId(uid);
      setToken(tok);
    };
    init();
  }, []);

  useEffect(() => {
    if (!userId || !token) return;

    CHARTS.forEach((chart, idx) => {
      fetch(`${API_BASE_URL}/stats/projects-${chart.endpoint}/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data) => {
          setStats((prev) => {
            const a = [...prev];
            a[idx] = data;
            return a;
          });
          setLoading((prev) => {
            const a = [...prev];
            a[idx] = false;
            return a;
          });
        })
        .catch(() =>
          setLoading((prev) => {
            const a = [...prev];
            a[idx] = false;
            return a;
          })
        );
    });

    fetch(`${API_BASE_URL}/${userId}/statistics`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setHeatmapData(data.value || []);
        setHeatmapLoading(false);
      })
      .catch(() => setHeatmapLoading(false));

    fetch(`${API_BASE_URL}/stats/weekly-deadlines/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setWeeklyData(data.data || []);
        setWeeklyLoading(false);
      })
      .catch(() => setWeeklyLoading(false));
  }, [userId, token]);

  useEffect(() => {
    stats.forEach((stat, idx) => {
      if (stat.total === 0) return;
      const target = Math.round((stat.completed / stat.total) * 100);
      let current = 0;
      const step = () => {
        if (current < target) {
          current += 2;
          setAnimatedPercent((prev) => {
            const a = [...prev];
            a[idx] = Math.min(current, target);
            return a;
          });
          setTimeout(step, 15);
        }
      };
      step();
    });
  }, [stats]);

  const bg = darkMode ? '#111827' : '#eff6ff';
  const cardBg = darkMode ? '#1f2937' : '#ffffff';
  const textColor = darkMode ? '#f9fafb' : '#111827';

  return (
    <View style={[styles.screen, { backgroundColor: bg }]}>
      <AppHeader />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionTitle, { color: textColor }]}>
          Project Completion Overview
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.donutRow}
        >
          {CHARTS.map((chart, idx) => (
            <DonutChart
              key={chart.label}
              label={chart.label}
              color={chart.color}
              percentage={animatedPercent[idx]}
              completed={stats[idx].completed}
              total={stats[idx].total}
              darkMode={darkMode}
            />
          ))}
        </ScrollView>

        <View style={[styles.sectionCard, { backgroundColor: cardBg }]}>
          <Text style={[styles.cardTitle, { color: textColor }]}>
            Projects Due This Week
          </Text>
          {weeklyLoading ? (
            <ActivityIndicator color="#3b82f6" style={{ marginTop: 20 }} />
          ) : weeklyData.length === 0 ? (
            <Text
              style={[
                styles.emptyText,
                { color: darkMode ? '#6b7280' : '#9ca3af' },
              ]}
            >
              No data available
            </Text>
          ) : (
            <BarChart data={weeklyData} darkMode={darkMode} />
          )}
        </View>

        <View style={[styles.sectionCard, { backgroundColor: cardBg }]}>
          <Text style={[styles.cardTitle, { color: textColor }]}>
            Activity Heatmap
          </Text>
          <Text
            style={[
              styles.cardSubtitle,
              { color: darkMode ? '#9ca3af' : '#6b7280' },
            ]}
          >
            Project activity over the past year
          </Text>
          {heatmapLoading ? (
            <ActivityIndicator color="#3b82f6" style={{ marginTop: 20 }} />
          ) : (
            <HeatMap data={heatmapData} darkMode={darkMode} />
          )}
          <View style={styles.heatLegend}>
            <Text
              style={[
                styles.legendText,
                { color: darkMode ? '#9ca3af' : '#6b7280' },
              ]}
            >
              Less
            </Text>
            {GITHUB_COLORS.map((c, i) => (
              <View
                key={i}
                style={[styles.legendCell, { backgroundColor: c }]}
              />
            ))}
            <Text
              style={[
                styles.legendText,
                { color: darkMode ? '#9ca3af' : '#6b7280' },
              ]}
            >
              More
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingBottom: 40 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  donutRow: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  sectionCard: {
    margin: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: { fontSize: 17, fontWeight: 'bold', marginBottom: 4 },
  cardSubtitle: { fontSize: 13, marginBottom: 12 },
  emptyText: { textAlign: 'center', paddingVertical: 20, fontSize: 14 },
  barChart: { marginTop: 8 },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    justifyContent: 'center',
    paddingVertical: 8,
  },
  barCol: { alignItems: 'center', gap: 4 },
  bar: { borderRadius: 4 },
  barValue: { fontSize: 11, fontWeight: '600' },
  barLabel: { fontSize: 10 },
  heatLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 8,
  },
  legendCell: { width: 12, height: 12, borderRadius: 2 },
  legendText: { fontSize: 11 },
});