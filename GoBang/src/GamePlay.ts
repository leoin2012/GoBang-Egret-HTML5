/**
 *
 * @author 
 *
 */
class GamePlay extends egret.Sprite{
    
    
    private NONE:number = 0;
    private WHITE:number = 1;						// 黑子标识
    private BLACK:number = 2;						// 白子标识
    private LINE_NUM:number = 19; 					// 格子的数量
    private GIRD_WIDTH:number = 20; 					// 格子的宽度
    private GIRD_HEIGHT:number = 20; 					// 格子的高度
    private BASE_X:number = 18; 						// 棋盘左上角X
    private BASE_Y:number = 18; 						// 棋盘左上角Y
    private STATE_INIT:number = 0;					// 0 初始状态
    private STATE_PLAYING:number = this.STATE_INIT + 1;	// 1 下棋
    private STATE_OVER:number = this.STATE_PLAYING + 1;	// 2 一盘结束
    private playState:number = this.STATE_INIT; 						// 游戏中状态管理
    
    // 下面是用来做电脑AI下棋的数组
    private gobang:number[] = []; 							// 保存连成五个子的位置
    private chessBoard:any[] = [];									// 保存当前已下的棋子
    private bigArrayOne:any[][] = [];                                //存放每个格子的权重值
    private bigArrayTwo:any[][] = [];                                //存放每个格子的连子数
    private g:number[] = [];  
    
    private MainImage:egret.Bitmap;									// 棋盘的图
    private WhiteImage:egret.Bitmap;									// 白子
    private BlackImage:egret.Bitmap; 									// 黑子
    private CpuWinImg:egret.Bitmap; 									// 电脑胜利
    private PlayerWinImg:egret.Bitmap;									// 玩家胜利
    private RedCorssImg:egret.Bitmap;									// 红色十字图
    private FocusImg:egret.Bitmap;										// 玩家游标
    
    private HUMAN:number = 0; 						// 玩家标识-黑棋（先下者） 
    private COMPUTER:number = 1;				// 电脑标识-白棋（后下者）
    private curPlayer:number = this.HUMAN; 								// 当前要下的一方
    private currentX:number; 										// 当前所在区域的左上角X
    private currentY:number; 										// 当前所在区域的左上角Y
    private currentCol:number; 									// 当前是第几个竖线
    private currentRow:number; 									// 当前是第几个横线
    private LastChessmanA:number; 									// 最后一个子位于第几根竖线
    private LastChessmanB:number; 									// 最后一个子位于第几根横线 
    
    private indexWhite:number;										// 白子下了几个
    private indexBlack:number;										// 黑子下了几个
    private draw_y:number[][] = [];					// 已下的子的Y坐标
    private draw_x:number[][] = []; 					// 已下的子的X坐标
    
    private chessContainer: egret.Sprite;
    
	public constructor() {
        super();
        this.touchEnabled = true;
        this.addEventListener(egret.Event.ADDED_TO_STAGE, this.onAddToStage, this);
        this.addEventListener(egret.TouchEvent.TOUCH_TAP,this.onTouch,this);
	}
	
    private onAddToStage(event:egret.Event) {
        this.MainImage = this.createBitmapByName("main");
        this.addChild(this.MainImage);
        
        this.chessContainer = new egret.Sprite();
        this.addChild(this.chessContainer);
        
        var stageW:number = this.stage.stageWidth;
        var stageH:number = this.stage.stageHeight;
//        this.MainImage.width = stageW;
//        this.MainImage.height = stageH;
        
        this.setParam();
        this.addEventListener(egret.Event.ENTER_FRAME,this.onEnterFrame,this);
    }
    
    private onEnterFrame(evt: egret.Event) { 
        if (this.playState == this.STATE_INIT) {
            this.buildChessboard();// 准备开始下棋
        } else {
            if (this.playState == this.STATE_OVER) {// 决出胜负
                if (this.curPlayer == this.HUMAN) {// 玩家胜利
                    console.log("PlayerWin");
                } else {// 电脑胜利
                    console.log("CpuWin");
                }
            } else {
            }
        }
    }
    
