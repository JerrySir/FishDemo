const {ccclass, property} = cc._decorator;

@ccclass
export default class Helloworld extends cc.Component {

    @property({type: cc.Integer, displayName: "掉落球的数量"})
    numberOfTopBall: Number = 20;

    @property(cc.Node)
    gameBox: cc.Node = null;

    @property({type: cc.Prefab, displayName: "鱼塘上面球的Prefab"})
    topBallPrefab: cc.Prefab = null;

    @property({type: cc.Prefab, displayName: "鱼塘里面球的Prefab"})
    bottomBallPrefab: cc.Prefab = null;

    @property({type: cc.Node, displayName: "鱼塘Node"})
    water: cc.Node = null;

    @property({type: cc.Prefab, displayName: "鱼的Prefab"})
    fishPrefab: cc.Prefab = null;

    @property({type: cc.SpriteAtlas, displayName: "鱼的资源图片"})
    fishAtlas: cc.SpriteAtlas = null;

    @property({type: cc.AudioClip, displayName: "发射BottomBall的声音"})
    hitAudio: cc.AudioClip = null;

    @property({type: cc.AudioClip, displayName: "消除TopBall的声音"})
    destroyAudio: cc.AudioClip = null;

    // 是否完成初始化
    _isInitComplete: boolean = false;
    // TopBall列表
    _topBallList: cc.Node[] = [];
    //
    _canvasSize = null;

    // 下面球的数组
    _bottomBallList : cc.Node[] = [];

    onLoad () {
        cc.director.getPhysicsManager().enabled = true;
        // cc.director.getPhysicsManager().debugDrawFlags = cc.PhysicsManager.DrawBits.e_aabbBit |
        //     cc.PhysicsManager.DrawBits.e_jointBit |
        //     cc.PhysicsManager.DrawBits.e_shapeBit;
        cc.director.getPhysicsManager().gravity = cc.v2(0, -640);

        this._canvasSize = cc.view.getCanvasSize();
        cc.log(this._canvasSize);
        // cc.log(this.gameBox.getPosition())

        this.gameBox.on(cc.Node.EventType.TOUCH_START, function(event){
            var point = this.gameBox.convertTouchToNodeSpaceAR(event);
            cc.log(event.touch)
            cc.log(point);
        }.bind(this))
    }

    start () {
        this.generateTopBalls();
        this.generateFishes();
        // 生成全部球之后再开始监听键盘事件
        // this.addKeyboardListener();
    }

    // 初始化鱼塘

