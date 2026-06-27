// Sistema Admin - Blend Studio

document.addEventListener('DOMContentLoaded', function() {
  
  // Dados Mock (simulando banco de dados)
  const db = {
    agendamentos: [
      { id: 1, cliente: 'Carlos Eduardo', servico: 'Corte Clássico', profissional: 'João Silva', data: '2024-01-15', hora: '10:00', valor: 50, status: 'confirmed' },
      { id: 2, cliente: 'Fernando Santos', servico: 'Barba Completa', profissional: 'Carlos Santos', data: '2024-01-15', hora: '11:00', valor: 35, status: 'completed' },
      { id: 3, cliente: 'Ricardo Oliveira', servico: 'Fade / Degradê', profissional: 'Pedro Oliveira', data: '2024-01-15', hora: '14:00', valor: 60, status: 'pending' },
      { id: 4, cliente: 'André Costa', servico: 'Combo Premium', profissional: 'João Silva', data: '2024-01-15', hora: '15:00', valor: 80, status: 'confirmed' },
      { id: 5, cliente: 'Bruno Almeida', servico: 'Corte Infantil', profissional: 'Carlos Santos', data: '2024-01-15', hora: '16:00', valor: 40, status: 'confirmed' },
      { id: 6, cliente: 'Daniel Ferreira', servico: 'Sobrancelha', profissional: 'Pedro Oliveira', data: '2024-01-15', hora: '17:00', valor: 20, status: 'cancelled' },
      { id: 7, cliente: 'Eduardo Lima', servico: 'Corte + Barba', profissional: 'João Silva', data: '2024-01-16', hora: '09:00', valor: 80, status: 'pending' },
      { id: 8, cliente: 'Fabio Souza', servico: 'Fade / Degradê', profissional: 'Carlos Santos', data: '2024-01-16', hora: '10:00', valor: 60, status: 'confirmed' },
    ],
    clientes: [
      { id: 1, nome: 'Carlos Eduardo', telefone: '(35) 99999-1111', email: 'carlos@email.com', ultimaVisita: '2024-01-10', totalVisitas: 12 },
      { id: 2, nome: 'Fernando Santos', telefone: '(35) 99999-2222', email: 'fernando@email.com', ultimaVisita: '2024-01-15', totalVisitas: 8 },
      { id: 3, nome: 'Ricardo Oliveira', telefone: '(35) 99999-3333', email: 'ricardo@email.com', ultimaVisita: '2024-01-12', totalVisitas: 15 },
      { id: 4, nome: 'André Costa', telefone: '(35) 99999-4444', email: 'andre@email.com', ultimaVisita: '2024-01-14', totalVisitas: 6 },
      { id: 5, nome: 'Bruno Almeida', telefone: '(35) 99999-5555', email: 'bruno@email.com', ultimaVisita: '2024-01-13', totalVisitas: 20 },
    ],
    servicos: [
      { id: 1, nome: 'Corte Clássico', duracao: '45 min', preco: 50, status: 'active' },
      { id: 2, nome: 'Barba Completa', duracao: '30 min', preco: 35, status: 'active' },
      { id: 3, nome: 'Fade / Degradê', duracao: '50 min', preco: 60, status: 'active' },
      { id: 4, nome: 'Combo Premium', duracao: '1h 15min', preco: 80, status: 'active' },
      { id: 5, nome: 'Corte Infantil', duracao: '40 min', preco: 40, status: 'active' },
      { id: 6, nome: 'Sobrancelha', duracao: '15 min', preco: 20, status: 'active' },
    ],
    profissionais: [
      { id: 1, nome: 'João Silva', especialidade: 'Cortes Clássicos e Barbas', status: 'active', foto: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=100&h=100&fit=crop&crop=face' },
      { id: 2, nome: 'Carlos Santos', especialidade: 'Fades e Degradês', status: 'active', foto: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=100&h=100&fit=crop&crop=face' },
      { id: 3, nome: 'Pedro Oliveira', especialidade: 'Estilo Moderno', status: 'active', foto: 'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=100&h=100&fit=crop&crop=face' },
    ]
  };

  // Login System
  const loginScreen = document.getElementById('loginScreen');
  const adminDashboard = document.getElementById('adminDashboard');
  const loginForm = document.getElementById('loginForm');

  // Verificar se já está logado
  if (localStorage.getItem('blendAdminLogged') === 'true') {
    showDashboard();
  }

  loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    // Login simples para demonstração
    if (email === 'admin@blendstudio.com.br' && password === 'admin123') {
      localStorage.setItem('blendAdminLogged', 'true');
      showDashboard();
    } else {
      alert('Email ou senha inválidos!\nUse: admin@blendstudio.com.br / admin123');
    }
  });

  function showDashboard() {
    loginScreen.style.display = 'none';
    adminDashboard.style.display = 'block';
    initializeTables();
    updateStats();
  }

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', function(e) {
    e.preventDefault();
    localStorage.removeItem('blendAdminLogged');
    location.reload();
  });

  // Navegação Sidebar
  const sidebarLinks = document.querySelectorAll('.sidebar-menu a[data-section]');
  const sections = document.querySelectorAll('.admin-section');
  const pageTitle = document.getElementById('pageTitle');

  sidebarLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Remover active de todos
      sidebarLinks.forEach(l => l.classList.remove('active'));
      sections.forEach(s => s.classList.remove('active'));
      
      // Adicionar active no atual
      this.classList.add('active');
      
      // Mostrar seção correspondente
      const sectionId = this.dataset.section;
      document.getElementById(sectionId).classList.add('active');
      
      // Atualizar título
      const titles = {
        dashboard: 'Dashboard',
        agendamentos: 'Gerenciar Agendamentos',
        clientes: 'Base de Clientes',
        servicos: 'Catálogo de Serviços',
        profissionais: 'Equipe de Profissionais',
        financeiro: 'Relatório Financeiro',
        configuracoes: 'Configurações'
      };
      pageTitle.textContent = titles[sectionId] || 'Dashboard';
    });
  });

  // Mobile Toggle
  document.getElementById('mobileToggle').addEventListener('click', function() {
    document.getElementById('sidebar').classList.toggle('show');
  });

  // Inicializar Tabelas
  function initializeTables() {
    initTabelaAgendamentos();
    initTabelaTodosAgendamentos();
    initTabelaClientes();
    initTabelaServicos();
    initTabelaProfissionais();
  }

  // Tabela Agendamentos Recentes (Dashboard)
  function initTabelaAgendamentos() {
    const tbody = document.querySelector('#tabelaAgendamentos tbody');
    tbody.innerHTML = '';
    
    db.agendamentos.slice(0, 5).forEach(apt => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${apt.cliente}</td>
        <td>${apt.servico}</td>
        <td>${apt.profissional}</td>
        <td>${formatDate(apt.data)} às ${apt.hora}</td>
        <td><span class="status-badge status-${apt.status}">${getStatusText(apt.status)}</span></td>
        <td>
          <button class="btn-action btn-view" onclick="verDetalhes(${apt.id})"><i class="bi bi-eye"></i></button>
          <button class="btn-action btn-edit" onclick="editarAgendamento(${apt.id})"><i class="bi bi-pencil"></i></button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Tabela Todos Agendamentos
  function initTabelaTodosAgendamentos() {
    $('#tabelaTodosAgendamentos').DataTable({
      data: db.agendamentos.map(apt => [
        `#${apt.id.toString().padStart(3, '0')}`,
        apt.cliente,
        apt.servico,
        apt.profissional,
        `${formatDate(apt.data)} às ${apt.hora}`,
        `R$ ${apt.valor.toFixed(2).replace('.', ',')}`,
        `<span class="status-badge status-${apt.status}">${getStatusText(apt.status)}</span>`,
        `
          <button class="btn-action btn-view" onclick="verDetalhes(${apt.id})"><i class="bi bi-eye"></i></button>
          <button class="btn-action btn-edit" onclick="editarAgendamento(${apt.id})"><i class="bi bi-pencil"></i></button>
          <button class="btn-action btn-delete" onclick="excluirAgendamento(${apt.id})"><i class="bi bi-trash"></i></button>
        `
      ]),
      columns: [
        { title: 'ID' },
        { title: 'Cliente' },
        { title: 'Serviço' },
        { title: 'Profissional' },
        { title: 'Data/Hora' },
        { title: 'Valor' },
        { title: 'Status' },
        { title: 'Ações' }
      ],
      language: {
        url: '//cdn.datatables.net/plug-ins/1.13.7/i18n/pt-BR.json'
      },
      order: [[0, 'desc']],
      pageLength: 10
    });
  }

  // Tabela Clientes
  function initTabelaClientes() {
    $('#tabelaClientes').DataTable({
      data: db.clientes.map(cli => [
        cli.nome,
        cli.telefone,
        cli.email,
        formatDate(cli.ultimaVisita),
        cli.totalVisitas,
        `
          <button class="btn-action btn-view"><i class="bi bi-eye"></i></button>
          <button class="btn-action btn-edit"><i class="bi bi-pencil"></i></button>
        `
      ]),
      columns: [
        { title: 'Nome' },
        { title: 'Telefone' },
        { title: 'Email' },
        { title: 'Última Visita' },
        { title: 'Total Visitas' },
        { title: 'Ações' }
      ],
      language: {
        url: '//cdn.datatables.net/plug-ins/1.13.7/i18n/pt-BR.json'
      }
    });
  }

  // Tabela Serviços
  function initTabelaServicos() {
    $('#tabelaServicos').DataTable({
      data: db.servicos.map(serv => [
        serv.nome,
        serv.duracao,
        `R$ ${serv.preco.toFixed(2).replace('.', ',')}`,
        `<span class="status-badge status-${serv.status === 'active' ? 'confirmed' : 'cancelled'}">${serv.status === 'active' ? 'Ativo' : 'Inativo'}</span>`,
        `
          <button class="btn-action btn-edit"><i class="bi bi-pencil"></i></button>
          <button class="btn-action btn-delete"><i class="bi bi-trash"></i></button>
        `
      ]),
      columns: [
        { title: 'Serviço' },
        { title: 'Duração' },
        { title: 'Preço' },
        { title: 'Status' },
        { title: 'Ações' }
      ],
      language: {
        url: '//cdn.datatables.net/plug-ins/1.13.7/i18n/pt-BR.json'
      }
    });
  }

  // Tabela Profissionais
  function initTabelaProfissionais() {
    $('#tabelaProfissionais').DataTable({
      data: db.profissionais.map(prof => [
        `<img src="${prof.foto}" alt="${prof.nome}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover;">`,
        prof.nome,
        prof.especialidade,
        `<span class="status-badge status-confirmed">Ativo</span>`,
        `
          <button class="btn-action btn-edit"><i class="bi bi-pencil"></i></button>
          <button class="btn-action btn-delete"><i class="bi bi-trash"></i></button>
        `
      ]),
      columns: [
        { title: 'Foto' },
        { title: 'Nome' },
        { title: 'Especialidade' },
        { title: 'Status' },
        { title: 'Ações' }
      ],
      language: {
        url: '//cdn.datatables.net/plug-ins/1.13.7/i18n/pt-BR.json'
      }
    });
  }

  // Atualizar Stats
  function updateStats() {
    const hoje = new Date().toISOString().split('T')[0];
    const agendamentosHoje = db.agendamentos.filter(a => a.data === hoje).length;
    
    document.getElementById('totalAgendamentos').textContent = agendamentosHoje;
    
    // Calcular faturamento do dia
    const faturamento = db.agendamentos
      .filter(a => a.data === hoje && a.status !== 'cancelled')
      .reduce((sum, a) => sum + a.valor, 0);
    
    document.getElementById('faturamentoDia').textContent = `R$ ${faturamento}`;
  }

  // Funções Globais
  window.verDetalhes = function(id) {
    const apt = db.agendamentos.find(a => a.id === id);
    if (!apt) return;
    
    const content = document.getElementById('detalhesAgendamentoContent');
    content.innerHTML = `
      <div class="row">
        <div class="col-md-6 mb-3">
          <strong>Cliente:</strong><br>${apt.cliente}
        </div>
        <div class="col-md-6 mb-3">
          <strong>Serviço:</strong><br>${apt.servico}
        </div>
        <div class="col-md-6 mb-3">
          <strong>Profissional:</strong><br>${apt.profissional}
        </div>
        <div class="col-md-6 mb-3">
          <strong>Data:</strong><br>${formatDate(apt.data)}
        </div>
        <div class="col-md-6 mb-3">
          <strong>Horário:</strong><br>${apt.hora}
        </div>
        <div class="col-md-6 mb-3">
          <strong>Valor:</strong><br>R$ ${apt.valor.toFixed(2).replace('.', ',')}
        </div>
        <div class="col-md-12 mb-3">
          <strong>Status:</strong><br>
          <span class="status-badge status-${apt.status}">${getStatusText(apt.status)}</span>
        </div>
      </div>
    `;
    
    new bootstrap.Modal(document.getElementById('verDetalhesModal')).show();
  };

  window.editarAgendamento = function(id) {
    alert('Funcionalidade de edição será implementada. ID: ' + id);
  };

  window.excluirAgendamento = function(id) {
    if (confirm('Tem certeza que deseja excluir este agendamento?')) {
      const index = db.agendamentos.findIndex(a => a.id === id);
      if (index > -1) {
        db.agendamentos.splice(index, 1);
        alert('Agendamento excluído com sucesso!');
        location.reload();
      }
    }
  };

  // Utilitários
  function formatDate(dateString) {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  }

  function getStatusText(status) {
    const statuses = {
      confirmed: 'Confirmado',
      pending: 'Pendente',
      completed: 'Concluído',
      cancelled: 'Cancelado'
    };
    return statuses[status] || status;
  }
});
