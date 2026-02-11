// Practical Grades PWA with Enhanced Session Management and Task Editing
class PracticalGradesPWA {
    constructor() {
        // Default application data with empty students list - CHANGED: Only "Class 1" default session
        this.defaultData = {
            students: [], // Start with empty student list
            tasks: [
                {id:"task_1", name:"Task 1", desc:"Click to edit task description"},
                {id:"task_2", name:"Task 2", desc:"Click to edit task description"},
                {id:"task_3", name:"Task 3", desc:"Click to edit task description"},
                {id:"task_4", name:"Task 4", desc:"Click to edit task description"},
                {id:"task_5", name:"Task 5", desc:"Click to edit task description"},
                {id:"task_6", name:"Task 6", desc:"Click to edit task description"}
            ],
            defaultSessions: [
                {name:"Class 1", desc:"First class session"}
            ],
            ratingScale: [
                {value:0, label:"Did Not Attempt", color:"#ff4444"},
                {value:1, label:"Minimal Effort", color:"#ff8800"},
                {value:2, label:"Satisfactory", color:"#ffcc00"},
                {value:3, label:"Well Done", color:"#44aa44"}
            ],
            school: "" // Empty school name by default
        };

        // Session management
        this.currentSession = null;
        this.availableSessions = [];
        this.sessionMetadata = {};

        // Application state
        this.editMode = false;
        this.currentStudent = '';
        this.currentScores = {};
        this.students = [];
        this.tasks = [...this.defaultData.tasks];
        this.assessments = [];
        this.editingStudentIndex = -1;
        this.editingTaskIndex = -1;
        this.editingSessionName = '';

        // Task editing state - NEW FOR SESSION-SPECIFIC TASKS
        this.selectedTaskIndex = -1;
        this.taskToDelete = null;

        // PWA state
        this.deferredPrompt = null;
        this.isInstalled = false;
        this.isOnline = navigator.onLine;

        // UI state
        this.currentView = 'sessionManager'; // 'sessionManager' or 'mainApp'

        // Session deletion state
        this.sessionToDelete = null;

        // Initialize the application
        this.init();
    }

    init() {
        console.log('🚀 Initializing Practical Grades PWA...');
        this.setupEventListeners();
        this.setupPWAFeatures();
        this.updateCurrentDate();
        this.loadSessions();
        this.renderSessionGrid();
        this.loadGlobalSchoolName();
        console.log('✅ Initialization complete');
    }

    // CRITICAL SESSION MANAGEMENT FIXES

    /**
     * Load available sessions with enhanced error handling and debugging
     */
    loadSessions() {
        console.log('📚 Loading sessions...');
        try {
            const savedSessions = localStorage.getItem('practicalGrades_sessions');
            console.log('Raw sessions data from localStorage:', savedSessions);
            
            this.availableSessions = savedSessions ? JSON.parse(savedSessions) : [];
            console.log('Parsed available sessions:', this.availableSessions);
            
            // Load session metadata
            const savedMetadata = localStorage.getItem('practicalGrades_sessionMetadata');
            console.log('Raw metadata from localStorage:', savedMetadata);
            
            this.sessionMetadata = savedMetadata ? JSON.parse(savedMetadata) : {};
            console.log('Parsed session metadata:', this.sessionMetadata);
            
            console.log('✅ Sessions loaded successfully');
        } catch (error) {
            console.error('❌ Error loading sessions:', error);
            this.availableSessions = [];
            this.sessionMetadata = {};
            this.showToast('Error loading sessions data', 'error');
        }
    }

    /**
     * Save sessions with enhanced error handling and validation
     */
    saveSessionList() {
        console.log('💾 Saving session list...');
        console.log('Available sessions to save:', this.availableSessions);
        console.log('Session metadata to save:', this.sessionMetadata);
        
        try {
            // Validate data before saving
            if (!Array.isArray(this.availableSessions)) {
                console.error('❌ Available sessions is not an array:', this.availableSessions);
                this.availableSessions = [];
            }
            
            if (typeof this.sessionMetadata !== 'object' || this.sessionMetadata === null) {
                console.error('❌ Session metadata is not an object:', this.sessionMetadata);
                this.sessionMetadata = {};
            }
            
            // Save to localStorage
            localStorage.setItem('practicalGrades_sessions', JSON.stringify(this.availableSessions));
            localStorage.setItem('practicalGrades_sessionMetadata', JSON.stringify(this.sessionMetadata));
            
            console.log('✅ Session list saved successfully');
            
            // Verify the save worked
            const verifySession = localStorage.getItem('practicalGrades_sessions');
            const verifyMetadata = localStorage.getItem('practicalGrades_sessionMetadata');
            console.log('Verification - saved sessions:', verifySession);
            console.log('Verification - saved metadata:', verifyMetadata);
            
        } catch (error) {
            console.error('❌ Error saving sessions:', error);
            this.showToast('Error saving session data - storage may be full', 'error');
        }
    }

    /**
     * Create a new session with enhanced debugging and UI updating
     */
    createSession(sessionName) {
        console.log('🆕 Creating new session:', sessionName);
        
        if (!sessionName || typeof sessionName !== 'string') {
            console.error('❌ Invalid session name:', sessionName);
            this.showToast('Invalid session name provided', 'error');
            return false;
        }
        
        const trimmedName = sessionName.trim();
        if (!trimmedName) {
            console.error('❌ Empty session name after trimming');
            this.showToast('Session name cannot be empty', 'error');
            return false;
        }
        
        try {
            // Check for duplicates
            const allSessions = [
                ...this.defaultData.defaultSessions.map(s => s.name),
                ...this.availableSessions
            ];
            
            if (allSessions.includes(trimmedName)) {
                console.error('❌ Session already exists:', trimmedName);
                this.showToast('Session name already exists', 'error');
                return false;
            }
            
            // Add to available sessions
            console.log('📝 Adding session to availableSessions array...');
            this.availableSessions.push(trimmedName);
            console.log('Updated availableSessions:', this.availableSessions);
            
            // Initialize session metadata
            if (!this.sessionMetadata[trimmedName]) {
                this.sessionMetadata[trimmedName] = {
                    created: new Date().toISOString(),
                    lastUsed: new Date().toISOString()
                };
            }
            console.log('Session metadata initialized:', this.sessionMetadata[trimmedName]);
            
            // Save to localStorage immediately
            this.saveSessionList();
            
            // Force UI refresh
            console.log('🔄 Forcing UI refresh...');
            this.renderSessionGrid();
            
            console.log('✅ Session created successfully:', trimmedName);
            this.showToast(`Session "${trimmedName}" created successfully`, 'success');
            return true;
            
        } catch (error) {
            console.error('❌ Error creating session:', error);
            this.showToast('Error creating session', 'error');
            return false;
        }
    }

    /**
     * Delete a session with enhanced debugging and proper cleanup - FIXED VERSION
     */
    deleteSession(sessionName) {
        console.log('🗑️ Deleting session:', sessionName);
        
        if (!sessionName) {
            console.error('❌ No session name provided for deletion');
            return false;
        }
        
        try {
            const sessionKey = sessionName.toLowerCase().replace(/[^a-z0-9]/g, '');
            console.log('Generated session key for deletion:', sessionKey);
            
            // Remove ALL session-related localStorage keys
            const dataTypes = ['students', 'tasks', 'assessments', 'instructor'];
            console.log('🧹 Cleaning up localStorage data...');
            
            dataTypes.forEach(type => {
                const storageKey = `practicalGrades_${sessionKey}_${type}`;
                console.log(`Removing localStorage key: ${storageKey}`);
                localStorage.removeItem(storageKey);
                
                // Verify removal
                const check = localStorage.getItem(storageKey);
                if (check) {
                    console.warn(`⚠️ Failed to remove localStorage key: ${storageKey}`);
                } else {
                    console.log(`✅ Successfully removed: ${storageKey}`);
                }
            });
            
            // Check if it's a default session or custom session
            const isDefaultSession = this.defaultData.defaultSessions.some(ds => ds.name === sessionName);
            
            if (isDefaultSession) {
                // For default sessions, remove from defaultSessions array to prevent re-showing
                console.log('📋 Removing default session from defaultSessions array...');
                this.defaultData.defaultSessions = this.defaultData.defaultSessions.filter(s => s.name !== sessionName);
                console.log('Updated defaultSessions:', this.defaultData.defaultSessions);
            } else {
                // For custom sessions, remove from availableSessions array
                console.log('📋 Removing from availableSessions array...');
                console.log('Before removal:', this.availableSessions);
                this.availableSessions = this.availableSessions.filter(s => s !== sessionName);
                console.log('After removal:', this.availableSessions);
            }
            
            // Remove from metadata
            if (this.sessionMetadata[sessionName]) {
                console.log('🏷️ Removing session metadata...');
                delete this.sessionMetadata[sessionName];
                console.log('Metadata after removal:', this.sessionMetadata);
            }
            
            // Save updated session list immediately
            this.saveSessionList();
            
            // Handle current session deletion
            if (this.currentSession === sessionName) {
                console.log('🔄 Deleted session was current session, returning to session manager...');
                this.currentSession = null;
                this.returnToSessionManager();
            } else {
                // Force UI refresh
                console.log('🔄 Forcing UI refresh after deletion...');
                this.renderSessionGrid();
            }
            
            console.log('✅ Session deleted successfully:', sessionName);
            this.showToast(`Session "${sessionName}" deleted successfully`, 'success');
            return true;
            
        } catch (error) {
            console.error('❌ Error deleting session:', error);
            this.showToast('Error deleting session', 'error');
            return false;
        }
    }

