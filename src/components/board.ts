const rotateLeft = function (matrix: unknown[][]) {
  const rows = matrix.length;
  const columns = matrix[0].length;
  const res = [];
  for (var row = 0; row < rows; ++row) {
    res.push([]);
    for (var column = 0; column < columns; ++column) {
      res[row][column] = matrix[column][columns - row - 1];
    }
  }
  return res;
};

class Tile {
  value: number;
  row: number;
  column: number;
  oldRow: number;
  oldColumn: number;
  markForDeletion: boolean;
  mergedInto: any;
  static id = 0;
  constructor(value = 0, row = -1, column = -1) {
    this.value = value || 0;
    this.row = row || -1;
    this.column = column || -1;
    this.oldRow = -1;
    this.oldColumn = -1;
    this.markForDeletion = false;
    this.mergedInto = null;
    Tile.id = Tile.id++;
  }
  moveTo(row, column) {
    this.oldRow = this.row;
    this.oldColumn = this.column;
    this.row = row;
    this.column = column;
  }
  isNew() {
    return this.oldRow == -1 && !this.mergedInto;
  }

  hasMoved() {
    return (
      (this.fromRow() != -1 &&
        (this.fromRow() != this.toRow() ||
          this.fromColumn() != this.toColumn())) ||
      this.mergedInto
    );
  }

  fromRow() {
    return this.mergedInto ? this.row : this.oldRow;
  }

  fromColumn() {
    return this.mergedInto ? this.column : this.oldColumn;
  }

  toRow() {
    return this.mergedInto ? this.mergedInto.row : this.row;
  }

  toColumn() {
    return this.mergedInto ? this.mergedInto.column : this.column;
  }
}

class Board {
  tiles: Tile[];
  cells: Tile[][];
  won = false;

  static size = 4;

  static fourProbability = 0.1;


  static deltaX = [-1, 0, 1, 0];
  static deltaY = [0, -1, 0, 1];

  constructor() {
    this.tiles = [];
    this.cells = [];
    for (var i = 0; i < Board.size; ++i) {
      this.cells[i] = [
        this.addTile(),
        this.addTile(),
        this.addTile(),
        this.addTile(),
      ];
    }
    this.addRandomTile();
    this.setPositions();
    this.won = false;
  }

  addTile(value = 0, row = -1, column = -1) {
    const res = new Tile(value, row, column);
    this.tiles.push(res);
    return res;
  }

  moveLeft() {
    var hasChanged = false;
    for (var row = 0; row < Board.size; ++row) {
      var currentRow = this.cells[row].filter((tile) => tile.value != 0);
      var resultRow = [];
      for (var target = 0; target < Board.size; ++target) {
        var targetTile = currentRow.length
          ? currentRow.shift()
          : this.addTile();
        if (currentRow.length > 0 && currentRow[0].value == targetTile.value) {
          var tile1 = targetTile;
          targetTile = this.addTile(targetTile.value);
          tile1.mergedInto = targetTile;
          var tile2 = currentRow.shift();
          tile2.mergedInto = targetTile;
          targetTile.value += tile2.value;
        }
        resultRow[target] = targetTile;
        this.won = this.won || targetTile.value == 2048;

        hasChanged =
          hasChanged || targetTile.value != this.cells[row][target].value;
      }
      this.cells[row] = resultRow;
    }
    return hasChanged;
  }

  setPositions() {
    this.cells.forEach((row, rowIndex) => {
      row.forEach((tile, columnIndex) => {
        tile.oldRow = tile.row;
        tile.oldColumn = tile.column;
        tile.row = rowIndex;
        tile.column = columnIndex;
        tile.markForDeletion = false;
      });
    });
  }

  addRandomTile() {
    var emptyCells = [];
    for (var r = 0; r < Board.size; ++r) {
      for (var c = 0; c < Board.size; ++c) {
        if (this.cells[r][c].value == 0) {
          emptyCells.push({ r: r, c: c });
        }
      }
    }
    var index = ~~(Math.random() * emptyCells.length);
    var cell = emptyCells[index];
    var newValue = Math.random() < Board.fourProbability ? 4 : 2;
    this.cells[cell.r][cell.c] = this.addTile(newValue);
  }

  move (direction: number) {
    // 0 -> left, 1 -> up, 2 -> right, 3 -> down
    this.clearOldTiles();
    for (var i = 0; i < direction; ++i) {
      this.cells = rotateLeft(this.cells);
    }
    var hasChanged = this.moveLeft();
    for (var i = direction; i < 4; ++i) {
      this.cells = rotateLeft(this.cells);
    }
    if (hasChanged) {
      this.addRandomTile();
    }
    this.setPositions();
    return this;
  }

  clearOldTiles () {
    this.tiles = this.tiles.filter((tile) => tile.markForDeletion == false);
    this.tiles.forEach((tile) => {
      tile.markForDeletion = true;
    });
  }

  hasWon () {
    return this.won;
  }

  hasLost = function () {
    var canMove = false;
    for (var row = 0; row < Board.size; ++row) {
      for (var column = 0; column < Board.size; ++column) {
        canMove = canMove || this.cells[row][column].value == 0;
        for (var dir = 0; dir < 4; ++dir) {
          var newRow = row + Board.deltaX[dir];
          var newColumn = column + Board.deltaY[dir];
          if (
            newRow < 0 ||
            newRow >= Board.size ||
            newColumn < 0 ||
            newColumn >= Board.size
          ) {
            continue;
          }
          canMove = canMove ||
            this.cells[row][column].value == this.cells[newRow][newColumn].value;
        }
      }
    }
    return !canMove;
  }

  startX: number;
  startY: number;

  handleTouchStart (event) {
    if (this.hasWon()) {
      return;
    }
    if (event.touches.length != 1) {
      return;
    }
    this.startX = event.touches[0].screenX;
    this.startY = event.touches[0].screenY;
    event.preventDefault();
  }

  handleTouchEnd = function (event) {
    if (this.hasWon()) {
      return;
    }
    if (event.changedTouches.length != 1) {
      return;
    }
    var deltaX = event.changedTouches[0].screenX - this.startX;
    var deltaY = event.changedTouches[0].screenY - this.startY;
    var direction = -1;
    if (Math.abs(deltaX) > 3 * Math.abs(deltaY) && Math.abs(deltaX) > 30) {
      direction = deltaX > 0 ? 2 : 0;
    } else if (Math.abs(deltaY) > 3 * Math.abs(deltaX) && Math.abs(deltaY) > 30) {
      direction = deltaY > 0 ? 3 : 1;
    }
    if (direction != -1) {
      this.move(direction);
    }
  }
}
export { Board };
