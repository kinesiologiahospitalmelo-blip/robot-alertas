// Tabs
document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
        document.querySelector("#" + btn.dataset.tab).classList.add("active");
    });
});

// ======================= ACCIONES ===========================
function cargarAcciones() {
    fetch("/api/actions")
        .then(r => r.json())
        .then(data => {
            const cont = document.getElementById("acciones-list");
            cont.innerHTML = "";

            Object.keys(data).forEach(symbol => {
                const info = data[symbol];
                const row = document.createElement("div");
                row.className = "accion-item";
                row.innerHTML = `
                    <b>${symbol}</b> — 
                    ↑ ${info.up} — 
                    ↓ ${info.down}
                    <button onclick="borrar('${symbol}')">❌</button>
                `;
                cont.appendChild(row);
            });
        });
}

function borrar(symbol) {
    fetch("/api/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol })
    }).then(() => cargarAcciones());
}

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

cargarAcciones();

// ======================= TELEGRAM ===========================
document.getElementById("btn-save-tg").onclick = () => {
    const token = document.getElementById("tg-token").value;
    const chat_id = document.getElementById("tg-chat").value;

    fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, chat_id })
    }).then(() => alert("Guardado ✔"));
};

document.getElementById("btn-test-tg").onclick = () => {
    fetch("/api/send-test", { method: "POST" });
};

// ====================== LOGS ============================
document.getElementById("btn-refresh-logs").onclick = () => {
    fetch("/api/logs")
        .then(r => r.json())
        .then(lines => {
            document.getElementById("logs-box").textContent = lines.join("\n");
        });
};
