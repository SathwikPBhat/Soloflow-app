// ...existing code...
import { Feather } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import AppHeader from '../components/AppHeader';
import { useTheme } from '../contexts/ThemeContext';
import { API_BASE_URL } from '../utils/config';
import { storage } from '../utils/storage';

const PRIORITY_LABELS = { 1: 'Backlog', 2: 'In Progress', 3: 'To Do', 4: 'Review' };
const PRIORITY_COLORS = {
  1: { bg: '#fef9c3', text: '#713f12' },
  2: { bg: '#dbeafe', text: '#1e40af' },
  3: { bg: '#f3e8ff', text: '#6b21a8' },
  4: { bg: '#dcfce7', text: '#14532d' },
};

const BOARDS = [
  { id: 'backlog', title: 'Backlog', color: '#f59e0b', priority: 1 },
  { id: 'todo', title: 'To Do', color: '#8b5cf6', priority: 3 },
  { id: 'inprogress', title: 'In Progress', color: '#3b82f6', priority: 2 },
  { id: 'review', title: 'Review', color: '#22c55e', priority: 4 },
];

function TaskCard({ task, darkMode, onMove }) {
  const pc = PRIORITY_COLORS[task.task_priority] || PRIORITY_COLORS[1];
  const label = PRIORITY_LABELS[task.task_priority] || 'Backlog';

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isOverdue = (d) => d && new Date(d) < new Date();

  return (
    <View
      style={[
        styles.taskCard,
        {
          backgroundColor: darkMode ? '#1f2937' : '#ffffff',
          borderColor: darkMode ? '#374151' : '#e5e7eb',
        },
      ]}
    >
      <Text
        style={[styles.taskName, { color: darkMode ? '#f9fafb' : '#111827' }]}
        numberOfLines={2}
      >
        {task.task_name}
      </Text>

      {task.task_description ? (
        <Text
          style={[styles.taskDesc, { color: darkMode ? '#d1d5db' : '#6b7280' }]}
          numberOfLines={2}
        >
          {task.task_description}
        </Text>
      ) : null}

      {task.task_project && (
        <View style={styles.taskMeta}>
          <Feather name="briefcase" size={11} color={darkMode ? '#9ca3af' : '#6b7280'} />
          <Text style={[styles.taskMetaText, { color: darkMode ? '#d1d5db' : '#4b5563' }]}>
            {task.task_project?.project_name || ''}
          </Text>
        </View>
      )}

      {task.task_client && (
        <View style={styles.taskMeta}>
          <Feather name="users" size={11} color={darkMode ? '#9ca3af' : '#6b7280'} />
          <Text style={[styles.taskMetaText, { color: darkMode ? '#d1d5db' : '#4b5563' }]}>
            {task.task_client?.client_name || ''}
          </Text>
        </View>
      )}

      {task.task_price > 0 && (
        <View style={styles.taskMeta}>
          <Feather name="dollar-sign" size={11} color="#22c55e" />
          <Text style={{ color: '#22c55e', fontSize: 12, fontWeight: '600' }}>
            ${task.task_price?.toLocaleString()}
          </Text>
        </View>
      )}

      <View style={styles.taskFooter}>
        <View style={[styles.priorityBadge, { backgroundColor: pc.bg }]}>
          <Text style={[styles.priorityText, { color: pc.text }]}>{label}</Text>
        </View>
        {task.task_commissioned && (
          <Text
            style={[
              styles.dueDateText,
              {
                color: isOverdue(task.task_commissioned)
                  ? '#ef4444'
                  : darkMode
                  ? '#9ca3af'
                  : '#6b7280',
              },
            ]}
          >
            {formatDate(task.task_commissioned)}
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.moveBtn,
          { borderColor: darkMode ? '#4b5563' : '#d1d5db' },
        ]}
        onPress={() => onMove(task)}
      >
        <Text style={[styles.moveBtnText, { color: darkMode ? '#93c5fd' : '#2563eb' }]}>
          Move to...
        </Text>
        <Feather name="chevron-right" size={14} color={darkMode ? '#93c5fd' : '#2563eb'} />
      </TouchableOpacity>
    </View>
  );
}

