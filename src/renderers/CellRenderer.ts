import Konva from "konva";
import type { VisibleRange, SelectedCell } from "../types";
import { TableConfig } from "../core/TableConfig";
import { TableCalculator } from "../core/TableCalculator";

export class CellRenderer {
	private readonly layer: Konva.Layer;
	private readonly config: TableConfig;
	private readonly calculator: TableCalculator;
	private selectedCell: SelectedCell;

	constructor(
		layer: Konva.Layer,
		config: TableConfig,
		calculator: TableCalculator,
		selectedCell: SelectedCell
	) {
		this.layer = layer;
		this.config = config;
		this.calculator = calculator;
		this.selectedCell = selectedCell;
	}

	/**
	 * 设置选中的单元格
	 */
	public setSelectedCell(selectedCell: SelectedCell): void {
		this.selectedCell = selectedCell;
	}

	/**
	 * 创建或更新单个单元格
	 */
	private createOrUpdateCell(row: number, col: number): Konva.Group {
		const { layer, config, calculator, selectedCell } = this;
		const cellStyle = config.columns[col].style!;
		const { colOffsets, colWidths } = calculator;
		const { headerHeight, rowHeight, columns, records } = config;

		const cellX = colOffsets[col];
		const cellY = headerHeight + row * rowHeight;
		const cellW = colWidths[col];
		const cellH = rowHeight;

		const field = columns[col].field;
		// const cellValue = records[row][field] || "";
		const cellValue = `cell-${row}-${col}`;
		const isSelected = row === selectedCell.row && col === selectedCell.col;
		const { selectedFillColor } = cellStyle;

		let cellGroup = layer.findOne(`.cell-${row}-${col}`) as Konva.Group;
		if (!cellGroup) {
			cellGroup = new Konva.Group({
				x: cellX,
				y: cellY,
				name: `cell-${row}-${col}`,
			});
			layer.add(cellGroup);
		}

		let fillRect = cellGroup.findOne(".cell-fill") as Konva.Rect;
		const fillColor = isSelected ? selectedFillColor : "transparent";
		if (fillRect) {
			fillRect.fill(fillColor);
		} else {
			fillRect = new Konva.Rect({
				x: 0,
				y: 0,
				width: cellW,
				height: cellH,
				fill: fillColor,
				name: "cell-fill",
			});
			cellGroup.add(fillRect);
		}

		let textElement = cellGroup.findOne(".cell-text") as Konva.Text;
		if (textElement) {
			textElement.text(cellValue.toString());
		} else {
			textElement = new Konva.Text({
				x: 8,
				y: 10,
				width: cellW - 16,
				height: cellH - 20,
				text: cellValue.toString(),
				fontSize: 14,
				fill: "#111827",
				align: "center",
				verticalAlign: "middle",
				ellipsis: true,
				name: "cell-text",
			});
			cellGroup.add(textElement);
		}

		return cellGroup;
	}

	/**
	 * 渲染单元格
	 */
	public render(visibleRange: VisibleRange): void {
		if (!this.layer) return;

		const { startRowIndex, endRowIndex, startColIndex, endColIndex } =
			visibleRange;

		// 获取当前已有的所有单元格 - 使用filter方法精确匹配name以cell-开头的元素
		const existingCells = this.layer.children.filter((child) =>
			child.name().startsWith("cell-")
		);
		const cellsToKeep: { [key: string]: boolean } = {};

		// 只创建或更新可见区域内的单元格
		for (let row = startRowIndex; row <= endRowIndex; row++) {
			for (let col = startColIndex; col <= endColIndex; col++) {
				// 标记需要保留的单元格
				cellsToKeep[`${row}-${col}`] = true;

				this.createOrUpdateCell(row, col);
			}
		}

		// 移除不在可见区域内的单元格
		existingCells.forEach((cell) => {
			const cellName = cell.name();
			const cellMatch = cellName.match(/cell-(\d+)-(\d+)/);
			if (cellMatch) {
				const row = parseInt(cellMatch[1], 10);
				const col = parseInt(cellMatch[2], 10);
				if (!cellsToKeep[`${row}-${col}`]) {
					cell.remove();
				}
			}
		});
	}

	/**
	 * 局部更新选中状态变化的单元格
	 */
	public updateSelectedCell(
		prevSelectedRow: number,
		prevSelectedCol: number,
		newSelectedRow: number,
		newSelectedCol: number
	): void {
		if (!this.layer) return;

		// 1. 查找并更新之前选中的单元格（恢复为默认样式）
		if (prevSelectedRow !== -1 && prevSelectedCol !== -1) {
			const prevCell = this.layer.findOne(
				`.cell-${prevSelectedRow}-${prevSelectedCol}`
			) as Konva.Group;
			if (prevCell) {
				// 直接更新填充颜色为透明
				const fillRect = prevCell.findOne(".cell-fill") as Konva.Rect;
				if (fillRect) {
					fillRect.fill("transparent");
				}
			}
		}

		// 2. 查找并更新新选中的单元格（设置为选中样式）
		const newCell = this.layer.findOne(
			`.cell-${newSelectedRow}-${newSelectedCol}`
		) as Konva.Group;
		if (newCell) {
			// 直接更新填充颜色为选中颜色
			const fillRect = newCell.findOne(".cell-fill") as Konva.Rect;
			if (fillRect) {
				fillRect.fill(
					this.config.columns[newSelectedCol].style!.selectedFillColor
				);
			}
		}

		// 3. 仅批量绘制更新的部分
		this.layer.batchDraw();
	}

	/**
	 * 清空所有单元格
	 */
	public clear(): void {
		this.layer.find(".cell-").forEach((cell) => cell.remove());
	}
}
