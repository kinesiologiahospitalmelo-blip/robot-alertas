const api = (endpoint, method="GET", data=null) => {
    return fetch(endpoint, {
        method: method,
        headers: {"Content-Type": "application/json"},
        body: data ? JSON.stringify(data) : null
    }).then(r => r.json());
};

// ================= TABS =================
document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
        document.getElementById(btn.dataset.tab).classList.add("active");
    };
});

// ================= ACCIONES =================
function loadActions() {
    api("/api/actions").then(data => {
        let html = "";
        for (let symbol in data) {
            const info = data[symbol];

            html += `
            <div class="card">
                <b>${symbol}</b> — Alza: ${info.up} · Baja: ${info.down}
                <br>
                Estado: <b>${info.active ? "ACTIVA" : "INACTIVA"}</b>
                <br>
                <button onclick="toggleAction('${symbol}', ${!info.active})">
                    ${info.active ? "Desactivar" : "Activar"}
                </button>
                <button onclick="deleteAction('${symbol}')">Eliminar</button>
            </div>
            <hr>`;
        }
        document.getElementById("acciones-list").innerHTML = html;
    });
}

function toggleAction(symbol, state) {
    api("/api/update", "POST", {symbol: symbol, active: state}).then(loadActions);
}

function deleteAction(symbol) {
    api("/api/delete", "POST", {symbol: symbol}).then(loadActions);
}

document.getElementById("btn-add").onclick = () => {
    const s = document.getElementById("new-symbol").value.toUpperCase();
    const u = document.getElementById("new-up").value;
    const d = document.getElementById("new-down").value;

    api("/api/add", "POST", {symbol: s, up: u, down: d}).then(() => {
        document.getElementById("new-symbol").value = "";
        document.getElementById("new-up").value = "";
        document.getElementById("new-down").value = "";
        loadActions();
    });
};

loadActions();

// ================= TELEGRAM =================
document.getElementById("btn-save-tg").onclick = () => {
    const token = document.getElementById("tg-token").value;
    const chat = document.getElementById("tg-chat").value;

    api("/api/settings", "POST", {token: token, chat_id: chat});
};

document.getElementById("btn-test-tg").onclick = () => {
    api("/api/settings").then(s => {
        fetch(`https://api.telegram.org/bot${s.token}/sendMessage?chat_id=${s.chat_id}&text=Test desde Robot Alertas`);
    });
};

// ================= LOGS =================
document.getElementById("btn-refresh-logs").onclick = () => {
    api("/api/logs").then(logs => {
        document.getElementById("logs-box").textContent = logs.join("\n");
    });
};