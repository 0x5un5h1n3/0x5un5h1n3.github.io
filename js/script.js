class TerminalPortfolio {
  constructor() {
    this.currentSection = 'welcome';
    this.currentFileIndex = 0;
    this.currentContentIndex = 0;
    this.contentItems = [];
    this.commandHistory = [];
    this.historyIndex = -1;
    this.isMinimized = false;
    this.isMaximized = false;
    this.projects = [];
    this.displayedProjects = 6;
    this.navigationMode = 'files';
    
    this.fileItems = document.querySelectorAll('.file-item');
    this.sections = ['welcome', 'projects', 'connect', 'about', 'terminal'];
    
    this.commands = {
      help: () => this.showHelp(),
      clear: () => this.clearTerminal(),
      ls: () => this.listFiles(),
      cd: (args) => this.changeDirectory(args[0]),
      cat: (args) => this.showFile(args[0]),
      pwd: () => this.showCurrentDirectory(),
      whoami: () => this.showUser(),
      date: () => this.showDate(),
      uptime: () => this.showUptime(),
      ps: () => this.showProcesses(),
      top: () => this.showTop(),
      history: () => this.showHistory(),
      exit: () => this.handleExit(),
      reset: () => this.resetTerminal(),
      echo: (args) => this.echo(args.join(' ')),
      tree: () => this.showTree(),
      find: (args) => this.findFiles(args[0]),
      grep: (args) => this.grepContent(args.join(' ')),
      vim: () => this.showVimMessage(),
      nano: () => this.showNanoMessage(),
      ssh: () => this.showSSHMessage(),
      curl: (args) => this.curlCommand(args[0]),
      ping: (args) => this.pingCommand(args[0]),
      chmod: () => this.showChmodMessage(),
      sudo: () => this.showSudoMessage(),
      neofetch: () => this.showSystemInfo()
    };
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupKeyboardNavigation();
    this.setupWindowControls();
    this.setupCustomCursor();
    this.loadProjects();
    this.updateTime();
    
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.add('files-mode');
    
    this.showSection('welcome');
    this.updateStatusBar('welcome');
    this.currentSection = 'welcome';
    
    this.selectFile(0, false);
    
    setTimeout(() => this.updateCursorPosition(), 100);
  }

  setupEventListeners() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileOverlay = document.getElementById('mobile-overlay');
    const sidebar = document.getElementById('sidebar');
    
    if (mobileMenuBtn) {
      mobileMenuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('mobile-open');
        mobileOverlay.classList.toggle('active');
      });
    }
    
    if (mobileOverlay) {
      mobileOverlay.addEventListener('click', () => {
        sidebar.classList.remove('mobile-open');
        mobileOverlay.classList.remove('active');
      });
    }

    document.getElementById('file-explorer').addEventListener('click', (e) => {
      const fileItem = e.target.closest('.file-item');
      if (fileItem) {
        e.preventDefault();
        e.stopPropagation();
        
        this.switchToFilesMode();
        
        const index = parseInt(fileItem.dataset.index);
        this.selectFile(index, true);
        
        if (window.innerWidth <= 480) {
          sidebar.classList.remove('mobile-open');
          mobileOverlay.classList.remove('active');
        }
      }
    });

    const mobileNav = document.getElementById('mobile-nav');
    if (mobileNav) {
      mobileNav.addEventListener('click', (e) => {
        const navItem = e.target.closest('.mobile-nav-item');
        if (navItem) {
          e.preventDefault();
          const section = navItem.dataset.section;
          
          mobileNav.querySelectorAll('.mobile-nav-item').forEach(item => {
            item.classList.remove('active');
          });
          navItem.classList.add('active');
          
          this.showSection(section);
          this.updateStatusBar(section);
          this.currentSection = section;
          
          const fileItems = document.querySelectorAll('.file-item');
          fileItems.forEach((item, index) => {
            if (item.dataset.section === section) {
              this.selectFile(index, false);
            }
          });
        }
      });
    }

    const commandInput = document.getElementById('command-input');
    commandInput.addEventListener('keydown', (e) => this.handleCommandInput(e));
    commandInput.addEventListener('focus', () => this.showTerminalSection());
    commandInput.addEventListener('input', () => this.updateCursorPosition());
    commandInput.addEventListener('keyup', () => this.updateCursorPosition());
    commandInput.addEventListener('click', () => this.updateCursorPosition());
    
    const terminalSection = document.getElementById('terminal-section');
    if (terminalSection) {
      terminalSection.addEventListener('click', () => this.focusCommandInput());
    }
    
    document.addEventListener('keydown', (e) => {
      if (e.key.startsWith('Arrow') || e.key === 'Tab' || e.key === 'Escape' || e.key === 'Enter') {
        return;
      }
      
      const commandInput = document.getElementById('command-input');
      if (document.activeElement !== commandInput && e.key.length === 1) {
        commandInput.focus();
        this.showTerminalSection();
      }
    });
    
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('tab-close')) {
        e.stopPropagation();
        e.preventDefault();
        this.closeTab();
      }
    });
  }

  setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Tab'].includes(e.key)) {
        if (document.activeElement === document.getElementById('command-input')) {
          return;
        }
        e.preventDefault();
      }

      if (e.ctrlKey) {
        switch (e.key) {
          case 'w':
            e.preventDefault();
            this.handleClose();
            break;
          case 'm':
            e.preventDefault();
            if (e.shiftKey) {
              this.toggleMaximize();
            } else {
              this.toggleMinimize();
            }
            break;
          case 'l':
            e.preventDefault();
            this.clearTerminal();
            break;
          case 'c':
            e.preventDefault();
            this.interruptCommand();
            break;
          case 'r':
            e.preventDefault();
            this.resetTerminal();
            break;
        }
        return;
      }

      if (document.activeElement !== document.getElementById('command-input')) {
        switch (e.key) {
          case 'ArrowUp':
            if (this.navigationMode === 'files') {
              this.navigateFiles(-1);
            } else {
              this.navigateContent(-1);
              this.scrollPage(-1);
            }
            break;
          case 'ArrowDown':
            if (this.navigationMode === 'files') {
              this.navigateFiles(1);
            } else {
              this.navigateContent(1);
              this.scrollPage(1);
            }
            break;
          case 'ArrowRight':
            if (this.navigationMode === 'files') {
              this.openCurrentFile();
              setTimeout(() => this.switchToContentMode(), 100);
            } else {
              this.navigateContent(1, true);
            }
            break;
          case 'ArrowLeft':
            if (this.navigationMode === 'files') {
              this.goToParentDirectory();
            } else {
              this.navigateContent(-1, true);
            }
            break;
          case 'Enter':
            if (this.navigationMode === 'files') {
              this.openCurrentFile();
            } else {
              this.activateContentItem();
            }
            break;
          case 'Tab':
            if (this.navigationMode === 'files') {
              this.switchToContentMode();
            } else {
              this.focusCommandInput();
            }
            break;
          case ' ':
            if (this.navigationMode === 'files') {
              this.openCurrentFile();
            } else {
              this.activateContentItem();
            }
            break;
          case 'Escape':
            this.switchToFilesMode();
            break;
        }
      }

      if (e.key === '`' || e.key === '~') {
        e.preventDefault();
        this.focusCommandInput();
      }
    });
  }

  setupWindowControls() {
    document.getElementById('btn-close').addEventListener('click', () => this.handleClose());
    document.getElementById('btn-minimize').addEventListener('click', () => this.toggleMinimize());
    document.getElementById('btn-maximize').addEventListener('click', () => this.toggleMaximize());

    const titlebar = document.getElementById('titlebar');
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };

    titlebar.addEventListener('mousedown', (e) => {
      if (e.target.closest('.window-btn')) return;
      isDragging = true;
      const rect = document.getElementById('terminal-window').getBoundingClientRect();
      dragOffset.x = e.clientX - rect.left;
      dragOffset.y = e.clientY - rect.top;
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const window = document.getElementById('terminal-window');
      window.style.position = 'absolute';
      window.style.left = `${e.clientX - dragOffset.x}px`;
      window.style.top = `${e.clientY - dragOffset.y}px`;
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
    });

    titlebar.addEventListener('dblclick', (e) => {
      if (e.target.closest('.window-btn')) return;
      this.toggleMaximize();
    });
  }

  setupCustomCursor() {
    const cursor = document.querySelector('.custom-cursor');
    document.addEventListener('mousemove', (e) => {
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;
    });
  }

  navigateFiles(direction) {
    const newIndex = Math.max(0, Math.min(this.fileItems.length - 1, this.currentFileIndex + direction));
    this.selectFile(newIndex, false);
  }

  selectFile(index, shouldOpen = false) {
    this.fileItems.forEach(item => {
      item.classList.remove('active', 'keyboard-selected');
    });

    this.currentFileIndex = index;
    const selectedItem = this.fileItems[index];
    selectedItem.classList.add('active', 'keyboard-selected');

    if (shouldOpen) {
      this.openFile(selectedItem.dataset.section);
    }
  }

  openCurrentFile() {
    const selectedItem = this.fileItems[this.currentFileIndex];
    this.openFile(selectedItem.dataset.section);
  }

  openFile(section) {
    const selectedItem = this.fileItems[this.currentFileIndex];
    const isFolder = selectedItem.dataset.type === 'folder';
    
    if (isFolder) {
      const isExpanded = selectedItem.classList.contains('expanded');
      selectedItem.classList.toggle('expanded');
      selectedItem.classList.toggle('collapsed');
      
      if (isExpanded) {
        this.addTerminalOutput(`Collapsed folder: ${section}`, 'info');
      } else {
        this.addTerminalOutput(`Expanded folder: ${section}`, 'info');
        this.currentSection = section;
        this.showSection(section);
        this.updateStatusBar(section);
      }
    } else {
      this.currentSection = section;
      this.showSection(section);
      this.updateStatusBar(section);
      this.addTerminalOutput(`Opened file: ${section}`, 'success');
    }
  }

  goToParentDirectory() {
    this.selectFile(0, true);
    this.addTerminalOutput('Moved to parent directory', 'info');
  }

  showSection(section) {
    document.querySelectorAll('.content-section').forEach(s => {
      s.classList.remove('active');
    });

    const targetSection = document.getElementById(`${section}-section`);
    if (targetSection) {
      targetSection.classList.add('active');
      setTimeout(() => this.updateContentItems(), 100);
    }
  }

  showTerminalSection() {
    this.showSection('terminal');
    this.updateStatusBar('terminal');
    setTimeout(() => this.updateCursorPosition(), 50);
  }

  handleCommandInput(e) {
    const input = e.target;
    
    switch (e.key) {
      case 'Enter':
        this.executeCommand(input.value.trim());
        input.value = '';
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.navigateHistory(-1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        this.navigateHistory(1);
        break;
      case 'Tab':
        e.preventDefault();
        this.autoComplete(input);
        break;
      case 'Escape':
        input.blur();
        break;
    }
  }

  executeCommand(command) {
    if (!command) return;

    this.commandHistory.unshift(command);
    if (this.commandHistory.length > 100) {
      this.commandHistory.pop();
    }
    this.historyIndex = -1;

    this.addTerminalOutput(`$ ${command}`, 'prompt');

    const [cmd, ...args] = command.toLowerCase().split(' ');
    
    if (this.commands[cmd]) {
      this.commands[cmd](args);
    } else {
      this.addTerminalOutput(`Command not found: ${cmd}`, 'error');
      this.addTerminalOutput('Type "help" for available commands', 'comment');
    }

    this.scrollTerminalToBottom();
  }

  navigateHistory(direction) {
    const input = document.getElementById('command-input');
    
    if (direction === -1 && this.historyIndex < this.commandHistory.length - 1) {
      this.historyIndex++;
      input.value = this.commandHistory[this.historyIndex] || '';
    } else if (direction === 1 && this.historyIndex > -1) {
      this.historyIndex--;
      input.value = this.commandHistory[this.historyIndex] || '';
    }
  }

  autoComplete(input) {
    const partial = input.value.toLowerCase();
    const matches = Object.keys(this.commands).filter(cmd => cmd.startsWith(partial));
    
    if (matches.length === 1) {
      input.value = matches[0];
    } else if (matches.length > 1) {
      this.addTerminalOutput('Available commands:', 'info');
      this.addTerminalOutput(matches.join('  '), 'comment');
    }
  }

  showHelp() {
    const helpText = [
      'Available commands:',
      '',
      'File Operations:',
      '  ls                 List files and directories',
      '  cd <dir>          Change directory',
      '  cat <file>        Display file contents',
      '  pwd               Show current directory',
      '  tree              Show directory tree',
      '  find <name>       Find files by name',
      '  grep <text>       Search for text',
      '',
      'System:',
      '  whoami            Show current user',
      '  ps                Show running processes',
      '  top               Show system resources',
      '  uptime            Show system uptime',
      '  date              Show current date/time',
      '  neofetch          Show system information',
      '',
      'Terminal:',
      '  clear             Clear terminal screen',
      '  reset             Reset terminal',
      '  history           Show command history',
      '  echo <text>       Echo text to output',
      '  exit              Exit terminal',
      '',
      'Network:',
      '  ping <host>       Ping a host',
      '  curl <url>        Fetch URL content',
      '  ssh               Show SSH information',
      '',
      'Keyboard Shortcuts:',
      '  Ctrl+L            Clear screen',
      '  Ctrl+C            Interrupt command',
      '  Ctrl+R            Reset terminal',
      '  Ctrl+W            Close window',
      '  Ctrl+M            Minimize window',
      '  Ctrl+Shift+M      Maximize window',
      '  Tab               Auto-complete',
      '  Up/Down           Command history',
      '  Arrow keys        Navigate file explorer',
      '  Enter             Open selected file',
      '  ~ or `            Focus terminal input'
    ];
    
    helpText.forEach(line => {
      this.addTerminalOutput(line, line.includes(':') ? 'highlight' : 'comment');
    });
  }

  clearTerminal() {
    document.getElementById('terminal-output').innerHTML = '';
  }

  listFiles() {
    this.addTerminalOutput('total 5', 'comment');
    this.addTerminalOutput('drwxr-xr-x  1 0x5un5h1n3  staff   512 Jan  1 12:00 welcome/', 'info');
    this.addTerminalOutput('drwxr-xr-x  1 0x5un5h1n3  staff   512 Jan  1 12:00 projects/', 'info');
    this.addTerminalOutput('drwxr-xr-x  1 0x5un5h1n3  staff   512 Jan  1 12:00 connect/', 'info');
    this.addTerminalOutput('-rw-r--r--  1 0x5un5h1n3  staff  1024 Jan  1 12:00 about.md', 'info');
    this.addTerminalOutput('-rwxr-xr-x  1 0x5un5h1n3  staff  2048 Jan  1 12:00 terminal.js', 'success');
  }

  changeDirectory(dir) {
    if (!dir) {
      this.addTerminalOutput('Usage: cd <directory>', 'error');
      return;
    }

    const validDirs = ['welcome', 'projects', 'connect', 'about', 'terminal', '~', '/'];
    
    if (validDirs.includes(dir) || dir === '..') {
      if (dir === '..' || dir === '~' || dir === '/') {
        dir = 'welcome';
      }
      this.openFile(dir);
      this.addTerminalOutput(`Changed to: ${dir}`, 'success');
    } else {
      this.addTerminalOutput(`Directory not found: ${dir}`, 'error');
    }
  }

  showFile(file) {
    if (!file) {
      this.addTerminalOutput('Usage: cat <filename>', 'error');
      return;
    }

    const files = {
      'welcome.txt': 'welcome',
      'about.md': 'about',
      'projects': 'projects',
      'connect': 'connect',
      'terminal.js': 'terminal'
    };

    if (files[file]) {
      this.openFile(files[file]);
      this.addTerminalOutput(`Displaying: ${file}`, 'success');
    } else {
      this.addTerminalOutput(`File not found: ${file}`, 'error');
    }
  }

  showCurrentDirectory() {
    this.addTerminalOutput(`/home/0x5un5h1n3/portfolio/${this.currentSection}`, 'info');
  }

  showUser() {
    this.addTerminalOutput('0x5un5h1n3', 'success');
    this.addTerminalOutput('Software engineer with a passion for technology and cybersecurity', 'comment');
  }

  showDate() {
    this.addTerminalOutput(new Date().toString(), 'info');
  }

  showUptime() {
    const start = new Date('2024-01-01');
    const now = new Date();
    const days = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    this.addTerminalOutput(`System uptime: ${days} days`, 'info');
    this.addTerminalOutput('Load average: 0.42, 0.38, 0.35', 'comment');
  }

  showProcesses() {
    this.addTerminalOutput('PID    COMMAND', 'highlight');
    this.addTerminalOutput('1      /sbin/init', 'info');
    this.addTerminalOutput('42     portfolio.js', 'success');
    this.addTerminalOutput('128    terminal-emulator', 'info');
    this.addTerminalOutput('256    github-api-client', 'info');
    this.addTerminalOutput('512    websocket-server', 'info');
  }

  showTop() {
    this.addTerminalOutput('top - Interactive process viewer', 'highlight');
    this.addTerminalOutput('CPU: 15.2% user, 5.8% system, 79.0% idle', 'info');
    this.addTerminalOutput('Memory: 2.1GB used, 5.9GB free', 'info');
    this.addTerminalOutput('', '');
    this.addTerminalOutput('PID  CPU%  MEM%  COMMAND', 'highlight');
    this.addTerminalOutput('42   12.5  8.2   portfolio.js', 'success');
    this.addTerminalOutput('128  5.1   3.4   terminal-emulator', 'info');
  }

  showHistory() {
    this.addTerminalOutput('Command history:', 'highlight');
    this.commandHistory.slice(0, 10).reverse().forEach((cmd, i) => {
      this.addTerminalOutput(`${i + 1}  ${cmd}`, 'comment');
    });
  }

  echo(text) {
    this.addTerminalOutput(text || '', 'info');
  }

  showTree() {
    const tree = [
      '.',
      '├── welcome/',
      '│   └── intro.txt',
      '├── projects/',
      '│   ├── repositories.json',
      '│   └── showcase.md',
      '├── connect/',
      '│   └── connections.txt',
      '├── about.md',
      '└── terminal.js'
    ];
    
    tree.forEach(line => {
      this.addTerminalOutput(line, 'info');
    });
  }

  findFiles(name) {
    if (!name) {
      this.addTerminalOutput('Usage: find <filename>', 'error');
      return;
    }

    const files = ['welcome/', 'projects/', 'connect/', 'about.md', 'terminal.js'];
    const matches = files.filter(file => file.toLowerCase().includes(name.toLowerCase()));
    
    if (matches.length > 0) {
      matches.forEach(match => {
        this.addTerminalOutput(`./portfolio/${match}`, 'success');
      });
    } else {
      this.addTerminalOutput(`No files found matching: ${name}`, 'warning');
    }
  }

  grepContent(text) {
    if (!text) {
      this.addTerminalOutput('Usage: grep <search_text>', 'error');
      return;
    }

    this.addTerminalOutput(`Searching for: "${text}"`, 'info');
    this.addTerminalOutput('about.md:1: Digital craftsperson & system architect', 'success');
    this.addTerminalOutput('welcome/intro.txt:3: Interactive terminal portfolio', 'success');
  }

  showVimMessage() {
    this.addTerminalOutput('vim: command-line text editor', 'info');
    this.addTerminalOutput('Use file explorer or commands instead', 'comment');
  }

  showNanoMessage() {
    this.addTerminalOutput('nano: simple text editor', 'info');
    this.addTerminalOutput('Use file explorer or commands instead', 'comment');
  }

  showSSHMessage() {
    this.addTerminalOutput('SSH connections:', 'highlight');
    this.addTerminalOutput('github.com:22 - Active', 'success');
    this.addTerminalOutput('gitlab.com:22 - Active', 'success');
    this.addTerminalOutput('mastodon.social:443 - Connected', 'info');
  }

  curlCommand(url) {
    if (!url) {
      this.addTerminalOutput('Usage: curl <url>', 'error');
      return;
    }

    this.addTerminalOutput(`Fetching: ${url}`, 'info');
    setTimeout(() => {
      if (url.includes('github')) {
        this.addTerminalOutput('200 OK - GitHub API response received', 'success');
      } else {
        this.addTerminalOutput('Connection established', 'success');
      }
    }, 1000);
  }

  pingCommand(host) {
    if (!host) {
      this.addTerminalOutput('Usage: ping <hostname>', 'error');
      return;
    }

    this.addTerminalOutput(`PING ${host}:`, 'info');
    for (let i = 1; i <= 3; i++) {
      setTimeout(() => {
        const time = (Math.random() * 50 + 10).toFixed(1);
        this.addTerminalOutput(`64 bytes from ${host}: icmp_seq=${i} time=${time}ms`, 'success');
      }, i * 500);
    }
  }

  showChmodMessage() {
    this.addTerminalOutput('File permissions already optimal', 'success');
    this.addTerminalOutput('chmod: no changes needed', 'comment');
  }

  showSudoMessage() {
    this.addTerminalOutput('0x5un5h1n3 is already in the sudoers file', 'warning');
    this.addTerminalOutput('This incident will be reported', 'comment');
  }

  showSystemInfo() {
    const info = [
      '                   -`                    0x5un5h1n3@terminal',
      '                  .o+`                   ─────────────────────',
      '                 `ooo/                   OS: BTW Arch Linux x86_64',
      '                `+oooo:                  Host: Terminal Interface',
      '               `+oooooo:                 Kernel: JavaScript 5.0',
      '               -+oooooo+:                Uptime: Always online',
      '             `/:-:++oooo+:               Shell: bash 5.1.4',
      '            `/++++/+++++++:              Terminal: terminal.js',
      '           `/++++++++++++++:             CPU: Multi-threaded problem solver',
      '          `/+++ooooooooo+/`              Memory: Constantly expanding',
      '         ./ooosssso++osssssso+`          Disk: Projects, ideas, and code',
      '        .oossssso-````/ossssss+`         Theme: VS Code Dark+',
      '       -osssssso.      :ssssssso.        Icons: File type indicators',
      '      :osssssss/        osssso+++.       Terminal: Custom implementation',
      '     /ossssssss/        +ssssooo/-       Network: Always connected',
      '   `/ossssso+/:-        -:/+osssso+-     ──────────────────────────────',
      '  `+sso+:-`                 `.-/+oso:    ',
      ' `++:.                           `-/+/   ',
      ' .`                                 `/   '
    ];
    
    info.forEach(line => {
      this.addTerminalOutput(line, 'info');
    });
  }

  resetTerminal() {
    this.clearTerminal();
    this.addTerminalOutput('Terminal reset', 'success');
    this.addTerminalOutput('Type "help" for available commands', 'comment');
  }

  handleExit() {
    this.addTerminalOutput('There is no exit from the digital realm...', 'warning');
    this.addTerminalOutput('Use Ctrl+W to close the window instead', 'comment');
  }

  interruptCommand() {
    this.addTerminalOutput('^C', 'warning');
    this.addTerminalOutput('Command interrupted', 'comment');
  }

  // Window Controls
  handleClose() {
    const window = document.getElementById('terminal-window');
    const desktopIcon = document.getElementById('desktop-icon');
    const mobileNav = document.getElementById('mobile-nav');
    
    window.classList.add('closed');
    desktopIcon.style.display = 'flex';
    if (mobileNav) mobileNav.style.display = 'none';
    
    this.addTerminalOutput('Connection closed by user', 'warning');
    
    // Setup desktop icon double-click to reopen
    const reopenHandler = () => {
      window.classList.remove('closed');
      desktopIcon.style.display = 'none';
      if (mobileNav && window.innerWidth <= 768) mobileNav.style.display = 'block';
      this.addTerminalOutput('Terminal session restored', 'success');
      desktopIcon.removeEventListener('dblclick', reopenHandler);
    };
    
    desktopIcon.addEventListener('dblclick', reopenHandler);
  }

  toggleMinimize() {
    const window = document.getElementById('terminal-window');
    const dock = document.getElementById('desktop-dock');
    const dockTerminal = document.getElementById('dock-terminal');
    const mobileNav = document.getElementById('mobile-nav');
    
    this.isMinimized = !this.isMinimized;
    
    if (this.isMinimized) {
      window.classList.add('minimized');
      dock.style.display = 'block';
      if (mobileNav) mobileNav.style.display = 'none';
      this.addTerminalOutput('Window minimized to dock', 'warning');
      
      // Setup dock click to restore
      const restoreHandler = () => {
        window.classList.remove('minimized');
        dock.style.display = 'none';
        if (mobileNav && window.innerWidth <= 768) mobileNav.style.display = 'block';
        this.isMinimized = false;
        this.addTerminalOutput('Window restored from dock', 'info');
        dockTerminal.removeEventListener('click', restoreHandler);
      };
      
      dockTerminal.addEventListener('click', restoreHandler);
    } else {
      window.classList.remove('minimized');
      dock.style.display = 'none';
      if (mobileNav && window.innerWidth <= 768) mobileNav.style.display = 'block';
    }
  }

  toggleMaximize() {
    const window = document.getElementById('terminal-window');
    const maximizeBtn = document.getElementById('btn-maximize');
    
    this.isMaximized = !this.isMaximized;
    
    if (this.isMaximized) {
      window.classList.add('maximized');
      maximizeBtn.classList.add('maximized');
      this.addTerminalOutput('Window maximized', 'info');
    } else {
      window.classList.remove('maximized');
      maximizeBtn.classList.remove('maximized');
      this.addTerminalOutput('Window restored', 'info');
    }
  }

  async loadProjects() {
    const container = document.getElementById('projects-container');
    
    container.innerHTML = `
      <div class="loading-terminal">
        <div class="loading-line">
          <span class="terminal-prompt">0x5un5h1n3@terminal:~$</span>
          <span class="loading-command">curl -s https://api.github.com/users/0x5un5h1n3/repos</span>
        </div>
        <div class="loading-line">
          <span class="loading-text">Fetching repositories</span>
          <span class="loading-dots">...</span>
        </div>
        <div class="loading-line">
          <span class="loading-spinner">▓</span>
          <span class="loading-progress">Connecting to GitHub API...</span>
        </div>
      </div>
    `;
    
    const startTime = Date.now();
    const minLoadingTime = 800;
    
    try {
      const response = await fetch('https://api.github.com/users/0x5un5h1n3/repos?sort=updated&per_page=12');
      const repos = await response.json();
      
      this.projects = repos
        .filter(repo => !repo.fork && !repo.archived)
        .sort((a, b) => b.stargazers_count - a.stargazers_count);
      
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
      
      setTimeout(() => {
        container.innerHTML = `
          <div class="loading-terminal">
            <div class="loading-line">
              <span class="success">✓ Successfully fetched ${this.projects.length} repositories</span>
            </div>
            <div class="loading-line">
              <span class="comment">Parsing repository data...</span>
            </div>
          </div>
        `;
        
        setTimeout(() => this.renderProjects(), 300);
      }, remainingTime);
      
    } catch (error) {
      console.error('Failed to load projects:', error);
      
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
      
      setTimeout(() => {
        container.innerHTML = `
          <div class="loading-terminal">
            <div class="loading-line">
              <span class="error">✗ Failed to load GitHub repositories</span>
            </div>
            <div class="loading-line">
              <span class="comment">Check your internet connection and try again</span>
            </div>
          </div>
        `;
      }, remainingTime);
      
      this.addTerminalOutput('Failed to load GitHub repositories', 'error');
    }
  }

  renderProjects() {
    const container = document.getElementById('projects-container');
    container.innerHTML = '';
    
    this.projects.slice(0, this.displayedProjects).forEach((repo, index) => {
      setTimeout(() => {
        const card = this.createProjectCard(repo);
        container.appendChild(card);
      }, index * 100);
    });
    
    if (this.displayedProjects < this.projects.length) {
      setTimeout(() => {
        const loadMoreBtn = document.createElement('div');
        loadMoreBtn.className = 'load-more-btn';
        loadMoreBtn.innerHTML = `
          <div class="load-more-content">
            <span class="load-more-text">→ Load more repositories (${this.projects.length - this.displayedProjects} remaining)</span>
          </div>
        `;
        loadMoreBtn.addEventListener('click', () => this.loadMoreProjects());
        container.appendChild(loadMoreBtn);
      }, this.displayedProjects * 100 + 200);
    }
  }

  createProjectCard(repo) {
    const card = document.createElement('div');
    card.className = 'project-card';
    
    const updatedDate = new Date(repo.updated_at).toLocaleDateString();
    const language = repo.language || 'Text';
    
    card.innerHTML = `
      <div class="project-title">${repo.name}</div>
      <div class="project-description">
        ${repo.description || 'No description available'}
      </div>
      <div class="project-stats">
        <span>* ${repo.stargazers_count}</span>
        <span>↻ ${repo.forks_count}</span>
        <span>@ ${updatedDate}</span>
      </div>
      <div class="project-tags">
        <span class="tag">${language}</span>
        ${repo.topics ? repo.topics.slice(0, 2).map(topic => `<span class="tag">${topic}</span>`).join('') : ''}
      </div>
      <a href="${repo.html_url}" class="project-link" target="_blank" rel="noopener noreferrer">
        → View repository
      </a>
    `;
    
    return card;
  }

  loadMoreProjects() {
    const previousIndex = this.currentContentIndex;
    this.displayedProjects = Math.min(this.projects.length, this.displayedProjects + 6);
    this.renderProjects();
    this.addTerminalOutput(`Loaded more projects (${this.displayedProjects}/${this.projects.length})`, 'success');
    
    setTimeout(() => {
      this.updateContentItems();
      if (this.navigationMode === 'content' && this.contentItems.length > 0) {
        this.contentItems.forEach(item => item.classList.remove('keyboard-selected'));
        this.currentContentIndex = Math.min(previousIndex, this.contentItems.length - 1);
        this.contentItems[this.currentContentIndex].classList.add('keyboard-selected');
        this.contentItems[this.currentContentIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }

  closeTab() {
    this.addTerminalOutput('Tab closed - Terminal session ended', 'warning');
    this.clearTerminal();
    this.showSection('welcome');
    this.currentSection = 'welcome';
    this.updateStatusBar('welcome');
    this.switchToFilesMode();
    this.selectFile(0, false);
  }

  scrollPage(direction) {
    const terminalBody = document.getElementById('terminal-body');
    if (terminalBody) {
      const scrollAmount = 100;
      terminalBody.scrollTop += direction * scrollAmount;
    }
  }

  updateCursorPosition() {
    const input = document.getElementById('command-input');
    const inputLine = input.parentElement;
    
    if (!input || !inputLine) return;
    
    const prompt = inputLine.querySelector('.input-prompt');
    if (!prompt) return;
    
    if (prompt.offsetWidth === 0) {
      setTimeout(() => this.updateCursorPosition(), 100);
      return;
    }
    
    const tempSpan = document.createElement('span');
    tempSpan.style.visibility = 'hidden';
    tempSpan.style.position = 'absolute';
    tempSpan.style.fontFamily = getComputedStyle(input).fontFamily;
    tempSpan.style.fontSize = getComputedStyle(input).fontSize;
    tempSpan.style.fontWeight = getComputedStyle(input).fontWeight;
    
    let cursorPos;
    if (document.activeElement === input) {
      cursorPos = input.selectionStart || 0;
    } else {
      cursorPos = input.value.length;
    }
    
    const textBeforeCursor = input.value.substring(0, cursorPos);
    tempSpan.textContent = textBeforeCursor;
    
    document.body.appendChild(tempSpan);
    const textWidth = tempSpan.offsetWidth;
    document.body.removeChild(tempSpan);
    
    const promptWidth = prompt.offsetWidth;
    const gap = window.innerWidth <= 768 ? 24 : 8;
    const cursorLeft = promptWidth + textWidth + gap;
    
    inputLine.style.setProperty('--cursor-left', `${cursorLeft}px`);
  }

  addTerminalOutput(text, type = '') {
    const output = document.getElementById('terminal-output');
    const line = document.createElement('div');
    line.className = `output-line ${type}`;
    line.textContent = text;
    output.appendChild(line);
  }

  scrollTerminalToBottom() {
    const body = document.getElementById('terminal-body');
    body.scrollTop = body.scrollHeight;
  }

  updateStatusBar(section) {
    const statusSection = document.getElementById('current-section');
    if (statusSection) {
      statusSection.textContent = section;
    }
  }

  updateTime() {
    const timeElement = document.getElementById('current-time');
    const updateClock = () => {
      const now = new Date();
      timeElement.textContent = now.toLocaleTimeString('en-US', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    };
    
    updateClock();
    setInterval(updateClock, 1000);
  }

  focusCommandInput() {
    const input = document.getElementById('command-input');
    input.focus();
    this.showTerminalSection();
  }

  blurAll() {
    document.activeElement?.blur();
  }

  updateContentItems() {
    const activeSection = document.querySelector('.content-section.active');
    if (!activeSection) return;

    this.contentItems = Array.from(activeSection.querySelectorAll('a, button, .project-card, .connect-item, .load-more-btn'));
    this.currentContentIndex = 0;
  }

  navigateContent(direction, horizontal = false) {
    if (this.contentItems.length === 0) {
      this.updateContentItems();
    }

    if (this.contentItems.length === 0) return;

    this.contentItems.forEach(item => item.classList.remove('keyboard-selected'));

    if (horizontal) {
      const currentItem = this.contentItems[this.currentContentIndex];
      const isGrid = currentItem && currentItem.closest('.projects-grid');
      
      if (isGrid) {
        if (direction > 0) {
          this.currentContentIndex = Math.min(this.contentItems.length - 1, this.currentContentIndex + 1);
        } else {
          this.currentContentIndex = Math.max(0, this.currentContentIndex - 1);
        }
      } else {
        this.currentContentIndex = Math.max(0, Math.min(this.contentItems.length - 1, this.currentContentIndex + direction));
      }
    } else {
      const currentItem = this.contentItems[this.currentContentIndex];
      const isGrid = currentItem && currentItem.closest('.projects-grid');
      
      if (isGrid) {
        const itemsPerRow = 2;
        const movement = direction * itemsPerRow;
        this.currentContentIndex = Math.max(0, Math.min(this.contentItems.length - 1, this.currentContentIndex + movement));
      } else {
        this.currentContentIndex = Math.max(0, Math.min(this.contentItems.length - 1, this.currentContentIndex + direction));
      }
    }
    
    const currentItem = this.contentItems[this.currentContentIndex];
    currentItem.classList.add('keyboard-selected');
    currentItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  activateContentItem() {
    if (this.contentItems.length === 0) return;
    
    const currentItem = this.contentItems[this.currentContentIndex];
    if (currentItem.tagName === 'A') {
      currentItem.click();
    } else if (currentItem.tagName === 'BUTTON') {
      currentItem.click();
    } else if (currentItem.classList.contains('load-more-btn')) {
      currentItem.click();
    } else if (currentItem.classList.contains('project-card')) {
      const link = currentItem.querySelector('a');
      if (link) link.click();
    }
  }

  switchToContentMode() {
    this.navigationMode = 'content';
    this.updateContentItems();
    
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.remove('files-mode');
    sidebar.classList.add('content-mode');
    
    this.fileItems.forEach(item => item.classList.remove('keyboard-selected'));
    
    if (this.contentItems.length > 0) {
      this.currentContentIndex = 0;
      this.contentItems[0].classList.add('keyboard-selected');
      this.contentItems[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    this.addTerminalOutput('Switched to content navigation mode', 'info');
  }

  switchToFilesMode() {
    this.navigationMode = 'files';
    
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.remove('content-mode');
    sidebar.classList.add('files-mode');
    
    this.contentItems.forEach(item => item.classList.remove('keyboard-selected'));
    
    const selectedItem = this.fileItems[this.currentFileIndex];
    selectedItem.classList.add('keyboard-selected');
    
    this.addTerminalOutput('Switched to file explorer mode', 'info');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new TerminalPortfolio();
  
  document.addEventListener('contextmenu', (e) => e.preventDefault());
  
  document.addEventListener('selectstart', (e) => {
    if (!e.target.matches('input, textarea')) {
      e.preventDefault();
    }
  });
});