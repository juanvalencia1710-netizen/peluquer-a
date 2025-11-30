// Variables globales
let selectedServices = [];
let selectedTime = null;
let totalAmount = 0;
let reservations = [];

// URL de la API (cambiar si está en otro servidor)
const API_URL = 'http://localhost/barbershop-colombia/api.php';

// CONFIGURACIÓN DE LA BARBERÍA
const BARBERIA_CONFIG = {
    whatsapp: '573001234567',
    email: 'contacto@barbershop.com',
    nombre: 'BarberShop Colombia',
    direccion: 'Calle 123 #45-67, Medellín'
};

// Configurar fecha mínima (hoy)
const today = new Date().toISOString().split('T')[0];
document.getElementById('fecha').min = today;

// Cargar reservas al iniciar
loadReservations();

// Función para hacer peticiones a la API
async function apiRequest(action, method = 'GET', data = null) {
    try {
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        if (data && method !== 'GET') {
            options.body = JSON.stringify(data);
        }
        
        const response = await fetch(`${API_URL}?action=${action}`, options);
        return await response.json();
    } catch (error) {
        console.error('Error en la petición:', error);
        return { success: false, message: 'Error de conexión' };
    }
}

// Cargar reservas desde la base de datos
async function loadReservations() {
    const result = await apiRequest('obtener_reservas');
    
    if (result.success) {
        reservations = result.data || [];
        displayReservations();
    } else {
        console.error('Error al cargar reservas:', result.message);
    }
}

// Mostrar reservas
function displayReservations() {
    const listDiv = document.getElementById('reservationsList');
    
    if (!reservations || reservations.length === 0) {
        listDiv.innerHTML = `
            <p style="text-align: center; color: rgba(255, 255, 255, 0.5); padding: 40px;">
                No hay reservas registradas aún. ¡Sé el primero en reservar!
            </p>
        `;
        return;
    }

    listDiv.innerHTML = reservations.map((reserva, index) => `
        <div class="reservation-card">
            <div class="reservation-header">
                <div class="reservation-name">${reserva.cliente_nombre}</div>
                <div class="reservation-badge">${reserva.ciudad}</div>
            </div>
            <div class="reservation-info">
                <div class="info-item">
                    <span>📅</span>
                    <span>${formatDate(reserva.fecha_reserva)}</span>
                </div>
                <div class="info-item">
                    <span>⏰</span>
                    <span>${reserva.hora_reserva.substring(0, 5)}</span>
                </div>
                <div class="info-item">
                    <span>📱</span>
                    <span>${reserva.cliente_telefono}</span>
                </div>
                <div class="info-item">
                    <span>💰</span>
                    <span>$${parseFloat(reserva.total).toLocaleString()}</span>
                </div>
            </div>
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.1);">
                <strong style="color: #FCD116;">Servicios:</strong> ${reserva.servicios}
            </div>
            ${reserva.comentarios ? `
                <div style="margin-top: 10px; font-size: 0.9em; color: rgba(255,255,255,0.7);">
                    <strong>Comentarios:</strong> ${reserva.comentarios}
                </div>
            ` : ''}
            <div style="margin-top: 10px;">
                <span class="reservation-badge" style="background: ${getEstadoColor(reserva.estado)}">
                    ${getEstadoTexto(reserva.estado)}
                </span>
            </div>
            <div style="margin-top: 15px; display: flex; gap: 10px;">
                <button onclick="contactarCliente('${reserva.cliente_telefono}', '${reserva.cliente_nombre}', '${reserva.fecha_reserva}', '${reserva.hora_reserva}')" class="btn-contact">
                    📱 Contactar Cliente
                </button>
                <button onclick="reenviarConfirmacion(${index})" class="btn-contact btn-resend">
                    🔄 Reenviar
                </button>
            </div>
        </div>
    `).join('');
}

function getEstadoColor(estado) {
    const colores = {
        'pendiente': 'rgba(255, 193, 7, 0.3)',
        'confirmada': 'rgba(76, 175, 80, 0.3)',
        'completada': 'rgba(33, 150, 243, 0.3)',
        'cancelada': 'rgba(244, 67, 54, 0.3)'
    };
    return colores[estado] || 'rgba(255, 255, 255, 0.1)';
}

function getEstadoTexto(estado) {
    const textos = {
        'pendiente': '⏳ Pendiente',
        'confirmada': '✅ Confirmada',
        'completada': '🎉 Completada',
        'cancelada': '❌ Cancelada'
    };
    return textos[estado] || estado;
}

function formatDate(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('es-CO', options);
}

