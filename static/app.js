// ============================
// CAMBIO DE TABS
// ============================
document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll(".tab").forEach(sec => sec.classList.remove("active"));
        document.getElementById(btn.dataset.tab).classList.add("active");
    };
});

// ============================
// CARGAR ACCIONES
// ============================
function cargarAcciones() {
    fetch("/api/actions")
        .then(r => r.json())
        .then(data => {
            const box = document.getElementById("acciones-list");
            box.innerHTML = "";

            Object.keys(data).forEach(symbol => {
                const info = data[symbol];

                box.innerHTML += `
                    <div class="item">
                        <b>${symbol}</b>
                        &nbsp;|&nbsp; ⬆ ${info.up} &nbsp;|&nbsp; ⬇ ${info.down}
                        &nbsp;|&nbsp; Activa: 
                        <input type="checkbox" ${info.active ? "checked" : ""} 
                            onchange="toggleAccion('${symbol}', this.checked)">
                        <button onclick="borrarAccion('${symbol}')">❌</button>
                    </div>
                `;
            });
        });
}

cargarAcciones();

// ============================
// AGREGAR ACCIÓN
// ============================
document.getElementById("btn-add").onclick = () => {
    const symbol = document.getElementById("new-symbol").value;
    const up = document.getElementById("new-up").value;
    const down = document.getElementById("new-down").value;

    fetch("/api/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, up, down })
    }).then(() => cargarAcciones());
};

// ============================
// ACTIVAR / DESACTIVAR ACCIÓN
// ============================
function toggleAccion(symbol, active) {
    fetch("/api/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, active })
    });
}

// ============================
// BORRAR ACCIÓN
// ============================
function borrarAccion(symbol) {
    fetch("/api/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol })
    }).then(() => cargarAcciones());
}

// ============================
// TELEGRAM
// ============================
document.getElementById("btn-save-tg").onclick = () => {
    const token = document.getElementById("tg-token").value;
    const chat_id = document.getElementById("tg-chat").value;

    fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, chat_id })
    }).then(() => alert("Guardado"));
};

document.getElementById("btn-test-tg").onclick = () => {
    fetch("/api/test-telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}"
    })
    .then(r => r.json())
    .then(() => alert("Mensaje enviado a Telegram"))
    .catch(() => alert("Error enviando mensaje"));
};

// ============================
// LOGS
// ============================
document.getElementById("btn-refresh-logs").onclick = () => {
    fetch("/api/logs")
        .then(r => r.json())
        .then(lines => {
            document.getElementById("logs-box").textContent = lines.join("\n");
        });
};