export default function Dashboard() {
  const { darkMode } = useTheme();
  const { width } = useWindowDimensions();
  const numColumns = width < 640 ? 1 : 2;

  const [boards, setBoards] = useState({
    backlog: { ...BOARDS[0], tasks: [] },
    todo: { ...BOARDS[1], tasks: [] },
    inprogress: { ...BOARDS[2], tasks: [] },
    review: { ...BOARDS[3], tasks: [] },
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState(null);
  const [token, setToken] = useState(null);

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState(1);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [addingTask, setAddingTask] = useState(false);

  const [moveModalVisible, setMoveModalVisible] = useState(false);
  const [taskToMove, setTaskToMove] = useState(null);

  const [priceModalVisible, setPriceModalVisible] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [taskPrice, setTaskPrice] = useState('');

  // Helper: build URL and centralize fetch (uses token from closure)
  const buildUrl = (path) => {
    const base = (API_BASE_URL || '').replace(/\/+$/g, '');
    const p = (path || '').replace(/^\/+/g, '');
    return `${base}/${p}`;
  };

  const apiFetch = async (path, { method = 'GET', body, headers = {} } = {}) => {
    const url = buildUrl(path);
    const finalHeaders = { Accept: 'application/json', ...headers };
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
    let bodyToSend = body;
    if (body && !(body instanceof FormData) && typeof body !== 'string') {
      finalHeaders['Content-Type'] = 'application/json';
      bodyToSend = JSON.stringify(body);
    }
    const res = await fetch(url, { method, headers: finalHeaders, body: bodyToSend });
    const text = await res.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch (e) { /* not json */ }
    if (!res.ok) {
      const errMsg = (json && (json.message || json.error)) || res.statusText || 'Request failed';
      throw new Error(errMsg);
    }
    return json;
  };

  useEffect(() => {
    const init = async () => {
      const uid = await storage.getItem('user_id');
      const tok = await storage.getItem('token');
      setUserId(uid);
      setToken(tok);
    };
    init();
  }, []);

  const fetchTasks = useCallback(async () => {
    if (!userId || !token) return;
    setLoading(true);
    try {
      const data = await apiFetch(`${userId}/dashboard`);
      const tasks = Array.isArray(data)
        ? data
        : data?.tasks || data?.task || data?.data?.tasks || [];

      const newBoards = {
        backlog: { ...BOARDS[0], tasks: [] },
        todo: { ...BOARDS[1], tasks: [] },
        inprogress: { ...BOARDS[2], tasks: [] },
        review: { ...BOARDS[3], tasks: [] },
      };

      tasks.forEach((task) => {
        const isCompleted = Boolean(task?.task_status);
        const p = Number(task?.task_priority);
        if (isCompleted) newBoards.review.tasks.push(task);
        else if (p === 1) newBoards.backlog.tasks.push(task);
        else if (p === 3) newBoards.todo.tasks.push(task);
        else if (p === 2) newBoards.inprogress.tasks.push(task);
        else if (p === 4) newBoards.review.tasks.push(task); // legacy fallback
        else newBoards.backlog.tasks.push(task);
      });
      setBoards(newBoards);
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed to load tasks', text2: err.message });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, token]);

  const fetchClients = useCallback(async () => {
    if (!userId || !token) return;
    try {
      const data = await apiFetch(`${userId}/clients`);
      setClients(data?.clients || []);
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed to load clients' });
    }
  }, [userId, token]);

  useEffect(() => {
    if (userId && token) {
      fetchTasks();
      fetchClients();
    }
  }, [userId, token, fetchTasks, fetchClients]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTasks();
  };

  useEffect(() => {
    if (selectedClient && userId && token) {
      (async () => {
        try {
          const data = await apiFetch(`${userId}/${selectedClient}/projectdropdown`);
          const availableProjects = Array.isArray(data) ? data : data?.projects || [];
          setProjects(availableProjects.filter((project) => project?.status !== true));
        } catch {
          setProjects([]);
        }
      })();
    } else {
      setProjects([]);
    }
  }, [selectedClient, userId, token]);

  const handleMoveTask = (task) => {
    setTaskToMove(task);
    setMoveModalVisible(true);
  };

  const confirmMove = async (targetBoardId) => {
    if (!taskToMove) return;
    setMoveModalVisible(false);
    const targetBoard = BOARDS.find((b) => b.id === targetBoardId);
    if (!targetBoard) return;
    const taskId = taskToMove._id || taskToMove.id;
    const isCompletedTask = Boolean(taskToMove.task_status);
    if (!taskId) {
      Toast.show({ type: 'error', text1: 'Failed to move task', text2: 'Task id is missing' });
      setTaskToMove(null);
      return;
    }
    if (targetBoardId === 'review') {
      try {
        if (!isCompletedTask) {
          await apiFetch(`${userId}/${taskId}/status`, {
            method: 'PATCH',
          });
        }

        setCurrentTask({ ...taskToMove, _id: taskId, task_status: true });
        setTaskPrice(String(taskToMove.task_price ?? 0));
        setPriceModalVisible(true);
        await fetchTasks();
      } catch (err) {
        Toast.show({ type: 'error', text1: 'Failed to move task', text2: err.message });
      }
      setTaskToMove(null);
      return;
    }

    if (isCompletedTask) {
      Toast.show({
        type: 'info',
        text1: 'Task already completed',
        text2: 'Completed tasks stay in Review.',
      });
      setTaskToMove(null);
      return;
    }

    if (Number(taskToMove.task_priority) === targetBoard.priority) {
      setTaskToMove(null);
      return;
    }
    try {
      await apiFetch(`${userId}/${taskId}/priority`, {
        method: 'PATCH',
        body: { task_priority: targetBoard.priority },
      });
      await fetchTasks();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed to move task', text2: err.message });
    }
    setTaskToMove(null);
  };

  const handlePriceSubmit = async () => {
    if (!currentTask) return;
    const taskId = currentTask._id || currentTask.id;
    const parsedPrice = parseFloat(taskPrice);
    if (!taskId) {
      Toast.show({ type: 'error', text1: 'Failed to update price', text2: 'Task id is missing' });
      return;
    }
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      Toast.show({ type: 'error', text1: 'Invalid price', text2: 'Price must be a non-negative number.' });
      return;
    }
    try {
      await apiFetch(`${userId}/${taskId}/price`, {
        method: 'PATCH',
        body: { task_price: parsedPrice },
      });
      await fetchTasks();
      setPriceModalVisible(false);
      setCurrentTask(null);
      setTaskPrice('');
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed to update price', text2: err.message });
    }
  };

  const handleAddTask = async () => {
    if (!taskName || !selectedClient || !selectedProject) {
      Toast.show({ type: 'error', text1: 'Please fill all required fields' });
      return;
    }
    setAddingTask(true);
    try {
      await apiFetch(`${userId}/${selectedClient}/addtask`, {
        method: 'POST',
        body: {
          task_name: taskName,
          task_description: taskDesc,
          task_priority: taskPriority,
          task_type: 1,
          project_id: selectedProject,
        },
      });
      Toast.show({ type: 'success', text1: 'Task added!' });
      setShowTaskModal(false);
      setTaskName('');
      setTaskDesc('');
      setTaskPriority(1);
      setSelectedClient('');
      setSelectedProject('');
      await fetchTasks();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed to add task', text2: err.message });
    } finally {
      setAddingTask(false);
    }
  };

  const bg = darkMode ? '#111827' : '#f9fafb';
  const textColor = darkMode ? '#f9fafb' : '#111827';

  if (loading) {
    return (
      <View style={[styles.screen, { backgroundColor: bg }]}>
        <AppHeader />
        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
      </View>
    );
  }

  const boardArray = Object.values(boards);

  return (
    <View style={[styles.screen, { backgroundColor: bg }]}>
      <AppHeader />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <Text style={[styles.pageTitle, { color: textColor }]}>Kanban Board</Text>
        <TouchableOpacity
          style={styles.addTaskBtn}
          onPress={() => setShowTaskModal(true)}
        >
          <Feather name="plus" size={16} color="#fff" />
          <Text style={styles.addTaskBtnText}>Add Task</Text>
        </TouchableOpacity>
      </View>

      {/* Boards - responsive grid (1 or 2 columns). Outer FlatList handles vertical scrolling.
          Each board uses an inner FlatList for tasks with nestedScrollEnabled so many tasks scroll properly. */}
      <FlatList
        data={boardArray}
        keyExtractor={(b) => b.id}
        numColumns={numColumns}
        columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : null}
        contentContainerStyle={styles.flatListContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item: board }) => {
          const columnStyle =
            numColumns > 1
              ? { flex: 1, marginHorizontal: 8, marginBottom: 12, minHeight: 180 }
              : { width: '100%', marginBottom: 12, minHeight: 180 };

          return (
            <View
              key={board.id}
              style={[
                styles.board,
                columnStyle,
                {
                  backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                  borderColor: darkMode ? '#374151' : '#e5e7eb',
                },
              ]}
            >
              <View style={[styles.boardHeader, { borderBottomColor: darkMode ? '#374151' : '#e5e7eb' }]}>
                <View style={[styles.boardDot, { backgroundColor: board.color }]} />
                <Text style={[styles.boardTitle, { color: textColor }]}>
                  {board.title}
                </Text>
                <View
                  style={[styles.countBadge, { backgroundColor: darkMode ? '#374151' : '#f3f4f6' }]}
                >
                  <Text style={{ color: darkMode ? '#d1d5db' : '#6b7280', fontSize: 12 }}>
                    {board.tasks.length}
                  </Text>
                </View>
              </View>

              <View style={styles.tasksContainer}>
                <FlatList
                  data={board.tasks}
                  keyExtractor={(t, index) => String(t._id || t.id || `${board.id}-${index}`)}
                  renderItem={({ item: task }) => (
                    <TaskCard
                      task={task}
                      darkMode={darkMode}
                      onMove={handleMoveTask}
                    />
                  )}
                  nestedScrollEnabled={false}
                  scrollEnabled={false}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 12 }}
                  ListEmptyComponent={
                    <View
                      style={[
                        styles.emptyBoard,
                        { borderColor: darkMode ? '#4b5563' : '#d1d5db' },
                      ]}
                    >
                      <Text style={{ color: darkMode ? '#9ca3af' : '#6b7280', fontSize: 12 }}>
                        No tasks in {board.title.toLowerCase()}
                      </Text>
                    </View>
                  }
                />
              </View>
            </View>
          );
        }}
      />

      {/* Move Task Modal */}
      <Modal visible={moveModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: darkMode ? '#1f2937' : '#fff' },
            ]}
          >
            <Text style={[styles.modalTitle, { color: textColor }]}>
              Move task to...
            </Text>
            {BOARDS.map((b) => (
              <TouchableOpacity
                key={b.id}
                style={[
                  styles.moveOption,
                  { backgroundColor: darkMode ? '#374151' : '#f3f4f6' },
                ]}
                onPress={() => confirmMove(b.id)}
              >
                <View style={[styles.boardDot, { backgroundColor: b.color }]} />
                <Text style={[styles.moveOptionText, { color: textColor }]}>
                  {b.title}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              onPress={() => setMoveModalVisible(false)}
              style={styles.cancelBtn}
            >
              <Text style={{ color: '#6b7280' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Price Modal */}
      <Modal visible={priceModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: darkMode ? '#1f2937' : '#fff' },
            ]}
          >
            <Text style={[styles.modalTitle, { color: textColor }]}>
              Set Task Price
            </Text>
            {currentTask && (
              <Text
                style={{ color: darkMode ? '#9ca3af' : '#6b7280', marginBottom: 12 }}
              >
                Task: {currentTask.task_name}
              </Text>
            )}
            <TextInput
              style={[
                styles.priceInput,
                {
                  backgroundColor: darkMode ? '#374151' : '#f9fafb',
                  borderColor: darkMode ? '#4b5563' : '#d1d5db',
                  color: textColor,
                },
              ]}
              value={taskPrice}
              onChangeText={setTaskPrice}
              keyboardType="numeric"
              placeholder="Enter price"
              placeholderTextColor={darkMode ? '#6b7280' : '#9ca3af'}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity
                onPress={() => {
                  setPriceModalVisible(false);
                  setCurrentTask(null);
                  setTaskPrice('');
                }}
                style={[
                  styles.modalCancelBtn,
                  { backgroundColor: darkMode ? '#374151' : '#f3f4f6' },
                ]}
              >
                <Text style={{ color: darkMode ? '#d1d5db' : '#374151' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handlePriceSubmit}
                style={styles.modalSubmitBtn}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Task Modal */}
      <Modal visible={showTaskModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView>
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor: darkMode ? '#1f2937' : '#fff',
                  marginTop: 40,
                },
              ]}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: textColor }]}>
                  Add Task
                </Text>
                <TouchableOpacity onPress={() => setShowTaskModal(false)}>
                  <Feather
                    name="x"
                    size={22}
                    color={darkMode ? '#9ca3af' : '#6b7280'}
                  />
                </TouchableOpacity>
              </View>

              <Text style={[styles.fieldLabel, { color: darkMode ? '#d1d5db' : '#374151' }]}>
                Client
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.pickerRow}
              >
                {clients.map((c) => (
                  <TouchableOpacity
                    key={c._id}
                    style={[
                      styles.pickerChip,
                      {
                        backgroundColor:
                          selectedClient === c._id
                            ? '#3b82f6'
                            : darkMode
                            ? '#374151'
                            : '#f3f4f6',
                      },
                    ]}
                    onPress={() => {
                      setSelectedClient(c._id);
                      setSelectedProject('');
                    }}
                  >
                    <Text
                      style={{
                        color:
                          selectedClient === c._id
                            ? '#fff'
                            : darkMode
                            ? '#d1d5db'
                            : '#374151',
                        fontSize: 13,
                      }}
                    >
                      {c.client_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={[styles.fieldLabel, { color: darkMode ? '#d1d5db' : '#374151' }]}>
                Project
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.pickerRow}
              >
                {projects.map((p) => (
                  <TouchableOpacity
                    key={p.id || p._id}
                    style={[
                      styles.pickerChip,
                      {
                        backgroundColor:
                          selectedProject === (p.id || p._id)
                            ? '#3b82f6'
                            : darkMode
                            ? '#374151'
                            : '#f3f4f6',
                      },
                    ]}
                    onPress={() => setSelectedProject(p.id || p._id)}
                  >
                    <Text
                      style={{
                        color:
                          selectedProject === (p.id || p._id)
                            ? '#fff'
                            : darkMode
                            ? '#d1d5db'
                            : '#374151',
                        fontSize: 13,
                      }}
                    >
                      {p.projectName || p.project_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={[styles.fieldLabel, { color: darkMode ? '#d1d5db' : '#374151' }]}>
                Task Name *
              </Text>
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    backgroundColor: darkMode ? '#374151' : '#f9fafb',
                    borderColor: darkMode ? '#4b5563' : '#d1d5db',
                    color: textColor,
                  },
                ]}
                value={taskName}
                onChangeText={setTaskName}
                placeholder="Task name"
                placeholderTextColor={darkMode ? '#6b7280' : '#9ca3af'}
              />

              <Text style={[styles.fieldLabel, { color: darkMode ? '#d1d5db' : '#374151' }]}>
                Description
              </Text>
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    backgroundColor: darkMode ? '#374151' : '#f9fafb',
                    borderColor: darkMode ? '#4b5563' : '#d1d5db',
                    color: textColor,
                    height: 80,
                  },
                ]}
                value={taskDesc}
                onChangeText={setTaskDesc}
                placeholder="Task description"
                placeholderTextColor={darkMode ? '#6b7280' : '#9ca3af'}
                multiline
              />

              <Text style={[styles.fieldLabel, { color: darkMode ? '#d1d5db' : '#374151' }]}>
                Priority
              </Text>
              <View style={styles.priorityRow}>
                {[
                  { label: 'Backlog', val: 1 },
                  { label: 'To Do', val: 3 },
                  { label: 'In Progress', val: 2 },
                ].map((p) => (
                  <TouchableOpacity
                    key={p.val}
                    style={[
                      styles.priorityChip,
                      {
                        backgroundColor:
                          taskPriority === p.val
                            ? '#4f46e5'
                            : darkMode
                            ? '#374151'
                            : '#f3f4f6',
                      },
                    ]}
                    onPress={() => setTaskPriority(p.val)}
                  >
                    <Text
                      style={{
                        color:
                          taskPriority === p.val
                            ? '#fff'
                            : darkMode
                            ? '#d1d5db'
                            : '#374151',
                        fontSize: 13,
                      }}
                    >
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalBtns}>
                <TouchableOpacity
                  onPress={() => setShowTaskModal(false)}
                  style={[
                    styles.modalCancelBtn,
                    { backgroundColor: darkMode ? '#374151' : '#f3f4f6' },
                  ]}
                >
                  <Text style={{ color: darkMode ? '#d1d5db' : '#374151' }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleAddTask}
                  style={styles.modalSubmitBtn}
                  disabled={addingTask}
                >
                  {addingTask ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={{ color: '#fff', fontWeight: '600' }}>Add Task</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pageTitle: { fontSize: 20, fontWeight: 'bold' },
  addTaskBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#4f46e5',
    borderRadius: 10,
  },
  addTaskBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  flatListContainer: {
    paddingHorizontal: 12,
    paddingBottom: 20,
    paddingTop: 6,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  board: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    minHeight: 180,
  },
  boardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 8,
    borderBottomWidth: 1,
  },
  boardDot: { width: 12, height: 12, borderRadius: 6 },
  boardTitle: { flex: 1, fontWeight: '600', fontSize: 15 },
  countBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  tasksContainer: { padding: 10 },
  emptyBoard: {
    height: 80,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
  taskCard: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  taskName: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  taskDesc: { fontSize: 12, marginBottom: 8 },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 3,
  },
  taskMetaText: { fontSize: 12 },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  priorityText: { fontSize: 11, fontWeight: '600' },
  dueDateText: { fontSize: 11 },
  moveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  moveBtnText: { fontSize: 12, fontWeight: '500' },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  moveOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
  },
  moveOptionText: { fontSize: 15 },
  cancelBtn: { alignItems: 'center', paddingTop: 8 },
  priceInput: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 16,
  },
  modalInput: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 12,
  },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 8 },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalSubmitBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#3b82f6',
  },
  fieldLabel: { fontSize: 13, fontWeight: '500', marginBottom: 6 },
  pickerRow: { marginBottom: 12 },
  pickerChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  priorityRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  priorityChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
});
// ...existing code...