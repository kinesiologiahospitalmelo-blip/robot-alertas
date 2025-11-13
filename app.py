import json
import threading
import time
import datetime
import pytz
import yfinance as yf
import requests
from flask import Flask, request, jsonify

app = Flask(__name__)

ACTIONS_PATH = "actions.json"
SETTINGS_PATH = "settings.json"
LOGS_PATH = "logs.txt"

CHECK_TIMES = [(9, 0), (13, 0), (16, 0)] # Horarios fijos AR

robot_running = True

# -----------------------------
# JSON HELPERS
# -----------------------------
def read_json(path):
    try:
        with open(path, "r") as f:
            return json.load(f)
    except:
        return {}

def write_json(path, data):
    with open(path, "w") as f:
        json.dump(data, f, indent=4)

def save_log(text):
    stamp = datetime.datetime.now().strftime("[%Y-%m-%d %H:%M]")
    with open(LOGS_PATH, "a") as f:
        f.write(stamp + " " + text + "\n")


# -----------------------------
# API ACCIONES
# -----------------------------
@app.route("/api/actions", methods=["GET"])
def api_get_actions():
    return jsonify(read_json(ACTIONS_PATH))

@app.route("/api/add", methods=["POST"])
def api_add_action():
    req = request.json
    symbol = req.get("symbol", "").upper()
    up = float(req.get("up"))
    down = float(req.get("down"))

    data = read_json(ACTIONS_PATH)
    data[symbol] = {"up": up, "down": down, "active": True}
    write_json(ACTIONS_PATH, data)

    save_log(f"Añadida acción {symbol}")
    return jsonify({"ok": True})

@app.route("/api/update", methods=["POST"])
def api_update():
    req = request.json
    symbol = req.get("symbol")

    data = read_json(ACTIONS_PATH)
    if symbol not in data:
        return jsonify({"error": "No existe"}), 404

    if req.get("up") is not None:
        data[symbol]["up"] = float(req["up"])
    if req.get("down") is not None:
        data[symbol]["down"] = float(req["down"])
    if req.get("active") is not None:
        data[symbol]["active"] = bool(req["active"])

    write_json(ACTIONS_PATH, data)
    save_log(f"Actualizada acción {symbol}")
    return jsonify({"ok": True})

@app.route("/api/delete", methods=["POST"])
def api_delete():
    req = request.json
    symbol = req.get("symbol")

    data = read_json(ACTIONS_PATH)
    if symbol in data:
        del data[symbol]
        write_json(ACTIONS_PATH, data)
        save_log(f"Eliminada acción {symbol}")

    return jsonify({"ok": True})


# -----------------------------
# API SETTINGS (Token + ChatID)
# -----------------------------
@app.route("/api/settings", methods=["GET"])
def api_get_settings():
    return jsonify(read_json(SETTINGS_PATH))

@app.route("/api/settings", methods=["POST"])
def api_save_settings():
    req = request.json
    write_json(SETTINGS_PATH, {
        "token": req.get("token"),
        "chat_id": req.get("chat_id")
    })
    save_log("Guardados token/chat_id")
    return jsonify({"ok": True})


# -----------------------------
# API LOGS
# -----------------------------
@app.route("/api/logs", methods=["GET"])
def api_logs():
    try:
        with open(LOGS_PATH) as f:
            return jsonify(f.read().splitlines())
    except:
        return jsonify([])


# -----------------------------
# TELEGRAM
# -----------------------------
def enviar_telegram(token, chat_id, mensaje):
    if not token or not chat_id:
        return

    try:
        url = f"https://api.telegram.org/bot{token}/sendMessage"
        requests.post(url, data={"chat_id": chat_id, "text": mensaje}, timeout=10)
    except:
        save_log("Error enviando Telegram")


@app.route("/api/test-telegram", methods=["POST"])
def test_tg():
    settings = read_json(SETTINGS_PATH)
    token = settings.get("token")
    chat_id = settings.get("chat_id")

    enviar_telegram(token, chat_id, "✅ Test recibido: el bot funciona.")
    save_log("Test Telegram enviado")

    return jsonify({"ok": True})


# -----------------------------
# LOOP DEL ROBOT
# -----------------------------
def robot_loop():
    tz = pytz.timezone("America/Argentina/Buenos_Aires")
    last_run = set()

    save_log("Robot iniciado")

    while robot_running:
        now = datetime.datetime.utcnow().replace(tzinfo=pytz.utc).astimezone(tz)
        hm = (now.hour, now.minute)
        key = (now.date(), now.hour, now.minute)

        if hm in CHECK_TIMES and key not in last_run:
            last_run.add(key)

            settings = read_json(SETTINGS_PATH)
            acciones = read_json(ACTIONS_PATH)

            save_log(f"Chequeo {hm}")

            for s, info in acciones.items():
                if not info.get("active"):
                    continue

                try:
                    data = yf.Ticker(s).history(period="1d", interval="1m")
                    precio = float(data["Close"].iloc[-1])
                except:
                    save_log(f"Error precio {s}")
                    continue

                if precio >= info["up"]:
                    msg = f"📈 {s} superó {info['up']} → {precio:.2f}"
                    enviar_telegram(settings["token"], settings["chat_id"], msg)
                    save_log(msg)

                if precio <= info["down"]:
                    msg = f"📉 {s} bajó de {info['down']} → {precio:.2f}"
                    enviar_telegram(settings["token"], settings["chat_id"], msg)
                    save_log(msg)

        time.sleep(30)


threading.Thread(target=robot_loop, daemon=True).start()


# -----------------------------
# SERVER
# -----------------------------
@app.route("/")
def home():
    return "<h1>Servidor OK → /static/index.html</h1>"


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)
