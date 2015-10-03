/**
 *
 * @author
 *
 */
var GamePlay = (function (_super) {
    __extends(GamePlay, _super);
    function GamePlay() {
        _super.call(this);
        this.NONE = 0;
        this.WHITE = 1; // 黑子标识
        this.BLACK = 2; // 白子标识
        this.LINE_NUM = 19; // 格子的数量
        this.GIRD_WIDTH = 20; // 格子的宽度
        this.GIRD_HEIGHT = 20; // 格子的高度
        this.BASE_X = 18; // 棋盘左上角X
        this.BASE_Y = 18; // 棋盘左上角Y
        this.STATE_INIT = 0; // 0 初始状态
        this.STATE_PLAYING = this.STATE_INIT + 1; // 1 下棋
        this.STATE_OVER = this.STATE_PLAYING + 1; // 2 一盘结束
        this.playState = this.STATE_INIT; // 游戏中状态管理
        // 下面是用来做电脑AI下棋的数组
        this.gobang = []; // 保存连成五个子的位置
        this.chessBoard = []; // 保存当前已下的棋子
        this.bigArrayOne = []; //存放每个格子的权重值
        this.bigArrayTwo = []; //存放每个格子的连子数
        this.g = [];
        this.HUMAN = 0; // 玩家标识-黑棋（先下者） 
        this.COMPUTER = 1; // 电脑标识-白棋（后下者）
        this.curPlayer = this.HUMAN; // 当前要下的一方
        this.draw_y = []; // 已下的子的Y坐标
        this.draw_x = []; // 已下的子的X坐标
        this.touchEnabled = true;
        this.addEventListener(egret.Event.ADDED_TO_STAGE, this.onAddToStage, this);
        this.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onTouch, this);
    }
    var __egretProto__ = GamePlay.prototype;
    __egretProto__.onAddToStage = function (event) {
        this.MainImage = this.createBitmapByName("main");
        this.addChild(this.MainImage);
        this.chessContainer = new egret.Sprite();
        this.addChild(this.chessContainer);
        var stageW = this.stage.stageWidth;
        var stageH = this.stage.stageHeight;
        //        this.MainImage.width = stageW;
        //        this.MainImage.height = stageH;
        this.setParam();
        this.addEventListener(egret.Event.ENTER_FRAME, this.onEnterFrame, this);
    };
    __egretProto__.onEnterFrame = function (evt) {
        if (this.playState == this.STATE_INIT) {
            this.buildChessboard(); // 准备开始下棋
        }
        else {
            if (this.playState == this.STATE_OVER) {
                if (this.curPlayer == this.HUMAN) {
                    console.log("PlayerWin");
                }
                else {
                    console.log("CpuWin");
                }
            }
            else {
            }
        }
    };
    __egretProto__.onTouch = function (event) {
        var minGap = 999;
        var targetX;
        var targetY;
        for (var i = 0; i < this.LINE_NUM * this.LINE_NUM; i++) {
            //            this.currentCol = Math.floor(i % this.LINE_NUM);
            //            this.currentRow = Math.floor(i / this.LINE_NUM);
            var linex = Math.floor(i % this.LINE_NUM);
            var liney = Math.floor(i / this.LINE_NUM);
            var x = linex * this.GIRD_WIDTH + this.BASE_X;
            var y = liney * this.GIRD_HEIGHT + this.BASE_Y;
            var gap = Math.pow(event.localX - x, 2) + Math.pow(event.localY - y, 2);
            if (gap < minGap) {
                minGap = gap;
                this.currentCol = linex + 1;
                this.currentRow = liney + 1;
                targetX = x;
                targetY = y;
            }
        }
        if (this.playState != this.STATE_PLAYING) {
            return;
        }
        if (this.curPlayer == this.HUMAN) {
            if (this.chessBoard[this.LINE_NUM * (this.currentRow - 1) + this.currentCol - 1] != this.NONE) {
                //                graphics.drawString("此处有子，请重新落子..", 40, 280, Graphics.LEFT
                //                    | Graphics.TOP);
                console.log("此处有子"); // 已经下过的地方不能再下
                return;
            }
            this.chessBoard[this.LINE_NUM * (this.currentRow - 1) + this.currentCol - 1] = this.WHITE;
            //            this.addChessman(this.currentX + this.GIRD_WIDTH / 2, this.currentY + this.GIRD_HEIGHT / 2);
            this.addChessman(targetX, targetY);
            var comStep = this.computer(); // 计算出电脑要下的一步，并计算gobang
            if (this.checkVictory()) {
                return;
            }
            this.computerStep(comStep); // 模拟电脑下一个
            if (this.checkVictory()) {
                return;
            }
            this.curPlayer = this.HUMAN; // 切换要下棋的一方
        }
        //        var x: number = 2 * this.GIRD_WIDTH + this.BASE_X;
        //        var y: number = 2 * this.GIRD_HEIGHT + this.BASE_Y;
    };
    /**
    * 初始化一些参数
    */
    __egretProto__.setParam = function () {
        for (var i = 0; i < this.LINE_NUM * this.LINE_NUM; i++) {
            this.chessBoard[i] = this.NONE;
        }
        for (var i = 0; i < 3; i++) {
            this.bigArrayOne[i] = [];
            this.bigArrayTwo[i] = [];
        }
        for (var i = 0; i < 2; i++) {
            this.draw_y[i] = [];
            this.draw_x[i] = [];
        }
        this.g[0] = 1; //判断胜负的横竖斜四个方向，0为横，1为竖，2为左斜，3为右斜
        this.g[1] = this.LINE_NUM;
        this.g[2] = this.LINE_NUM - 1;
        this.g[3] = this.LINE_NUM + 1;
    };
    __egretProto__.buildChessboard = function () {
        for (var i = 0; i < this.LINE_NUM * this.LINE_NUM; i++) {
            this.chessBoard[i] = this.NONE;
            this.bigArrayOne[0][i] = 0;
            this.bigArrayOne[1][i] = 0;
            this.bigArrayOne[2][i] = 0;
            this.bigArrayTwo[0][i] = 0;
            this.bigArrayTwo[1][i] = 0;
            this.bigArrayTwo[2][i] = 0;
        }
        for (var i = 0; i < 5; i++) {
            this.gobang[i] = 0;
        }
        // 初始化玩家游标放在棋盘正中间
        if (this.LINE_NUM % 2 == 0) {
            this.currentX = this.BASE_X + this.GIRD_WIDTH * (this.LINE_NUM / 2 - 1) - this.GIRD_WIDTH / 2;
            this.currentY = this.BASE_Y + this.GIRD_HEIGHT * (this.LINE_NUM / 2 - 1) - this.GIRD_HEIGHT / 2;
            this.currentCol = this.LINE_NUM / 2;
        }
        else {
            this.currentX = this.BASE_X + this.GIRD_WIDTH * (this.LINE_NUM - 1) / 2 - this.GIRD_WIDTH / 2;
            this.currentY = this.BASE_Y + this.GIRD_HEIGHT * (this.LINE_NUM - 1) / 2 - this.GIRD_HEIGHT / 2;
            this.currentCol = (this.LINE_NUM + 1) / 2;
        }
        this.currentRow = this.currentCol;
        this.playState = this.STATE_PLAYING;
        this.curPlayer = this.HUMAN; // 切换要下棋的一方
        this.drawChessmanBefore();
    };
    /*
    * 画出已下的棋子
    */
    __egretProto__.drawChessmanBefore = function () {
        while (this.chessContainer.numChildren > 0)
            this.chessContainer.removeChildAt(0);
        var x, y;
        for (var i = 0; i < this.chessBoard.length; i++) {
            if (this.chessBoard[i] == this.NONE) {
                continue;
            }
            x = Math.floor(this.BASE_X + (i % this.LINE_NUM) * this.GIRD_WIDTH - this.GIRD_WIDTH / 2 + 2);
            y = Math.floor(this.BASE_Y + Math.floor((i / this.LINE_NUM)) * this.GIRD_HEIGHT - this.GIRD_HEIGHT / 2 + 2);
            //            console.log("drawX" + x + "Y" + y);
            if (this.chessBoard[i] == this.WHITE) {
                this.drawChess("white", x, y);
            }
            else if (this.chessBoard[i] == this.BLACK) {
                this.drawChess("black", x, y);
            }
        }
    };
    __egretProto__.drawChess = function (type, x, y) {
        var chess = this.createBitmapByName(type);
        this.chessContainer.addChild(chess);
        chess.x = x;
        chess.y = y;
    };
    __egretProto__.addChessman = function (x, y) {
        var col;
        var row;
        col = (x - this.BASE_X) / this.GIRD_WIDTH + 1;
        row = (y - this.BASE_Y) / this.GIRD_HEIGHT + 1;
        if (col > this.LINE_NUM || col < 1 || row > this.LINE_NUM || row < 1) {
            return;
        }
        //        //test
        //        this.chessBoard[(row - 1) * this.LINE_NUM + col - 1] = this.BLACK;
        //        //test
        if (this.chessBoard[(row - 1) * this.LINE_NUM + col - 1] == this.WHITE) {
            this.draw_x[0][this.indexWhite] = Math.floor(x - this.GIRD_WIDTH * 2 / 5);
            this.draw_y[0][this.indexWhite] = Math.floor(y - this.GIRD_HEIGHT * 2 / 5); // 白子
            //				System.out.println("白子");
            this.indexWhite++;
        }
        else if (this.chessBoard[(row - 1) * this.LINE_NUM + col - 1] == this.BLACK) {
            this.draw_x[1][this.indexBlack] = Math.floor(x - this.GIRD_WIDTH * 2 / 5);
            this.draw_y[1][this.indexBlack] = Math.floor(y - this.GIRD_HEIGHT * 2 / 5); // 黑子
            //				System.out.println("黑子");
            this.indexBlack++;
        }
        else {
            return;
        }
        this.drawChessmanBefore();
    };
    __egretProto__.computerStep = function (comStep) {
        this.curPlayer = this.COMPUTER; // 切换要下棋的一方
        this.chessBoard[comStep] = this.BLACK;
        this.LastChessmanA = (comStep + 1) % this.LINE_NUM;
        this.LastChessmanB = (comStep + 1 - this.LastChessmanA) / this.LINE_NUM + 1;
        this.addChessman((this.LastChessmanA - 1) * this.GIRD_WIDTH + this.BASE_X, (this.LastChessmanB - 1) * this.GIRD_HEIGHT + this.BASE_Y);
        this.computer(); // 这里并计算gobang
    };
    /**
    * private int getNumber(int x,int y) { return
    * (y-baseY)*lineNumber/gridHeight+(x-baseX)/gridWidth; }
    */
    /**
    * 分析并找出下一步该走在何处，并计算gobang
    */
    __egretProto__.computer = function () {
        //            var e:number[] = [1, 2, 4, 12, 24];                    //电脑AI判定落子连成1子，2子，3子，4子，5子时分别的权重数值
        var e = [1, 2, 3, 4, 5]; //电脑AI判定落子连成1子，2子，3子，4子，5子时分别的权重数值    
        var c = []; //计算棋局双方的连子数
        var retGirdIndex = 0; // 此变量记录电脑应下于何处
        var n = 0;
        var p; //
        var girdIndex; //棋盘格子的索引数0-121
        var h; //
        var a; //                                        //记录电脑可下棋子的索引号
        var d = 0; //判断胜负的横竖斜四个方向，0为横，1为竖，2为左斜，3为右斜
        var z = 0; //记录关键胜负的五个子的索引号，为0，1，2，3，4
        for (var i = 0; i < 3; i++) {
            for (girdIndex = 0; girdIndex < this.LINE_NUM * this.LINE_NUM; girdIndex++) {
                this.bigArrayOne[i][girdIndex] = 0;
                this.bigArrayTwo[i][girdIndex] = 0;
            }
        }
        for (girdIndex = 0; girdIndex < this.LINE_NUM * this.LINE_NUM; girdIndex++) {
            for (d = 0; d < 4; d++) {
                if ((girdIndex / this.LINE_NUM < (this.LINE_NUM - 4) || d == 0) && (girdIndex % this.LINE_NUM < (this.LINE_NUM - 4) || d == 1 || d == 2) && (girdIndex % this.LINE_NUM > 3 || d != 2)) {
                    c[1] = 0; //计算黑子的连子数，胜利时为5
                    c[2] = 0; //计算白字的连子数，胜利时为5
                    for (z = 0; z < 5; z++) {
                        c[this.chessBoard[girdIndex + z * this.g[d]]]++; //计算c[]的数值
                    }
                    if (c[1] == 0) {
                        p = 2;
                    }
                    else if (c[2] == 0) {
                        p = 1;
                    }
                    else {
                        p = 0;
                    }
                    if (p != 0) {
                        for (z = 0; z < 5; z++) {
                            if (c[p] == 5) {
                                this.gobang[z] = girdIndex + z * this.g[d];
                            }
                            else if (this.chessBoard[girdIndex + z * this.g[d]] == this.NONE) {
                                a = girdIndex + z * this.g[d]; //记录电脑可下棋子的索引号
                                this.bigArrayOne[0][a] += e[c[p]]; //记录在此格落子的权重
                                if (c[p] >= 2) {
                                    this.bigArrayOne[p][a] += e[c[p]]; //分别记录黑白棋子每个落子的相应权重
                                }
                                if (c[p] > this.bigArrayTwo[p][a]) {
                                    this.bigArrayTwo[p][a] = c[p]; //分别记录黑白棋子的在每个格子的连子数，bigArrayTwo[1][]为黑子,bigArrayTwo[2][]为白子
                                }
                            }
                        }
                    }
                }
            }
            for (var q = 1; q < 3; q++) {
                if (this.bigArrayOne[q][girdIndex] >= e[4]) {
                    h = 2 * this.bigArrayTwo[q][girdIndex];
                    if (q == 2) {
                        h++;
                    }
                    if (this.bigArrayOne[0][girdIndex] < this.LINE_NUM * this.LINE_NUM) {
                        this.bigArrayOne[0][girdIndex] += this.LINE_NUM * this.LINE_NUM * h;
                    }
                    else if (this.bigArrayOne[0][girdIndex] < this.LINE_NUM * this.LINE_NUM * h) {
                        this.bigArrayOne[0][girdIndex] = this.LINE_NUM * this.LINE_NUM * h;
                    }
                }
            }
            if (this.bigArrayOne[0][girdIndex] > this.bigArrayOne[0][retGirdIndex]) {
                n = 0;
            }
            if (this.bigArrayOne[0][girdIndex] >= this.bigArrayOne[0][retGirdIndex]) {
                n++;
                //                                if ((rnd.nextInt() & 0x7FFFFFFF) % 1000 * n / 1000 < 1) {
                //                                    retGirdIndex = girdIndex;
                //                                }
                if (((Math.floor(Math.random() * 462) - 231) & 0x7FFFFFFF) % 1000 * n / 1000 < 1) {
                    retGirdIndex = girdIndex;
                }
            }
        }
        return retGirdIndex;
    };
    /*
    * 检查是否有一方胜出，并做出相应处理
    */
    __egretProto__.checkVictory = function () {
        if (this.gobang[1] != 0) {
            this.playState = this.STATE_OVER;
            if (this.curPlayer == this.HUMAN) {
                //                graphics.drawImage(PlayerWinImg, 10, 260, Graphics.LEFT
                //                    | Graphics.TOP);
                console.log("PlayerWin");
            }
            else {
                //                        graphics.drawImage(CpuWinImg, 10, 260, Graphics.LEFT
                //                            | Graphics.TOP);
                console.log("CpuWin");
            }
            return true;
        }
        else {
            return false;
        }
    };
    /**
    * 根据name关键字创建一个Bitmap对象。name属性请参考resources/resource.json配置文件的内容。
    * Create a Bitmap object according to name keyword.As for the property of name please refer to the configuration file of resources/resource.json.
    */
    __egretProto__.createBitmapByName = function (name) {
        var result = new egret.Bitmap();
        var texture = RES.getRes(name);
        result.texture = texture;
        return result;
    };
    return GamePlay;
})(egret.Sprite);
GamePlay.prototype.__class__ = "GamePlay";
//# sourceMappingURL=GamePlay.js.map