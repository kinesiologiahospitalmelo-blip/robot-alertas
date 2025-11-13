// ----- TABS -----
document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
        document.getElementById(btn.dataset.tab).classList.add("active");
    };
});


// ----- CARGAR ACCIONES -----
async function loadActions() {
    let res = await fetch("/api/actions");
    let data = await res.json();

    let box = document.getElementById("acciones-list");
    box.innerHTML = "";

    for (let symbol in data) {
        let item = data[symbol];
        box.innerHTML += `
            <div class="card">
                <b>${symbol}</b><br>
                Up: ${item.up} — Down: ${item.down}<br>
                <label>
                    <input type="checkbox" ${item.active ? "checked" : ""} 
                        onchange="toggleActive('${symbol}', this.checked)"> Activo
                </label>
                <button onclick="deleteAction('${symbol}')">Eliminar</button>
            </div>`;
    }
}
loadActions();


// ----- AGREGAR ACCIÓN -----
document.getElementById("btn-add").onclick = async () => {
    let symbol = document.getElementById("new-symbol").value;
    let up = document.getElementById("new-up").value;
    let down = document.getElementById("new-down").value;

    await fetch("/api/add", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({symbol, up, down})
    });

    loadActions();
};


// ----- SETTINGS TELEGRAM -----
async function loadSettings() {
    let res = await fetch("/api/settings");
    let s = await res.json();
    document.getElementById("tg-token").value = s.token || "";
    document.getElementById("tg-chat").value = s.chat_id || "";
}
loadSettings();

document.getElementById("btn-save-tg").onclick = async () => {
    let token = document.getElementById("tg-token").value;
    let chat_id = document.getElementById("tg-chat").value;

    await fetch("/api/settings", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({token, chat_id})
    });

    alert("Guardado");
};


// ----- TEST TELEGRAM -----
document.getElementById("btn-test-tg").onclick = async () => {
    await fetch("/api/settings"); // asegura lectura

    let token = document.getElementById("tg-token").value;
    let chat_id = document.getElementById("tg-chat").value;

    fetch(`https://api.telegram.org/bot${token}/sendMessage?chat_id=${chat_id}&text=Prueba OK`);
    
    alert("Mensaje enviado (si token y chat_id son válidos)");
};


// ----- LOGS -----
document.getElementById("btn-refresh-logs").onclick = async () => {
    let res = await fetch("/api/logs");
    let logs = await res.json();
    document.getElementById("logs-box").textContent = logs.join("\n");
};