    /**
     * Render session grid with enhanced error handling and debugging - FIXED VERSION
     */
    renderSessionGrid() {
        console.log('🎨 Rendering session grid...');
        
        const sessionGrid = document.getElementById('sessionGrid');
        if (!sessionGrid) {
            console.error('❌ Session grid element not found');
            return;
        }
        
        try {
            // Clear existing content
            sessionGrid.innerHTML = '';
            console.log('🧹 Cleared existing session grid content');
            
            // Get all sessions (default + custom) - FIXED: Properly handle deleted defaults
            const allSessions = [
                ...this.defaultData.defaultSessions.map(s => s.name),
                ...this.availableSessions.filter(s => !this.defaultData.defaultSessions.some(ds => ds.name === s))
            ];
            
            console.log('All sessions to render:', allSessions);
            
            // Create session tiles
            allSessions.forEach((sessionName, index) => {
                console.log(`Creating tile for session ${index + 1}:`, sessionName);
                const sessionTile = this.createSessionTile(sessionName);
                sessionGrid.appendChild(sessionTile);
            });
            
            // Show session manager view
            const sessionManager = document.getElementById('sessionManager');
            const mainApp = document.getElementById('mainApplication');
            if (sessionManager && mainApp) {
                sessionManager.classList.remove('hidden');
                mainApp.classList.add('hidden');
                this.currentView = 'sessionManager';
                console.log('✅ Session manager view activated');
            }
            
            console.log('✅ Session grid rendered successfully');
            
        } catch (error) {
            console.error('❌ Error rendering session grid:', error);
            this.showToast('Error rendering sessions', 'error');
        }
    }

    // Session Management UI Methods
    addNewSession() {
        console.log('➕ Opening add new session modal...');
        this.editingSessionName = '';
        const modal = document.getElementById('sessionNameModal');
        const title = document.getElementById('sessionNameModalTitle');
        const input = document.getElementById('sessionNameInput');
        
        if (title) title.textContent = 'Add New Session';
        if (input) input.value = '';
        if (modal) modal.classList.remove('hidden');
        
        setTimeout(() => {
            if (input) {
                input.focus();
                console.log('✅ Modal opened and input focused');
            }
        }, 100);
    }

    saveSessionName() {
        console.log('💾 Saving session name...');
        
        const input = document.getElementById('sessionNameInput');
        if (!input) {
            console.error('❌ Session name input not found');
            return;
        }
        
        const newName = input.value.trim();
        console.log('Session name from input:', newName);
        
        if (!newName) {
            console.error('❌ Empty session name');
            this.showToast('Please enter a session name', 'error');
            return;
        }
        
        try {
            // Check for duplicate names
            const allSessions = [
                ...this.defaultData.defaultSessions.map(s => s.name),
                ...this.availableSessions
            ];
            
            if (this.editingSessionName !== newName && allSessions.includes(newName)) {
                console.error('❌ Duplicate session name:', newName);
                this.showToast('Session name already exists', 'error');
                return;
            }
            
            if (this.editingSessionName) {
                // Rename existing session
                console.log('✏️ Renaming session from', this.editingSessionName, 'to', newName);
                this.renameSessionData(this.editingSessionName, newName);
                
                // Update current session name if we're in that session
                if (this.currentSession === this.editingSessionName) {
                    this.currentSession = newName;
                    const sessionNameEl = document.getElementById('currentSessionName');
                    if (sessionNameEl) {
                        sessionNameEl.textContent = newName;
                        this.setupSessionNameEditing();
                    }
                }
            } else {
                // Create new session
                console.log('🆕 Creating new session:', newName);
                const success = this.createSession(newName);
                if (!success) {
                    console.error('❌ Failed to create session');
                    return;
                }
            }
            
            this.hideSessionNameModal();
            
            // Force UI refresh regardless of view
            if (this.currentView === 'sessionManager') {
                console.log('🔄 Refreshing session manager view...');
                this.renderSessionGrid();
            }
            
            console.log('✅ Session name saved successfully');
            
        } catch (error) {
            console.error('❌ Error saving session name:', error);
            this.showToast('Error saving session', 'error');
        }
    }

    deleteSessionWithConfirm(sessionName) {
        console.log('🔍 Preparing to delete session with confirmation:', sessionName);
        
        const sessionData = this.getSessionData(sessionName);
        const hasData = sessionData.evaluationCount > 0;
        
        let confirmText = `Are you sure you want to delete "${sessionName}"?`;
        if (hasData) {
            confirmText += `\n\nThis session contains ${sessionData.evaluationCount} evaluation${sessionData.evaluationCount !== 1 ? 's' : ''}. All data will be permanently lost.`;
        } else {
            confirmText += '\n\nThis session is empty.';
        }
        confirmText += '\n\nThis action cannot be undone.';
        
        const modal = document.getElementById('deleteConfirmModal');
        const textEl = document.getElementById('deleteConfirmText');
        if (textEl) textEl.textContent = confirmText;
        if (modal) modal.classList.remove('hidden');
        
        // Store session name for deletion
        this.sessionToDelete = sessionName;
        console.log('📋 Session marked for deletion:', sessionName);
    }

    confirmDeleteSession() {
        console.log('✅ Confirming session deletion...');
        
        if (!this.sessionToDelete) {
            console.error('❌ No session marked for deletion');
            return;
        }
        
        const sessionName = this.sessionToDelete;
        const success = this.deleteSession(sessionName);
        
        if (success) {
            this.hideDeleteConfirmModal();
        }
        
        this.sessionToDelete = null;
    }

    bulkDeleteEmptySessions() {
        const allSessions = [
            ...this.defaultData.defaultSessions.map(s => s.name),
            ...this.availableSessions.filter(s => !this.defaultData.defaultSessions.some(ds => ds.name === s))
        ];
        
        const emptySessions = allSessions.filter(sessionName => {
            const sessionData = this.getSessionData(sessionName);
            return sessionData.evaluationCount === 0;
        });
        
        if (emptySessions.length === 0) {
            this.showToast('No empty sessions found', 'info');
            return;
        }
        
        const confirmText = `Delete ${emptySessions.length} empty session${emptySessions.length !== 1 ? 's' : ''}?\n\nSessions to delete:\n${emptySessions.join(', ')}\n\nThis action cannot be undone.`;
        
        if (confirm(confirmText)) {
            try {
                emptySessions.forEach(sessionName => {
                    this.deleteSession(sessionName);
                });
                
                this.showToast(`${emptySessions.length} empty session${emptySessions.length !== 1 ? 's' : ''} deleted`, 'success');
                
            } catch (error) {
                console.error('Error bulk deleting sessions:', error);
                this.showToast('Error deleting sessions', 'error');
            }
        }
    }

    hideSessionNameModal() {
        const modal = document.getElementById('sessionNameModal');
        if (modal) modal.classList.add('hidden');
        this.editingSessionName = '';
    }

    hideDeleteConfirmModal() {
        const modal = document.getElementById('deleteConfirmModal');
        if (modal) modal.classList.add('hidden');
        this.sessionToDelete = null;
        this.taskToDelete = null;
    }