    private onTouch(event:egret.TouchEvent) {
        var minGap: number = 999;
        var targetX: number;
        var targetY: number;
        //        console.log("x" + event.localX + "y" + event.localY);
        for (var i:number = 0; i < this.LINE_NUM * this.LINE_NUM; i++) {
//            this.currentCol = Math.floor(i % this.LINE_NUM);
//            this.currentRow = Math.floor(i / this.LINE_NUM);
            var linex: number = Math.floor(i % this.LINE_NUM);
            var liney: number = Math.floor(i / this.LINE_NUM);
            var x: number = linex * this.GIRD_WIDTH + this.BASE_X;
            var y: number = liney * this.GIRD_HEIGHT + this.BASE_Y;
            var gap: number = Math.pow(event.localX - x,2) + Math.pow(event.localY - y,2);
            if(gap < minGap)
            { 
                minGap = gap;
                this.currentCol = linex+1;
                this.currentRow = liney+1;
                targetX = x;
                targetY = y;
                //                console.log("minGap:"+minGap+"x"+targetX+"y"+targetY);    
            }
        }
        
        if (this.playState != this.STATE_PLAYING) {
            return;
        }
        if (this.curPlayer == this.HUMAN) {
            if (this.chessBoard[this.LINE_NUM * (this.currentRow - 1) + this.currentCol - 1] != this.NONE) {
//                graphics.drawString("此处有子，请重新落子..", 40, 280, Graphics.LEFT
//                    | Graphics.TOP);
                    console.log("此处有子");// 已经下过的地方不能再下
                    return;
            }
            this.chessBoard[this.LINE_NUM * (this.currentRow - 1) + this.currentCol - 1] = this.WHITE;
//            this.addChessman(this.currentX + this.GIRD_WIDTH / 2, this.currentY + this.GIRD_HEIGHT / 2);
            this.addChessman(targetX, targetY);
            var comStep:number = this.computer();	// 计算出电脑要下的一步，并计算gobang
            if (this.checkVictory()) // 检查玩家是否胜利
            {
                return;
            }
            this.computerStep(comStep);  	// 模拟电脑下一个
            if (this.checkVictory()) // 检查电脑是否胜利
            {
                return;
            }
            this.curPlayer = this.HUMAN;			// 切换要下棋的一方
            
//            this.addChessman(targetX, targetY);
        }
        
//        var x: number = 2 * this.GIRD_WIDTH + this.BASE_X;
//        var y: number = 2 * this.GIRD_HEIGHT + this.BASE_Y;
    }
    
    /**
    * 初始化一些参数
    */
    private setParam() {
//        this.chessBoard = new any[this.LINE_NUM * this.LINE_NUM];
//        this.bigArrayOne = new int[3][this.LINE_NUM * this.LINE_NUM];
//        this.bigArrayTwo = new int[3][this.LINE_NUM * this.LINE_NUM];
        for (var i:number = 0; i < this.LINE_NUM * this.LINE_NUM; i++) {
            this.chessBoard[i] = this.NONE;
        }
        for (var i:number = 0; i < 3; i++) {
            this.bigArrayOne[i] = [];
            this.bigArrayTwo[i] = [];
        }
        for (var i:number = 0; i < 2; i++) {
            this.draw_y[i] = [];
            this.draw_x[i] = [];
        }
        this.g[0] = 1;                                           //判断胜负的横竖斜四个方向，0为横，1为竖，2为左斜，3为右斜
        this.g[1] = this.LINE_NUM;
        this.g[2] = this.LINE_NUM - 1;
        this.g[3] = this.LINE_NUM + 1;
    }
    
    private buildChessboard() {// 准备开始下棋
            // 初始化数组
            for (var i:number = 0; i < this.LINE_NUM * this.LINE_NUM; i++) {
                this.chessBoard[i] = this.NONE;
                this.bigArrayOne[0][i] = 0;
                this.bigArrayOne[1][i] = 0;
                this.bigArrayOne[2][i] = 0;
                this.bigArrayTwo[0][i] = 0;
                this.bigArrayTwo[1][i] = 0;
                this.bigArrayTwo[2][i] = 0;
            }
            for (var i:number = 0; i < 5; i++) {
                this.gobang[i] = 0;
            }
            
            // 初始化玩家游标放在棋盘正中间
            if (this.LINE_NUM % 2 == 0) {
                this.currentX = this.BASE_X + this.GIRD_WIDTH * (this.LINE_NUM / 2 - 1) - this.GIRD_WIDTH
                    / 2;
                this.currentY = this.BASE_Y + this.GIRD_HEIGHT * (this.LINE_NUM / 2 - 1)
                    - this.GIRD_HEIGHT / 2;
                this.currentCol = this.LINE_NUM / 2;
            } else {
                this.currentX = this.BASE_X + this.GIRD_WIDTH * (this.LINE_NUM - 1) / 2 - this.GIRD_WIDTH
                    / 2;
                this.currentY = this.BASE_Y + this.GIRD_HEIGHT * (this.LINE_NUM - 1) / 2
                    - this.GIRD_HEIGHT / 2;
                this.currentCol = (this.LINE_NUM + 1) / 2;
            }
            this.currentRow = this.currentCol;
            this.playState = this.STATE_PLAYING;
            this.curPlayer = this.HUMAN;// 切换要下棋的一方
                
            this.drawChessmanBefore();
        }
        