    // 生成TopBall
    generateTopBalls() {
        let interval = setInterval(function(){
            let randomNum = Math.ceil(Math.random()*(9+9));
            // 计算gameBox位置
            let gameBoxPosition = this.gameBox.convertToNodeSpaceAR(cc.v2(0));
            let randomPoint = cc.v2({x: gameBoxPosition.x + Math.floor(Math.random()*(this._canvasSize.width/2-60))+30, y: this.gameBox.height/2})
            var ball = cc.instantiate(this.topBallPrefab);

            (ball.getChildByName("TagLabel").getComponent(cc.Label) as cc.Label).string = randomNum + '';
            if (randomNum === 6 || randomNum === 9) {
                (ball.getChildByName("BottomLine") as cc.Node).active = true;
            }
            this.gameBox.addChild(ball);
            ball.setPosition(randomPoint);

            // 播放射出声音
            cc.audioEngine.play(this.hitAudio, false, 1);

            this._topBallList.push(ball);
            if (this._topBallList.length >=20) {
                clearInterval(interval);
                this.addKeyboardListener();
            }
        }.bind(this), 300)
    }
    // 生成鱼儿
    generateFishes() {
        this.fishAtlas.getSpriteFrames().forEach(function(spriteFrameItem) {
            let fish = cc.instantiate(this.fishPrefab);
            fish.getComponent(cc.Sprite).spriteFrame = spriteFrameItem;
            this.water.addChild(fish);
        }.bind(this));
    }
    // 初始化键盘监听
    addKeyboardListener() {
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onInput, this);
    }
    
    onInput (event) {
        if (event.keyCode >= cc.macro.KEY['0'] && event.keyCode <= cc.macro.KEY['9']) {
            let inputNum = 9 - (cc.macro.KEY['9'] - event.keyCode);
            this.pushBottomBall(inputNum);
        }
        if (event.keyCode === cc.macro.KEY.escape) {
            this.removeBottomBall();
        }
    }

    pushBottomBall(num: number) {
        if (this._bottomBallList.length >= 2) {
            return;
        }
        // 生成BottomBall
        let bottomBallPosition = this.getBottomBallPosition(this._bottomBallList.length);
        let bottomBall = cc.instantiate(this.bottomBallPrefab);
        (bottomBall.getChildByName("TagLabel").getComponent(cc.Label) as cc.Label).string = num + '';
        bottomBall.opacity = 0;
        this.gameBox.addChild(bottomBall);
        let gameBoxPosition = this.gameBox.convertToNodeSpaceAR(cc.v2(0));
        bottomBall.setPosition(cc.v2({x: gameBoxPosition.x+this.gameBox.width/2, y:gameBoxPosition.y}));
        bottomBall.runAction(cc.spawn(cc.fadeIn(0.3), cc.moveTo(0.5,bottomBallPosition)))
        // 播放射出声音
        cc.audioEngine.play(this.hitAudio, false, 1);

        this._bottomBallList.push(bottomBall);
        // 达到消除条件
        if (this._bottomBallList.length >= 2) {
            let bottomBallSum: number = this._bottomBallList.map(item => 
                { 
                    return +(item.getChildByName("TagLabel").getComponent(cc.Label) as cc.Label).string
                }).reduce(function(prev, curr, idx, arr){
                return prev + curr;
            });
            for(let index = 0; index < this._topBallList.length; index++) {
                let item: cc.Node = this._topBallList[index] as cc.Node;
                if ((item.getChildByName("TagLabel").getComponent(cc.Label) as cc.Label).string === (bottomBallSum + '')) {
                    item.runAction(cc.sequence(cc.scaleTo(0.2, 0.8), cc.spawn(cc.scaleTo(0.1, 1.3), cc.fadeOut(0.1)), cc.callFunc((item)=> {
                        item.removeFromParent();
                        // 播放消除声音
                        cc.audioEngine.play(this.destroyAudio, false, 1);
                        // 发出通知
                        cc.systemEvent.emit('FishJump');
                    },this,item)))
                    // 立刻从数组中删除,防止动画未执行完再次消除
                    this._topBallList.splice(index, 1);
                    
                    return;
                }
            };
        }
        cc.log(this._bottomBallList);
    }

    removeBottomBall() {
        let length = this._bottomBallList.length;
        if (length <= 0) {
            return;
        }
        let bottomBall = this._bottomBallList[length - 1];
        // 立刻从数组中删除,防止动画未执行完再次消除
        this._bottomBallList.splice(length - 1, 1);
        // 反向动画
        let gameBoxPosition = this.gameBox.convertToNodeSpaceAR(cc.v2(0));
        bottomBall.runAction(cc.sequence(cc.spawn(cc.fadeOut(0.3), cc.moveTo(0.5,cc.v2(gameBoxPosition.x+this.gameBox.width/2, gameBoxPosition.y))), cc.callFunc((bottomBall)=> {
            bottomBall.removeFromParent();
        },this,bottomBall)))
        
        cc.log(this._bottomBallList);
    }

    // 获取底部球的位置
    getBottomBallPosition(index: number): cc.Vec2 {
        let gameBoxPosition = this.gameBox.convertToNodeSpaceAR(cc.v2(0));
        var randomPoint = cc.v2(0);
        // 球直径为130,不要让球在屏幕及水平面位置
        let randomWidth = Math.random()*(this.gameBox.width/2-130) + 65;
        let randomHeight = Math.random()*(this.gameBox.height/4-130) + this.gameBox.height/4; // 考虑底部多留一些空间
        if (index === 0) {
            randomPoint = cc.v2({x: gameBoxPosition.x + randomWidth, y: gameBoxPosition.y + randomHeight})
        } else if (index === 1) {
            randomPoint = cc.v2({x: gameBoxPosition.x + this.gameBox.width/2 + randomWidth, y: gameBoxPosition.y + randomHeight})
        }
        return randomPoint;
    }

    onDestroy () {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.onInput, this);
    }
}
