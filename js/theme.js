// Função para alternar entre os modos claro e escuro
function toggleTheme() {
    // Verifica se o body tem a classe light-mode
    const body = document.body;
    const isDarkMode = !body.classList.contains('light-mode');
    
    // Alterna a classe light-mode no body
    if (isDarkMode) {
        body.classList.add('light-mode');
        localStorage.setItem('theme', 'light');
        document.getElementById('theme-toggle-text').textContent = '🌑 Dark';
    } else {
        body.classList.remove('light-mode');
        localStorage.setItem('theme', 'dark');
        document.getElementById('theme-toggle-text').textContent = '☀ Light';
    }
}

// Função para verificar e aplicar o tema salvo no localStorage
function applyTheme() {
    const savedTheme = localStorage.getItem('theme');
    const themeToggleText = document.getElementById('theme-toggle-text');
    
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        if (themeToggleText) themeToggleText.textContent = '🌑 Dark';
    } else {
        document.body.classList.remove('light-mode');
        if (themeToggleText) themeToggleText.textContent = '☀ Light';
    }
}

// Executar ao carregar a página
document.addEventListener('DOMContentLoaded', function() {
    // Adicionar o botão de alternância de tema ao DOM
    const themeToggle = document.createElement('button');
    themeToggle.className = 'theme-toggle';
    themeToggle.innerHTML = '<span id="theme-toggle-text">☀ Light</span>';
    themeToggle.onclick = toggleTheme;
    document.body.appendChild(themeToggle);
    
    // Aplicar o tema salvo
    applyTheme();
}); 