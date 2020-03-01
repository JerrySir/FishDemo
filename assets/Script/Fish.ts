// Learn TypeScript:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/typescript.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property} = cc._decorator;

@ccclass
export default class NewClass extends cc.Component {

    @property(cc.Label)
    label: cc.Label = null;

    @property
    text: string = 'hello';

    _waterNode: cc.Node = null;
    _runloopAction: cc.Action = null;

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        this._waterNode = this.node.parent;

        cc.systemEvent.on('FishJump', function(){
            this.node.stopAction(this._runloopAction);
            // 跳跃上升
            let jumpUp = cc.moveBy(0.2, cc.v2(0, 30)).easing(cc.easeCubicActionOut());
            // 下落
            let jumpDown = cc.moveBy(0.1, cc.v2(0, -30)).easing(cc.easeCubicActionIn());
            this.node.runAction(cc.sequence(cc.delayTime(Math.random()*1), jumpUp, jumpDown, cc.callFunc(function(){
                this.refreshPosition();
            }.bind(this))));
        }.bind(this));
    }

    start () {
        this.refreshPosition();
    }

    refreshPosition() {
        let newPosition = this.getRandomPosition();
        let scaleAction = cc.scaleTo(0.3, this.node.x > newPosition.x ? 1 : -1, 1);

        let temp = this.node.position.sub(newPosition);
        let degree = this.getDegree(temp);
        let rotationAction = cc.rotateTo(0.2, this.node.x < newPosition.x ? degree : degree);
        
        let randomTime = Math.random()*3;
        this.node.runAction(cc.sequence(scaleAction, rotationAction, cc.moveTo(randomTime+2, newPosition).easing(cc.easeQuadraticActionOut()), cc.delayTime(randomTime+1), cc.callFunc(function(){
            this.refreshPosition();
        }.bind(this))));
    }

    getRandomPosition(): cc.Vec2 {
        let waterPosition = this._waterNode.convertToNodeSpaceAR(cc.v2(0));
        // Fish的直径为80
        let randomPosition = cc.v2({x: waterPosition.x + Math.random()*(this._waterNode.width - 80)+40, y: waterPosition.y + Math.random()*(this._waterNode.height - 80)+40});
        return randomPosition;
    }

    getDegree(vector: cc.Vec2): number{
        let degree = Math.atan(vector.y / vector.x) / Math.PI * 180;
        if(vector.x >= 0){
            if(vector.y < 0){
                degree += 360;
            }
        }else{
            if(vector.y > 0){
                // degree += 180;
            }else{
                // degree += 180;
            }
        }
        return degree;
    }

    onDestroy() {
        this.node.stopAction(this._runloopAction);
        cc.systemEvent.off('FishJump');
    }

    // update (dt) {}
}