    // Event handler attachment with debugging
    setupEventListeners() {
        console.log('🔗 Setting up event listeners...');
        
        // PWA install events
        const installBtn = document.getElementById('installBtn');
        if (installBtn) {
            installBtn.addEventListener('click', () => this.installApp());
            console.log('✅ Install button event listener attached');
        }
        
        const installAppBtn = document.getElementById('installAppBtn');
        if (installAppBtn) {
            installAppBtn.addEventListener('click', () => this.installApp());
            console.log('✅ Install app button event listener attached');
        }
        
        const dismissBtn = document.getElementById('dismissInstallBtn');
        if (dismissBtn) {
            dismissBtn.addEventListener('click', () => this.hideInstallBanner());
            console.log('✅ Dismiss install button event listener attached');
        }
        
        const closeIosBtn = document.getElementById('closeIosModal');
        if (closeIosBtn) {
            closeIosBtn.addEventListener('click', () => this.hideIOSInstallModal());
            console.log('✅ Close iOS modal button event listener attached');
        }

        // Session management - CRITICAL FIXES
        const addSessionBtn = document.getElementById('addNewSessionBtn');
        if (addSessionBtn) {
            addSessionBtn.addEventListener('click', () => {
                console.log('🖱️ Add new session button clicked');
                this.addNewSession();
            });
            console.log('✅ Add new session button event listener attached');
        } else {
            console.error('❌ Add new session button not found');
        }
        
        const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
        if (bulkDeleteBtn) {
            bulkDeleteBtn.addEventListener('click', () => {
                console.log('🖱️ Bulk delete button clicked');
                this.bulkDeleteEmptySessions();
            });
            console.log('✅ Bulk delete button event listener attached');
        }
        
        const switchSessionBtn = document.getElementById('switchSessionBtn');
        if (switchSessionBtn) {
            switchSessionBtn.addEventListener('click', () => {
                console.log('🖱️ Switch session button clicked');
                this.returnToSessionManager();
            });
            console.log('✅ Switch session button event listener attached');
        }

        // School name saving
        const schoolNameInput = document.getElementById('schoolName');
        if (schoolNameInput) {
            schoolNameInput.addEventListener('blur', () => this.saveGlobalSchoolName());
            schoolNameInput.addEventListener('input', () => this.saveGlobalSchoolName());
            console.log('✅ School name input event listeners attached');
        }

        // Session name modal - CRITICAL FIXES
        const closeSessionNameBtn = document.getElementById('closeSessionNameModal');
        if (closeSessionNameBtn) {
            closeSessionNameBtn.addEventListener('click', () => {
                console.log('🖱️ Close session name modal clicked');
                this.hideSessionNameModal();
            });
            console.log('✅ Close session name modal event listener attached');
        }
        
        const cancelSessionNameBtn = document.getElementById('cancelSessionNameModal');
        if (cancelSessionNameBtn) {
            cancelSessionNameBtn.addEventListener('click', () => {
                console.log('🖱️ Cancel session name modal clicked');
                this.hideSessionNameModal();
            });
            console.log('✅ Cancel session name modal event listener attached');
        }
        
        const saveSessionNameBtn = document.getElementById('saveSessionName');
        if (saveSessionNameBtn) {
            saveSessionNameBtn.addEventListener('click', () => {
                console.log('🖱️ Save session name button clicked');
                this.saveSessionName();
            });
            console.log('✅ Save session name button event listener attached');
        } else {
            console.error('❌ Save session name button not found');
        }
        
        const sessionNameInput = document.getElementById('sessionNameInput');
        if (sessionNameInput) {
            sessionNameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    console.log('⌨️ Enter key pressed in session name input');
                    this.saveSessionName();
                }
            });
            console.log('✅ Session name input keypress event listener attached');
        }

        // Delete confirmation modal - CRITICAL FIXES
        const closeDeleteBtn = document.getElementById('closeDeleteModal');
        if (closeDeleteBtn) {
            closeDeleteBtn.addEventListener('click', () => {
                console.log('🖱️ Close delete modal clicked');
                this.hideDeleteConfirmModal();
            });
            console.log('✅ Close delete modal event listener attached');
        }
        
        const cancelDeleteBtn = document.getElementById('cancelDelete');
        if (cancelDeleteBtn) {
            cancelDeleteBtn.addEventListener('click', () => {
                console.log('🖱️ Cancel delete button clicked');
                this.hideDeleteConfirmModal();
            });
            console.log('✅ Cancel delete button event listener attached');
        }
        
        const confirmDeleteBtn = document.getElementById('confirmDelete');
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', () => {
                console.log('🖱️ Confirm delete button clicked');
                if (this.taskToDelete !== null) {
                    this.confirmDeleteTask();
                } else {
                    this.confirmDeleteSession();
                }
            });
            console.log('✅ Confirm delete button event listener attached');
        } else {
            console.error('❌ Confirm delete button not found');
        }

        // Continue with remaining event listeners...
        this.setupRemainingEventListeners();
        
        console.log('✅ All critical event listeners setup complete');
    }

    setupRemainingEventListeners() {
        // Edit mode toggle
        const editModeBtn = document.getElementById('editModeBtn');
        if (editModeBtn) editModeBtn.addEventListener('click', () => this.toggleEditMode());

        // Student management
        const studentSelect = document.getElementById('studentSelect');
        if (studentSelect) studentSelect.addEventListener('change', (e) => this.selectStudent(e.target.value));
        
        const addStudentBtn = document.getElementById('addStudentBtn');
        if (addStudentBtn) addStudentBtn.addEventListener('click', () => this.showStudentModal());
        
        const addFirstStudentBtn = document.getElementById('addFirstStudentBtn');
        if (addFirstStudentBtn) addFirstStudentBtn.addEventListener('click', () => this.showStudentModal());
        
        const editStudentBtn = document.getElementById('editStudentBtn');
        if (editStudentBtn) editStudentBtn.addEventListener('click', () => this.editCurrentStudent());
        
        const deleteStudentBtn = document.getElementById('deleteStudentBtn');
        if (deleteStudentBtn) deleteStudentBtn.addEventListener('click', () => this.deleteCurrentStudent());
        
        const bulkStudentBtn = document.getElementById('bulkStudentBtn');
        if (bulkStudentBtn) bulkStudentBtn.addEventListener('click', () => this.showBulkStudentModal());
        
        const bulkAddStudentsBtn = document.getElementById('bulkAddStudentsBtn');
        if (bulkAddStudentsBtn) bulkAddStudentsBtn.addEventListener('click', () => this.showBulkStudentModal());

        // Task management - NEW SESSION-SPECIFIC TASK EVENTS
        const addNewTaskBtn = document.getElementById('addNewTaskBtn');
        if (addNewTaskBtn) addNewTaskBtn.addEventListener('click', () => this.showTaskModal());

        // Form actions
        const resetFormBtn = document.getElementById('resetFormBtn');
        if (resetFormBtn) resetFormBtn.addEventListener('click', () => this.resetCurrentForm());
        
        const exportStudentBtn = document.getElementById('exportStudentBtn');
        if (exportStudentBtn) exportStudentBtn.addEventListener('click', () => this.exportStudent());
        
        const exportAllBtn = document.getElementById('exportAllBtn');
        if (exportAllBtn) exportAllBtn.addEventListener('click', () => this.exportAll());
        
        const deleteSessionBtn = document.getElementById('deleteSessionBtn');
        if (deleteSessionBtn) deleteSessionBtn.addEventListener('click', () => this.deleteCurrentSession());
        
        const deleteAllBtn = document.getElementById('deleteAllBtn');
        if (deleteAllBtn) deleteAllBtn.addEventListener('click', () => this.deleteAllData());

        // Instructor name saving
        const instructorName = document.getElementById('instructorName');
        if (instructorName) instructorName.addEventListener('blur', () => this.saveInstructorName());

        // Student modal
        const closeModal = document.getElementById('closeModal');
        if (closeModal) closeModal.addEventListener('click', () => this.hideStudentModal());
        
        const cancelModal = document.getElementById('cancelModal');
        if (cancelModal) cancelModal.addEventListener('click', () => this.hideStudentModal());
        
        const saveStudent = document.getElementById('saveStudent');
        if (saveStudent) saveStudent.addEventListener('click', () => this.saveStudentFromModal());
        
        const studentNameInput = document.getElementById('studentNameInput');
        if (studentNameInput) {
            studentNameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.saveStudentFromModal();
                }
            });
        }

        // Bulk student modal
        const closeBulkModal = document.getElementById('closeBulkModal');
        if (closeBulkModal) closeBulkModal.addEventListener('click', () => this.hideBulkStudentModal());
        
        const cancelBulkModal = document.getElementById('cancelBulkModal');
        if (cancelBulkModal) cancelBulkModal.addEventListener('click', () => this.hideBulkStudentModal());
        
        const saveBulkStudents = document.getElementById('saveBulkStudents');
        if (saveBulkStudents) saveBulkStudents.addEventListener('click', () => this.saveBulkStudents());

        // Task modal - NEW FOR SESSION-SPECIFIC TASKS
        const closeTaskModal = document.getElementById('closeTaskModal');
        if (closeTaskModal) closeTaskModal.addEventListener('click', () => this.hideTaskModal());
        
        const cancelTaskModal = document.getElementById('cancelTaskModal');
        if (cancelTaskModal) cancelTaskModal.addEventListener('click', () => this.hideTaskModal());
        
        const saveTask = document.getElementById('saveTask');
        if (saveTask) saveTask.addEventListener('click', () => this.saveTaskFromModal());
        
        const taskNameInput = document.getElementById('taskNameInput');
        if (taskNameInput) {
            taskNameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.saveTaskFromModal();
                }
            });
        }

        // Modal background clicks
        const modals = ['sessionNameModal', 'studentModal', 'bulkStudentModal', 'taskModal', 'iosInstallModal', 'deleteConfirmModal'];
        modals.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target.id === modalId) {
                        modal.classList.add('hidden');
                        if (modalId === 'sessionNameModal') this.editingSessionName = '';
                        if (modalId === 'deleteConfirmModal') {
                            this.sessionToDelete = null;
                            this.taskToDelete = null;
                        }
                    }
                });
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const modals = document.querySelectorAll('.modal:not(.hidden)');
                modals.forEach(modal => {
                    modal.classList.add('hidden');
                    if (modal.id === 'sessionNameModal') this.editingSessionName = '';
                    if (modal.id === 'deleteConfirmModal') {
                        this.sessionToDelete = null;
                        this.taskToDelete = null;
                    }
                });
            }
        });
    }

    loadGlobalSchoolName() {
        try {
            const savedSchoolName = localStorage.getItem('practicalGrades_globalSchoolName');
            const schoolInput = document.getElementById('schoolName');
            if (schoolInput) {
                schoolInput.value = savedSchoolName || '';
            }
        } catch (error) {
            console.error('Error loading school name:', error);
        }
    }

    saveGlobalSchoolName() {
        try {
            const schoolInput = document.getElementById('schoolName');
            if (schoolInput) {
                localStorage.setItem('practicalGrades_globalSchoolName', schoolInput.value);
            }
        } catch (error) {
            console.error('Error saving school name:', error);
        }
    }

    // PWA Features
    setupPWAFeatures() {
        this.registerServiceWorker();
        this.setupInstallPrompt();
        this.setupOfflineDetection();
        this.checkInstallStatus();
    }

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            const swCode = `
                const CACHE_NAME = 'practical-grades-v1.0.0';
                const urlsToCache = [
                    './',
                    './index.html',
                    './style.css',
                    './app.js',
                    'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
                ];

                self.addEventListener('install', event => {
                    event.waitUntil(
                        caches.open(CACHE_NAME)
                            .then(cache => cache.addAll(urlsToCache))
                            .then(() => self.skipWaiting())
                    );
                });

                self.addEventListener('fetch', event => {
                    event.respondWith(
                        caches.match(event.request)
                            .then(response => {
                                if (response) {
                                    return response;
                                }
                                return fetch(event.request).catch(() => {
                                    if (event.request.destination === 'document') {
                                        return caches.match('./index.html');
                                    }
                                });
                            })
                    );
                });

                self.addEventListener('activate', event => {
                    event.waitUntil(
                        caches.keys().then(cacheNames => {
                            return Promise.all(
                                cacheNames.map(cacheName => {
                                    if (cacheName !== CACHE_NAME) {
                                        return caches.delete(cacheName);
                                    }
                                })
                            );
                        }).then(() => self.clients.claim())
                    );
                });
            `;

            const blob = new Blob([swCode], { type: 'application/javascript' });
            const swUrl = URL.createObjectURL(blob);

            navigator.serviceWorker.register(swUrl)
                .then(registration => {
                    console.log('SW registered: ', registration);
                })
                .catch(registrationError => {
                    console.log('SW registration failed: ', registrationError);
                });
        }
    }

    setupInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallBanner();
            const installBtn = document.getElementById('installAppBtn');
            if (installBtn) installBtn.classList.remove('hidden');
        });

        window.addEventListener('appinstalled', (evt) => {
            this.isInstalled = true;
            this.hideInstallBanner();
            const installBtn = document.getElementById('installAppBtn');
            if (installBtn) installBtn.classList.add('hidden');
            this.showToast('Practical Grades installed successfully!', 'success');
        });

        if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
            this.isInstalled = true;
        }

        if (!this.isInstalled) {
            const installBtn = document.getElementById('installAppBtn');
            if (installBtn) installBtn.classList.remove('hidden');
            setTimeout(() => {
                if (!this.isInstalled) {
                    this.showInstallBanner();
                }
            }, 3000);
        }
    }

    setupOfflineDetection() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.hideOfflineStatus();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showOfflineStatus();
        });

        if (!this.isOnline) {
            this.showOfflineStatus();
        }
    }

    checkInstallStatus() {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
        
        if (!this.isInstalled) {
            const installBtn = document.getElementById('installAppBtn');
            if (installBtn) {
                installBtn.classList.remove('hidden');
                if (isIOS && isSafari) {
                    installBtn.addEventListener('click', () => {
                        this.showIOSInstallModal();
                    });
                }
            }
        }
    }

    showInstallBanner() {
        if (this.isInstalled) return;
        const banner = document.getElementById('installBanner');
        if (banner) banner.classList.remove('hidden');
    }

    hideInstallBanner() {
        const banner = document.getElementById('installBanner');
        if (banner) banner.classList.add('hidden');
    }

    showIOSInstallModal() {
        const modal = document.getElementById('iosInstallModal');
        if (modal) modal.classList.remove('hidden');
    }

    hideIOSInstallModal() {
        const modal = document.getElementById('iosInstallModal');
        if (modal) modal.classList.add('hidden');
    }

    showOfflineStatus() {
        const status = document.getElementById('offlineStatus');
        if (status) status.classList.remove('hidden');
    }

    hideOfflineStatus() {
        const status = document.getElementById('offlineStatus');
        if (status) status.classList.add('hidden');
    }

    async installApp() {
        if (this.deferredPrompt) {
            const result = await this.deferredPrompt.prompt();
            console.log(`Install prompt result: ${result.outcome}`);
            
            if (result.outcome === 'accepted') {
                this.deferredPrompt = null;
                this.hideInstallBanner();
            }
        } else {
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            if (isIOS) {
                this.showIOSInstallModal();
            } else {
                this.showToast('Use Chrome or Edge browser for best PWA installation experience', 'info');
            }
        }
    }

    createSessionTile(sessionName) {
        const tile = document.createElement('div');
        tile.className = 'session-tile';
        
        const sessionData = this.getSessionData(sessionName);
        const evaluationCount = sessionData.evaluationCount;
        const totalStudents = sessionData.totalStudents;
        const lastUsed = sessionData.lastUsed;
        const completionPercent = totalStudents > 0 ? Math.round((evaluationCount / totalStudents) * 100) : 0;
        
        let status = 'empty';
        if (evaluationCount > 0) {
            status = completionPercent >= 100 ? 'complete' : 'active';
        }

        tile.innerHTML = `
            <div class="session-tile-header">
                <h3 class="session-tile-name">${sessionName}</h3>
                <div class="session-tile-actions">
                    <button class="session-action-btn edit" type="button" title="Rename Session">
                        <svg viewBox="0 0 16 16">
                            <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z"/>
                        </svg>
                    </button>
                    <button class="session-action-btn clone" type="button" title="Clone Session">
                        <svg viewBox="0 0 16 16">
                            <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                            <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
                        </svg>
                    </button>
                    <button class="session-action-btn delete" type="button" title="Delete Session">
                        <svg viewBox="0 0 16 16">
                            <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1H2.5zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5zM8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5zm3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0z"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="session-tile-content">
                <div class="session-tile-stats">
                    <div class="session-stat">
                        <span class="session-stat-value">${evaluationCount}</span>
                        <span>evaluation${evaluationCount !== 1 ? 's' : ''}</span>
                    </div>
                    <div class="session-stat">
                        <span class="session-stat-value">${completionPercent}%</span>
                        <span>complete</span>
                    </div>
                </div>
                <div class="session-tile-footer">
                    <span class="session-status ${status}">
                        ${status === 'complete' ? '✓ Complete' : status === 'active' ? '⚡ Active' : '○ Empty'}
                    </span>
                    ${lastUsed ? `<span class="session-last-used">Last used: ${lastUsed}</span>` : ''}
                </div>
            </div>
        `;

        // Add click handler to enter session (but not on action buttons)
        tile.addEventListener('click', (e) => {
            if (!e.target.closest('.session-action-btn')) {
                console.log('🖱️ Session tile clicked:', sessionName);
                this.enterSession(sessionName);
            }
        });

        // Add action button handlers with proper event stopping
        const editBtn = tile.querySelector('.session-action-btn.edit');
        const cloneBtn = tile.querySelector('.session-action-btn.clone');
        const deleteBtn = tile.querySelector('.session-action-btn.delete');

        if (editBtn) {
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                console.log('✏️ Edit session button clicked:', sessionName);
                this.renameSession(sessionName);
            });
        }

        if (cloneBtn) {
            cloneBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                console.log('📋 Clone session button clicked:', sessionName);
                this.cloneSession(sessionName);
            });
        }

        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                console.log('🗑️ Delete session button clicked:', sessionName);
                this.deleteSessionWithConfirm(sessionName);
            });
        }

        return tile;
    }

    getSessionData(sessionName) {
        try {
            const sessionKey = sessionName.toLowerCase().replace(/[^a-z0-9]/g, '');
            
            // Get evaluations count
            const assessmentsData = localStorage.getItem(`practicalGrades_${sessionKey}_assessments`);
            const evaluationCount = assessmentsData ? JSON.parse(assessmentsData).length : 0;
            
            // Get students count
            const studentsData = localStorage.getItem(`practicalGrades_${sessionKey}_students`);
            const students = studentsData ? JSON.parse(studentsData) : [];
            const totalStudents = students.length;
            
            // Get last used date from metadata or assessments
            let lastUsed = null;
            if (this.sessionMetadata[sessionName] && this.sessionMetadata[sessionName].lastUsed) {
                const date = new Date(this.sessionMetadata[sessionName].lastUsed);
                lastUsed = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            } else if (assessmentsData) {
                const assessments = JSON.parse(assessmentsData);
                if (assessments.length > 0) {
                    const dates = assessments.map(a => new Date(a.date)).sort((a, b) => b - a);
                    lastUsed = dates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }
            }
            
            return {
                evaluationCount,
                totalStudents,
                lastUsed
            };
        } catch (error) {
            console.error('Error getting session data:', error);
            return {
                evaluationCount: 0,
                totalStudents: 0,
                lastUsed: null
            };
        }
    }

    enterSession(sessionName) {
        this.currentSession = sessionName;
        
        // Update metadata
        if (!this.sessionMetadata[sessionName]) {
            this.sessionMetadata[sessionName] = {};
        }
        this.sessionMetadata[sessionName].lastUsed = new Date().toISOString();
        
        // Add to available sessions if not already there
        if (!this.availableSessions.includes(sessionName)) {
            this.availableSessions.push(sessionName);
        }
        
        this.saveSessionList();
        
        // Load session data
        this.loadSessionData();
        
        // Switch to main app view
        const sessionManager = document.getElementById('sessionManager');
        const mainApp = document.getElementById('mainApplication');
        if (sessionManager && mainApp) {
            sessionManager.classList.add('hidden');
            mainApp.classList.remove('hidden');
            this.currentView = 'mainApp';
        }
        
        // Update UI
        const sessionNameEl = document.getElementById('currentSessionName');
        if (sessionNameEl) sessionNameEl.textContent = sessionName;
        
        // Setup session name editing after entering session
        this.setupSessionNameEditing();
        
        // Render UI components
        this.renderStudentDropdown();
        this.renderTasks();
        this.updateEvaluationCount();
        this.loadInstructorName();
        this.loadGlobalSchoolName();
        
        this.showToast(`Entered session: ${sessionName}`, 'success');
    }

    // Session name inline editing
    setupSessionNameEditing() {
        const sessionNameEl = document.getElementById('currentSessionName');
        if (sessionNameEl && this.currentSession) {
            // Remove any existing event listeners
            sessionNameEl.replaceWith(sessionNameEl.cloneNode(true));
            const newSessionNameEl = document.getElementById('currentSessionName');
            
            newSessionNameEl.addEventListener('click', (e) => {
                this.editSessionNameInline();
            });
        }
    }

    editSessionNameInline() {
        if (!this.currentSession) return;
        
        this.editingSessionName = this.currentSession;
        const modal = document.getElementById('sessionNameModal');
        const title = document.getElementById('sessionNameModalTitle');
        const input = document.getElementById('sessionNameInput');
        
        if (title) title.textContent = 'Rename Session';
        if (input) input.value = this.currentSession;
        if (modal) modal.classList.remove('hidden');
        
        setTimeout(() => {
            if (input) {
                input.focus();
                input.select();
            }
        }, 100);
    }

    returnToSessionManager() {
        // Save current form if student is selected
        if (this.currentStudent) {
            this.saveGlobalSchoolName();
            this.saveInstructorName();
        }

        // Reset current form state
        this.currentStudent = '';
        this.currentScores = {};
        const studentSelect = document.getElementById('studentSelect');
        if (studentSelect) {
            studentSelect.value = '';
        }
        const evalForm = document.getElementById('evaluationForm');
        if (evalForm) evalForm.classList.add('hidden');
        
        // Switch back to session manager
        const sessionManager = document.getElementById('sessionManager');
        const mainApp = document.getElementById('mainApplication');
        if (sessionManager && mainApp) {
            mainApp.classList.add('hidden');
            sessionManager.classList.remove('hidden');
            this.currentView = 'sessionManager';
        }
        
        // Refresh session tiles to show updated stats
        this.renderSessionGrid();
    }

    renameSession(currentName) {
        this.editingSessionName = currentName;
        const modal = document.getElementById('sessionNameModal');
        const title = document.getElementById('sessionNameModalTitle');
        const input = document.getElementById('sessionNameInput');
        
        if (title) title.textContent = 'Rename Session';
        if (input) input.value = currentName;
        if (modal) modal.classList.remove('hidden');
        
        setTimeout(() => {
            if (input) {
                input.focus();
                input.select();
            }
        }, 100);
    }

    renameSessionData(oldName, newName) {
        try {
            const oldKey = oldName.toLowerCase().replace(/[^a-z0-9]/g, '');
            const newKey = newName.toLowerCase().replace(/[^a-z0-9]/g, '');
            
            // Copy all data to new keys
            const dataTypes = ['students', 'tasks', 'assessments', 'instructor'];
            dataTypes.forEach(type => {
                const oldStorageKey = `practicalGrades_${oldKey}_${type}`;
                const newStorageKey = `practicalGrades_${newKey}_${type}`;
                const data = localStorage.getItem(oldStorageKey);
                if (data) {
                    localStorage.setItem(newStorageKey, data);
                    localStorage.removeItem(oldStorageKey);
                }
            });
            
            // Update session list
            const index = this.availableSessions.indexOf(oldName);
            if (index >= 0) {
                this.availableSessions[index] = newName;
            }
            
            // Update metadata
            if (this.sessionMetadata[oldName]) {
                this.sessionMetadata[newName] = this.sessionMetadata[oldName];
                delete this.sessionMetadata[oldName];
            }
            
        } catch (error) {
            console.error('Error renaming session:', error);
            this.showToast('Error renaming session', 'error');
        }
    }

    cloneSession(sessionName) {
        const cloneName = `${sessionName} Copy`;
        let finalName = cloneName;
        let counter = 1;
        
        // Find unique name
        const allSessions = [
            ...this.defaultData.defaultSessions.map(s => s.name),
            ...this.availableSessions
        ];
        
        while (allSessions.includes(finalName)) {
            finalName = `${cloneName} ${counter}`;
            counter++;
        }
        
        try {
            const sourceKey = sessionName.toLowerCase().replace(/[^a-z0-9]/g, '');
            const targetKey = finalName.toLowerCase().replace(/[^a-z0-9]/g, '');
            
            // Copy all session data
            const dataTypes = ['students', 'tasks', 'assessments', 'instructor'];
            dataTypes.forEach(type => {
                const sourceStorageKey = `practicalGrades_${sourceKey}_${type}`;
                const targetStorageKey = `practicalGrades_${targetKey}_${type}`;
                const data = localStorage.getItem(sourceStorageKey);
                if (data) {
                    localStorage.setItem(targetStorageKey, data);
                }
            });
            
            // Add to sessions list
            this.availableSessions.push(finalName);
            
            // Copy metadata
            if (this.sessionMetadata[sessionName]) {
                this.sessionMetadata[finalName] = { ...this.sessionMetadata[sessionName] };
                this.sessionMetadata[finalName].lastUsed = new Date().toISOString();
            }
            
            this.saveSessionList();
            this.renderSessionGrid();
            this.showToast(`Session cloned as "${finalName}"`, 'success');
            
        } catch (error) {
            console.error('Error cloning session:', error);
            this.showToast('Error cloning session', 'error');
        }
    }

    getSessionStorageKey(key) {
        if (!this.currentSession) return null;
        const sessionKey = this.currentSession.toLowerCase().replace(/[^a-z0-9]/g, '');
        return `practicalGrades_${sessionKey}_${key}`;
    }

    // Data Management
    loadSessionData() {
        if (!this.currentSession) return;
        
        try {
            // Load students - start empty if no saved data
            const studentsKey = this.getSessionStorageKey('students');
            const savedStudents = localStorage.getItem(studentsKey);
            if (savedStudents) {
                this.students = JSON.parse(savedStudents);
                console.log('✅ Loaded students:', this.students);
            } else {
                this.students = []; // Start with empty list
                if (studentsKey) localStorage.setItem(studentsKey, JSON.stringify(this.students));
                console.log('✅ Initialized empty student list');
            }

            // Load tasks - use session-specific tasks or default
            const tasksKey = this.getSessionStorageKey('tasks');
            const savedTasks = localStorage.getItem(tasksKey);
            if (savedTasks) {
                this.tasks = JSON.parse(savedTasks);
                console.log('✅ Loaded tasks:', this.tasks);
            } else {
                this.tasks = [...this.defaultData.tasks]; // Start with default tasks
                if (tasksKey) localStorage.setItem(tasksKey, JSON.stringify(this.tasks));
                console.log('✅ Initialized default tasks');
            }

            // Load assessments
            const assessmentsKey = this.getSessionStorageKey('assessments');
            const savedAssessments = localStorage.getItem(assessmentsKey);
            this.assessments = savedAssessments ? JSON.parse(savedAssessments) : [];
            console.log('✅ Loaded assessments:', this.assessments);

        } catch (error) {
            console.error('Error loading session data:', error);
            this.showToast('Error loading session data, using defaults', 'error');
            this.resetSessionToDefaults();
        }
    }

    saveSessionData() {
        if (!this.currentSession) return;
        
        try {
            const studentsKey = this.getSessionStorageKey('students');
            const tasksKey = this.getSessionStorageKey('tasks');
            const assessmentsKey = this.getSessionStorageKey('assessments');
            
            if (studentsKey) {
                localStorage.setItem(studentsKey, JSON.stringify(this.students));
                console.log('✅ Saved students to:', studentsKey);
            }
            if (tasksKey) {
                localStorage.setItem(tasksKey, JSON.stringify(this.tasks));
                console.log('✅ Saved tasks to:', tasksKey);
            }
            if (assessmentsKey) {
                localStorage.setItem(assessmentsKey, JSON.stringify(this.assessments));
                console.log('✅ Saved assessments to:', assessmentsKey);
            }
        } catch (error) {
            console.error('Error saving session data:', error);
            this.showToast('Error saving data - storage may be full', 'error');
        }
    }

    saveInstructorName() {
        if (!this.currentSession) return;
        
        try {
            const instructorNameEl = document.getElementById('instructorName');
            if (!instructorNameEl) return;
            
            const instructorName = instructorNameEl.value;
            const instructorKey = this.getSessionStorageKey('instructor');
            if (instructorKey) localStorage.setItem(instructorKey, instructorName);
        } catch (error) {
            console.error('Error saving instructor name:', error);
        }
    }

    loadInstructorName() {
        if (!this.currentSession) return;
        
        try {
            const instructorKey = this.getSessionStorageKey('instructor');
            const savedInstructor = localStorage.getItem(instructorKey);
            const instructorNameEl = document.getElementById('instructorName');
            if (instructorNameEl) instructorNameEl.value = savedInstructor || '';
        } catch (error) {
            console.error('Error loading instructor name:', error);
        }
    }

    resetSessionToDefaults() {
        this.students = [];
        this.tasks = [...this.defaultData.tasks];
        this.assessments = [];
        this.saveSessionData();
    }

    // UI Management
    toggleEditMode() {
        this.editMode = !this.editMode;
        const btn = document.getElementById('editModeBtn');
        if (btn) {
            btn.textContent = `Edit Mode: ${this.editMode ? 'ON' : 'OFF'}`;
            btn.className = this.editMode ? 'btn btn--primary' : 'btn btn--secondary';
        }

        const studentControls = document.getElementById('studentControls');
        if (studentControls) studentControls.classList.toggle('hidden', !this.editMode);
        
        const taskControls = document.getElementById('taskControls');
        if (taskControls) taskControls.classList.toggle('hidden', !this.editMode);
        
        const utilityControls = document.getElementById('utilityControls');
        if (utilityControls) utilityControls.classList.toggle('hidden', !this.editMode);

        // Update task action buttons visibility
        const taskActions = document.querySelectorAll('.task-actions');
        taskActions.forEach(actions => {
            if (this.editMode) {
                actions.classList.add('edit-mode-visible');
            } else {
                actions.classList.remove('edit-mode-visible');
            }
        });

        console.log('✅ Edit mode toggled to:', this.editMode ? 'ON' : 'OFF');
    }

    updateCurrentDate() {
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const dateEl = document.getElementById('currentDate');
        if (dateEl) dateEl.textContent = dateStr;
    }

    updateEvaluationCount() {
        const countEl = document.getElementById('evaluationCount');
        if (countEl) countEl.textContent = this.assessments.length;
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        
        if (toast && toastMessage) {
            toastMessage.textContent = message;
            toast.className = `toast ${type}`;
            toast.classList.remove('hidden');
            
            setTimeout(() => {
                toast.classList.add('hidden');
            }, 4000);
        }
    }

    renderStudentDropdown() {
        const select = document.getElementById('studentSelect');
        const emptyState = document.getElementById('emptyStudentState');
        
        if (!select) {
            console.error('❌ Student select element not found');
            return;
        }
        
        const currentValue = select.value;
        select.innerHTML = '<option value="">Choose a student...</option>';
        
        console.log('🎨 Rendering student dropdown. Current students:', this.students);
        console.log('Students length:', this.students.length);
        
        // Show/hide empty state
        if (this.students.length === 0) {
            console.log('📭 No students found, showing empty state');
            if (emptyState) emptyState.classList.remove('hidden');
            select.classList.add('hidden');
        } else {
            console.log('📝 Students found, showing dropdown');
            if (emptyState) emptyState.classList.add('hidden');
            select.classList.remove('hidden');
            
            this.students.forEach((student, index) => {
                console.log(`Adding student ${index + 1}:`, student);
                const option = document.createElement('option');
                option.value = student;
                option.textContent = student;
                
                const hasEvaluation = this.assessments.some(assessment => assessment.student === student);
                if (hasEvaluation) {
                    option.classList.add('student-completed');
                }
                
                select.appendChild(option);
            });
            
            if (currentValue && this.students.includes(currentValue)) {
                select.value = currentValue;
                console.log('✅ Restored previous selection:', currentValue);
            }
        }

        console.log('✅ Student dropdown rendering complete');
    }

    selectStudent(studentName) {
        this.currentStudent = studentName;
        console.log('👤 Selected student:', studentName);
        
        const evalForm = document.getElementById('evaluationForm');
        if (studentName) {
            if (evalForm) evalForm.classList.remove('hidden');
            this.loadStudentEvaluation(studentName);
        } else {
            if (evalForm) evalForm.classList.add('hidden');
            this.currentScores = {};
        }
    }

    loadStudentEvaluation(studentName) {
        const existingEvaluation = this.assessments.find(assessment => assessment.student === studentName);
        
        if (existingEvaluation) {
            this.currentScores = { ...existingEvaluation.scores };
            this.updateRatingInputs();
            this.calculateScores();
        } else {
            this.currentScores = {};
            this.updateRatingInputs();
            this.calculateScores();
        }
    }

    showStudentModal(editIndex = -1) {
        if (!this.currentSession) {
            this.showToast('Please select a session first', 'error');
            return;
        }

        this.editingStudentIndex = editIndex;
        const modal = document.getElementById('studentModal');
        const title = document.getElementById('modalTitle');
        const input = document.getElementById('studentNameInput');
        
        if (editIndex >= 0) {
            if (title) title.textContent = 'Edit Student';
            if (input) input.value = this.students[editIndex];
        } else {
            if (title) title.textContent = 'Add Student';
            if (input) input.value = '';
        }
        
        if (modal) modal.classList.remove('hidden');
        setTimeout(() => {
            if (input) input.focus();
        }, 100);
    }

    hideStudentModal() {
        const modal = document.getElementById('studentModal');
        if (modal) modal.classList.add('hidden');
        this.editingStudentIndex = -1;
    }

    showBulkStudentModal() {
        if (!this.currentSession) {
            this.showToast('Please select a session first', 'error');
            return;
        }

        const modal = document.getElementById('bulkStudentModal');
        const input = document.getElementById('bulkStudentInput');
        
        if (input) input.value = '';
        if (modal) modal.classList.remove('hidden');
        
        setTimeout(() => {
            if (input) input.focus();
        }, 100);
    }

    hideBulkStudentModal() {
        const modal = document.getElementById('bulkStudentModal');
        if (modal) modal.classList.add('hidden');
    }

    saveBulkStudents() {
        const input = document.getElementById('bulkStudentInput');
        if (!input) return;
        
        const rawInput = input.value.trim();
        if (!rawInput) {
            this.showToast('Please enter student names', 'error');
            return;
        }
        
        // Parse input - handle both line breaks and commas
        const studentNames = rawInput
            .split(/[\n,]+/)
            .map(name => name.trim())
            .filter(name => name.length > 0);
        
        if (studentNames.length === 0) {
            this.showToast('No valid student names found', 'error');
            return;
        }
        
        let addedCount = 0;
        let duplicateCount = 0;
        
        studentNames.forEach(studentName => {
            if (!this.students.includes(studentName)) {
                this.students.push(studentName);
                addedCount++;
                console.log('✅ Added student:', studentName);
            } else {
                duplicateCount++;
                console.log('⚠️ Duplicate student skipped:', studentName);
            }
        });
        
        console.log('📊 Bulk add summary - Added:', addedCount, 'Duplicates:', duplicateCount);
        console.log('📝 Final student list:', this.students);
        
        this.saveSessionData();
        this.renderStudentDropdown();
        this.hideBulkStudentModal();
        
        let message = `Added ${addedCount} student${addedCount !== 1 ? 's' : ''}`;
        if (duplicateCount > 0) {
            message += ` (${duplicateCount} duplicate${duplicateCount !== 1 ? 's' : ''} skipped)`;
        }
        
        this.showToast(message, 'success');
    }

    saveStudentFromModal() {
        const input = document.getElementById('studentNameInput');
        if (!input) return;
        
        const studentName = input.value.trim();
        
        if (!studentName) {
            this.showToast('Please enter a student name', 'error');
            return;
        }
        
        if (this.editingStudentIndex >= 0) {
            const oldName = this.students[this.editingStudentIndex];
            this.students[this.editingStudentIndex] = studentName;
            
            this.assessments.forEach(assessment => {
                if (assessment.student === oldName) {
                    assessment.student = studentName;
                }
            });
            
            console.log('✏️ Updated student:', oldName, '→', studentName);
            this.showToast('Student updated successfully');
        } else {
            if (this.students.includes(studentName)) {
                this.showToast('Student already exists', 'error');
                return;
            }
            
            this.students.push(studentName);
            console.log('✅ Added new student:', studentName);
            this.showToast('Student added successfully');
        }
        
        console.log('📝 Updated student list:', this.students);
        
        this.saveSessionData();
        this.renderStudentDropdown();
        this.hideStudentModal();
    }

    editCurrentStudent() {
        if (!this.currentStudent) {
            this.showToast('Please select a student first', 'error');
            return;
        }
        
        const index = this.students.indexOf(this.currentStudent);
        if (index >= 0) {
            this.showStudentModal(index);
        }
    }

    deleteCurrentStudent() {
        if (!this.currentStudent) {
            this.showToast('Please select a student first', 'error');
            return;
        }
        
        if (confirm(`Are you sure you want to delete "${this.currentStudent}"? This will also remove all their evaluations.`)) {
            const index = this.students.indexOf(this.currentStudent);
            if (index >= 0) {
                this.students.splice(index, 1);
            }
            
            this.assessments = this.assessments.filter(assessment => assessment.student !== this.currentStudent);
            
            this.saveSessionData();
            this.renderStudentDropdown();
            this.selectStudent('');
            this.updateEvaluationCount();
            this.showToast('Student deleted successfully');
        }
    }

    // SESSION-SPECIFIC TASK MANAGEMENT - NEW FUNCTIONALITY
    renderTasks() {
        const container = document.getElementById('tasksContainer');
        if (!container) {
            console.error('❌ Tasks container element not found');
            return;
        }
        
        container.innerHTML = '';
        console.log('🎨 Rendering tasks. Current tasks:', this.tasks);
        
        if (this.tasks && this.tasks.length > 0) {
            this.tasks.forEach((task, index) => {
                console.log(`Creating task card ${index + 1}:`, task.name);
                const taskCard = this.createTaskCard(task, index);
                container.appendChild(taskCard);
            });
            console.log('✅ Task rendering complete');
        } else {
            console.log('📭 No tasks to render');
        }
    }

    createTaskCard(task, index) {
        const card = document.createElement('div');
        card.className = 'task-card';
        card.innerHTML = `
            <div class="task-header">
                <div>
                    <h3 class="task-title">${task.name}</h3>
                    <p class="task-description">${task.desc}</p>
                </div>
                <div class="task-actions ${this.editMode ? 'edit-mode-visible' : ''}">
                    <button class="task-action-btn edit" type="button" title="Edit Task" data-task-index="${index}">
                        <svg viewBox="0 0 16 16">
                            <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z"/>
                        </svg>
                    </button>
                    <button class="task-action-btn delete" type="button" title="Delete Task" data-task-index="${index}">
                        <svg viewBox="0 0 16 16">
                            <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1H2.5zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5zM8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5zm3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0z"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="rating-options" data-task-id="${task.id}">
                ${this.defaultData.ratingScale.map(rating => `
                    <label class="rating-option" data-value="${rating.value}">
                        <input type="radio" name="task_${task.id}" value="${rating.value}">
                        <div class="rating-label">
                            <span class="rating-value">${rating.value}</span>
                            <span class="rating-text">${rating.label}</span>
                        </div>
                    </label>
                `).join('')}
            </div>
        `;
        
        // Add task action button event listeners
        const editBtn = card.querySelector('.task-action-btn.edit');
        const deleteBtn = card.querySelector('.task-action-btn.delete');
        
        if (editBtn) {
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log('✏️ Edit task button clicked for index:', index);
                this.editTask(index);
            });
        }
        
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log('🗑️ Delete task button clicked for index:', index);
                this.deleteTaskWithConfirm(index);
            });
        }
        
        const radioInputs = card.querySelectorAll('input[type="radio"]');
        radioInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                this.updateTaskRating(task.id, parseInt(e.target.value));
                this.updateRatingSelection(e.target);
            });
        });
        
        return card;
    }

    // NEW: Task management methods for session-specific tasks
    showTaskModal(editIndex = -1) {
        if (!this.currentSession) {
            this.showToast('Please select a session first', 'error');
            return;
        }

        console.log('📝 Showing task modal for edit index:', editIndex);
        this.editingTaskIndex = editIndex;
        const modal = document.getElementById('taskModal');
        const title = document.getElementById('taskModalTitle');
        const nameInput = document.getElementById('taskNameInput');
        const descInput = document.getElementById('taskDescInput');
        const warningDiv = document.getElementById('sessionTaskWarning');
        
        if (editIndex >= 0) {
            if (title) title.textContent = 'Edit Task';
            if (nameInput) nameInput.value = this.tasks[editIndex].name;
            if (descInput) descInput.value = this.tasks[editIndex].desc;
            console.log('✏️ Editing task:', this.tasks[editIndex].name);
        } else {
            if (title) title.textContent = 'Add New Task';
            if (nameInput) nameInput.value = '';
            if (descInput) descInput.value = '';
            console.log('➕ Adding new task');
        }
        
        if (warningDiv) warningDiv.classList.remove('hidden');
        
        if (modal) modal.classList.remove('hidden');
        setTimeout(() => {
            if (nameInput) nameInput.focus();
        }, 100);
    }

    hideTaskModal() {
        const modal = document.getElementById('taskModal');
        if (modal) modal.classList.add('hidden');
        this.editingTaskIndex = -1;
    }

    saveTaskFromModal() {
        const nameInput = document.getElementById('taskNameInput');
        const descInput = document.getElementById('taskDescInput');
        
        if (!nameInput || !descInput) return;
        
        const taskName = nameInput.value.trim();
        const taskDesc = descInput.value.trim();
        
        if (!taskName) {
            this.showToast('Please enter a task name', 'error');
            return;
        }
        
        const taskId = taskName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        
        if (this.editingTaskIndex >= 0) {
            // Edit existing task
            const oldTaskId = this.tasks[this.editingTaskIndex].id;
            this.tasks[this.editingTaskIndex] = {
                id: taskId,
                name: taskName,
                desc: taskDesc || taskName
            };
            
            // Update all evaluations with new task ID
            this.migrateTaskIdInCurrentSession(oldTaskId, taskId);
            console.log('✏️ Updated task:', taskName);
            this.showToast('Task updated successfully', 'success');
        } else {
            // Add new task
            const newTask = {
                id: taskId,
                name: taskName,
                desc: taskDesc || taskName
            };
            
            this.tasks.push(newTask);
            console.log('➕ Added new task:', taskName);
            this.showToast('Task added successfully', 'success');
        }
        
        // Save session tasks
        this.saveSessionData();
        
        this.hideTaskModal();
        this.renderTasks();
        this.calculateScores();
    }

    editTask(index) {
        if (!this.currentSession) {
            this.showToast('Please select a session first', 'error');
            return;
        }

        if (index >= 0 && index < this.tasks.length) {
            console.log('✏️ Editing task at index:', index);
            this.showTaskModal(index);
        }
    }

    deleteTaskWithConfirm(index) {
        if (!this.currentSession) {
            this.showToast('Please select a session first', 'error');
            return;
        }

        if (index < 0 || index >= this.tasks.length) return;
        
        const task = this.tasks[index];
        const hasEvaluations = this.assessments.length > 0;
        
        let confirmText = `Are you sure you want to delete "${task.name}"?`;
        
        if (hasEvaluations) {
            confirmText += `\n\nThis will affect ${this.assessments.length} existing evaluation${this.assessments.length !== 1 ? 's' : ''} in this session only.`;
        }
        
        confirmText += '\n\nThis action cannot be undone.';
        
        const modal = document.getElementById('deleteConfirmModal');
        const textEl = document.getElementById('deleteConfirmText');
        if (textEl) textEl.textContent = confirmText;
        if (modal) modal.classList.remove('hidden');
        
        // Store task index for deletion
        this.taskToDelete = index;
        console.log('📋 Task marked for deletion:', task.name, 'at index:', index);
    }

    confirmDeleteTask() {
        if (this.taskToDelete === null || this.taskToDelete < 0 || this.taskToDelete >= this.tasks.length) {
            console.error('❌ Invalid task index for deletion:', this.taskToDelete);
            return;
        }
        
        const deletedTaskId = this.tasks[this.taskToDelete].id;
        const taskName = this.tasks[this.taskToDelete].name;
        
        console.log('🗑️ Deleting task:', taskName, 'with ID:', deletedTaskId);
        
        // Remove task from tasks array
        this.tasks.splice(this.taskToDelete, 1);
        
        // Remove task from all evaluations in current session
        this.assessments.forEach(assessment => {
            delete assessment.scores[deletedTaskId];
            assessment.total = Object.values(assessment.scores).reduce((sum, score) => sum + (score || 0), 0);
            assessment.percent = this.tasks.length > 0 ? Math.round((assessment.total / (this.tasks.length * 3)) * 100) : 0;
        });
        
        // Remove from current scores if present
        delete this.currentScores[deletedTaskId];
        
        this.saveSessionData();
        this.renderTasks();
        this.calculateScores();
        this.hideDeleteConfirmModal();
        this.showToast(`Task "${taskName}" deleted successfully`, 'success');
        
        this.taskToDelete = null;
    }

    migrateTaskIdInCurrentSession(oldTaskId, newTaskId) {
        console.log('🔄 Migrating task ID from', oldTaskId, 'to', newTaskId);
        
        // Update current session evaluations
        this.assessments.forEach(assessment => {
            if (assessment.scores[oldTaskId] !== undefined) {
                assessment.scores[newTaskId] = assessment.scores[oldTaskId];
                delete assessment.scores[oldTaskId];
            }
        });
        
        // Update current scores if present
        if (this.currentScores[oldTaskId] !== undefined) {
            this.currentScores[newTaskId] = this.currentScores[oldTaskId];
            delete this.currentScores[oldTaskId];
        }
        
        console.log('✅ Task ID migration complete');
    }

    updateRatingSelection(selectedInput) {
        const container = selectedInput.closest('.rating-options');
        if (!container) return;
        
        const options = container.querySelectorAll('.rating-option');
        options.forEach(option => option.classList.remove('selected'));
        
        const selectedOption = selectedInput.closest('.rating-option');
        if (selectedOption) selectedOption.classList.add('selected');
    }

    updateTaskRating(taskId, rating) {
        this.currentScores[taskId] = rating;
        this.calculateScores();
        this.autoSaveEvaluation();
    }

    updateRatingInputs() {
        this.tasks.forEach(task => {
            const inputs = document.querySelectorAll(`input[name="task_${task.id}"]`);
            const score = this.currentScores[task.id];
            
            inputs.forEach(input => {
                const option = input.closest('.rating-option');
                if (option) option.classList.remove('selected');
                
                if (score !== undefined && parseInt(input.value) === score) {
                    input.checked = true;
                    if (option) option.classList.add('selected');
                } else {
                    input.checked = false;
                }
            });
        });
    }

    calculateScores() {
        const total = Object.values(this.currentScores).reduce((sum, score) => sum + (score || 0), 0);
        const maxScore = this.tasks.length * 3;
        const percentage = maxScore > 0 ? Math.round((total / maxScore) * 100) : 0;
        
        const totalEl = document.getElementById('totalScore');
        if (totalEl) totalEl.textContent = total;
        
        const percentEl = document.getElementById('percentage');
        if (percentEl) percentEl.textContent = `${percentage}%`;
        
        const maxScoreElement = document.querySelector('.summary-max');
        if (maxScoreElement) {
            maxScoreElement.textContent = `/ ${maxScore}`;
        }
    }

    autoSaveEvaluation() {
        if (!this.currentStudent) return;
        
        const instructorNameEl = document.getElementById('instructorName');
        const instructor = instructorNameEl ? instructorNameEl.value || 'Unknown' : 'Unknown';
        const today = new Date().toISOString().split('T')[0];
        
        this.assessments = this.assessments.filter(assessment => assessment.student !== this.currentStudent);
        
        const evaluation = {
            student: this.currentStudent,
            date: today,
            instructor: instructor,
            scores: { ...this.currentScores },
            total: Object.values(this.currentScores).reduce((sum, score) => sum + (score || 0), 0),
            percent: Math.round((Object.values(this.currentScores).reduce((sum, score) => sum + (score || 0), 0) / (this.tasks.length * 3)) * 100)
        };
        
        this.assessments.push(evaluation);
        this.saveSessionData();
        this.updateEvaluationCount();
        this.renderStudentDropdown();
    }

    // Utility Functions
    resetCurrentForm() {
        this.currentScores = {};
        this.updateRatingInputs();
        this.calculateScores();
        this.showToast('Form reset successfully');
    }

    deleteCurrentSession() {
        if (!this.currentSession) {
            this.showToast('No session selected', 'error');
            return;
        }
        
        this.deleteSessionWithConfirm(this.currentSession);
    }

    deleteAllData() {
        if (confirm('Are you sure you want to delete ALL stored data for ALL sessions? This action cannot be undone.')) {
            try {
                const keysToDelete = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith('practicalGrades_')) {
                        keysToDelete.push(key);
                    }
                }
                
                keysToDelete.forEach(key => localStorage.removeItem(key));
                
                this.availableSessions = [];
                this.sessionMetadata = {};
                this.currentSession = null;
                this.students = [];
                this.tasks = [...this.defaultData.tasks];
                this.assessments = [];
                this.currentStudent = '';
                this.currentScores = {};
                
                this.showToast('All data deleted successfully');
                this.returnToSessionManager();
                
            } catch (error) {
                console.error('Error deleting data:', error);
                this.showToast('Error deleting data', 'error');
            }
        }
    }

    // Export Functions
    exportStudent() {
        if (!this.currentStudent) {
            this.showToast('Please select a student first', 'error');
            return;
        }
        
        const evaluation = this.assessments.find(assessment => assessment.student === this.currentStudent);
        if (!evaluation) {
            this.showToast('No evaluation data found for this student', 'error');
            return;
        }
        
        const data = [evaluation];
        this.exportToExcel(data, `${this.currentStudent.replace(/\s+/g, '_')}_evaluation`);
    }

    exportAll() {
        if (this.assessments.length === 0) {
            this.showToast('No evaluation data to export', 'error');
            return;
        }
        
        this.exportToExcel(this.assessments, 'all_evaluations');
    }

    exportToExcel(data, filename) {
        try {
            const exportData = data.map(assessment => {
                const row = {
                    Student: assessment.student,
                    Date: assessment.date,
                    Instructor: assessment.instructor,
                    Session: this.currentSession
                };
                
                this.tasks.forEach(task => {
                    row[task.name] = assessment.scores[task.id] || 0;
                });
                
                row['Total Score'] = assessment.total;
                row['Percentage'] = `${assessment.percent}%`;
                
                return row;
            });
            
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(exportData);
            
            const sheetName = this.currentSession ? this.currentSession.replace(/[^a-zA-Z0-9 ]/g, '').substring(0, 31) : 'PracticalGrades';
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
            
            const today = new Date().toISOString().split('T')[0];
            const sessionName = this.currentSession ? this.currentSession.replace(/[^a-zA-Z0-9]/g, '_') : 'PracticalGrades';
            const finalFilename = `PracticalGrades_${sessionName}_${today}_${filename}.xlsx`;
            
            XLSX.writeFile(wb, finalFilename);
            
            this.showToast(`Exported to ${finalFilename}`, 'success');
        } catch (error) {
            console.error('Export error:', error);
            this.showToast('Error exporting data', 'error');
        }
    }
}

// Initialize the PWA application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.practicalGrades = new PracticalGradesPWA();
});