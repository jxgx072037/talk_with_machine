import math
import mimetypes
import time

# 引入Flask，物理引擎库panda3d
from flask import Flask, render_template
from flask_socketio import SocketIO, send
from direct.showbase.ShowBase import ShowBase
from panda3d.bullet import BulletWorld, BulletRigidBodyNode, BulletBoxShape, BulletPlaneShape
from panda3d.core import Vec3

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


# 定义画面中方块的位置
agent_position = [0, 0, 0]
start_switch = False


# 生成正弦波
def sin_wave(period=1, sample_interval=0.01):
    while True:
        for i in range(int(period / sample_interval)):
            x = 2 * 3.14159 * sample_interval
            y = 5 * math.sin(x * i)
            yield x, y
            time.sleep(sample_interval)


sin_generator = sin_wave()


def gen_sin():
    global agent_position
    while True:
        if start_switch:
            x, agent_position[1] = next(sin_generator)
            agent_position[0] += x
            send({'x': agent_position[0], 'y': agent_position[1], 'z': agent_position[2]}, broadcast=True)
        else:
            break


# 模拟自由落体
class PhiscalSimulation(ShowBase):
    def __init__(self):
        # 禁用窗口渲染
        self.windowType = 'none'
        ShowBase.__init__(self, windowType=self.windowType)

        # 创建Bullet物理世界
        self.world = BulletWorld()
        self.world.setGravity(Vec3(0, -9.8, 0))  # 设置重力

        # 创建地面刚体
        ground_shape = BulletPlaneShape(Vec3(0, 1, 0), -10)  # 创建一个平面形状
        ground_body = BulletRigidBodyNode('Ground')
        ground_body.addShape(ground_shape)
        ground_body.setFriction(1.0)  # 设置地面的摩擦系数
        ground_body.setRestitution(0.3)  # 设置地面的弹性系数
        # 注意：我们没有设置地面的质量，所以它是静态的，不会被重力影响

        # 将地面刚体添加到物理世界和场景图中
        self.world.attachRigidBody(ground_body)
        self.groundNP = self.render.attachNewNode(ground_body)

        # 创建刚体
        shape = BulletBoxShape(Vec3(0.5, 0.5, 0.5))  # 创建一个立方体形状
        # shape = BulletSphereShape(0.5)  # 创建一个球形形状，半径为0.5
        self.body = BulletRigidBodyNode('Box')
        self.body.addShape(shape)
        self.body.setMass(1.0)  # 设置质量
        self.body.setFriction(1.0)  # 设置方块的摩擦系数
        self.body.setRestitution(0.1)  # 设置方块的弹性系数

        # 将刚体添加到物理世界和场景图中
        self.world.attachRigidBody(self.body)
        self.boxNP = self.render.attachNewNode(self.body)

        # 设置方块的初始位置
        initial_position = Vec3(0, 0, 0)
        self.boxNP.setPos(initial_position)

        # 外部施加的合力
        self.force = Vec3(0, 0, 0)

    def send_position_to_frontend(self):
        position = self.boxNP.getPos()
        agent_position[0], agent_position[1], agent_position[2] = position.x, position.y, position.z
        send({'x': agent_position[0], 'y': agent_position[1], 'z': agent_position[2]}, broadcast=True)

    def pid(self, target_position):
        time_step = 1 / 200.0  # 设置更新间隔
        previous_error, integral = 0, Vec3(0, 0, 0)
        global agent_position
        while True:
            if start_switch:
                kp, ki, kd = 10, 25, 250
                error = Vec3(*target_position) - Vec3(*agent_position)
                integral = integral + error * time_step
                derivative = error-previous_error
                self.force = error * kp + integral * ki + derivative * kd  # Vec3和int相乘，int必须放后边
                previous_error = error
                self.body.applyCentralForce(self.force)

                dt = globalClock.getDt()
                self.world.doPhysics(dt)  # 更新物理世界

                self.send_position_to_frontend()
                time.sleep(time_step)  # 添加延迟以使模拟速度与现实一致
            else:
                break

    def free_falling(self):
        time_step = 1 / 200.0  # 设置更新间隔，模拟现实世界刚体下坠
        self.body.applyCentralForce(Vec3(0, 0, 0))
        global agent_position
        while True:
            if start_switch:
                dt = globalClock.getDt()
                self.world.doPhysics(dt)  # 更新物理世界

                self.send_position_to_frontend()
                time.sleep(time_step)  # 添加延迟以使模拟速度与现实一致
            else:
                break


phiscal_simulation = PhiscalSimulation()


@socketio.on('start_button')
def start(msg):
    global start_switch, agent_position
    mode, start_switch = msg[:2]

    if mode == 'sin':
        gen_sin()
    elif mode == 'free_falling':
        phiscal_simulation.boxNP.setPos(Vec3(agent_position[0], agent_position[1], agent_position[2]))
        phiscal_simulation.free_falling()
    elif mode == 'pid':
        phiscal_simulation.boxNP.setPos(Vec3(agent_position[0], agent_position[1], agent_position[2]))
        target_position = [5, 5, 5]
        phiscal_simulation.pid(target_position)


if __name__ == '__main__':
    socketio.run(app, debug=True, allow_unsafe_werkzeug=True)
