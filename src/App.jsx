import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Edit2, X, Menu, Sun, Moon, LogOut, User } from 'lucide-react';
import axios from 'axios';

const API_BASE = 'http://localhost:8080/api';

// Configure axios defaults
axios.defaults.baseURL = API_BASE;
axios.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

const App = () => {
    const [user, setUser] = useState(null);
    const [isLogin, setIsLogin] = useState(true);
    const [authForm, setAuthForm] = useState({ username: '', password: '', email: '' });

    const [boards, setBoards] = useState([]);
    const [currentBoard, setCurrentBoard] = useState(null);
    const [columns, setColumns] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [darkMode, setDarkMode] = useState(false);
    const [showBoardModal, setShowBoardModal] = useState(false);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [draggedTask, setDraggedTask] = useState(null);
    const [filterTag, setFilterTag] = useState('all');
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const [newBoard, setNewBoard] = useState({ name: '', description: '' });
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        columnId: '',
        dueDate: '',
        priority: 'MEDIUM',
        tags: []
    });

    const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
    const tagsList = ['feature', 'bug', 'improvement', 'urgent', 'documentation'];
    const tagColors = {
        feature: 'bg-blue-500',
        bug: 'bg-red-500',
        improvement: 'bg-green-500',
        urgent: 'bg-orange-500',
        documentation: 'bg-purple-500'
    };

    // Check authentication on mount
    useEffect(() => {
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        if (token && savedUser) {
            setUser(JSON.parse(savedUser));
            loadBoards();
        }
    }, []);

    // Authentication
    const handleAuth = async (e) => {
        e.preventDefault();
        try {
            const endpoint = isLogin ? '/auth/login' : '/auth/register';
            const response = await axios.post(endpoint, authForm);

            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            setUser(response.data.user);
            loadBoards();
        } catch (error) {
            alert(error.response?.data?.message || 'Authentication failed');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setBoards([]);
        setCurrentBoard(null);
        setColumns([]);
        setTasks([]);
    };

    // Load data
    const loadBoards = async () => {
        try {
            const response = await axios.get('/boards');
            setBoards(response.data);
            if (response.data.length > 0) {
                loadBoard(response.data[0].id);
            }
        } catch (error) {
            console.error('Error loading boards:', error);
        }
    };

    const loadBoard = async (boardId) => {
        try {
            const [boardRes, columnsRes, tasksRes] = await Promise.all([
                axios.get(`/boards/${boardId}`),
                axios.get(`/boards/${boardId}/columns`),
                axios.get(`/boards/${boardId}/tasks`)
            ]);

            setCurrentBoard(boardRes.data);
            setColumns(columnsRes.data);
            setTasks(tasksRes.data);
        } catch (error) {
            console.error('Error loading board:', error);
        }
    };

    // CRUD Operations
    const createBoard = async () => {
        try {
            console.log('Creating board with data:', newBoard);
            console.log('Current token:', localStorage.getItem('token'));

            const response = await axios.post('/boards', newBoard);

            console.log('Board created successfully:', response.data);
            setBoards([...boards, response.data]);
            setCurrentBoard(response.data);
            setNewBoard({ name: '', description: '' });
            setShowBoardModal(false);
            loadBoard(response.data.id);
        } catch (error) {
            console.error('Full error object:', error);
            console.error('Error response:', error.response);
            console.error('Error status:', error.response?.status);
            console.error('Error data:', error.response?.data);

            const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
            alert(`Error creating board: ${errorMessage}\nStatus: ${error.response?.status || 'N/A'}`);
        }
    };

    const createTask = async () => {
        try {
            const response = await axios.post('/tasks', {
                ...newTask,
                boardId: currentBoard.id
            });
            setTasks([...tasks, response.data]);
            setNewTask({ title: '', description: '', columnId: '', dueDate: '', priority: 'MEDIUM', tags: [] });
            setShowTaskModal(false);
        } catch (error) {
            alert('Error creating task');
        }
    };

    const updateTask = async () => {
        try {
            const response = await axios.put(`/tasks/${editingTask.id}`, editingTask);
            setTasks(tasks.map(t => t.id === editingTask.id ? response.data : t));
            setEditingTask(null);
            setShowTaskModal(false);
        } catch (error) {
            alert('Error updating task');
        }
    };

    const deleteTask = async (taskId) => {
        try {
            await axios.delete(`/tasks/${taskId}`);
            setTasks(tasks.filter(t => t.id !== taskId));
        } catch (error) {
            alert('Error deleting task');
        }
    };

    const deleteBoard = async (boardId) => {
        try {
            await axios.delete(`/boards/${boardId}`);
            setBoards(boards.filter(b => b.id !== boardId));
            if (currentBoard?.id === boardId && boards.length > 1) {
                loadBoard(boards[0].id);
            }
        } catch (error) {
            alert('Error deleting board');
        }
    };

    // Drag and Drop
    const handleDragStart = (task) => {
        setDraggedTask(task);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = async (columnId) => {
        if (draggedTask && draggedTask.columnId !== columnId) {
            try {
                const updatedTask = { ...draggedTask, columnId };
                await axios.put(`/tasks/${draggedTask.id}`, updatedTask);
                setTasks(tasks.map(t => t.id === draggedTask.id ? { ...t, columnId } : t));
                setDraggedTask(null);
            } catch (error) {
                alert('Error moving task');
            }
        }
    };

    // Filter tasks
    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTag = filterTag === 'all' || task.tags?.includes(filterTag);
        return matchesSearch && matchesTag;
    });

    // Login Screen
    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
                    <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        TaskFlow
                    </h1>
                    <p className="text-center text-gray-600 mb-8">
                        {isLogin ? 'Welcome back!' : 'Create your account'}
                    </p>

                    <form onSubmit={handleAuth} className="space-y-4">
                        {!isLogin && (
                            <input
                                type="email"
                                placeholder="Email"
                                value={authForm.email}
                                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        )}
                        <input
                            type="text"
                            placeholder="Username"
                            value={authForm.username}
                            onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={authForm.password}
                            onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                        <button
                            type="submit"
                            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:opacity-90 transition"
                        >
                            {isLogin ? 'Sign In' : 'Sign Up'}
                        </button>
                    </form>

                    <p className="text-center mt-6 text-gray-600">
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-blue-600 font-semibold hover:underline"
                        >
                            {isLogin ? 'Sign Up' : 'Sign In'}
                        </button>
                    </p>
                </div>
            </div>
        );
    }

    // Main Dashboard
    return (
        <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
            {/* Header */}
            <header className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm border-b`}>
                <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden">
                            <Menu className="w-6 h-6" />
                        </button>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            TaskFlow
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative hidden md:block">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search tasks..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={`pl-10 pr-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            />
                        </div>

                        <select
                            value={filterTag}
                            onChange={(e) => setFilterTag(e.target.value)}
                            className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'}`}
                        >
                            <option value="all">All Tags</option>
                            {tagsList.map(tag => (
                                <option key={tag} value={tag}>{tag}</option>
                            ))}
                        </select>

                        <button
                            onClick={() => setDarkMode(!darkMode)}
                            className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
                        >
                            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>

                        <div className="flex items-center gap-2">
                            <User className="w-5 h-5" />
                            <span className="font-medium">{user.username}</span>
                        </div>

                        <button
                            onClick={handleLogout}
                            className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} hover:text-red-500`}
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex">
                {/* Sidebar */}
                <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r transition-all duration-300 overflow-hidden`}>
                    <div className="p-4">
                        <button
                            onClick={() => setShowBoardModal(true)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            <Plus className="w-4 h-4" />
                            New Board
                        </button>

                        <div className="mt-6 space-y-2">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase px-2">Your Boards</h3>
                            {boards.map(board => (
                                <div key={board.id} className="group flex items-center justify-between">
                                    <button
                                        onClick={() => loadBoard(board.id)}
                                        className={`flex-1 text-left px-3 py-2 rounded-lg transition ${
                                            currentBoard?.id === board.id
                                                ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
                                                : darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                                        }`}
                                    >
                                        {board.name}
                                    </button>
                                    <button
                                        onClick={() => deleteBoard(board.id)}
                                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-6 overflow-x-auto">
                    {currentBoard ? (
                        <>
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold">{currentBoard.name}</h2>
                                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {currentBoard.description}
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setEditingTask(null);
                                        setNewTask({ ...newTask, columnId: columns[0]?.id || '' });
                                        setShowTaskModal(true);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Task
                                </button>
                            </div>

                            {/* Kanban Board */}
                            <div className="flex gap-6 pb-6">
                                {columns.map(column => (
                                    <div
                                        key={column.id}
                                        onDragOver={handleDragOver}
                                        onDrop={() => handleDrop(column.id)}
                                        className={`flex-shrink-0 w-80 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg p-4`}
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-semibold text-lg">{column.name}</h3>
                                            <span className={`px-2 py-1 text-xs rounded-full ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                        {filteredTasks.filter(t => t.columnId === column.id).length}
                      </span>
                                        </div>

                                        <div className="space-y-3 min-h-[200px]">
                                            {filteredTasks
                                                .filter(task => task.columnId === column.id)
                                                .map(task => (
                                                    <div
                                                        key={task.id}
                                                        draggable
                                                        onDragStart={() => handleDragStart(task)}
                                                        className={`${darkMode ? 'bg-gray-700' : 'bg-white'} p-4 rounded-lg shadow-sm cursor-move hover:shadow-md transition group`}
                                                    >
                                                        <div className="flex items-start justify-between mb-2">
                                                            <h4 className="font-medium flex-1">{task.title}</h4>
                                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingTask(task);
                                                                        setShowTaskModal(true);
                                                                    }}
                                                                    className="p-1 hover:text-blue-500"
                                                                >
                                                                    <Edit2 className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => deleteTask(task.id)}
                                                                    className="p-1 hover:text-red-500"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <p className={`text-sm mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                            {task.description}
                                                        </p>
                                                        <div className="flex items-center justify-between flex-wrap gap-2">
                                                            <div className="flex gap-1">
                                                                {task.tags?.map(tag => (
                                                                    <span key={tag} className={`px-2 py-1 text-xs rounded-full text-white ${tagColors[tag] || 'bg-gray-500'}`}>
                                    {tag}
                                  </span>
                                                                ))}
                                                            </div>
                                                            <span className={`text-xs px-2 py-1 rounded ${
                                                                task.priority === 'URGENT' ? 'bg-red-100 text-red-800' :
                                                                    task.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                                                                        task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                                                                            'bg-green-100 text-green-800'
                                                            }`}>
                                {task.priority}
                              </span>
                                                        </div>
                                                        {task.dueDate && (
                                                            <div className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                                Due: {new Date(task.dueDate).toLocaleDateString()}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-96">
                            <div className="text-center">
                                <h3 className="text-xl font-semibold mb-2">No board selected</h3>
                                <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                                    Create a new board to get started
                                </p>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Board Modal */}
            {showBoardModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 w-full max-w-md`}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold">Create New Board</h3>
                            <button onClick={() => setShowBoardModal(false)}>
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <input
                            type="text"
                            placeholder="Board name"
                            value={newBoard.name}
                            onChange={(e) => setNewBoard({ ...newBoard, name: e.target.value })}
                            className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'} mb-3`}
                        />
                        <textarea
                            placeholder="Description"
                            value={newBoard.description}
                            onChange={(e) => setNewBoard({ ...newBoard, description: e.target.value })}
                            className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'} mb-4`}
                            rows="3"
                        />
                        <button
                            onClick={createBoard}
                            disabled={!newBoard.name}
                            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            Create Board
                        </button>
                    </div>
                </div>
            )}

            {/* Task Modal */}
            {showTaskModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto`}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold">
                                {editingTask ? 'Edit Task' : 'Create Task'}
                            </h3>
                            <button onClick={() => {
                                setShowTaskModal(false);
                                setEditingTask(null);
                            }}>
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <input
                            type="text"
                            placeholder="Task title"
                            value={editingTask ? editingTask.title : newTask.title}
                            onChange={(e) => editingTask
                                ? setEditingTask({ ...editingTask, title: e.target.value })
                                : setNewTask({ ...newTask, title: e.target.value })
                            }
                            className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'} mb-3`}
                        />
                        <textarea
                            placeholder="Description"
                            value={editingTask ? editingTask.description : newTask.description}
                            onChange={(e) => editingTask
                                ? setEditingTask({ ...editingTask, description: e.target.value })
                                : setNewTask({ ...newTask, description: e.target.value })
                            }
                            className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'} mb-3`}
                            rows="3"
                        />
                        <select
                            value={editingTask ? editingTask.columnId : newTask.columnId}
                            onChange={(e) => editingTask
                                ? setEditingTask({ ...editingTask, columnId: parseInt(e.target.value) })
                                : setNewTask({ ...newTask, columnId: parseInt(e.target.value) })
                            }
                            className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'} mb-3`}
                        >
                            <option value="">Select column</option>
                            {columns.map(col => (
                                <option key={col.id} value={col.id}>{col.name}</option>
                            ))}
                        </select>
                        <select
                            value={editingTask ? editingTask.priority : newTask.priority}
                            onChange={(e) => editingTask
                                ? setEditingTask({ ...editingTask, priority: e.target.value })
                                : setNewTask({ ...newTask, priority: e.target.value })
                            }
                            className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'} mb-3`}
                        >
                            {priorities.map(priority => (
                                <option key={priority} value={priority}>{priority}</option>
                            ))}
                        </select>
                        <input
                            type="date"
                            value={editingTask ? editingTask.dueDate : newTask.dueDate}
                            onChange={(e) => editingTask
                                ? setEditingTask({ ...editingTask, dueDate: e.target.value })
                                : setNewTask({ ...newTask, dueDate: e.target.value })
                            }
                            className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'} mb-4`}
                        />
                        <button
                            onClick={editingTask ? updateTask : createTask}
                            disabled={editingTask ? !editingTask.title : !newTask.title}
                            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {editingTask ? 'Update Task' : 'Create Task'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;