    /*
    * 画出已下的棋子
    */
    private drawChessmanBefore() {
        while(this.chessContainer.numChildren > 0)
            this.chessContainer.removeChildAt(0);
        
        var x, y:number;
        for (var i:number = 0; i < this.chessBoard.length; i++) {
            if (this.chessBoard[i] == this.NONE) {
                continue;
            }
            x = Math.floor(this.BASE_X + (i % this.LINE_NUM) * this.GIRD_WIDTH - this.GIRD_WIDTH / 2 + 2);
            y = Math.floor(this.BASE_Y + Math.floor((i / this.LINE_NUM)) * this.GIRD_HEIGHT - this.GIRD_HEIGHT / 2 + 2);
//            console.log("drawX" + x + "Y" + y);
            if (this.chessBoard[i] == this.WHITE) {
                this.drawChess("white",x,y);
            } else if (this.chessBoard[i] == this.BLACK) {
                this.drawChess("black",x,y);
            }
        }
    }
    
    private drawChess(type:string, x:number, y:number) {
        var chess:egret.Bitmap = this.createBitmapByName(type);
        this.chessContainer.addChild(chess);
        chess.x = x;
        chess.y = y;
    }
    
    private addChessman(x:number, y:number) {// 往棋盘添加一颗棋子
        var col:number;
        var row:number;
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
            this.draw_y[0][this.indexWhite] = Math.floor(y - this.GIRD_HEIGHT * 2 / 5);// 白子
            //				System.out.println("白子");
            this.indexWhite++;
        } else if (this.chessBoard[(row - 1) * this.LINE_NUM + col - 1] == this.BLACK) {
            this.draw_x[1][this.indexBlack] = Math.floor(x - this.GIRD_WIDTH * 2 / 5);
            this.draw_y[1][this.indexBlack] = Math.floor(y - this.GIRD_HEIGHT * 2 / 5);// 黑子
            //				System.out.println("黑子");
            this.indexBlack++;
        } else {
            return;
        }
        this.drawChessmanBefore();
    }
    
    private computerStep(comStep:number) {
        this.curPlayer = this.COMPUTER; // 切换要下棋的一方
        this.chessBoard[comStep] = this.BLACK;
        this.LastChessmanA = (comStep + 1) % this.LINE_NUM;
        this.LastChessmanB = (comStep + 1 - this.LastChessmanA) / this.LINE_NUM + 1;
        this.addChessman((this.LastChessmanA - 1) * this.GIRD_WIDTH + this.BASE_X, 
            (this.LastChessmanB - 1) * this.GIRD_HEIGHT + this.BASE_Y);
        this.computer();// 这里并计算gobang
    }
                
        /**
        * private int getNumber(int x,int y) { return
        * (y-baseY)*lineNumber/gridHeight+(x-baseX)/gridWidth; }
        */
        /**
        * 分析并找出下一步该走在何处，并计算gobang
        */
        private computer():number {
//            var e:number[] = [1, 2, 4, 12, 24];                    //电脑AI判定落子连成1子，2子，3子，4子，5子时分别的权重数值
            var e:number[] = [1, 2, 3, 4, 5];                    //电脑AI判定落子连成1子，2子，3子，4子，5子时分别的权重数值    
            var c:number[] = [];                           //计算棋局双方的连子数
            var retGirdIndex:number = 0;                           // 此变量记录电脑应下于何处
            var n:number = 0;            
            var p:number;//
            var girdIndex:number;                                  //棋盘格子的索引数0-121
            var h:number;//
            var a:number;//                                        //记录电脑可下棋子的索引号
            var d:number = 0;                                      //判断胜负的横竖斜四个方向，0为横，1为竖，2为左斜，3为右斜
            var z:number = 0;                                       //记录关键胜负的五个子的索引号，为0，1，2，3，4
            for (var i:number = 0; i < 3; i++) {                   // 对两个大数组清零
                for (girdIndex = 0; girdIndex < this.LINE_NUM * this.LINE_NUM; girdIndex++) {
                    this.bigArrayOne[i][girdIndex] = 0;
                    this.bigArrayTwo[i][girdIndex] = 0;
                }
            }
            for (girdIndex = 0; girdIndex < this.LINE_NUM * this.LINE_NUM; girdIndex++) {     //对棋盘所有格子进行遍历计算，包括落子记录，权重
                for (d = 0; d < 4; d++) {                                           //对四个方向进行落子计算或胜负判定
                    if ((girdIndex / this.LINE_NUM < (this.LINE_NUM - 4) || d == 0) && (girdIndex % this.LINE_NUM < (this.LINE_NUM - 4) || d == 1 || d == 2) && (girdIndex % this.LINE_NUM > 3 || d != 2)) {
                            c[1] = 0;                                                   //计算黑子的连子数，胜利时为5
                            c[2] = 0;                                                   //计算白字的连子数，胜利时为5
                            for (z = 0; z < 5; z++) {
                                c[this.chessBoard[girdIndex + z * this.g[d]]]++;                  //计算c[]的数值
                                    }
                                    if (c[1] == 0) {                                            //当上面的for循环结束后黑子数为0，说明此条线上只有白子
                                        p = 2;
                                    } else if (c[2] == 0) {
                                        p = 1;
                                    } else {
                                        p = 0;
                                    }
                                    
                                    if (p != 0) {
                                        for (z = 0; z < 5; z++) {
                                            if (c[p] == 5) // 记录关键胜负的五个子的坐标
                                            {
                                                this.gobang[z] = girdIndex + z * this.g[d];           
                                            } else if (this.chessBoard[girdIndex + z * this.g[d]] == this.NONE) {
                                                a = girdIndex + z * this.g[d];               //记录电脑可下棋子的索引号
                                                this.bigArrayOne[0][a] += e[c[p]];           //记录在此格落子的权重
                                                if (c[p] >= 2) {
                                                    this.bigArrayOne[p][a] += e[c[p]];       //分别记录黑白棋子每个落子的相应权重
                                                }
                                                if (c[p] > this.bigArrayTwo[p][a]) {
                                                    this.bigArrayTwo[p][a] = c[p];           //分别记录黑白棋子的在每个格子的连子数，bigArrayTwo[1][]为黑子,bigArrayTwo[2][]为白子
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            for (var q:number = 1; q < 3; q++) {
                                if (this.bigArrayOne[q][girdIndex] >= e[4]) {
                                    h = 2 * this.bigArrayTwo[q][girdIndex];
                                    if (q == 2) {
                                        h++;
                                    }
                                    if (this.bigArrayOne[0][girdIndex] < this.LINE_NUM * this.LINE_NUM) {
                                        this.bigArrayOne[0][girdIndex] += this.LINE_NUM * this.LINE_NUM * h;
                                    } else if (this.bigArrayOne[0][girdIndex] < this.LINE_NUM * this.LINE_NUM * h) {
                                        this.bigArrayOne[0][girdIndex] = this.LINE_NUM * this.LINE_NUM * h;
                                    }
                                }
                            }
                            if (this.bigArrayOne[0][girdIndex] > this.bigArrayOne[0][retGirdIndex]) {
                                n = 0;
                            }
                            if (this.bigArrayOne[0][girdIndex] >= this.bigArrayOne[0][retGirdIndex]) {            //找出权重最大的bigArrayOne[0][girdIndex],并输出girdIndex
                                n++;
//                                if ((rnd.nextInt() & 0x7FFFFFFF) % 1000 * n / 1000 < 1) {
//                                    retGirdIndex = girdIndex;
//                                }
                                if (((Math.floor(Math.random()*462)-231) & 0x7FFFFFFF) % 1000 * n / 1000 < 1) {
                                    retGirdIndex = girdIndex;
                                }
                            }
                        }
                        return retGirdIndex;
                }
                    
    /*
    * 检查是否有一方胜出，并做出相应处理
    */
    private checkVictory():boolean {
        if (this.gobang[1] != 0) { // gobang[1]!=0表示已经接到5个了，此时必有一方胜利
            this.playState = this.STATE_OVER;
            if (this.curPlayer == this.HUMAN) {
//                graphics.drawImage(PlayerWinImg, 10, 260, Graphics.LEFT
//                    | Graphics.TOP);
                console.log("PlayerWin");
                    } else {
//                        graphics.drawImage(CpuWinImg, 10, 260, Graphics.LEFT
//                            | Graphics.TOP);
                    console.log("CpuWin");
                        }
                        return true;
                    } else {
                        return false;
                    }
                }
    
	
    /**
    * 根据name关键字创建一个Bitmap对象。name属性请参考resources/resource.json配置文件的内容。
    * Create a Bitmap object according to name keyword.As for the property of name please refer to the configuration file of resources/resource.json.
    */
    private createBitmapByName(name:string):egret.Bitmap {
        var result:egret.Bitmap = new egret.Bitmap();
        var texture:egret.Texture = RES.getRes(name);
        result.texture = texture;
        return result;
    }
    
}
