import Konva from "konva";
import type { VisibleRange } from "../types";
import { TableConfig } from "../core/TableConfig";
import { TableCalculator } from "../core/TableCalculator";

export class GridRenderer {
	private readonly headerLayer: Konva.Layer;
	private readonly tileLayer: Konva.Layer;
	private readonly config: TableConfig;
	private readonly calculator: TableCalculator;

	constructor(
		headerLayer: Konva.Layer,
		tileLayer: Konva.Layer,
		config: TableConfig,
		calculator: TableCalculator
	) {
		this.headerLayer = headerLayer;
		this.tileLayer = tileLayer;
		this.config = config;
		this.calculator = calculator;
	}

	private get gridStyle() {
		return (
			this.config.columns?.[0]?.style || {
				borderColor: "red",
				borderWidth: 1,
			}
		);
	}

	/**
	 * 绘制表格的网格线（竖线和横线）
	 */
	public render(visibleRange: VisibleRange): void {
		if (!this.headerLayer || !this.tileLayer) return;

		const { borderColor, borderWidth } = this.gridStyle;
		const { colOffsets } = this.calculator;
		const { rowHeight, headerHeight } = this.config;
		// 使用传入的可见区域范围
		const { startRowIndex, endRowIndex, startColIndex, endColIndex } =
			visibleRange;

		// 获取或创建网格线组（headerLayer）
		let headerGridGroup = this.headerLayer.findOne(
			".grid-lines"
		) as Konva.Group;
		if (!headerGridGroup) {
			headerGridGroup = new Konva.Group({ name: "grid-lines" });
			this.headerLayer.add(headerGridGroup);
		}
		// 确保网格线组始终显示在最上面
		headerGridGroup.moveToTop();

		// 获取或创建网格线组（tileLayer）
		let tileGridGroup = this.tileLayer.findOne(".grid-lines") as Konva.Group;
		if (!tileGridGroup) {
			tileGridGroup = new Konva.Group({ name: "grid-lines" });
			this.tileLayer.add(tileGridGroup);
		}
		// 确保网格线组始终显示在最上面
		tileGridGroup.moveToTop();

		// 记录需要保留的网格线
		const verticalLinesToKeep: { [key: string]: boolean } = {};
		const horizontalLinesToKeep: { [key: string]: boolean } = {};

		// 绘制可见区域内的竖线（在headerLayer中）
		for (let col = startColIndex; col <= endColIndex + 1; col++) {
			if (col <= 0 || col >= this.calculator.totalColCount) continue;
			const x = colOffsets[col] || 0;
			const lineName = `v-line-${col}`;
			verticalLinesToKeep[lineName] = true;

			let line = headerGridGroup.findOne(`.${lineName}`) as Konva.Line;
			if (!line) {
				line = new Konva.Line({
					points: [x, 0, x, (endRowIndex + 1) * rowHeight + headerHeight],
					stroke: borderColor,
					strokeWidth: borderWidth,
					name: lineName,
				});
				headerGridGroup.add(line);
			} else {
				line.points([x, 0, x, (endRowIndex + 1) * rowHeight + headerHeight]);
				line.stroke(borderColor);
				line.strokeWidth(borderWidth);
			}
		}

		// 绘制表头底部横线作为分割线（在headerLayer中）
		const headerBottomLineName = `header-bottom-line`;
		verticalLinesToKeep[headerBottomLineName] = true;
		let headerBottomLine = headerGridGroup.findOne(
			`.${headerBottomLineName}`
		) as Konva.Line;
		if (!headerBottomLine) {
			headerBottomLine = new Konva.Line({
				points: [
					colOffsets[startColIndex],
					headerHeight,
					colOffsets[endColIndex + 1] || this.calculator.totalColWidth,
					headerHeight,
				],
				stroke: borderColor,
				strokeWidth: borderWidth,
				name: headerBottomLineName,
			});
			headerGridGroup.add(headerBottomLine);
		} else {
			headerBottomLine.points([
				colOffsets[startColIndex],
				headerHeight,
				colOffsets[endColIndex + 1] || this.calculator.totalColWidth,
				headerHeight,
			]);
			headerBottomLine.stroke(borderColor);
			headerBottomLine.strokeWidth(borderWidth);
		}

		// 绘制可见区域内的横线（在tileLayer中）
		for (let row = startRowIndex; row <= endRowIndex + 1; row++) {
			if (row < 2 || row > this.calculator.totalRowCount) continue;
			const y = row * rowHeight;
			const lineName = `h-line-${row}`;
			horizontalLinesToKeep[lineName] = true;

			// 尝试查找现有的横线
			let line = tileGridGroup.findOne(`.${lineName}`) as Konva.Line;
			if (!line) {
				line = new Konva.Line({
					points: [
						colOffsets[startColIndex],
						y,
						colOffsets[endColIndex + 1] || this.calculator.totalColWidth,
						y,
					],
					stroke: borderColor,
					strokeWidth: borderWidth,
					name: lineName,
				});
				tileGridGroup.add(line);
			} else {
				line.points([
					colOffsets[startColIndex],
					y,
					colOffsets[endColIndex + 1] || this.calculator.totalColWidth,
					y,
				]);
				line.stroke(borderColor);
				line.strokeWidth(borderWidth);
			}
		}

		// 移除不在可见区域内的竖线
		headerGridGroup.children
			.filter((line) => line.name().startsWith("v-line-"))
			.forEach((line) => {
				if (!verticalLinesToKeep[line.name()]) {
					line.remove();
				}
			});

		// 移除不在可见区域内的横线
		tileGridGroup.children
			.filter((line) => line.name().startsWith("h-line-"))
			.forEach((line) => {
				if (!horizontalLinesToKeep[line.name()]) {
					line.remove();
				}
			});
	}

	/**
	 * 清空网格线
	 */
	public clear(): void {
		this.headerLayer.findOne(".grid-lines")?.remove();
		this.tileLayer.findOne(".grid-lines")?.remove();
	}
}
