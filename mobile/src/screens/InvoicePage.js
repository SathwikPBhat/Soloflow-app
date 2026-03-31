import { Feather } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { API_BASE_URL } from '../utils/config';
import { useTheme } from '../contexts/ThemeContext';
import { storage } from '../utils/storage';

export default function InvoicePage({ route, navigation }) {
  const { user_id, client_id, project_id } = route.params;
  const { darkMode } = useTheme();
  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [token, setToken] = useState(null);

  const normalizeAmount = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const rawInvoiceItems = Array.isArray(invoiceData?.particulars)
    ? invoiceData.particulars
    : Array.isArray(invoiceData?.invoice_tasks)
    ? invoiceData.invoice_tasks
    : Array.isArray(invoiceData?.tasks)
    ? invoiceData.tasks
    : [];

  const invoiceItems = rawInvoiceItems.map((item) => ({
    task_name: item?.task_name || item?.name || item?.task_id?.task_name || 'Task',
    task_description:
      item?.task_description || item?.description || item?.task_id?.task_description || '',
    task_amount: normalizeAmount(
      item?.task_amount ?? item?.task_price ?? item?.amount ?? item?.task_id?.task_price
    ),
  }));

  const backendInvoiceTotal = normalizeAmount(
    invoiceData?.invoice_amount ?? invoiceData?.invoice_total_amount
  );
  const calculatedInvoiceTotal = invoiceItems.reduce(
    (sum, task) => sum + normalizeAmount(task.task_amount),
    0
  );
  const invoiceTotal = invoiceItems.length > 0 ? calculatedInvoiceTotal : backendInvoiceTotal;

  const normalizedStatus = String(invoiceData?.invoice_status || 'Pending').toLowerCase();

  useEffect(() => {
    storage.getItem('token').then(setToken);
  }, []);

  useEffect(() => {
    if (!token) return;
    const loadInvoice = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/${user_id}/${client_id}/${project_id}/viewinvoice`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to load invoice');
        }

        if (data.invoices && Array.isArray(data.invoices) && data.invoices.length > 0) {
          setInvoiceData(data.invoices[0]);
        } else if (data.invoice) {
          setInvoiceData(data.invoice);
        } else {
          setInvoiceData(data);
        }

        Toast.show({ type: 'success', text1: 'Invoice loaded' });
      } catch (error) {
        setInvoiceData(null);
        Toast.show({ type: 'error', text1: error.message || 'Failed to load invoice' });
      } finally {
        setLoading(false);
      }
    };

    loadInvoice();
  }, [token, user_id, client_id, project_id]);

  const handleSendInvoice = async () => {
    if (!invoiceData?._id) {
      Toast.show({ type: 'error', text1: 'Invoice ID not found' });
      return;
    }
    setIsSending(true);
    try {
      const res = await fetch(`${API_BASE_URL}/${user_id}/${invoiceData._id}/email`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (res.ok) {
        Toast.show({ type: 'success', text1: 'Invoice sent successfully!' });
      } else {
        Toast.show({ type: 'error', text1: data.message || 'Failed to send invoice' });
      }
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to send invoice' });
    } finally {
      setIsSending(false);
    }
  };

  const bg = darkMode ? '#111827' : '#f0f9ff';
  const cardBg = darkMode ? '#1f2937' : '#ffffff';
  const textColor = darkMode ? '#f9fafb' : '#111827';
  const subText = darkMode ? '#9ca3af' : '#6b7280';
  const borderColor = darkMode ? '#374151' : '#e5e7eb';

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: bg }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: bg, borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Invoice</Text>
        <View style={{ width: 30 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 60 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Invoice Number */}
          <View style={styles.subHeader}>
            <Text style={[styles.invoiceNum, { color: subText }]}>
              {invoiceData?.invoice_number ? `Invoice #${invoiceData.invoice_number}` : 'Loading...'}
            </Text>
          </View>

          {/* Main Card */}
          <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            {/* Project + Date */}
            <View style={[styles.cardSection, { borderBottomColor: borderColor }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.projectName, { color: textColor }]}>
                  {invoiceData?.invoice_project_id?.project_name || 'Project Name'}
                </Text>
                <Text style={[styles.invoiceDate, { color: subText }]}>
                  Date: {invoiceData?.invoice_date
                    ? new Date(invoiceData.invoice_date).toLocaleDateString()
                    : new Date().toLocaleDateString()}
                </Text>
              </View>
              <Text style={[styles.invoiceNumRight, { color: textColor }]}>
                #{invoiceData?.invoice_number || '0000'}
              </Text>
            </View>

            {/* Client + Company */}
            <View style={[styles.cardSection, { borderBottomColor: borderColor }]}>
              <View style={styles.billingBlock}>
                <Text style={[styles.billingLabel, { color: subText }]}>BILLED TO</Text>
                <Text style={[styles.billingName, { color: textColor }]}>
                  {invoiceData?.invoice_client_id?.client_name || 'Client Name'}
                </Text>
                <Text style={[styles.billingDetail, { color: subText }]}>
                  {invoiceData?.invoice_client_id?.client_email || ''}
                </Text>
                <Text style={[styles.billingDetail, { color: subText }]}>
                  {invoiceData?.invoice_client_id?.client_company || ''}
                </Text>
                <Text style={[styles.billingDetail, { color: subText }]}>
                  {invoiceData?.invoice_client_id?.client_address || ''}
                </Text>
              </View>
              <View style={styles.billingBlock}>
                <Text style={[styles.billingLabel, { color: subText }]}>FROM</Text>
                <Text style={[styles.billingName, { color: textColor }]}>
                  {invoiceData?.invoice_user_id?.user_name || 'User Name'}
                </Text>
                <Text style={[styles.billingDetail, { color: subText }]}>
                  {invoiceData?.invoice_user_id?.user_email || ''}
                </Text>
                <Text style={[styles.billingDetail, { color: subText }]}>
                  {invoiceData?.invoice_user_id?.user_company || ''}
                </Text>
              </View>
            </View>

            {/* Tasks Table */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { color: subText, flex: 2 }]}>Task</Text>
              <Text style={[styles.tableHeaderText, { color: subText, flex: 1, textAlign: 'right' }]}>Amount</Text>
            </View>
            {invoiceItems.map((task, idx) => (
              <View
                key={idx}
                style={[
                  styles.tableRow,
                  { borderBottomColor: borderColor, backgroundColor: idx % 2 === 0 ? 'transparent' : (darkMode ? '#1a2233' : '#f9fafb') },
                ]}
              >
                <View style={{ flex: 2 }}>
                  <Text style={[styles.taskName, { color: textColor }]}>
                    {task.task_name || 'Task'}
                  </Text>
                  {task.task_description && (
                    <Text style={[styles.taskDesc, { color: subText }]} numberOfLines={1}>
                      {task.task_description}
                    </Text>
                  )}
                </View>
                <Text style={[styles.taskPrice, { color: textColor }]}>
                  ${normalizeAmount(task.task_amount).toFixed(2)}
                </Text>
              </View>
            ))}

            {/* Total */}
            <View style={[styles.totalRow, { borderTopColor: borderColor }]}>
              <Text style={[styles.totalLabel, { color: subText }]}>TOTAL</Text>
              <Text style={[styles.totalAmount, { color: darkMode ? '#60a5fa' : '#2563eb' }]}>
                ${invoiceTotal.toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Status Badge */}
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    normalizedStatus === 'paid'
                      ? '#dcfce7'
                      : normalizedStatus === 'overdue'
                      ? '#fee2e2'
                      : normalizedStatus === 'pending'
                      ? '#dbeafe'
                      : '#fef9c3',
                },
              ]}
            >
              <Text
                style={{
                  color:
                    normalizedStatus === 'paid'
                      ? '#15803d'
                      : normalizedStatus === 'overdue'
                      ? '#b91c1c'
                      : normalizedStatus === 'pending'
                      ? '#1d4ed8'
                      : '#854d0e',
                  fontWeight: '600',
                  fontSize: 13,
                  textTransform: 'capitalize',
                }}
              >
                {normalizedStatus}
              </Text>
            </View>
          </View>

          {/* Send Invoice Button */}
          <TouchableOpacity
            style={[styles.sendBtn, { opacity: isSending ? 0.7 : 1 }]}
            onPress={handleSendInvoice}
            disabled={isSending}
          >
            {isSending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Feather name="send" size={18} color="#fff" />
            )}
            <Text style={styles.sendBtnText}>
              {isSending ? 'Sending...' : 'Send Invoice via Email'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  content: { padding: 16, paddingBottom: 40 },
  subHeader: { marginBottom: 12 },
  invoiceNum: { fontSize: 15 },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  cardSection: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  projectName: { fontSize: 17, fontWeight: '600', marginBottom: 4 },
  invoiceDate: { fontSize: 13 },
  invoiceNumRight: { fontSize: 15, fontWeight: '600' },
  billingBlock: { flex: 1, gap: 3 },
  billingLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  billingName: { fontSize: 14, fontWeight: '600' },
  billingDetail: { fontSize: 12 },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tableHeaderText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  tableRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, alignItems: 'center' },
  taskName: { fontSize: 14, fontWeight: '500' },
  taskDesc: { fontSize: 12, marginTop: 2 },
  taskPrice: { flex: 1, textAlign: 'right', fontWeight: '600', fontSize: 14 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 2,
  },
  totalLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  totalAmount: { fontSize: 22, fontWeight: 'bold' },
  statusRow: { alignItems: 'center', marginBottom: 16 },
  statusBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  sendBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});