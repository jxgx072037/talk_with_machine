from flask import Flask, send_file, render_template
from flask_socketio import SocketIO, send
import mimetypes, random, time, math

# 强制指定返回给前端的文件类型
mimetypes.add_type('text/css', '.css')
mimetypes.add_type('application/javascript', '.js')

app = Flask(__name__)

# 创建websocket通信
app.config['SECRET_KEY'] = 'mysecretkey'
socketio = SocketIO(app)


@app.route('/')
def index():
    return render_template('index.html')


def sine_wave(period=1, sample_interval=0.01):
    while True:
        for i in range(int(period / sample_interval)):
            x = 2 * 3.14159 * sample_interval
            y = 5 * math.sin(x * i)
            yield x, y
            time.sleep(sample_interval)


@socketio.on('message')
def handleMessage(msg):
    sine_generator = sine_wave()
    while True:
        x, y = next(sine_generator)
        send({'x': x, 'y': y}, broadcast=True)


if __name__ == '__main__':
    socketio.run(app, debug=True, allow_unsafe_werkzeug=True)