// WhatsApp Confirmaciones
function enviarConfirmacionWhatsApp(reservaData) {
    let telefono = reservaData.telefono.replace(/\D/g, '');
    
    if (!telefono.startsWith('57') && telefono.length === 10) {
        telefono = '57' + telefono;
    }
    
    const fechaFormateada = formatDate(reservaData.fecha);
    
    const mensaje = `
🎉 ¡RESERVA CONFIRMADA! 🎉

✂ BARBERSHOP COLOMBIA 💈

Hola ${reservaData.nombre}! Tu reserva ha sido confirmada exitosamente.

📅 Fecha: ${fechaFormateada}
⏰ Hora: ${reservaData.hora}
🏙 Ciudad: ${reservaData.ciudad}

💇‍♂ Servicios:
${reservaData.servicios.map(s => '  • ' + s).join('\n')}

💰 Total: $${reservaData.total.toLocaleString()} COP
`.trim();
    
    window.open(`https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`, '_blank');
}

function notificarBarberia(reservaData) {
    const fechaFormateada = formatDate(reservaData.fecha);
    
    const mensaje = `
🔔 NUEVA RESERVA RECIBIDA 🔔

👤 Cliente: ${reservaData.nombre}
📱 Teléfono: ${reservaData.telefono}
📅 Fecha: ${fechaFormateada}
⏰ Hora: ${reservaData.hora}
🏙 Ciudad: ${reservaData.ciudad}

💇‍♂ Servicios:
${reservaData.servicios.map(s => '  • ' + s).join('\n')}
`.trim();
    
    setTimeout(() => {
        window.open(`https://wa.me/${BARBERIA_CONFIG.whatsapp}?text=${encodeURIComponent(mensaje)}`, '_blank');
    }, 2000);
}

// Selección de Servicios
document.querySelectorAll('.service-item').forEach(item => {
    item.addEventListener('click', function() {
        this.classList.toggle('selected');
        updateSummary();
    });
});

function updateSummary() {
    selectedServices = [];
    totalAmount = 0;

    document.querySelectorAll('.service-item.selected').forEach(item => {
        const serviceName = item.querySelector('.service-name').textContent;
        const price = parseInt(item.dataset.price);
        selectedServices.push({ name: serviceName, price: price });
        totalAmount += price;
    });

    const servicesDiv = document.getElementById('selectedServices');

    if (selectedServices.length === 0) {
        servicesDiv.innerHTML = '<p style="color: #999;">No has seleccionado servicios</p>';
    } else {
        servicesDiv.innerHTML = selectedServices.map(s =>
            `<div class="summary-item">
                <span>${s.name}</span>
                <span>$${s.price.toLocaleString()}</span>
            </div>`
        ).join('');
    }

    document.getElementById('totalPrice').textContent = `$${totalAmount.toLocaleString()}`;
}

// ---------------------------------------------------------
// 🚀 SISTEMA DE HORAS — AHORA FUNCIONANDO SOLO CON <select>
// ---------------------------------------------------------

document.addEventListener("DOMContentLoaded", function () {
    const horaSelect = document.getElementById("hora");

    if (!horaSelect) return;

    const horasDisponibles = [
        "08:00 AM", "09:00 AM", "10:00 AM",
        "11:00 AM", "12:00 PM", "01:00 PM",
        "02:00 PM", "03:00 PM", "04:00 PM",
        "05:00 PM", "06:00 PM", "07:00 PM"
    ];

    horaSelect.innerHTML = "<option value='' disabled selected>Seleccionar hora</option>";

    horasDisponibles.forEach(hora => {
        const opcion = document.createElement("option");
        opcion.value = hora;
        opcion.textContent = hora;
        horaSelect.appendChild(opcion);
    });

    horaSelect.addEventListener("change", function () {
        selectedTime = horaSelect.value;
        console.log("Hora seleccionada:", selectedTime);
    });
});

// ---------------------------------------------------------

// Envío del formulario
document.getElementById('reservaForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    if (selectedServices.length === 0) {
        alert('❌ Por favor selecciona al menos un servicio');
        return;
    }

    if (!selectedTime) {
        alert('❌ Por favor selecciona una hora');
        return;
    }

    const telefono = document.getElementById('telefono').value.replace(/\D/g, '');
    if (telefono.length < 10) {
        alert('❌ Número de teléfono inválido');
        return;
    }

    const reservaData = {
        nombre: document.getElementById('nombre').value,
        telefono: document.getElementById('telefono').value,
        email: document.getElementById('email').value,
        fecha: document.getElementById('fecha').value,
        hora: selectedTime,
        ciudad: document.getElementById('ciudad').value,
        comentarios: document.getElementById('comentarios').value,
        servicios: selectedServices.map(s => s.name),
        total: totalAmount
    };

    const result = await apiRequest('crear_reserva', 'POST', reservaData);
    
    if (result.success) {
        document.getElementById('successModal').classList.add('show');
        enviarConfirmacionWhatsApp(reservaData);
        notificarBarberia(reservaData);
        resetForm();
    } else {
        alert('Error al guardar la reserva.');
    }
});

function resetForm() {
    document.getElementById('reservaForm').reset();
    document.querySelectorAll('.service-item').forEach(i => i.classList.remove('selected'));
    selectedServices = [];
    selectedTime = null;
    updateSummary();
}

function closeModal() {
    document.getElementById('successModal').classList.remove('show');
}

document.getElementById('successModal').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
});
