// Sistema de Agendamento - Blend Studio

document.addEventListener('DOMContentLoaded', function() {
  // Estado do agendamento
  const bookingState = {
    step: 1,
    service: null,
    serviceName: null,
    price: 0,
    professional: null,
    professionalName: null,
    date: null,
    time: null,
    clientName: null,
    clientPhone: null,
    clientEmail: null
  };

  // Elementos DOM
  const steps = document.querySelectorAll('.step');
  const stepContents = document.querySelectorAll('.booking-step-content');
  const serviceOptions = document.querySelectorAll('.service-option');
  const professionalOptions = document.querySelectorAll('.professional-option');
  const timeSlots = document.querySelectorAll('.time-slot');
  const btnNext = document.querySelectorAll('.btn-next');
  const btnPrev = document.querySelectorAll('.btn-prev');
  const btnConfirm = document.getElementById('btn-confirm');
  const bookingDate = document.getElementById('booking-date');

  // Configurar data mínima como hoje
  const today = new Date().toISOString().split('T')[0];
  if (bookingDate) {
    bookingDate.min = today;
  }

  // Seleção de serviço
  serviceOptions.forEach(option => {
    option.addEventListener('click', function() {
      // Remover seleção anterior
      serviceOptions.forEach(opt => opt.classList.remove('selected', 'border-gold'));
      
      // Adicionar seleção atual
      this.classList.add('selected', 'border-gold');
      
      // Atualizar estado
      bookingState.service = this.dataset.service;
      bookingState.serviceName = this.querySelector('h5').textContent;
      bookingState.price = parseFloat(this.dataset.price);
    });
  });

  // Seleção de profissional
  professionalOptions.forEach(option => {
    option.addEventListener('click', function() {
      // Remover seleção anterior
      professionalOptions.forEach(opt => opt.classList.remove('selected', 'border-gold'));
      
      // Adicionar seleção atual
      this.classList.add('selected', 'border-gold');
      
      // Atualizar estado
      bookingState.professional = this.dataset.professional;
      bookingState.professionalName = this.querySelector('h5').textContent;
    });
  });

  // Seleção de horário
  timeSlots.forEach(slot => {
    slot.addEventListener('click', function() {
      if (this.classList.contains('unavailable')) return;
      
      // Remover seleção anterior
      timeSlots.forEach(s => s.classList.remove('selected'));
      
      // Adicionar seleção atual
      this.classList.add('selected');
      
      // Atualizar estado
      bookingState.time = this.dataset.time;
    });
  });

  // Data change
  if (bookingDate) {
    bookingDate.addEventListener('change', function() {
      bookingState.date = this.value;
      // Simular horários indisponíveis aleatórios
      simulateUnavailableSlots();
    });
  }

  // Navegação entre steps
  btnNext.forEach(btn => {
    btn.addEventListener('click', function() {
      const nextStep = parseInt(this.dataset.next);
      goToStep(nextStep);
    });
  });

  btnPrev.forEach(btn => {
    btn.addEventListener('click', function() {
      const prevStep = parseInt(this.dataset.prev);
      goToStep(prevStep);
    });
  });

  // Confirmação do agendamento
  if (btnConfirm) {
    btnConfirm.addEventListener('click', function() {
      // Validar dados
      const name = document.getElementById('client-name').value;
      const phone = document.getElementById('client-phone').value;
      const email = document.getElementById('client-email').value;

      if (!bookingState.service) {
        alert('Por favor, selecione um serviço.');
        return;
      }

      if (!bookingState.professional) {
        alert('Por favor, selecione um profissional.');
        return;
      }

      if (!bookingState.date) {
        alert('Por favor, selecione uma data.');
        return;
      }

      if (!bookingState.time) {
        alert('Por favor, selecione um horário.');
        return;
      }

      if (!name || !phone || !email) {
        alert('Por favor, preencha todos os seus dados.');
        return;
      }

      // Atualizar estado com dados do cliente
      bookingState.clientName = name;
      bookingState.clientPhone = phone;
      bookingState.clientEmail = email;

      // Preencher resumo
      fillSummary();

      // Ir para step de confirmação
      goToStep(4);
    });
  }

  // Funções auxiliares
  function goToStep(stepNumber) {
    // Validar step atual antes de avançar
    if (stepNumber > bookingState.step) {
      if (!validateStep(bookingState.step)) {
        return;
      }
    }

    // Atualizar steps indicators
    steps.forEach((step, index) => {
      const stepNum = index + 1;
      step.classList.remove('active', 'completed');
      
      if (stepNum < stepNumber) {
        step.classList.add('completed');
      } else if (stepNum === stepNumber) {
        step.classList.add('active');
      }
    });

    // Mostrar conteúdo do step
    stepContents.forEach(content => {
      content.classList.add('d-none');
    });

    const currentContent = document.getElementById(`step${stepNumber}`);
    if (currentContent) {
      currentContent.classList.remove('d-none');
    }

    bookingState.step = stepNumber;
  }

  function validateStep(step) {
    switch(step) {
      case 1:
        if (!bookingState.service) {
          alert('Por favor, selecione um serviço.');
          return false;
        }
        break;
      case 2:
        if (!bookingState.professional) {
          alert('Por favor, selecione um profissional.');
          return false;
        }
        break;
      case 3:
        if (!bookingState.date || !bookingState.time) {
          alert('Por favor, selecione data e horário.');
          return false;
        }
        break;
    }
    return true;
  }

  function fillSummary() {
    document.getElementById('summary-service').textContent = bookingState.serviceName;
    document.getElementById('summary-professional').textContent = bookingState.professionalName;
    document.getElementById('summary-date').textContent = formatDate(bookingState.date);
    document.getElementById('summary-time').textContent = bookingState.time;
    document.getElementById('summary-client').textContent = bookingState.clientName;
    document.getElementById('summary-total').textContent = `R$ ${bookingState.price.toFixed(2).replace('.', ',')}`;
  }

  function formatDate(dateString) {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  }

  function simulateUnavailableSlots() {
    // Resetar todos os slots
    timeSlots.forEach(slot => {
      slot.classList.remove('unavailable');
    });

    // Marcar alguns slots como indisponíveis aleatoriamente
    const unavailableCount = Math.floor(Math.random() * 5) + 3;
    const slotsArray = Array.from(timeSlots);
    
    for (let i = 0; i < unavailableCount; i++) {
      const randomIndex = Math.floor(Math.random() * slotsArray.length);
      if (slotsArray[randomIndex]) {
        slotsArray[randomIndex].classList.add('unavailable');
      }
    }
  }

  // Inicializar
  goToStep(1);
});
