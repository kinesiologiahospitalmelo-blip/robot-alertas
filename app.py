import json
import threading
import time
import datetime
import pytz
import yfinance as yf
import requests
from flask import Flask, request, jsonify

app = Flask(__name__)

ACTIONS_PATH = "static/actions.json"
SETTINGS_PATH = "static/settings.json"
LOGS_PATH = "static/logs.txt"

CHECK_TIMES = [(9, 0), (13, 0), (16, 0)]  # horarios AR

robot_running = True


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


# ------------ API acciones ----------------
@app.route("/api/actions")
def api_get_actions():
   return jsonify(read_json(ACTIONS_PATH))


@app.route("/api/add", methods=["POST"])
def api_add_action():
   req = request.json
   symbol = req["symbol"].upper()
   up = float(req["up"])
   down = float(req["down"])

   data = read_json(ACTIONS_PATH)
   data[symbol] = {"up": up, "down": down, "active": True}
   write_json(ACTIONS_PATH, data)

   save_log(f"Añadida {symbol}")
   return jsonify({"ok": True})


@app.route("/api/delete", methods=["POST"])
def api_delete_action():
   req = request.json
   symbol = req["symbol"]
   data = read_json(ACTIONS_PATH)

   if symbol in data:
       del data[symbol]
       write_json(ACTIONS_PATH, data)

   save_log(f"Eliminada {symbol}")
   return jsonify({"ok": True})


# ------------ API settings ---------------
@app.route("/api/settings", methods=["GET"])
def api_get_settings():
   return jsonify(read_json(SETTINGS_PATH))


@app.route("/api/settings", methods=["POST"])
def api_save_settings():
   data = {
       "token": request.json["token"],
       "chat_id": request.json["chat_id"]
   }
   write_json(SETTINGS_PATH, data)
   save_log("Configuración Telegram actualizada")
   return jsonify({"ok": True})


# ------------ API test telegram -----------
@app.route("/api/send-test", methods=["POST"])
def api_send_test():
   s = read_json(SETTINGS_PATH)
   enviar_telegram(s.get("token"), s.get("chat_id"), "Mensaje de prueba desde Robot de Alertas ✔")
   save_log("Test Telegram enviado")
   return jsonify({"ok": True})


# ---------- telegram ---------------------
def enviar_telegram(token, chat_id, mensaje):
   if not token or not chat_id:
       return
   try:
       url = f"https://api.telegram.org/bot{token}/sendMessage"
       requests.post(url, data={"chat_id": chat_id, "text": mensaje})
   except Exception as e:
       save_log(f"Error Telegram: {e}")


# ---------- robot ---------
def robot_loop():
   tz_ar = pytz.timezone("America/Argentina/Buenos_Aires")
   last_run = set()
   save_log("Robot iniciado")

   while robot_running:
       now = datetime.datetime.now(tz_ar)
       hm = (now.hour, now.minute)
       key = (now.date(), now.hour, now.minute)

       if hm in CHECK_TIMES and key not in last_run:
           last_run.add(key)

           settings = read_json(SETTINGS_PATH)
           token = settings.get("token")
           chat_id = settings.get("chat_id")

           acciones = read_json(ACTIONS_PATH)
           save_log(f"Chequeo {hm}")

           for symbol, info in acciones.items():
               try:
                   data = yf.Ticker(symbol).history(period="1d", interval="1m")
                   precio = float(data["Close"].iloc[-1])
               except:
                   save_log(f"Error precio {symbol}")
                   continue

               if precio >= info["up"]:
                   msg = f"📈 {symbol} superó {info['up']} → {precio:.2f}"
                   enviar_telegram(token, chat_id, msg)
                   save_log(msg)

               if precio <= info["down"]:
                   msg = f"📉 {symbol} bajó de {info['down']} → {precio:.2f}"
                   enviar_telegram(token, chat_id, msg)
                   save_log(msg)

       time.sleep(30)


threading.Thread(target=robot_loop, daemon=True).start()


@app.route("/")
def index():
   return "<h1>Activo — Abrí /static/index.html</h1>"


if __name__ == "__main__":
   app.run(host="0.0.0.0", port=10000)
